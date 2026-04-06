"use client";

import { AlertCircle, Package, Check, Info } from "lucide-react";
import { Campaign } from "../types";
import { formatCurrency, getAssigneeInitial } from "../utils";

interface CampaignTableProps {
  campaigns: Campaign[];
  loading: boolean;
  onDelete: (id: string) => void;
  onAddClick: () => void;
}

export function CampaignTable({ campaigns, loading, onDelete, onAddClick }: CampaignTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-lg border border-slate-200">
        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300 mb-6">
          <Package className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No records found</h3>
        <p className="text-slate-500 text-sm max-w-xs text-center mb-8">
          Start tracking financial data by creating your first record.
        </p>
        <button 
          onClick={onAddClick}
          className="px-6 py-2.5 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
        >
          Create First Record
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Order Value</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Expected Refund</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Partner</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {campaigns.map((campaign) => (
              <tr 
                key={campaign.id} 
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center text-slate-600 font-bold text-sm">
                      {campaign.product_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{campaign.product_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{campaign.id.slice(0, 8)}...</td>
                <td className="px-6 py-4">
                  <StatusBadge status={campaign.status} />
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">₹0</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">{formatCurrency(campaign.expected_refund)}</td>
                <td className="px-6 py-4">
                  {campaign.assigned_to ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                        {getAssigneeInitial(campaign.assigned_to)}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{campaign.assigned_to}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => onDelete(campaign.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isMatched = status.toLowerCase() === "matched";
  const isPending = status.toLowerCase() === "pending";
  const isFailed = status.toLowerCase() === "failed";

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide ${
      isMatched 
        ? "bg-slate-900 text-white" 
        : isPending
        ? "bg-amber-50 text-amber-700"
        : isFailed
        ? "bg-red-50 text-red-700"
        : "bg-slate-100 text-slate-700"
    }`}>
      {isMatched && <Check className="w-3 h-3" />}
      {isPending && <Info className="w-3 h-3" />}
      {isFailed && <AlertCircle className="w-3 h-3" />}
      {status}
    </div>
  );
}
