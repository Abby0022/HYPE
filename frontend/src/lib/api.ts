import axios from "axios";
import { createClient } from "@/utils/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach the Supabase access token ──────────────────
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const supabase = createClient();
    // getSession() reads from the cookie that middleware refreshed — reliable
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }
  return config;
});

// ── Response interceptor: handle 401 globally ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      // Session expired or invalid — middleware will redirect on next navigation,
      // but force it now so the user doesn't sit on a broken page.
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export async function fetchDashboardSummary() {
  const { data } = await api.get("/dashboard-summary");
  return data;
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------
export async function fetchCampaigns() {
  const { data } = await api.get("/campaigns");
  return data;
}

export async function createCampaign(payload: {
  product_name: string;
  expected_refund: number;
  assigned_to?: string;
}) {
  const { data } = await api.post("/campaigns", payload);
  return data;
}

export async function deleteCampaign(id: string) {
  const { data } = await api.delete(`/campaigns/${id}`);
  return data;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export async function fetchOrders() {
  const { data } = await api.get("/orders");
  return data;
}

export async function deleteOrder(orderId: string) {
  const { data } = await api.delete(`/orders/${orderId}`);
  return data;
}

// ---------------------------------------------------------------------------
// Bank Credits
// ---------------------------------------------------------------------------
export async function fetchBankCredits() {
  const { data } = await api.get("/bank-credits");
  return data;
}

export async function uploadBankCSV(file: File, password?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (password) {
    formData.append("password", password);
  }
  const { data } = await api.post("/upload-bank-csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// ---------------------------------------------------------------------------
// Settlements
// ---------------------------------------------------------------------------
export async function fetchSettlements() {
  const { data } = await api.get("/settlements");
  return data;
}

export async function markSettlementPaid(id: string) {
  const { data } = await api.post(`/settlements/${id}/mark-paid`);
  return data;
}

// ---------------------------------------------------------------------------
// Pending Settlements
// ---------------------------------------------------------------------------
export async function fetchPendingSettlements() {
  const { data } = await api.get("/pending-settlements");
  return data;
}

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------
export async function runReconciliation() {
  const { data } = await api.post("/run-reconciliation");
  return data;
}
