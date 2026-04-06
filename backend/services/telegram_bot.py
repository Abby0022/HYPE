"""
telegram_bot.py — The Hype Campaign Tracker
============================================
Telegram bot with Gemini AI parsing for WhatsApp-forwarded Amazon order ingestion.

Business model:
    order_value     = full amount paid to Amazon              e.g. ₹3,500
    campaign_fee    = fee deducted by the campaign platform   e.g. ₹200
    expected_refund = net amount credited to your bank        e.g. ₹3,300

Flow:
    1. User forwards an Amazon WhatsApp order notification, or types
       a plain-language order description.
    2. Gemini 2.0 Flash extracts structured JSON from the text.
    3. Bot replies with a Preview Card and three inline buttons:
         [✅ Save]  — persists order + campaign; reconciler auto-matches
                      the credit when it arrives in the bank statement.
         [✏️ Edit]  — prompts for a field correction (field: value format).
         [❌ Skip]  — silently discards the pending order.

Slash commands:
    /start   — welcome + quick usage example
    /help    — full usage guide with field explanations
    /pending — lists all settlements with status = Pending
    /summary — live dashboard snapshot from Supabase
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import time
import uuid
from datetime import date
from typing import Any

from google import genai
from google.genai import types

from dotenv import load_dotenv
from supabase import Client, create_client
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram import error as tg_error
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO,
)
log = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Configuration  (required keys raise at startup if missing)
# ─────────────────────────────────────────────────────────────────────────────

BOT_TOKEN       = os.environ["TELEGRAM_BOT_TOKEN"]
ALLOWED_CHAT_ID = int(os.getenv("TELEGRAM_CHAT_ID", "0"))   # 0 = unrestricted
GEMINI_API_KEY  = os.environ["GEMINI_API_KEY"]
SUPABASE_URL    = os.environ["SUPABASE_URL"]
SUPABASE_KEY    = os.environ["SUPABASE_KEY"]

# ─────────────────────────────────────────────────────────────────────────────
# Lazy singletons — Gemini & Supabase
# ─────────────────────────────────────────────────────────────────────────────

_gen_client = genai.Client(api_key=GEMINI_API_KEY)
_model_id   = "gemini-2.0-flash"
_gen_config = types.GenerateContentConfig(
    temperature=0.1,
    max_output_tokens=2048,
    response_mime_type="application/json",   # forces clean JSON, no markdown fences
)



_supabase: Client | None = None


def sb() -> Client:
    """Return (or initialise) the shared Supabase client."""
    global _supabase
    if _supabase is None:
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase


# ─────────────────────────────────────────────────────────────────────────────
# In-memory session store  { chat_id → pending order dict }
# Cleared on Save or Skip; survives Edit round-trips.
# NOTE: This store is NOT restart-safe (data is lost on bot restart).
#       For production use context.user_data (PTB built-in persistence).
# ─────────────────────────────────────────────────────────────────────────────

_pending: dict[int, dict[str, Any]] = {}

# ─────────────────────────────────────────────────────────────────────────────
# Field aliases for the Edit flow
# ─────────────────────────────────────────────────────────────────────────────

FIELD_ALIASES: dict[str, str] = {
    # product
    "product":          "product_name",
    "product_name":     "product_name",
    "name":             "product_name",
    # order value
    "value":            "order_value",
    "order_value":      "order_value",
    "price":            "order_value",
    "paid":             "order_value",
    # campaign fee
    "fee":              "campaign_fee",
    "campaign_fee":     "campaign_fee",
    "platform_fee":     "campaign_fee",
    "deduction":        "campaign_fee",
    "cut":              "campaign_fee",
    # expected refund
    "refund":           "expected_refund",
    "expected_refund":  "expected_refund",
    "final":            "expected_refund",
    "back":             "expected_refund",
    # assigned to
    "partner":          "assigned_to",
    "assigned_to":      "assigned_to",
    "for":              "assigned_to",
    "person":           "assigned_to",
    # order id
    "orderid":          "order_id",
    "order_id":         "order_id",
    "id":               "order_id",
    # ship to
    "shipto":           "ship_to",
    "ship_to":          "ship_to",
    "address":          "ship_to",
    "delivery":         "ship_to",
    # amazon account
    "account":          "amazon_account",
    "amazon_account":   "amazon_account",
}

NUMERIC_FIELDS = {"order_value", "campaign_fee", "expected_refund"}

# ─────────────────────────────────────────────────────────────────────────────
# Gemini prompt
# ─────────────────────────────────────────────────────────────────────────────

_PARSE_PROMPT = """\
You are a strict JSON extraction assistant for an Indian e-commerce campaign tracker.

==== BUSINESS MODEL (read carefully before parsing) ====
The user orders products on Amazon and participates in refund campaigns:
  - order_value     : full amount the user PAID to Amazon        (e.g. ₹3,500)
  - campaign_fee    : fee the CAMPAIGN PLATFORM deducts          (e.g. ₹200)
  - expected_refund : net amount the user receives in their BANK (e.g. ₹3,300)

CRITICAL RULES:
  - Bank/card cashback (e.g. "HDFC cashback", "SBI offer") → IGNORE completely.
  - "less", "deduction", "platform cut", "fee", "minus", "deducted", "they take"
    all refer to campaign_fee — the platform's share of the refund.
  - If no fee is mentioned → campaign_fee = 0 and expected_refund = order_value.
  - If expected_refund is not stated but order_value and campaign_fee are known →
    ALWAYS compute: expected_refund = order_value - campaign_fee.

==== OUTPUT SCHEMA ====
Return ONLY a valid JSON object with these exact keys:

{
  "product_name":    string | null,
  "order_value":     number | null,
  "campaign_fee":    number | null,
  "expected_refund": number | null,
  "assigned_to":     "Abhijeet" | "Raghvendra" | null,
  "order_id":        string | null,
  "ship_to":         string | null,
  "amazon_account":  string | null
}

Rules:
  - All monetary values are plain numbers — no ₹ symbol, no commas.
  - assigned_to must be exactly "Abhijeet" or "Raghvendra" — infer from context.
  - Extract Amazon order IDs matching ###-#######-####### into order_id.
  - No markdown, no code fences, no explanation — raw JSON only.

User message:
"""

# ─────────────────────────────────────────────────────────────────────────────
# Utility helpers
# ─────────────────────────────────────────────────────────────────────────────

def inr(val: Any) -> str:
    """Format a numeric value as ₹ with comma grouping, or '—' if absent."""
    if val is None:
        return "—"
    try:
        return f"₹{float(val):,.0f}"
    except (TypeError, ValueError):
        return str(val)


def strip_code_fence(text: str) -> str:
    """Extract and, if needed, repair the JSON object from Gemini's response."""
    start = text.find("{")
    end   = text.rfind("}")
    if start == -1:
        return text.strip()
    candidate = text[start:end + 1] if end != -1 else text[start:]

    # If the JSON looks truncated (no closing brace), try to repair it
    if end == -1 or candidate.count('{') > candidate.count('}'):
        candidate = _repair_truncated_json(candidate)

    return candidate


def _repair_truncated_json(text: str) -> str:
    """
    Best-effort repair of a truncated JSON object:
    - Removes the last (incomplete) key-value pair if it has no closing quote.
    - Appends missing closing braces.
    """
    # Strip trailing comma / whitespace before trying to close
    cleaned = text.rstrip().rstrip(",").rstrip()
    # Count unmatched braces
    depth = cleaned.count('{') - cleaned.count('}')
    if depth > 0:
        cleaned += '}' * depth
    return cleaned


def recalc_refund(order: dict[str, Any]) -> None:
    """Recompute expected_refund in-place whenever order_value or campaign_fee change."""
    ov  = float(order.get("order_value")  or 0)
    fee = float(order.get("campaign_fee") or 0)
    order["expected_refund"] = max(ov - fee, 0)


def build_preview(order: dict[str, Any]) -> str:
    """Return a professional Markdown Preview Card for an order dict."""
    fee      = order.get("campaign_fee")
    fee_line = (
        f"➖ *Platform Fee:*   {inr(fee)}  _(deducted)_"
        if fee
        else "🟢 *Platform Fee:*   ₹0  _(no deduction)_"
    )
    
    return (
        "📊 *Order Summary — Verification Required*\n"
        "─────────────────────────\n"
        f"📦 *Product:*       {order.get('product_name') or '—'}\n"
        f"💰 *Order Value:*   {inr(order.get('order_value'))}  _(Paid to Amazon)_\n"
        f"{fee_line}\n"
        "─────────────────────────\n"
        f"🏦 *Exp. Refund:*   `{inr(order.get('expected_refund'))}`\n"
        "─────────────────────────\n"
        f"👤 *Partner:*       {order.get('assigned_to') or 'Unassigned'}\n"
        f"🆔 *Order ID:*      `{order.get('order_id') or 'Manual Entry'}`\n"
        f"📍 *Ship To:*       {order.get('ship_to') or '—'}\n"
        f"🛍️ *Account:*       {order.get('amazon_account') or '—'}\n\n"
        "💡 _Please verify the details above before saving._"
    )



def action_keyboard(chat_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[
        InlineKeyboardButton("✅ Save",  callback_data=f"save:{chat_id}"),
        InlineKeyboardButton("✏️ Edit",  callback_data=f"edit:{chat_id}"),
        InlineKeyboardButton("❌ Skip",  callback_data=f"skip:{chat_id}"),
    ]])


def is_allowed(update: Update) -> bool:
    """Return True if the message is from the authorised chat (or no restriction is set)."""
    return ALLOWED_CHAT_ID == 0 or update.effective_chat.id == ALLOWED_CHAT_ID

# ─────────────────────────────────────────────────────────────────────────────
# Gemini order parsing
# ─────────────────────────────────────────────────────────────────────────────

def parse_order(text: str, *, _retries: int = 2) -> dict[str, Any] | None:
    """
    Send `text` to Gemini and return a structured order dict.
    Retries up to `_retries` times on JSON parse failure (truncation).

    NOTE: This is a synchronous function. It is called from async handlers via
    direct invocation which blocks the event loop during the Gemini API call.
    For high-throughput bots, wrap this in asyncio.get_event_loop().run_in_executor()
    to move it to a thread pool.
    """
    last_exc: Exception | None = None
    for attempt in range(1, _retries + 2):     # 1-indexed, up to _retries+1 attempts
        try:
            response = _gen_client.models.generate_content(
                model=_model_id,
                contents=[_PARSE_PROMPT, text],
                config=_gen_config,
            )
            raw  = strip_code_fence(response.text)
            data = json.loads(raw)

            # Ensure expected_refund is always computed if Gemini left it null
            if data.get("order_value") and data.get("expected_refund") is None:
                data["campaign_fee"] = data.get("campaign_fee") or 0
                data["expected_refund"] = max(
                    float(data["order_value"]) - float(data["campaign_fee"]), 0
                )
            return data

        except json.JSONDecodeError as exc:
            last_exc = exc
            log.warning("Gemini parse error (attempt %d/%d): %s", attempt, _retries + 1, exc)
            # FIXED: `import time` moved to top-level; time.sleep is intentional here
            # because parse_order is a synchronous function (not async).
            time.sleep(0.5 * attempt)

        except Exception as exc:
            log.error("Gemini unexpected error: %s", exc)
            return None

    log.error("Gemini parse failed after %d attempts: %s", _retries + 1, last_exc)
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Supabase persistence
# ─────────────────────────────────────────────────────────────────────────────

def save_order(order: dict[str, Any]) -> tuple[bool, str]:
    """
    1. Upsert a row in `amazon_orders`.
    2. Insert a matching row in `campaigns` — expected_refund is the
       reconciliation target the bank-credit matcher uses.

    Returns (success: bool, reply_markdown: str).
    """
    order_id        = order.get("order_id") or f"TG-{uuid.uuid4().hex[:8].upper()}"
    product         = order.get("product_name")    or "Unknown Product"
    order_value     = float(order.get("order_value")     or 0)
    campaign_fee    = float(order.get("campaign_fee")    or 0)
    expected_refund = float(order.get("expected_refund") or max(order_value - campaign_fee, 0))
    assigned_to     = order.get("assigned_to")

    # ── 1. amazon_orders ────────────────────────────────────────────────────
    try:
        sb().table("amazon_orders").upsert(
            {
                "order_id":       order_id,
                "order_date":     date.today().isoformat(),
                "order_value":    order_value,
                "product_name":   product,
                "ship_to":        order.get("ship_to"),
                "amazon_account": order.get("amazon_account"),
            },
            on_conflict="order_id",
        ).execute()
    except Exception as exc:
        err_msg = str(exc)
        if "PGRST204" in err_msg or "schema cache" in err_msg:
            log.error("Database schema mismatch: %s", err_msg)
            return False, (
                "⚠️ *Database Sync Required*\n\n"
                "It looks like your Supabase database is out of sync with the new bot features. "
                "Please run the SQL migration script (available in /help) to add the missing columns."
            )
        log.error("amazon_orders upsert failed: %s", exc)
        return False, f"❌ *Database error* while saving order:\n`{err_msg}`"


    # ── 2. campaigns ────────────────────────────────────────────────────────
    # Full payload (requires schema migration 001_schema.sql to be applied)
    campaign_payload = {
        "product_name":    product,
        "order_id":        order_id,
        "order_value":     order_value,
        "campaign_fee":    campaign_fee,
        "expected_refund": expected_refund,
        "assigned_to":     assigned_to,
        "status":          "Pending",
    }
    # Minimal payload — works even on old/unpatched DB schemas
    campaign_minimal = {
        "product_name":    product,
        "expected_refund": expected_refund,
        "assigned_to":     assigned_to,
        "status":          "Pending",
    }

    campaign_saved = False
    for label, payload in [
        ("full",    campaign_payload),
        ("minimal", campaign_minimal),
    ]:
        try:
            sb().table("campaigns").insert(payload).execute()
            campaign_saved = True
            if label == "minimal":
                log.warning(
                    "Campaign saved with MINIMAL payload — run 001_schema.sql "
                    "in Supabase to add missing columns (campaign_fee, order_value, order_id)."
                )
            break
        except Exception as exc:
            log.error("Campaign insert (%s) failed: %s", label, exc)

    campaign_note = "" if campaign_saved else "\n⚠️ _Campaign record could not be saved — check bot logs._"

    return True, (
        f"✔️ *Order Successfully Logged*\n"
        "─────────────────────────\n"
        f"📦 *Product:*       _{product}_\n"
        f"🆔 *Order ID:*      `{order_id}`\n"
        "─────────────────────────\n"
        f"💰 *Purchase:*      {inr(order_value)}\n"
        f"➖ *Deduction:*     {inr(campaign_fee)}\n"
        f"🏦 *Refund Goal:*   *{inr(expected_refund)}*\n"
        "─────────────────────────\n"
        f"👤 *Assigned To:*   {assigned_to or 'Unassigned'}\n\n"
        f"🎯 *Status:* _Pending Bank Reconciliation_{campaign_note}\n"
        "The system will now monitor your bank feed for a matching credit."
    )


# ─────────────────────────────────────────────────────────────────────────────
# Command handlers
# ─────────────────────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_allowed(update):
        return
    await update.message.reply_text(
        "👋 *Welcome to the Hype Order Bot!*\n\n"
        "I am your automated campaign manager. I track your Amazon orders and "
        "ensure your refunds are accurately logged and matched against your bank.\n\n"
        "🚀 *Quick Start:*\n"
        "Simply forward an Amazon WhatsApp notification or describe your order manually:\n"
        "_\"Ordered JioEyeQ Dashcam for ₹3,500. Platform takes ₹200. Expected refund of ₹3,300 for Raghvendra.\"_\n\n"
        "🔗 *Commands:*\n"
        "/summary — Live dashboard view\n"
        "/pending — View outstanding refunds\n"
        "/help    — Full documentation",
        parse_mode="Markdown",
    )



async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_allowed(update):
        return
    await update.message.reply_text(
        "📖 *Hype Order Bot — Documentation*\n\n"
        "Establish a central source of truth for your e-commerce campaigns.\n\n"
        "📦 *1. Creating an Order*\n"
        "Forward any order notification or describe it manually. Use terms like:\n"
        "• `deduct`, `cut`, `fee`, `platform share` for campaign fees.\n"
        "• `for [Name]` to assign to a partner.\n\n"
        "🔍 *2. Verification & Editing*\n"
        "After parsing, you'll see a Preview Card. \n"
        "• *Save*: Persists the record to your dashboard.\n"
        "• *Edit*: Correct any field by replying with `field: value`.\n"
        "  (Fields: `product`, `value`, `fee`, `refund`, `partner`, `id`)\n\n"
        "📊 *3. Management Commands*\n"
        "/summary — Visual dashboard snapshot.\n"
        "/pending — Items awaiting bank reconciliation.\n"
        "/help    — Return to this guide.\n\n"
        "⚡ _Pro Tip: You can forward multiple orders in quick succession._",
        parse_mode="Markdown",
    )



async def cmd_pending(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_allowed(update):
        return
    try:
        rows = (
            sb().table("settlements")
            .select("amount, campaigns(product_name, assigned_to)")
            .eq("status", "Pending")
            .order("created_at", desc=True)
            .execute()
            .data
        )
    except Exception as exc:
        await update.message.reply_text(f"❌ Error:\n`{exc}`", parse_mode="Markdown")
        return

    if not rows:
        await update.message.reply_text("✅ No pending settlements right now!")
        return

    total = 0.0
    lines = ["⏳ *Outstanding Settlements*\n"
             "─────────────────────────\n"]
    for row in rows:
        amt  = float(row.get("amount", 0))
        camp = row.get("campaigns") or {}
        total += amt
        lines.append(
            f"• _{camp.get('product_name', 'Unknown')}_  \n"
            f"  → *{inr(amt)}*  ({camp.get('assigned_to', '—')})"
        )
    lines.append("\n─────────────────────────")
    lines.append(f"💰 *Total Receivables: {inr(total)}*")
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")



async def cmd_summary(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_allowed(update):
        return
    try:
        campaigns = sb().table("campaigns").select("status, expected_refund, campaign_fee").execute().data or []
        credits   = sb().table("bank_credits").select("amount, match_conf").execute().data or []
        orders    = sb().table("amazon_orders").select("order_id, order_value").execute().data or []
        settles   = sb().table("settlements").select("status, amount").execute().data or []
    except Exception as exc:
        await update.message.reply_text(f"❌ Error:\n`{exc}`", parse_mode="Markdown")
        return

    total_paid      = sum(float(r.get("order_value", 0))     for r in orders)
    total_expected  = sum(float(r.get("expected_refund", 0)) for r in campaigns)
    total_fees      = sum(float(r.get("campaign_fee", 0))    for r in campaigns)
    total_received  = sum(float(r.get("amount", 0))          for r in credits)
    unmatched       = sum(1 for r in credits if r.get("match_conf") == "UNMATCHED")
    pending_count   = sum(1 for r in settles if r.get("status") == "Pending")
    pending_amt     = sum(float(r.get("amount", 0)) for r in settles if r.get("status") == "Pending")
    gap             = total_expected - total_received

    await update.message.reply_text(
        "📊 *Hype Tracker — Performance Snapshot*\n"
        "─────────────────────────\n"
        f"🛒 *Total Orders:*        {len(orders)}  _({inr(total_paid)} volume)_\n"
        f"📣 *Active Campaigns:*    {len(campaigns)}\n"
        f"🔴 *Total Fees Paid:*     {inr(total_fees)}\n"
        "─────────────────────────\n"
        f"📥 *Total Expected:*      {inr(total_expected)}\n"
        f"🏦 *Total Recovered:*     {inr(total_received)}\n"
        "─────────────────────────\n"
        f"{'✅' if gap == 0 else '⚠️'} *Balance Gap:*        `{inr(gap)}`\n"
        f"⏳ *Pending Deposits:*     {pending_count}  _({inr(pending_amt)})_\n"
        f"❓ *Unmatched Items:*    {unmatched}",
        parse_mode="Markdown",
    )


# ─────────────────────────────────────────────────────────────────────────────
# Message handler — new order or edit field response
# ─────────────────────────────────────────────────────────────────────────────

# ─────────────────────────────────────────────────────────────────────────────
# Resilient Telegram send helper
# ─────────────────────────────────────────────────────────────────────────────

async def safe_edit(msg_coro, *, retries: int = 3, base_delay: float = 1.5):
    """
    Call a coroutine that edits/sends a Telegram message.
    Retries on TimedOut / NetworkError with exponential back-off.
    """
    for attempt in range(1, retries + 1):
        try:
            return await msg_coro
        except (tg_error.TimedOut, tg_error.NetworkError) as exc:
            if attempt == retries:
                log.error("Telegram send failed after %d retries: %s", retries, exc)
                raise
            wait = base_delay * (2 ** (attempt - 1))
            log.warning("Telegram timeout (attempt %d/%d), retrying in %.1fs…", attempt, retries, wait)
            await asyncio.sleep(wait)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_allowed(update):
        return

    text    = update.message.text.strip()
    chat_id = update.effective_chat.id

    if context.user_data.get("awaiting_edit"):
        await _handle_edit_input(update, context, text, chat_id)
        return

    msg   = await update.message.reply_text("⏳ Parsing with Gemini AI…")
    order = await asyncio.to_thread(parse_order, text)

    if not order or not order.get("product_name"):
        await safe_edit(msg.edit_text(
            "⚠️ *Parsing Interrupted*\n\n"
            "I couldn't quite extract the order details from that message. "
            "Please try rephrasing or using this clear format:\n\n"
            "_\"Ordered product for ₹X. Platform takes ₹Y. Back for [Name].\"_\n\n"
            "Need help? Type /help for a guide.",
            parse_mode="Markdown",
        ))
        return

    _pending[chat_id] = order
    await safe_edit(msg.edit_text(
        build_preview(order),
        parse_mode="Markdown",
        reply_markup=action_keyboard(chat_id),
    ))


async def _handle_edit_input(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    text: str,
    chat_id: int,
) -> None:
    """Process a `field: value` correction and re-render the preview."""
    order = _pending.get(chat_id)
    if not order:
        context.user_data["awaiting_edit"] = False
        await update.message.reply_text(
            "No pending order found. Please send an order message first."
        )
        return

    if ":" not in text:
        await update.message.reply_text(
            "Please reply in the format: `field: value`\n"
            "Example: `fee: 200`  or  `partner: Raghvendra`",
            parse_mode="Markdown",
        )
        return

    raw_field, _, raw_value = text.partition(":")
    key        = raw_field.strip().lower().replace(" ", "_")
    value: Any = raw_value.strip()

    actual_field = FIELD_ALIASES.get(key)
    if not actual_field:
        await update.message.reply_text(
            f"⚠️ Unknown field: `{key}`\n"
            "Valid fields:\n"
            "`product` · `value` · `fee` · `refund` · `partner` · `orderid` · `shipto` · `account`",
            parse_mode="Markdown",
        )
        return

    if actual_field in NUMERIC_FIELDS:
        cleaned = re.sub(r"[₹,\s]", "", value)
        if not re.match(r"^\d+(\.\d+)?$", cleaned):
            await update.message.reply_text(
                f"⚠️ `{value}` is not a valid number.\nExample: `fee: 200`",
                parse_mode="Markdown",
            )
            return
        value = float(cleaned)

    order[actual_field] = value

    # Auto-recompute expected_refund when a linked field changes
    if actual_field in ("order_value", "campaign_fee"):
        recalc_refund(order)

    _pending[chat_id]  = order
    context.user_data["awaiting_edit"] = False

    await update.message.reply_text(
        f"✅ Updated *{actual_field}* → `{value}`\n\n" + build_preview(order),
        parse_mode="Markdown",
        reply_markup=action_keyboard(chat_id),
    )

# ─────────────────────────────────────────────────────────────────────────────
# Callback query handler  (Save / Edit / Skip)
# ─────────────────────────────────────────────────────────────────────────────

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    action, chat_id_str = query.data.split(":", 1)
    chat_id = int(chat_id_str)
    order   = _pending.get(chat_id)

    if action == "save":
        if not order:
            await query.edit_message_text(
                "⚠️ Session expired. Please send the order message again."
            )
            return
        await safe_edit(query.edit_message_text("💾 Saving to Supabase…"))
        success, reply = save_order(order)
        _pending.pop(chat_id, None)
        await safe_edit(query.edit_message_text(reply, parse_mode="Markdown"))

    elif action == "edit":
        if not order:
            await query.edit_message_text(
                "⚠️ Session expired. Please send the order message again."
            )
            return
        context.user_data["awaiting_edit"] = True
        await query.edit_message_text(
            build_preview(order) + "\n\n"
            "✏️ *Which field needs fixing?*\n"
            "Reply as `field: new value`\n\n"
            "Fields: `product` · `value` · `fee` · `refund` · "
            "`partner` · `orderid` · `shipto` · `account`",
            parse_mode="Markdown",
        )

    elif action == "skip":
        _pending.pop(chat_id, None)
        await query.edit_message_text("🗑️ Order discarded.")

# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Log all errors; suppress transient errors so polling continues."""
    exc = context.error
    if isinstance(exc, (tg_error.TimedOut, tg_error.NetworkError, tg_error.Conflict)):
        log.warning("Transient Telegram error (suppressed): %s", exc)
        return
    log.error("Unhandled exception: %s", exc, exc_info=exc)


def setup_bot() -> Application:
    """Initialize and return the Telegram bot Application instance."""
    from telegram.request import HTTPXRequest
    
    request = HTTPXRequest(
        connect_timeout=10.0,
        read_timeout=30.0,
        write_timeout=30.0,
        pool_timeout=30.0,
    )

    app = (
        Application.builder()
        .token(BOT_TOKEN)
        .request(request)
        .build()
    )

    app.add_handler(CommandHandler("start",   cmd_start))
    app.add_handler(CommandHandler("help",    cmd_help))
    app.add_handler(CommandHandler("pending", cmd_pending))
    app.add_handler(CommandHandler("summary", cmd_summary))
    app.add_handler(CallbackQueryHandler(handle_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_error_handler(error_handler)
    
    return app


def run_bot() -> None:
    log.info("Starting Hype Telegram Bot (Gemini 2.0 Flash + Supabase)…")
    app = setup_bot()
    app.run_polling(
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=False,
    )


def run_bot_with_retry() -> None:
    """Restart the bot automatically on any unhandled crash."""
    import time
    backoff = 3
    while True:
        try:
            run_bot()
        except (KeyboardInterrupt, SystemExit):
            log.info("Bot stopped.")
            break
        except Exception as exc:
            log.error("Bot crashed (%s), restarting in %ss…", exc, backoff)
            time.sleep(backoff)
            backoff = min(backoff * 2, 60)  # exponential up to 60s
        else:
            break


if __name__ == "__main__":
    run_bot()