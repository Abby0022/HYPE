'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components'
import { Hash, Package, CalendarDays, MapPin, IndianRupee } from 'lucide-react'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit?: (data: any) => void
  mode?: 'create' | 'view' | 'edit'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any
}

const statuses = ['Pending', 'Logged', 'Shipped', 'Delivered']

/* Shared input class — mirrors app design tokens */
const fieldCls = [
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white',
  'text-sm text-[#0a0a0a] placeholder-gray-400',
  'focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/8 focus:border-gray-400',
  'transition-colors',
  'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
].join(' ')

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
      {children}
    </label>
  )
}

function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

/* Status dot colour map */
const statusDot: Record<string, string> = {
  Pending:   'bg-amber-400',
  Logged:    'bg-gray-500',
  Shipped:   'bg-blue-400',
  Delivered: 'bg-emerald-500',
}

export function OrderModal({
  isOpen, onClose, onSubmit, mode = 'view', initialData,
}: OrderModalProps) {
  const [orderId,      setOrderId]      = useState('')
  const [productName,  setProductName]  = useState('')
  const [orderDate,    setOrderDate]    = useState('')
  const [orderValue,   setOrderValue]   = useState('')
  const [shipTo,       setShipTo]       = useState('')
  const [status,       setStatus]       = useState('Pending')

  useEffect(() => {
    if (isOpen && initialData && mode !== 'create') {
      setTimeout(() => {
        setOrderId(initialData.order_id || '')
        setProductName(initialData.product_name || '')
        setOrderDate(initialData.order_date
          ? new Date(initialData.order_date).toISOString().split('T')[0]
          : '')
        setOrderValue(String(initialData.order_value ?? ''))
        setStatus(typeof initialData.status === 'string' ? initialData.status.charAt(0).toUpperCase() + initialData.status.slice(1) : 'Pending')
        setShipTo(typeof initialData.ship_to === 'string' ? initialData.ship_to : '')
      }, 0)
    } else if (!isOpen) {
      setTimeout(() => {
        setOrderId(''); setProductName(''); setOrderDate(''); setOrderValue('')
        setStatus('Pending'); setShipTo('')
      }, 0)
    }
  }, [isOpen, initialData, mode])

  const handleSubmit = () => {
    if (onSubmit && productName && orderValue) {
      onSubmit({
        product_name: productName,
        order_value:  parseFloat(orderValue),
        ship_to:      shipTo,
        status:       status.toLowerCase(),
      })
    }
  }

  const isReadOnly = mode === 'view'
  const title      = mode === 'view' ? 'View Order' : mode === 'edit' ? 'Edit Order' : 'New Order'
  const subtitle   = mode === 'view' && orderId ? `Order #${orderId.slice(0, 8)}` : undefined

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            {mode === 'view' ? 'Close' : 'Cancel'}
          </button>
          {mode !== 'view' && (
            <button
              onClick={handleSubmit}
              disabled={!productName || !orderValue}
              className="px-5 py-2 rounded-xl bg-[#0a0a0a] text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {mode === 'edit' ? 'Update Order' : 'Create Order'}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <SectionDivider>Order Details</SectionDivider>

        {/* Order ID — always read-only */}
        <div>
          <FieldLabel>Order ID</FieldLabel>
          <div className="relative">
            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={orderId}
              disabled
              className={`${fieldCls} pl-10`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Product Name</FieldLabel>
            <div className="relative">
              <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Product name"
                value={productName}
                onChange={e => !isReadOnly && setProductName(e.target.value)}
                disabled={isReadOnly}
                className={`${fieldCls} pl-10`}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Order Date</FieldLabel>
            <div className="relative">
              <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={orderDate}
                onChange={e => !isReadOnly && setOrderDate(e.target.value)}
                disabled={isReadOnly}
                className={`${fieldCls} pl-10`}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Order Value (₹)</FieldLabel>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={orderValue}
                onChange={e => !isReadOnly && setOrderValue(e.target.value)}
                disabled={isReadOnly}
                className={`${fieldCls} pl-10 font-semibold`}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Ship To</FieldLabel>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Shipping address"
                value={shipTo}
                onChange={e => !isReadOnly && setShipTo(e.target.value)}
                disabled={isReadOnly}
                className={`${fieldCls} pl-10`}
              />
            </div>
          </div>
        </div>

        <SectionDivider>Status</SectionDivider>

        <div className="grid grid-cols-2 gap-2">
          {statuses.map(s => {
            const active = status === s
            return (
              <label
                key={s}
                className={[
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all',
                  active
                    ? 'border-[#0a0a0a] bg-[#0a0a0a]'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                  isReadOnly ? 'cursor-not-allowed opacity-70' : '',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="order-status"
                  checked={active}
                  onChange={() => !isReadOnly && setStatus(s)}
                  disabled={isReadOnly}
                  className="sr-only"
                />
                <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[s]}`} />
                <span className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>
                  {s}
                </span>
              </label>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
