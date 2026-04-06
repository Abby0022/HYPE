'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { UploadCloud, DownloadCloud, Package, Filter, FileText, FileSpreadsheet, CheckCircle2, AlertCircle, Lock, X } from 'lucide-react'
import {
  PageHeader, FilterBar, DataTable, EmptyState,
  LoadingState, StatusBadge, Modal, type ColumnDef,
} from '@/components'
import { useBankCredits } from './hooks'
import { useExport } from '@/hooks/useExport'
import { BANK_CREDIT_TABS } from './constants'
import { uploadBankCSV } from '@/lib/api'

export default function BankCreditsPage() {
  const { bankCredits, loading, search, setSearch, statusFilter, setStatusFilter, refreshBankCredits } = useBankCredits()
  const { handleExport } = useExport()
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExportData = (format: 'csv' | 'excel') => {
    handleExport(
      bankCredits.map(c => ({
        'NEFT Ref': c.neft_ref,
        'Credit Date': new Date(c.credit_date).toLocaleDateString(),
        'Amount (₹)': c.amount,
        'Description': c.description || '—',
        'Status': c.match_status,
      })),
      format,
      { filename: `bank_credits_${new Date().toISOString().split('T')[0]}`, sheetName: 'Bank Credits' }
    )
    setShowExportMenu(false)
  }

  const processUpload = async (file: File, pwd?: string) => {
    setUploadStatus(null)
    setUploading(true)
    try {
      const result = await uploadBankCSV(file, pwd)
      setUploadStatus(`Imported ${result.records_processed ?? 0} statement rows. Reconciliation started.`)
      await refreshBankCredits()
      setPasswordModalOpen(false)
      setPendingFile(null)
      setPassword('')
    } catch (err: any) {
      if (err.response?.status === 428 || err.response?.data?.detail === 'PASSWORD_REQUIRED') {
        setPendingFile(file)
        setPasswordModalOpen(true)
        setUploadStatus('File is protected. Waiting for password.')
      } else {
        setUploadStatus(`Error: ${err.response?.data?.detail || err.message || 'Upload failed'}`)
      }
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processUpload(file, password)
  }

  const columns: ColumnDef[] = [
    {
      key: 'neft_ref', label: 'NEFT Ref',
      render: (v: string) => <span className="text-sm font-medium text-[#0a0a0a]">{v}</span>,
    },
    {
      key: 'credit_date', label: 'Credit Date',
      render: (v: string) => <span className="text-sm text-gray-600">{new Date(v).toLocaleDateString()}</span>,
    },
    {
      key: 'amount', label: 'Amount',
      render: (v: number) => <span className="text-sm font-semibold text-[#0a0a0a]">₹{v.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'description', label: 'Description',
      render: (v: string | undefined) => (
        <span className="text-sm text-gray-500 max-w-xs truncate">{v || '—'}</span>
      ),
    },
    {
      key: 'match_status', label: 'Status',
      render: (v: string) => {
        const map: Record<string, 'pending' | 'success' | 'error' | 'warning' | 'info'> = {
          matched: 'success', unmatched: 'pending', partial: 'warning',
        }
        return <StatusBadge status={v} variant={map[v.toLowerCase()] || 'info'} size="md" />
      },
    },
  ]

  const isError = uploadStatus?.startsWith('Error')

  return (
    <div className="flex flex-col p-6 lg:p-8 w-full bg-white min-h-screen">
      <PageHeader title="Bank Credits" subtitle="Track and manage all bank credit transactions" />

      <FilterBar
        tabs={Array.from(BANK_CREDIT_TABS)}
        activeTab={statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
        onTabChange={tab => setStatusFilter(tab === 'All' ? 'all' : tab.toLowerCase() as 'all' | 'matched' | 'unmatched' | 'partial')}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by NEFT ref or description..."
        loading={loading || uploading}
        rightContent={
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block w-48">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input 
                type="password"
                placeholder="Doc Password (Opt)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-gray-300 transition-colors"
              />
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-60">
              <UploadCloud className="w-4 h-4" />
              {uploading ? 'Importing...' : 'Import Statement'}
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

      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xlsm" className="hidden" onChange={handleFileSelect} />

      {uploadStatus && (
        <div className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
          isError
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>
          {isError
            ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
          <div className="flex-1">{uploadStatus}</div>
          <button onClick={() => setUploadStatus(null)} className="ml-auto p-0.5 rounded-md hover:bg-black/5 transition-colors">
            <X className="w-4 h-4 opacity-70 hover:opacity-100" />
          </button>
        </div>
      )}

      <div className="flex-1 min-h-[600px] bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingState count={5} type="rows" />
        ) : bankCredits.length === 0 ? (
          <EmptyState
            icon={<Package className="w-7 h-7" />}
            title="No bank credits found"
            description={search.length > 0 ? 'Try adjusting your search criteria.' : 'Start by importing a bank statement.'}
            hasSearch={search.length > 0}
            action={{ label: 'Import Statement', onClick: () => fileRef.current?.click() }}
          />
        ) : (
          <DataTable columns={columns} data={bankCredits} keyField="id" />
        )}
      </div>

      <Modal title="Password Required" isOpen={passwordModalOpen} onClose={() => { setPasswordModalOpen(false); setPendingFile(null); setPassword('') }}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Password Required</h2>
          <p className="text-sm text-gray-600 mb-6">
            This statement file is encrypted. Please enter the password (often your account number or mobile number) to proceed.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Password</label>
              <div className="relative">
                 <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/5 focus:border-[#0a0a0a] transition-all"
                  placeholder="Enter password..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && password && pendingFile) {
                      processUpload(pendingFile, password)
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex bg-gray-50 -mx-6 -mb-6 px-6 py-4 mt-8 gap-3 justify-end rounded-b-2xl border-t border-gray-100">
              <button
                onClick={() => { setPasswordModalOpen(false); setPendingFile(null); setPassword('') }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!password || uploading}
                onClick={() => pendingFile && processUpload(pendingFile, password)}
                className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-black rounded-xl transition-colors disabled:opacity-50"
              >
                {uploading ? 'Decrypting...' : 'Submit & Upload'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
