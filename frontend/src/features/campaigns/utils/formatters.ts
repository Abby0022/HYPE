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

export const getAssigneeInitial = (assignee: string | null | undefined): string => {
  return assignee ? assignee.charAt(0).toUpperCase() : "?";
};
