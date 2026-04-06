import { Target, CheckCircle2, AlertCircle, DollarSign } from "lucide-react";

export const METRIC_CARDS_CONFIG = [
  {
    id: "total_campaigns",
    title: "Total Campaigns",
    icon: Target,
    key: "totalCampaigns",
  },
  {
    id: "matched_campaigns",
    title: "Matched Campaigns",
    icon: CheckCircle2,
    key: "matchedCampaigns",
  },
  {
    id: "pending_campaigns",
    title: "Pending Campaigns",
    icon: AlertCircle,
    key: "pendingCampaigns",
  },
  {
    id: "total_refund",
    title: "Expected Refunds",
    icon: DollarSign,
    key: "totalExpectedRefund",
    isCurrency: true,
  },
  {
    id: "bank_credits",
    title: "Bank Credits",
    icon: DollarSign,
    key: "totalBankCredits",
    isCurrency: true,
  },
  {
    id: "pending_settlements",
    title: "Pending Settlements",
    icon: AlertCircle,
    key: "pendingSettlements",
  },
] as const;
