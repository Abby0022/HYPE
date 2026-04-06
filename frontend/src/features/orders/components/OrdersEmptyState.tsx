"use client";

import { Package } from "lucide-react";

interface OrdersEmptyStateProps {
  hasSearch: boolean;
  loading: boolean;
}

export function OrdersEmptyState({ hasSearch, loading }: OrdersEmptyStateProps) {
  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300 mb-6">
        <Package className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">No orders found</h3>
      <p className="text-slate-500 text-sm max-w-xs text-center">
        {hasSearch
          ? "Try adjusting your search criteria"
          : "Start importing orders to get started"}
      </p>
    </div>
  );
}
