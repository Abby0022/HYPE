"use client";

import { Plus } from "lucide-react";

interface CampaignHeaderProps {
  onAddClick: () => void;
}

export function CampaignHeader({ onAddClick }: CampaignHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-black text-slate-900 mb-2">Records</h1>
        <p className="text-sm text-slate-500 font-medium">Manage and track all financial records</p>
      </div>
      <button
        onClick={onAddClick}
        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded text-xs font-black hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-widest shadow-sm"
      >
        <Plus className="w-4 h-4" />
        NEW RECORD
      </button>
    </div>
  );
}
