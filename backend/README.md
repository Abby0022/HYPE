# Hype Campaign Tracker — Backend API & Bot

A high-performance, integrated backend system for tracking e-commerce campaigns, managing Amazon orders, and automating bank reconciliation with AI-powered data extraction.

---

## 🚀 Overview

The **Hype Backend** is a unified service that handles both a RESTful API (FastAPI) and an autonomous Telegram Bot. It is designed to streamline the workflow for "Refund after Purchase" campaigns by:
- **AI Order Extraction**: Automatically parsing forwarded WhatsApp/Amazon order notifications using **Gemini 2.0 Flash**.
- **Bank Reconciliation**: Matching bank credit entries (from Excel/CSV uploads) against expected campaign refunds.
- **Dashboard API**: Feeding the frontend dashboard with real-time settlement tracking and performance metrics.

---

## 💎 Key Features in Depth

### 1. AI-Powered Order Ingestion (Gemini 2.0 Flash)
The core of the data entry system is a sophisticated LLM-based parser that eliminates manual data entry.
*   **Natural Language Processing**: Send any order notification text (even messy forwards) directly to the Telegram bot.
*   **Structured Extraction**: Extracts `Product Name`, `Order Value`, `Campaign Fee`, `Expected Refund`, `Order ID`, `Ship-to Address`, and `Amazon Account`.
*   **Business Logic Aware**: Automatically computes the `expected_refund` (Paid Amount - Platform Fee) if it's missing from the source text.
*   **Interactive Verification**: Presents a "Preview Card" with inline buttons for instant verification, field editing (e.g., `fee: 200`), or discarding.

### 2. Smart Bank Statement Parsing
A resilient parsing engine optimized for Indian banking formats.
*   **Multi-Bank Support**: Pre-configured aliases for **SBI, ICICI, HDFC, Axis, Kotak**, and **Paytm Payments Bank**.
*   **Security & Encryption**: Supports **password-protected Excel (.xlsx)** and **Encrypted ZIP** files. The system detects protection status and prompts for a password via the API/Frontend.
*   **Auto-Column Detection**: Scans the first 15 rows of any document to find headers, handling metadata rows and encoding quirks (UTF-8, Latin-1, CP1252) automatically.
*   **Reference Extraction**: Robustly extracts **UTR (NEFT/RTGS)**, **IMPS Reference (12 digits)**, and **UPI IDs** from narration strings.

### 3. Automated Reconciliation Engine
The system acts as a "matchmaker" between what you're owed and what arrived in your bank.
*   **Deterministic Matching**: Links `bank_credits` to `campaigns` based on the exact expected refund amount and timeframe.
*   **Settlement Tracking**: Once a match is confirmed, a `settlement` record is created, marking the campaign as **Matched**.
*   **Manual Overrides**: Operators can manually link unmatched credits to campaigns via the dashboard if needed.

### 4. Consolidated Dashboard & Reporting
Real-time analytics to keep track of business performance.
*   **Live Metrics**: Track **Total Volume (Paid)**, **Platform Fees Paid**, **Recovery Rate**, and **Balance Gap** (the delta between expected and received refunds).
*   **Bot Summary**: Command `/summary` provides a high-fidelity snapshot of the business directly in Telegram.
*   **Pending Receivables**: Command `/pending` shows exactly who owes you money and for which product.

### 5. Multi-User Partnership Management
Designed for collaborative environments where different partners manage different Amazon accounts.
*   **Partner Attribution**: Orders are automatically assigned to partners (e.g., **Abhijeet** or **Raghvendra**) based on text context or manual override.
*   **Segmented Views**: Filter settlements and metrics by partner to manage individual performance and payouts.

---

## 🛠️ Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12+)
- **Package Manager**: [uv](https://github.com/astral-sh/uv) (Modern, high-performance)
- **AI Engine**: [Google Generative AI](https://ai.google.dev/) (Gemini-2.0-Flash)
- **Telegram Bot**: [python-telegram-bot](https://python-telegram-bot.org/) (Async V20+)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **Data Processing**: [Pandas](https://pandas.pydata.org/) & [OpenPyXL](https://openpyxl.readthedocs.io/)

---

## 📦 Getting Started

### Prerequisites
Ensure you have the **`uv`** package manager installed:
```bash
curl -LsSf https://astral-sh.uv.io/install.sh | sh
```

### Installation
1. Clone the repository and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Initialize the environment and install dependencies:
   ```bash
   uv sync
   ```

### Running the Server
The bot is integrated into the FastAPI lifecycle. Starting the server automatically starts the Telegram bot:
```bash
uv run uvicorn main:app --reload
```
- **API Host**: `http://localhost:8000`
- **Swagger Docs**: `http://localhost:8000/docs`

---

## 🔑 Environment Variables

Create a `.env` file in the `backend/` directory with the following keys:

| Key | Description |
| :--- | :--- |
| `TELEGRAM_BOT_TOKEN` | API Token from @BotFather |
| `GEMINI_API_KEY` | Google AI Studio API Key |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase Service Role or Anon Key |
| `FRONTEND_URL` | URL of the frontend (for CORS) |

---

## 📂 Project Structure

```text
backend/
├── main.py              # FastAPI entry point & Lifespan manager
├── auth.py              # JWT Authentication logic
├── pyproject.toml       # UV project configuration
├── services/            # Core business logic
│   ├── telegram_bot.py  # Bot handlers and Gemini parsing
│   ├── reconciler.py    # Bank statement matching algorithm
│   └── bank_parser.py   # Secure Excel/CSV parser (supports encrypted files)
└── requirements.txt     # (Legacy) Pip dependency list
```

---

## 🛡️ Database Security

This project uses **Supabase** with the following core tables:
- `amazon_orders`: Master list of orders.
- `campaigns`: Active refund tracking records.
- `bank_credits`: Raw entries parsed from bank statements.
- `settlements`: Reconciled records linking a campaign to a bank credit.

> [!IMPORTANT]
> Ensure **RLS (Row Level Security)** is configured in Supabase to protect sensitive financial data. All API endpoints except `/` and `/docs` require a valid JWT from the frontend.

---

Developed with ❤️ for the Hype SaaS platform.
