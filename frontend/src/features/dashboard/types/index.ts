export interface DashboardMetrics {
  totalCampaigns: number;
  matchedCampaigns: number;
  pendingCampaigns: number;
  failedCampaigns: number;
  totalExpectedRefund: number;
  totalBankCredits: number;
  pendingSettlements: number;
  completedSettlements: number;
  failedSettlements: number;
}

export interface MetricCard {
  title: string;
  value: string | number;
  change?: {
    percentage: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
}
