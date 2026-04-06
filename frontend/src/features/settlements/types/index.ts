export interface Settlement {
  id: string;
  created_at: string;
  campaign_id: string;
  bank_credit_id: string;
  amount: number;
  status: "Pending" | "PAID" | "FAILED";
  paid_at?: string;
}
