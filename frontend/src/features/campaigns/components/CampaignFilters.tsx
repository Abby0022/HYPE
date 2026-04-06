"use client";

import { Search, Filter, Download } from "lucide-react";
import { CAMPAIGN_TABS } from "../constants";
import { CampaignStatus } from "../types";

interface CampaignFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: CampaignStatus;
  onStatusChange: (val: string) => void;
}

export function CampaignFilters({ 
  search, 
  onSearchChange, 
  statusFilter, 
  onStatusChange 
}: CampaignFiltersProps) {
  return (
    <div className="mb-8 space-y-5">
      {/* Tab Navigation */}
      <div className="flex items-center gap-8 border-b border-slate-200 -mb-px">
        {CAMPAIGN_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onStatusChange(tab === "All" ? "all" : tab.toLowerCase())}
            className={`pb-3 pt-0 text-sm transition-all border-b-2 whitespace-nowrap ${
              statusFilter === tab.toLowerCase() || (tab === "All" && statusFilter === "all")
                ? "border-slate-900 text-slate-900 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-500 font-medium"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search & Action Bar */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search records..." 
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
          />
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
        
        <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          <Download className="w-4 h-4" />
          CSV Export
        </button>
      </div>
    </div>
  );
}
