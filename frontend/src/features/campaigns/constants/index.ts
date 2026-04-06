export const CAMPAIGN_TABS = ["Overview", "All", "Pending", "Matched", "Failed", "Recent"] as const;

export const CAMPAIGN_STATUS_CONFIG = {
  matched: {
    label: "Matched",
    bgColor: "bg-slate-900",
    textColor: "text-white",
  },
  pending: {
    label: "Pending",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
  },
  failed: {
    label: "Failed",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
  },
} as const;
