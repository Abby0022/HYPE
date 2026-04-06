'use client'

import { useState } from 'react'
import { Send, Package, Filter, DownloadCloud, FileText, FileSpreadsheet } from 'lucide-react'
import {
  PageHeader, FilterBar, DataTable, EmptyState,
  LoadingState, StatusBadge, type ColumnDef,
} from '@/components'
import { useSettlements } from './hooks'
import { useExport } from '@/hooks/useExport'
import { SETTLEMENT_TABS } from './constants'

export default function SettlementsPage() {
  const { settlements, loading, search, setSearch, statusFilter, setStatusFilter } = useSettlements()
  const { handleExport } = useExport()
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleExportData = (format: 'csv' | 'excel') => {
    handleExport(
      settlements.map(s => ({
        'Settlement ID': s.id.slice(0, 8),
        'Campaign': s.campaign_id.slice(0, 8),
        'Amount (₹)': s.amount,
        'Status': s.status || 'pending',
        'Paid Date': s.paid_at ? new Date(s.paid_at).toLocaleDateString() : '—',
      })),
      format,
      { filename: `settlements_${new Date().toISOString().split('T')[0]}`, sheetName: 'Settlements' }
    )
    setShowExportMenu(false)
  }

  const columns: ColumnDef[] = [
    {
      key: 'id', label: 'Settlement ID',
      render: (v: string) => <span className="text-sm font-medium text-[#0a0a0a]">{v.slice(0, 8)}…</span>,
    },
    {
      key: 'campaign_id', label: 'Campaign',
      render: (v: string) => <span className="text-sm text-gray-600">{v.slice(0, 8)}…</span>,
    },
    {
      key: 'amount', label: 'Amount',
      render: (v: number) => <span className="text-sm font-semibold text-[#0a0a0a]">₹{v.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (v: string | undefined | null) => {
        const s = v || 'pending'
        const map: Record<string, 'pending' | 'success' | 'error' | 'info'> = {
          pending: 'pending', paid: 'success', failed: 'error',
        }
        return <StatusBadge status={s} variant={map[s.toLowerCase()] || 'info'} size="md" />
      },
    },
    {
      key: 'paid_at', label: 'Paid Date',
      render: (v: string | undefined) => (
        <span className="text-sm text-gray-500">
          {v ? new Date(v).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col p-6 lg:p-8 w-full bg-white min-h-screen">
      <PageHeader title="Settlements" subtitle="Track and manage settlement payments" />

      <FilterBar
        tabs={Array.from(SETTLEMENT_TABS)}
        activeTab={statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
        onTabChange={tab => setStatusFilter(tab === 'All' ? 'all' : tab.toLowerCase() as typeof statusFilter)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by settlement ID or campaign..."
        loading={loading}
        rightContent={
          <div className="flex items-center gap-2">
            <button onClick={() => {}}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors">
              <Send className="w-4 h-4" /> Process Settlement
            </button>
            <div className="relative">
              <button onClick={() => setShowExportMenu(v => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                <DownloadCloud className="w-4 h-4" /> Export
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 min-w-48 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl shadow-black/5">
                  <button onClick={() => handleExportData('csv')}
                    className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 text-left">
                    <FileText className="w-4 h-4" /> CSV Export
                  </button>
                  <button onClick={() => handleExportData('excel')}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 text-left">
                    <FileSpreadsheet className="w-4 h-4" /> Excel Export
                  </button>
                </div>
              )}
            </div>
          </div>
        }
        actions={[{ label: 'Filter', icon: <Filter className="w-4 h-4" />, onClick: () => {}, variant: 'secondary' }]}
      />

      <div className="flex-1 min-h-[600px] bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingState count={5} type="rows" />
        ) : settlements.length === 0 ? (
          <EmptyState
            icon={<Package className="w-7 h-7" />}
            title="No settlements found"
            description={search.length > 0
              ? 'Try adjusting your search criteria.'
              : 'Settlements will appear here once campaigns are matched.'}
            hasSearch={search.length > 0}
          />
        ) : (
          <DataTable columns={columns} data={settlements} keyField="id" />
        )}
      </div>
    </div>
  )
}
