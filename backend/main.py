import os
import asyncio
import httpx
from datetime import datetime, timezone
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from supabase import create_client, Client
from auth import get_current_user

from services.bank_parser import parse_bank_csv, PasswordRequiredError
from services.reconciler import run_reconciliation
from services.telegram_bot import setup_bot

load_dotenv()

async def _pinger():
    """Background task to keep the backend alive on Render's free tier."""
    while True:
        await asyncio.sleep(600) # Ping every 10 minutes
        url = os.getenv("RENDER_EXTERNAL_URL")
        if url:
            try:
                async with httpx.AsyncClient() as client:
                    await client.get(url)
                    print(f"✓ Uptime Pinger: Successfully touched {url}")
            except Exception as e:
                print(f"✗ Uptime Pinger: Failed to touch {url}: {e}")

@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Startup
    bot_app = setup_bot()
    await bot_app.initialize()
    await bot_app.start()
    await bot_app.updater.start_polling(drop_pending_updates=True)
    print("✓ Telegram Bot Started")
    
    # Internal keep-alive for Render
    asyncio.create_task(_pinger())
    
    yield
    
    # Shutdown
    await bot_app.updater.stop()
    await bot_app.stop()
    await bot_app.shutdown()
    print("✓ Telegram Bot Stopped")


# ---------------------------------------------------------------------------
# Supabase singleton
# ---------------------------------------------------------------------------
_supabase_client: Client | None = None


def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_KEY", "")
        if not url or not key:
            # Raise RuntimeError so it's safe to call from background tasks too
            raise RuntimeError("Missing Supabase configuration (SUPABASE_URL / SUPABASE_KEY)")
        _supabase_client = create_client(url, key)
    return _supabase_client


# App
# ---------------------------------------------------------------------------
_is_debug = os.getenv("DEBUG", "False").lower() == "true"

app = FastAPI(
    title="The Hype Campaign Tracker API",
    lifespan=lifespan,
    docs_url="/docs" if _is_debug else None,
    redoc_url="/redoc" if _is_debug else None,
)

# Filter out blank FRONTEND_URL before building allowed origins list
_frontend_url = os.getenv("FRONTEND_URL", "").strip()
_allowed_origins = []

if _frontend_url:
    _allowed_origins.append(_frontend_url)
else:
    # Fallback to localhost if not set, for safety
    _allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class CampaignCreate(BaseModel):
    product_name: str
    expected_refund: float
    assigned_to: Optional[str] = None
    status: Optional[str] = None


class CampaignUpdate(BaseModel):
    product_name: Optional[str] = None
    expected_refund: Optional[float] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None


def normalize_campaign_status(status: Optional[str]) -> str:
    """Normalize status to title-case: Pending, Matched, Failed"""
    if not status:
        return "Pending"
    normalized = status.strip().lower()
    if normalized == "pending":
        return "Pending"
    elif normalized == "matched":
        return "Matched"
    elif normalized == "failed":
        return "Failed"
    return "Pending"


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------
@app.get("/")
@app.head("/")
def read_root():
    return {"message": "Welcome to The Hype API. Systems are online."}


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
@app.get("/dashboard-summary")
def dashboard_summary(user: dict = Depends(get_current_user)):  # FIXED: added auth guard
    sb = get_supabase()

    # ── defaults (all variables declared before any try/except block) ────────
    total_campaigns = 0
    pending_campaigns = 0
    matched_campaigns = 0
    matched_credits = 0
    unmatched_credits = 0
    total_received = 0.0
    unexplained_amount = 0.0
    pending_settlements_count = 0
    total_orders = 0
    total_order_value = 0.0
    processed_amount = 0.0
    pending_amount = 0.0
    avg_latency_seconds = 0
    reject_rate_percent = 0.0   # ← FIXED: declared at function scope
    returns_percent = 0.0       # ← FIXED: declared at function scope

    # Campaigns
    try:
        c_res = sb.table("campaigns").select("status, expected_refund, created_at").execute().data or []
        total_campaigns = len(c_res)
        pending_campaigns = sum(1 for c in c_res if c.get("status") == "Pending")
        matched_campaigns = sum(1 for c in c_res if c.get("status") == "Matched")
        pending_amount = sum(float(c.get("expected_refund", 0) or 0) for c in c_res if c.get("status") == "Pending")
    except Exception as e:
        print(f"Error fetching campaigns: {e}")

    # Bank credits
    try:
        bc_res = sb.table("bank_credits").select("amount, match_status, description").execute().data or []
        total_credits = len(bc_res)
        matched_credits = sum(1 for b in bc_res if b.get("match_status") not in ("UNMATCHED", "UNMATCHED_NOTIFIED"))
        unmatched_credits = sum(1 for b in bc_res if b.get("match_status") in ("UNMATCHED", "UNMATCHED_NOTIFIED"))
        total_received = sum(float(b.get("amount", 0) or 0) for b in bc_res)
        unexplained_amount = sum(float(b.get("amount", 0) or 0) for b in bc_res if b.get("match_status") in ("UNMATCHED", "UNMATCHED_NOTIFIED"))
        processed_amount = sum(float(b.get("amount", 0) or 0) for b in bc_res if b.get("match_status") not in ("UNMATCHED", "UNMATCHED_NOTIFIED"))
        reject_rate_percent = round((unmatched_credits / total_credits * 100), 1) if total_credits > 0 else 0.0
        returns_count = sum(1 for b in bc_res if "RETURN" in (b.get("description", "") or "").upper())
        returns_percent = round((returns_count / total_credits * 100), 1) if total_credits > 0 else 0.0
    except Exception as e:
        print(f"Error fetching bank_credits: {e}")

    # Settlements — single query, filter in Python (FIXED: was two round-trips)
    try:
        all_s = sb.table("settlements").select("created_at, paid_at, status").execute().data or []
        pending_settlements_count = sum(1 for s in all_s if s.get("status") == "Pending")

        latencies = []
        for s in all_s:
            if s.get("status") == "PAID" and s.get("paid_at") and s.get("created_at"):
                try:
                    p_at = datetime.fromisoformat(s["paid_at"].replace("Z", "+00:00"))
                    c_at = datetime.fromisoformat(s["created_at"].replace("Z", "+00:00"))
                    latencies.append((p_at - c_at).total_seconds())
                except Exception:
                    continue
        avg_latency_seconds = int(sum(latencies) / len(latencies)) if latencies else 0
    except Exception as e:
        print(f"Error calculating latency: {e}")

    # Orders
    try:
        o_res = sb.table("amazon_orders").select("order_id, order_value").execute().data or []
        total_orders = len(o_res)
        total_order_value = sum(float(o.get("order_value", 0) or 0) for o in o_res)
    except Exception as e:
        print(f"Error fetching orders: {e}")

    return {
        "total_campaigns": total_campaigns,
        "pending_campaigns": pending_campaigns,
        "matched_campaigns": matched_campaigns,
        "matched_credits": matched_credits,
        "unmatched_credits": unmatched_credits,
        "total_received": total_received,
        "unexplained_amount": unexplained_amount,
        "pending_settlements": pending_settlements_count,
        "total_orders": total_orders,
        "total_order_value": total_order_value,
        "processed_amount": processed_amount,
        "pending_amount": pending_amount,
        "avg_latency_seconds": avg_latency_seconds,
        "reject_rate_percent": reject_rate_percent,
        "returns_percent": returns_percent,
    }


# ---------------------------------------------------------------------------
# Campaigns CRUD
# ---------------------------------------------------------------------------
@app.get("/campaigns")
def list_campaigns(user: dict = Depends(get_current_user)):
    sb = get_supabase()
    return sb.table("campaigns").select("*").order("created_at", desc=True).execute().data


@app.post("/campaigns")
def create_campaign(payload: CampaignCreate, user: dict = Depends(get_current_user)):  # FIXED: added auth
    sb = get_supabase()
    record = payload.model_dump(exclude_none=True)
    record["status"] = normalize_campaign_status(record.get("status"))
    result = sb.table("campaigns").insert(record).execute()
    return result.data[0] if result.data else result.data


@app.patch("/campaigns/{campaign_id}")
def update_campaign(campaign_id: str, payload: CampaignUpdate, user: dict = Depends(get_current_user)):  # FIXED: added auth
    sb = get_supabase()
    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "status" in updates:
        updates["status"] = normalize_campaign_status(updates["status"])
    result = sb.table("campaigns").update(updates).eq("id", campaign_id).execute()
    return result.data[0] if result.data else {"ok": True}


@app.delete("/campaigns/{campaign_id}")
def delete_campaign(campaign_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    sb.table("campaigns").delete().eq("id", campaign_id).execute()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Amazon Orders
# ---------------------------------------------------------------------------
@app.get("/orders")
def list_orders(user: dict = Depends(get_current_user)):
    sb = get_supabase()
    return sb.table("amazon_orders").select("*").order("created_at", desc=True).execute().data


@app.delete("/orders/{order_id}")
def delete_order(order_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    sb.table("amazon_orders").delete().eq("order_id", order_id).execute()
    return {"ok": True}


class OrderUpdate(BaseModel):
    product_name: Optional[str] = None
    order_value: Optional[float] = None
    ship_to: Optional[str] = None
    order_date: Optional[str] = None
    status: Optional[str] = None


@app.patch("/orders/{order_id}")
def update_order(order_id: str, payload: OrderUpdate, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = sb.table("amazon_orders").update(updates).eq("order_id", order_id).execute()
    return result.data[0] if result.data else {"ok": True}


# ---------------------------------------------------------------------------
# Bank Credits
# ---------------------------------------------------------------------------
@app.get("/bank-credits")
def list_bank_credits(user: dict = Depends(get_current_user)):
    sb = get_supabase()
    return sb.table("bank_credits").select("*").order("credit_date", desc=True).execute().data


@app.post("/upload-bank-csv")
async def upload_bank_csv(
    file: UploadFile = File(...),
    password: str = Form(None),
    background_tasks: BackgroundTasks = None,
    user: dict = Depends(get_current_user),
):
    content = await file.read()
    try:
        records = parse_bank_csv(content, file_name=file.filename, password=password)
        sb = get_supabase()

        for record in records:
            sb.table("bank_credits").upsert(record, on_conflict="neft_ref").execute()

        if background_tasks is not None:
            background_tasks.add_task(run_reconciliation)

        return {"message": "Statement Parsed Successfully", "records_processed": len(records)}
    except PasswordRequiredError:
        raise HTTPException(status_code=428, detail="PASSWORD_REQUIRED")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Settlements
# ---------------------------------------------------------------------------
@app.get("/settlements")
def list_settlements(user: dict = Depends(get_current_user)):  # FIXED: added auth
    sb = get_supabase()
    rows = (
        sb.table("settlements")
        .select("*, campaigns(product_name, assigned_to), bank_credits(credit_date, amount, description)")
        .order("created_at", desc=True)
        .execute()
        .data
    )
    return rows


@app.post("/settlements/{settlement_id}/mark-paid")
def mark_settlement_paid(settlement_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    result = (
        sb.table("settlements")
        .update({"status": "PAID", "paid_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", settlement_id)
        .execute()
    )
    return result.data[0] if result.data else {"ok": True}


# ---------------------------------------------------------------------------
# Pending Settlements (view)
# ---------------------------------------------------------------------------
@app.get("/pending-settlements")
def pending_settlements(user: dict = Depends(get_current_user)):  # FIXED: added auth
    sb = get_supabase()
    res = (
        sb.table("settlements")
        .select("id, amount, created_at, campaigns!inner(product_name, expected_refund, assigned_to), bank_credits(amount, credit_date)")
        .eq("status", "Pending")
        .eq("campaigns.assigned_to", "Raghvendra")
        .execute()
    )

    output = []
    for row in res.data or []:
        cmp = row.get("campaigns") or {}
        bc = row.get("bank_credits") or {}
        output.append({
            "settlement_id": row["id"],
            "product_name": cmp.get("product_name"),
            "expected_refund": cmp.get("expected_refund"),
            "credit_amount": bc.get("amount"),
            "credit_date": bc.get("credit_date"),
            "settlement_amount": row["amount"],
            "settlement_created_at": row["created_at"],
        })

    return output


# ---------------------------------------------------------------------------
# Reconciliation
# ---------------------------------------------------------------------------
@app.post("/run-reconciliation")
def reconcile(user: dict = Depends(get_current_user)):  # FIXED: added auth
    result = run_reconciliation()
    return {"message": "Reconciliation Complete", "result": result}
