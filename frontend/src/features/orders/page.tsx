'use client'

import { createPortal } from 'react-dom'
import { useState, useRef, useEffect } from 'react'
import {
  DownloadCloud, UploadCloud, Package, Filter,
  MoreHorizontal, FileText, FileSpreadsheet, Eye, Edit, Trash2,
} from 'lucide-react'
import {
  PageHeader, FilterBar, DataTable, EmptyState,
  LoadingState, Modal, StatusBadge, type ColumnDef,
} from '@/components'
import { useOrders } from './hooks'
import { useExport } from '@/hooks/useExport'
import { Order } from './types'
import { ORDER_TABS } from './constants'
import { OrderModal } from './components'
import { formatOrderId, formatCurrency, formatDate, getCustomerInitial } from './utils/formatters'

function ActionMenu({
  order, onView, onEdit, onDelete,
}: {
  order: Order
  onView: (o: Order) => void
  onEdit: (o: Order) => void
  onDelete: (o: Order) => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const calcPos = () => {
    if (!menuRef.current) return
    const r = menuRef.current.getBoundingClientRect()
    const w = 160, h = 132
    let left = r.right - w, top = r.bottom + 8
    if (left < 8) left = r.left
    if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8)
    if (top + h > window.innerHeight - 8) top = r.top - h - 8
    setPos({ top, left })
  }

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(calcPos)
    const onOut = (e: MouseEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false)
    }
    const onClose = () => setOpen(false)
    document.addEventListener('mousedown', onOut)
    window.addEventListener('resize', onClose)
    window.addEventListener('scroll', onClose, true)
    return () => {
      document.removeEventListener('mousedown', onOut)
      window.removeEventListener('resize', onClose)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [open])

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setOpen(c => { if (!c) requestAnimationFrame(calcPos); return !c })}
        className="p-1.5 rounded-lg text-gray-400 hover:text-[#0a0a0a] hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div ref={panelRef} style={{ top: pos.top, left: pos.left }}
          className="fixed w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-[1000] py-1 flex flex-col"
        >
          <button onClick={() => { setOpen(false); onView(order) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50 text-left">
            <Eye className="w-4 h-4 shrink-0" /> View
          </button>
          <button onClick={() => { setOpen(false); onEdit(order) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#0a0a0a] hover:bg-gray-50 text-left">
            <Edit className="w-4 h-4 shrink-0" /> Edit
          </button>
          <div className="h-px bg-gray-100 my-1" />
          <button onClick={() => { setOpen(false); onDelete(order) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left">
            <Trash2 className="w-4 h-4 shrink-0" /> Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

export default function OrdersPage() {
  const { orders, loading, submitting, statusFilter, search, setStatusFilter, setSearch, remove, loadOrders } = useOrders()
  const { handleExport } = useExport()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view')
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>(undefined)
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleOpenModal = (mode: 'create' | 'edit' | 'view', order?: Order) => {
    setModalMode(mode); setSelectedOrder(order); setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteOrder) return
    const ok = await remove(deleteOrder.order_id)
    if (ok) setDeleteOrder(null)
  }

  const handleOrderSubmit = async (data: Partial<Order>) => {
    if (!selectedOrder) return
    try {
      const { api } = await import('@/lib/api')
      await api.patch(`/orders/${selectedOrder.order_id}`, data)
      setIsModalOpen(false)
      await loadOrders()
    } catch (err) {
      console.error('Failed to update order:', err)
    }
  }

  const handleExportData = (format: 'csv' | 'excel') => {
    handleExport(
      orders.map(o => ({
        'Order ID': formatOrderId(o.order_id),
        'Product': o.product_name,
        'Customer': o.ship_to || 'Unassigned',
        'Status': ('status' in o ? o.status as string : '') || 'pending',
        'Total (₹)': o.order_value,
        'Date': formatDate(o.order_date),
      })),
      format,
      { filename: `orders_${new Date().toISOString().split('T')[0]}`, sheetName: 'Orders' }
    )
    setShowExportMenu(false)
  }

  const columns: ColumnDef[] = [
    {
      key: 'order_id', label: 'Order',
      render: (v: string) => <span className="text-sm font-medium text-[#0a0a0a]">{formatOrderId(v)}</span>,
    },
    {
      key: 'product_name', label: 'Product',
      render: (v: string) => <span className="text-sm text-gray-600 truncate max-w-xs">{v}</span>,
    },
    {
      key: 'ship_to', label: 'Customer',
      render: (v: string | null) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
            {getCustomerInitial(v || '')}
          </div>
          <span className="text-sm text-gray-700">{v || 'Unassigned'}</span>
        </div>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (v: string | undefined | null) => {
        const s = v || 'pending'
        const map: Record<string, 'pending' | 'success' | 'error' | 'info'> = {
          logged: 'success', pending: 'pending', shipped: 'info', delivered: 'success',
        }
        return <StatusBadge status={s} variant={map[s.toLowerCase()] || 'info'} size="md" />
      },
    },
    {
      key: 'order_value', label: 'Total',
      render: (v: number) => <span className="text-sm font-semibold text-[#0a0a0a]">{formatCurrency(v)}</span>,
    },
    {
      key: 'order_date', label: 'Date',
      render: (v: string) => <span className="text-sm text-gray-500">{formatDate(v)}</span>,
    },
    {
      key: 'order_id', label: 'Actions',
      render: (_v: string, row: Order) => (
        <ActionMenu order={row}
          onView={o => handleOpenModal('view', o)}
          onEdit={o => handleOpenModal('edit', o)}
          onDelete={o => setDeleteOrder(o)}
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col p-6 lg:p-8 w-full bg-white min-h-screen">
      <PageHeader title="Orders" subtitle="Track and manage all incoming orders" />

      <FilterBar
        tabs={Array.from(ORDER_TABS)}
        activeTab={statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
        onTabChange={tab => setStatusFilter(tab === 'All' ? 'all' : tab.toLowerCase() as 'all' | 'pending' | 'logged' | 'shipped' | 'delivered')}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search orders..."
        loading={loading}
        rightContent={
          <div className="flex items-center gap-2">
            <button onClick={() => {}}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors">
              <UploadCloud className="w-4 h-4" /> Import Orders
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
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Package className="w-7 h-7" />}
            title="No orders found"
            description={search.length > 0 ? 'Try adjusting your search criteria.' : 'Start importing orders to get started.'}
            hasSearch={search.length > 0}
          />
        ) : (
          <DataTable columns={columns} data={orders} keyField="order_id" />
        )}
      </div>

      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        initialData={selectedOrder}
        onSubmit={modalMode === 'edit' ? handleOrderSubmit : undefined}
      />

      <Modal
        isOpen={!!deleteOrder}
        onClose={() => setDeleteOrder(null)}
        title="Delete order"
        subtitle={deleteOrder ? `Remove ${formatOrderId(deleteOrder.order_id)} from the list?` : undefined}
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteOrder(null)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-semibold">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-semibold disabled:opacity-60">
              {submitting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600 leading-relaxed">This action cannot be undone. The order will be removed permanently.</p>
      </Modal>
    </div>
  )
}
