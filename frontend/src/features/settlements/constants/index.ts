export const SETTLEMENT_TABS = ["All", "Pending", "Paid", "Failed"] as const;

export const SETTLEMENT_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    variant: "pending" as const,
  },
  paid: {
    label: "Paid",
    variant: "success" as const,
  },
  failed: {
    label: "Failed",
    variant: "error" as const,
  },
} as const;
