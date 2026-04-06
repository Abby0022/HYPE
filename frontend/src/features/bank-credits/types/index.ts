export interface BankCredit {
  id: string;
  created_at: string;
  credit_date: string;
  amount: number;
  neft_ref: string;
  description?: string;
  match_status: "UNMATCHED" | "MATCHED" | "PARTIAL";
  campaign_id?: string;
}
