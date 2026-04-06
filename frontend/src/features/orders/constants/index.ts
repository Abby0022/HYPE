export const ORDER_TABS = ["All", "Pending", "Logged", "Shipped", "Delivered"] as const;

export const ORDER_STATUS_CONFIG = {
  logged: {
    label: "Logged",
    color: "emerald",
  },
  pending: {
    label: "Pending",
    color: "amber",
  },
  shipped: {
    label: "Shipped",
    color: "blue",
  },
  delivered: {
    label: "Delivered",
    color: "slate",
  },
} as const;
