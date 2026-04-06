import os
import logging
import requests
import math
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_supabase = None


def _get_supabase():
    global _supabase
    if _supabase is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_KEY", "")
        if not url or not key:
            return None
        _supabase = create_client(url, key)
    return _supabase


def send_telegram_alert(message: str):
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        logger.warning("Telegram alert skipped — missing BOT_TOKEN or CHAT_ID")
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": message, "parse_mode": "Markdown"}
    try:
        resp = requests.post(url, json=payload, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        logger.error("Failed to send Telegram alert: %s", e)


# ---------------------------------------------------------------------------
# Reconciliation engine
# ---------------------------------------------------------------------------

def run_reconciliation():
    supabase = _get_supabase()
    if not supabase:
        logger.error("Missing Supabase credentials for reconciliation.")
        return {"matched": 0, "unmatched": 0, "error": "no_credentials"}

    # 1. Fetch all unmatched bank credits
    unmatched_credits = (
        supabase.table("bank_credits")
        .select("*")
        .eq("match_status", "UNMATCHED")
        .execute()
        .data
    )
    if not unmatched_credits:
        return {"matched": 0, "unmatched": 0}

    # 2. Fetch all PENDING campaigns
    # FIXED: was querying "PENDING" (uppercase) but status is stored as title-case "Pending"
    pending_campaigns = (
        supabase.table("campaigns")
        .select("*")
        .eq("status", "Pending")
        .execute()
        .data
    )

    matched_count = 0

    for credit in unmatched_credits:
        credit_amt = float(credit["amount"])
        best_match = None
        best_diff = float("inf")
        match_type = None

        for camp in pending_campaigns:
            expected = float(camp["expected_refund"])
            diff = abs(credit_amt - expected)

            if math.isclose(credit_amt, expected, abs_tol=0.01):
                best_match = camp
                best_diff = 0
                match_type = "EXACT"
                break
            elif diff <= 10 and diff < best_diff:
                best_match = camp
                best_diff = diff
                match_type = "HIGH"

        if best_match:
            matched_count += 1
            campaign_id = best_match["id"]
            expected = float(best_match["expected_refund"])

            # Update bank_credit
            try:
                supabase.table("bank_credits").update(
                    {"match_status": match_type, "campaign_id": campaign_id}
                ).eq("id", credit["id"]).execute()
            except Exception as e:
                logger.error("Failed to update bank_credit %s: %s", credit["id"], e)
                continue

            # Update campaign status — FIXED: was "MATCHED" (uppercase), must be title-case "Matched"
            try:
                supabase.table("campaigns").update(
                    {"status": "Matched"}
                ).eq("id", campaign_id).execute()
            except Exception as e:
                logger.error("Failed to update campaign %s: %s", campaign_id, e)

            # Send notification
            send_telegram_alert(
                f"✅ ₹{credit_amt:,.2f} from THE HYPE matched to "
                f"Campaign: {best_match['product_name']} ({match_type})"
            )

            # Auto-Settlement for Raghvendra
            if best_match.get("assigned_to") == "Raghvendra":
                try:
                    supabase.table("settlements").insert(
                        {
                            "campaign_id": campaign_id,
                            "bank_credit_id": credit["id"],
                            "amount": expected,
                            # FIXED: was "PENDING" (uppercase), must be title-case "Pending"
                            # so /pending-settlements and dashboard_summary can find it
                            "status": "Pending",
                        }
                    ).execute()
                    send_telegram_alert(
                        f"⚠️ Settlement Created! ₹{expected:,.2f} due to "
                        f"Raghvendra for ({best_match['product_name']})."
                    )
                except Exception as e:
                    logger.error("Failed to create settlement: %s", e)

            # Remove from local list so it isn't matched twice
            pending_campaigns = [
                c for c in pending_campaigns if c["id"] != campaign_id
            ]
        else:
            # Only alert on newly discovered unmatched credits to avoid duplicate alerts
            logger.warning(
                "No campaign match for credit %s: ₹%.2f on %s",
                credit.get("id"), credit_amt, credit.get("credit_date"),
            )
            
            # Change match_status to avoid spam
            try:
                supabase.table("bank_credits").update(
                    {"match_status": "UNMATCHED_NOTIFIED"}
                ).eq("id", credit["id"]).execute()
            except Exception as e:
                logger.error("Failed to update status to UNMATCHED_NOTIFIED: %s", e)

            send_telegram_alert(
                f"❓ ₹{credit_amt:,.2f} on {credit['credit_date']} "
                f"has NO matching campaign"
            )

    return {
        "matched": matched_count,
        "unmatched": len(unmatched_credits) - matched_count,
    }
