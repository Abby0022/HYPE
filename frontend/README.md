# Hype Campaign Tracker — Frontend Dashboard

A high-fidelity, modern SaaS dashboard built with Next.js and Tailwind CSS. It serves as the primary control center for managing e-commerce campaigns, bank reconciliations, and settlements in real-time.

---

## 🚀 Overview

The **Hype Frontend** provides a premium, responsive interface that consumes the FastAPI backend and provides complete operational visibility. It's designed to streamline complex financial reconciliations into a simple, single-page application workflow.

- **Dynamic Metrics**: Instantly visualize pending receivables, platform fees, and recovery rates.
- **Secure File Ingestion**: Upload password-protected bank statements directly from the browser for automated AI pairing.
- **Data Portability**: Export your verified settlements and raw bank credits as clean `.csv` or `.xlsx` files with a single click.

---

## 💎 Key Features in Depth

### 1. Unified Dashboard Analytics
The command center for business health.
*   **Performance Cards**: Track `Total Processed`, `Gap Amount` (unexplained variations), `Pending Refunds`, and `Recovery Rate`.
*   **Minimalist UI**: Built using a sleek, monochromatic design system that emphasizes data readability and reduces cognitive load.

### 2. Campaign Management (`/campaigns`)
Manage the lifecycle of expected refunds.
*   **Interactive Modal Workflows**: Create new expected campaigns directly from the UI when a Telegram bot is unavailable.
*   **Status Tracking**: Live visual indicators (Badges) tracking whether a campaign is `Pending`, `Matched`, or `Settled`.

### 3. Smart Document Decryption (`/bank-credits`)
Highly advanced file upload handler for bank statements.
*   **Encrypted Payloads**: Securely prompts the user for document passwords when encrypted ZIP or Excel files are uploaded, decrypting them server-side without leaking credentials.
*   **Status Triage**: Filter items by their match status (e.g., viewing only `Unmatched` credits to resolve manually).
*   **One-Click Export**: Download fully filtered datasets back to Excel.

### 4. Partner Settlements (`/settlements`)
Easily attribute funds to respective team members or accounts.
*   **Attribution Engine**: View who is owed what based on the `assigned_to` parameter.
*   **One-Click Payouts**: Mark settlements as "Paid" to close the lifecycle loop.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server & Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing for robust API consumption)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS)
- **Icons**: [Lucide React](https://lucide.dev/) (Consistent, clean iconography)
- **State Management**: Custom React Hooks pattern (e.g. `useBankCredits`, `useExport`)
- **API Client**: [Axios](https://axios-http.com/) with Interceptors for Supabase Auth Tokens.
- **Authentication**: [Supabase Auth](https://supabase.com/docs/guides/auth) 

---

## 📦 Getting Started

### Prerequisites
Make sure you have **Node.js (18+)** and **npm** / **yarn** installed.

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
   *(or `yarn install` / `pnpm install`)*

### Development
Start the Next.js development server:
```bash
npm run dev
```
- **Local Host**: `http://localhost:3000`

---

## 🔑 Environment Variables

Create a `.env.local` file in the `frontend/` directory with the following keys:

| Key | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Anon Key for frontend authentication |
| `NEXT_PUBLIC_API_URL` | The URL of the FastAPI Backend (e.g., `http://localhost:8000`) |

---

## 📂 Project Structure

```text
frontend/
├── src/
│   ├── app/                 # Next.js App Router (pages & layouts)
│   ├── components/          # Reusable UI elements (DataTable, Modal, etc.)
│   ├── features/            # Domain-driven feature modules
│   │   ├── bank-credits/    # Components & logic for bank statements
│   │   ├── campaigns/       # Components & logic for active campaigns
│   │   ├── dashboard/       # Main overview grid & charts
│   │   └── settlements/     # Payout matrices
│   ├── hooks/               # Global utility hooks (useExport, useAuth)
│   └── lib/                 # Third-party wrappers (api.ts for Axios)
├── next.config.ts           # Next.js build configuration
└── tailwind.config.ts       # Tailwind theme and plugin settings
```

---

## 🔒 Security & API Integration

The frontend uses **Axios Interceptors** to automatically attach the current Supabase JWT token to the `Authorization` header on every request to the backend.

> [!NOTE] 
> The backend relies exclusively on these tokens for route protection. If a user logs out of the frontend, their backend requests will be rejected via a `401 Unauthorized`.

---

Developed with ❤️ for the Hype SaaS platform.
