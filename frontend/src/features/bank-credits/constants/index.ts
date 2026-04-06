export const BANK_CREDIT_TABS = ["All", "Matched", "Unmatched", "Partial"] as const;

export const BANK_CREDIT_STATUS_CONFIG = {
  matched: {
    label: "Matched",
    variant: "success" as const,
  },
  unmatched: {
    label: "Unmatched",
    variant: "pending" as const,
  },
  partial: {
    label: "Partial",
    variant: "warning" as const,
  },
} as const;
