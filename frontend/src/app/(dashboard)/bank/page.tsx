"use client";

import { useEffect, useState, useRef } from "react";
import { fetchBankCredits, uploadBankCSV } from "@/lib/api";
import { Upload, ChevronDown, MoreHorizontal, Check, AlertCircle, FileText } from "lucide-react";

interface BankCredit {
  id: string;
  created_at: string;
  credit_date: string;
  amount: number;
  neft_ref: string;
  description: string | null;
  match_status: string;
  campaign_id: string | null;
}

export default function BankPage() {
  const [credits, setCredits] = useState<BankCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      setCredits(await fetchBankCredits());
    } catch {
      setCredits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadResult(null);
    try {
      const result = await uploadBankCSV(file);
      setUploadResult(
        `Successfully processed ${result.records_processed} ledger entries. Reconciliation started.`
      );
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failure";
      setUploadResult(`Error: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".csv")) handleUpload(file);
  };

  return (
    <div className="flex flex-col p-8 text-gray-900 w-full animate-in fade-in duration-500">
      
      {/* Top Actions Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-gray-900 leading-tight">Bank Credits</h1>
        </div>
        <div className="flex items-center gap-2">
           <button
              onClick={() => fileRef.current?.click()} 
              className="flex items-center gap-2 px-3 py-1.5 bg-[#111827] text-white border border-[#111827] rounded text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
           >
              <Upload className="w-4 h-4" />
              Upload CSV
           </button>
        </div>
      </div>

      {/* Upload Hub / Result */}
      <div className={`mt-6 p-6 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center min-h-[140px] mb-2 ${dragging ? "border-[#111827] bg-gray-50" : "border-gray-300 bg-white"}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
      >
          <input ref={fileRef} type="file" accept=".csv" onChange={onFileSelect} className="hidden" />
          
          {uploading ? (
             <div className="flex flex-col items-center">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-[#111827] rounded-full animate-spin mb-3"></div>
                <span className="text-[13px] font-medium text-gray-600">Processing statement...</span>
             </div>
          ) : uploadResult ? (
             <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${uploadResult.includes("Error") ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                   {uploadResult.includes("Error") ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                </div>
                <span className="text-sm font-medium text-gray-700">{uploadResult}</span>
             </div>
          ) : (
             <div className="flex flex-col items-center text-center cursor-pointer" onClick={() => fileRef.current?.click()}>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                   <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-[13px] font-medium text-gray-900">Drag & drop your bank statement here</span>
                <span className="text-[12px] text-gray-500 mt-1">Supports SBI & ICICI Standard CSV formats</span>
             </div>
          )}
      </div>

      {/* Filters Row */}
      <div className="mt-4 flex items-center gap-2 pb-5">
         <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-full text-[13px] font-medium hover:bg-gray-50 transition-colors">
            Match Status
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
         </button>
         <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-full text-[13px] font-medium hover:bg-gray-50 transition-colors">
            Date
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
         </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden flex flex-col">
          <div className="w-full flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-[13px] font-medium text-gray-400">Entry Date</th>
                  <th className="px-4 py-3 text-[13px] font-medium text-gray-400">Match Status</th>
                  <th className="px-4 py-3 text-[13px] font-medium text-gray-400">NEFT Reference</th>
                  <th className="px-4 py-3 text-[13px] font-medium text-gray-400">Actual Credit</th>
                  <th className="px-4 py-3 text-[13px] font-medium text-gray-400">Narration Detail</th>
                  <th className="px-4 py-3 text-[13px] font-medium text-gray-400 w-10"></th>
                </tr>
              </thead>
              <tbody className="text-sm border-t border-gray-100">
                {loading && (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-400">Loading ledger...</td></tr>
                )}
                {!loading && credits.length === 0 && (
                   <tr><td colSpan={6} className="py-10 text-center text-gray-400 border-b border-gray-100">No credits imported yet.</td></tr>
                )}
                {credits.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3.5 text-gray-500 font-medium text-[13px]">
                      {new Date(c.credit_date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5">
                       <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${c.match_status.toUpperCase() === 'EXACT' ? 'bg-emerald-500' : c.match_status.toUpperCase() === 'HIGH' ? 'bg-indigo-500' : 'bg-red-500'}`}></div>
                          <span className={`text-[13px] font-medium ${c.match_status.toUpperCase() === 'EXACT' ? 'text-emerald-600' : c.match_status.toUpperCase() === 'HIGH' ? 'text-indigo-600' : 'text-red-500'}`}>
                             {c.match_status.toUpperCase() === 'EXACT' ? 'Matched' : c.match_status.toUpperCase() === 'HIGH' ? 'Probable' : 'Unmatched'}
                          </span>
                       </div>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-mono text-gray-500 bg-gray-50/50">
                      {c.neft_ref}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-gray-900">
                       ₹{Number(c.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-[13px] max-w-[250px] truncate" title={c.description || ""}>
                      {c.description || "System Automated Inflow"}
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                       <MoreHorizontal className="w-4 h-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && credits.length > 0 && (
             <div className="p-4 border-t border-gray-200 flex items-center justify-between text-[13px] text-gray-500">
                <div>Showing 1 to {credits.length} of {credits.length} entries</div>
             </div>
          )}
      </div>
    </div>
  );
}
