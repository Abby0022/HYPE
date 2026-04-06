export interface Campaign {
  id: string;
  created_at: string;
  product_name: string;
  order_id?: string;
  order_value?: number;
  campaign_fee?: number;
  expected_refund: number;
  status: "Pending" | "Matched" | "Failed";
  assigned_to?: string;
}

export type CampaignStatus = "all" | "pending" | "matched" | "failed";
