# The Hype SaaS — Core Platform Documentation

An enterprise-grade, full-stack monorepo designed to solve the complexity of e-commerce refund tracking, bank reconciliation, and partner settlements. The platform combines autonomous AI data ingestion via a Telegram Bot with strict, deterministic financial matching algorithms inside a centralized operational dashboard.

---

## 🛠 Executive Summary

For modern e-commerce campaigns (specifically "Refund after Purchase" marketing loops), tracking who bought what, what the platform fees were, and matching those expectations against delayed, bulk bank deposits is a logistical nightmare.

**The Hype SaaS** eliminates manual spreadsheet tracking by:
1. **Automating Data Entry**: Operators forward WhatsApp/Amazon messages directly to a Telegram bot. Google's Gemini 2.0 AI extracts the financial parameters in real-time.
2. **Automating Reconciliation**: Excel/CSV bank statements are uploaded to the dashboard (even if password protected). The system runs a matching algorithm to link massive, unstructured bank credits to the exact user campaigns waiting for refunds.
3. **Automating Payouts**: Once a refund lands in the bank, the system automatically tags team members/partners and updates pending settlement metrics.

---

## 🏗 System Architecture

The codebase is structured as a Monorepo containing two decoupled, highly-specialized services united by a central Supabase PostgreSQL database.

### 1. The Backend Engine (`/backend`)
*   **Core**: Python 3.12 managed by the blazing-fast `uv` package manager.
*   **Web Framework**: FastAPI (running on `uvicorn`).
*   **Bot Framework**: `python-telegram-bot` (V20+). The bot's event loop is integrated directly into FastAPI's `lifespan` manager, allowing the bot and the web server to run in a single container.
*   **AI Layer**: `google-genai` (Gemini-2.0-Flash) acts as a structured JSON parser that interprets natural language and corrects missing financial parameters (like calculating expected refunds based on platform fees).

### 2. The Command Dashboard (`/frontend`)
*   **Core**: Next.js 15+ (App Router).
*   **Typing & Style**: Strict TypeScript, Tailwind CSS, and Lucide React icons.
*   **State & Networking**: Custom React Hooks powering Axios interceptors that seamlessly pass Supabase JWTs to the Python API.
*   **Key UI Capabilities**: Real-time KPI metrics, fully featured DataTables, Modal-based form interactions, and secure client-to-server file uploading.

---

## 🗄️ Database Schema & Data Flow

At the heart of the system is **Supabase**. The platform operates across 4 core tables:

1. **`amazon_orders`**
   - The raw source of truth for purchases. Contains the Amazon `order_id`, `order_value`, and the raw text parsed by the bot.
2. **`campaigns`**
   - The financial tracking unit. Represents an active marketing campaign waiting for a refund.
   - Contains: `expected_refund`, `campaign_fee`, and `status` (`Pending`, `Matched`).
3. **`bank_credits`**
   - The ingestion layer for bank statements (SBI, ICICI, HDFC, etc).
   - Contains: `amount`, `credit_date`, `description`/narration containing UTR or UPI refs, and `match_status`.
4. **`settlements`**
   - The final ledger. Links a `campaign_id` to a `bank_credit_id` when a match occurs, and assigns it to a partner (e.g. `Raghvendra`).

### The Data Lifecycle
1. **User Request** ➡️ **Telegram Bot** ➡️ **Gemini Model** ➡️ **Supabase (Insert `campaign`)**
2. **Bank Issues Statement** ➡️ **User uploads to Dashboard** ➡️ **FastAPI Parses File** ➡️ **Supabase (Insert `bank_credits`)**
3. **FastAPI Background Worker** ➡️ **Reconciler Math Formula** ➡️ **Matches Campaign & Credit** ➡️ **Supabase (Update statuses & Insert `settlements`)**
4. **Supabase APIs** ➡️ **Next.js Dashboard** ➡️ **Real-Time Visualization**

---

## 🧠 The Reconciliation Engine

The `backend/services/reconciler.py` script houses the core mathematical engine.

1. **Data Gathering**: It pulls all `bank_credits` where `match_status` == `"UNMATCHED"` and all `campaigns` where `status` == `"Pending"`.
2. **Precision Matching**: It loops over every unmatched credit and compares float values using strict tolerance math (`math.isclose()`) against the expected campaigns.
3. **Spam Protection**: If an item does not match, its status is updated to `UNMATCHED_NOTIFIED` and an alert is sent. This prevents the bot from spamming the Telegram support channel on subsequent cron runs.
4. **State Transition**: Upon a successful match:
   - The bank credit `match_status` -> `EXACT`.
   - The campaign `status` -> `Matched`.
   - A subsequent `settlement` record is created.

---

## 🔒 Security Posture

*   **Supabase RLS**: Row Level Security ensures that the database cannot be queried directly over the client without an authenticated JWT.
*   **Strict API Gateways**: The FastAPI backend acts as a shielded gateway. All destructive routes (Uploads, Deletions) require a validated `Bearer` token verified by `auth.py`. Missing secrets result in hard HTTP 500 blocks.
*   **Encrypted Document Handling**: The backend parser `bank_parser.py` natively handles `.zip` archives and password-protected `.xlsx` Excel sheets via `msoffcrypto-tool`. The dashboard prompts operators for the document password natively, transmitting it securely to the Python server, leaving no cached traces of unencrypted financial data.

---

## 🚦 Deployment & Bootstrapping

### 1. Clone the Monorepo
```bash
git clone https://github.com/your-org/the-hype.git
cd the-hype
```

### 2. Configure Environment Variables
You MUST set up environment variables in both directories before the services can talk to each other.

**Backend (`backend/.env`)**
```env
# Telemetry and Parsing
TELEGRAM_BOT_TOKEN="bot_api_token"
TELEGRAM_CHAT_ID="-100chatid"
GEMINI_API_KEY="AIzaSy..."

# Database & Security
SUPABASE_URL="https://yourid.supabase.co"
SUPABASE_KEY="service_role_or_anon_key"
SUPABASE_JWT_SECRET="your_jwt_signing_secret"
FRONTEND_URL="http://localhost:3000"
```

**Frontend (`frontend/.env.local`)**
```env
NEXT_PUBLIC_SUPABASE_URL="https://yourid.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

### 3. Start the Backend (Terminal 1)
```bash
cd backend
curl -LsSf https://astral-sh.uv.io/install.sh | sh  # Install uv if missing
uv sync
uv run uvicorn main:app --reload
```
*The Telegram Bot and the REST API are now concurrently alive.*

### 4. Start the Frontend Dashboard (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
*Navigate to `http://localhost:3000` to interact with your secure dashboard.*
