export const formatOrderId = (orderId: string): string => {
  return `#${orderId.slice(-6)}`;
};

export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString("en-IN")}`;
};

export const formatDate = (date: string | null): string => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getCustomerInitial = (customerName: string | null | undefined): string => {
  return customerName ? customerName.charAt(0).toUpperCase() : "—";
};
