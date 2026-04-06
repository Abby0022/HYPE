"use client";

import { Upload } from "lucide-react";

interface OrdersHeaderProps {
  onImport?: () => void;
}

export function OrdersHeader({ onImport }: OrdersHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Orders</h1>
        <p className="text-slate-500 text-sm mt-1">Track and manage all incoming orders</p>
      </div>
      <button
        onClick={onImport}
        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
      >
        <Upload className="w-4 h-4" />
        Import Orders
      </button>
    </div>
  );
}
