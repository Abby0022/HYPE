"use client";

import { useEffect, useState } from "react";
import { fetchSettlements, markSettlementPaid } from "@/lib/api";
import { Download, ChevronDown, Check, Loader2, ArrowRight } from "lucide-react";

interface Settlement {
  id: string;
  created_at: string;
  campaign_id: string;
  bank_credit_id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  campaigns?: {
    product_name: string;
    assigned_to: string | null;
  };
  bank_credits?: {
    credit_date: string;
    amount: number;
    description: string | null;
  };
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setSettlements(await fetchSettlements());
    } catch {
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkPaid = async (id: string) => {
    setMarkingId(id);
    try {
      await markSettlementPaid(id);
      await load();
    } finally {
      setMarkingId(null);
    }
  };

  const pendingCount = settlements.filter(s => s.status?.toUpperCase() === "PENDING").length;
  const totalPending = settlements.filter(s => s.status?.toUpperCase() === "PENDING").reduce((acc, s) => acc + Number(s.amount), 0);

  return (
    <div className="flex flex-col p-8 text-gray-900 w-full animate-in fade-in duration-500">
      
      {/* Top Actions Row */}
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-gray-900">Settlements</h1>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm text-gray-700">
              <Download className="w-4 h-4" />
              Export
           </button>
        </div>
      </div>

      {/* Stats Summary Line */}
      {!loading && settlements.length > 0 && (
        <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center gap-6 animate-in slide-in-from-top-4 duration-300">
           <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Pending</span>
              <span className="text-xl font-bold text-red-500">₹{totalPending.toLocaleString("en-IN")}</span>
           </div>
           <div className="w-px h-10 bg-gray-200"></div>
           <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Records</span>
              <span className="text-xl font-bold text-gray-900">{pendingCount}</span>
           </div>
           <div className="w-px h-10 bg-gray-200"></div>
           <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active Partner</span>
              <div className="flex items-center gap-2">
                 <div className="w-6 h-6 rounded-full bg-[#111827] text-white flex items-center justify-center text-[10px] font-bold">RA</div>
                 <span className="text-sm font-bold text-gray-700">Raghvendra</span>
              </div>
           </div>
        </div>
      )}

      {/* Filters Row */}
      <div className="mt-6 flex items-center gap-2 pb-5 border-b border-gray-200">
         <button className="flex items-center gap-2 px-3 py-1.5 bg-[#111827] text-white rounded-full text-[13px] font-medium hover:bg-gray-800 transition-colors">
            Payment Status
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
         </button>
         <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-full text-[13px] font-medium hover:bg-gray-50 transition-colors">
            Date
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
         </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white mt-4 border border-gray-200 shadow-sm rounded-lg overflow-hidden flex flex-col">
          <div className="w-full flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-[13px] font-medium text-gray-400">Order Ref</th>
                  <th className="px-4 py-3 text-[13px] font-medium text-gray-400">Payment Status</th>
                  <th className="px-4 py-3 text-[13px] font-medium text-gray-400">Product</th>
                  <th className="px-4 py-3 text-[13px] font-medium text-gray-400">Total Net</th>
                  <th className="px-4 py-3 text-[13px] font-medium text-gray-400">Credit Date</th>
                  <th className="px-4 py-3 text-[13px] font-medium text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm border-t border-gray-100">
                {loading && (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-400">Loading settlements...</td></tr>
                )}
                {!loading && settlements.length === 0 && (
                   <tr><td colSpan={6} className="py-10 text-center text-gray-400 border-b border-gray-100">No pending settlements found.</td></tr>
                )}
                {settlements.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3.5">
                      <code className="text-[12px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                         #{s.campaign_id.slice(-6).toUpperCase()}
                      </code>
                    </td>
                    <td className="px-4 py-3.5">
                       <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${s.status?.toUpperCase() === 'PAID' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          <span className={`text-[13px] font-medium ${s.status?.toUpperCase() === 'PAID' ? 'text-emerald-600' : 'text-red-500'}`}>
                             {s.status?.toUpperCase() === 'PAID' ? 'Paid' : 'Pending'}
                          </span>
                       </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-gray-900 max-w-[200px] truncate" title={s.campaigns?.product_name}>
                      {s.campaigns?.product_name}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-gray-900">
                       ₹{Number(s.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-[13px]">
                      {s.bank_credits?.credit_date || "—"}
                    </td>
                    <td className="px-4 py-3.5 w-[150px]">
                      {s.status?.toUpperCase() === "PENDING" ? (
                        <button
                          onClick={() => handleMarkPaid(s.id)}
                          className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded disabled:opacity-50 transition-colors"
                          disabled={markingId === s.id}
                        >
                          {markingId === s.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Mark Paid
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-bold tracking-wider uppercase">
                           Done
                           <ArrowRight className="w-3 h-3 opacity-50" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && settlements.length > 0 && (
             <div className="p-4 border-t border-gray-200 flex items-center justify-between text-[13px] text-gray-500">
                <div>Showing 1 to {settlements.length} of {settlements.length} entries</div>
             </div>
          )}
      </div>
    </div>
  );
}
