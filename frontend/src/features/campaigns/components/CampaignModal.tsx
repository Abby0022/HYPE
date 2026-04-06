'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components'
import { Package, Hash, CalendarDays, MapPin, IndianRupee } from 'lucide-react'

interface CampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { product_name: string; expected_refund: number; assigned_to?: string; status?: string }) => void
  submitting: boolean
  mode?: 'create' | 'view' | 'edit'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any
}

const statuses    = ['Pending', 'Matched', 'Failed']
const teamMembers = ['Abhijeet', 'Raghvendra']

/* Shared input class — matches the app's field style */
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

export function CampaignModal({
  isOpen, onClose, onSubmit, submitting, mode = 'create', initialData,
}: CampaignModalProps) {
  const [productName,    setProductName]    = useState('')
  const [orderId,        setOrderId]        = useState('')
  const [orderDate,      setOrderDate]      = useState('')
  const [orderValue,     setOrderValue]     = useState('')
  const [campaignFee,    setCampaignFee]    = useState('')
  const [expectedRefund, setExpectedRefund] = useState('')
  const [status,         setStatus]         = useState('Pending')
  const [assignedTo,     setAssignedTo]     = useState('')
  const [shipTo,         setShipTo]         = useState('')

  useEffect(() => {
    if (isOpen && initialData && mode !== 'create') {
      setTimeout(() => {
        setProductName(initialData.product_name || '')
        setOrderId(initialData.order_id || initialData.id?.slice(0, 8) || '')
        setOrderDate(initialData.created_at ? new Date(initialData.created_at).toISOString().split('T')[0] : '')
        setOrderValue(initialData.order_value ? initialData.order_value.toString() : '')
        setCampaignFee(initialData.campaign_fee ? initialData.campaign_fee.toString() : '')
        setExpectedRefund(initialData.expected_refund ? initialData.expected_refund.toString() : '')
        setStatus(initialData.status
          ? initialData.status.charAt(0).toUpperCase() + initialData.status.slice(1)
          : 'Pending')
        setAssignedTo(initialData.assigned_to || '')
        setShipTo(initialData.ship_to || '')
      }, 0)
    } else if (!isOpen) {
      setTimeout(() => {
        setProductName(''); setOrderId(''); setOrderDate(''); setOrderValue('')
        setCampaignFee(''); setExpectedRefund(''); setStatus('Pending'); setAssignedTo(''); setShipTo('')
      }, 0)
    }
  }, [isOpen, initialData, mode])

  const handleSubmit = () => {
    if (!productName || !expectedRefund || !assignedTo) return
    onSubmit({
      product_name:    productName,
      expected_refund: parseFloat(expectedRefund),
      assigned_to:     assignedTo,
      status:          status.toLowerCase(),
    })
  }

  const isReadOnly = mode === 'view'
  const title      = mode === 'view' ? 'View Campaign' : mode === 'edit' ? 'Edit Campaign' : 'New Campaign'
  const subtitle   = mode === 'create' ? 'Fill in the details to create a new campaign record.' : undefined

  /* ── Status dot colours ── */
  const statusDot: Record<string, string> = {
    Pending: 'bg-amber-400',
    Matched: 'bg-emerald-500',
    Failed:  'bg-red-500',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="2xl"
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
              disabled={submitting || !productName || !expectedRefund || !assignedTo}
              className="px-5 py-2 rounded-xl bg-[#0a0a0a] text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? 'Saving…' : mode === 'edit' ? 'Update Campaign' : 'Create Campaign'}
            </button>
          )}
        </>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── LEFT: main fields ── */}
        <div className="flex-1 space-y-4">
          <SectionDivider>Campaign Info</SectionDivider>

          {/* Product name */}
          <div>
            <FieldLabel>Product Name</FieldLabel>
            <div className="relative">
              <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Amazon product name"
                value={productName}
                onChange={e => !isReadOnly && setProductName(e.target.value)}
                disabled={isReadOnly}
                className={`${fieldCls} pl-10`}
              />
            </div>
          </div>

          {/* Order ID + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Order ID</FieldLabel>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Order ID"
                  value={orderId}
                  onChange={e => !isReadOnly && setOrderId(e.target.value)}
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

          {/* Ship To */}
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

          <SectionDivider>Financial</SectionDivider>

          {/* Order Value + Campaign Fee */}
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
                  className={`${fieldCls} pl-10`}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Campaign Fee (₹)</FieldLabel>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={campaignFee}
                  onChange={e => !isReadOnly && setCampaignFee(e.target.value)}
                  disabled={isReadOnly}
                  className={`${fieldCls} pl-10`}
                />
              </div>
            </div>
          </div>

          {/* Expected Refund */}
          <div>
            <FieldLabel>Expected Refund (₹)</FieldLabel>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={expectedRefund}
                onChange={e => !isReadOnly && setExpectedRefund(e.target.value)}
                disabled={isReadOnly}
                className={`${fieldCls} pl-10 font-semibold`}
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT: status + assignee + summary ── */}
        <div className="lg:w-52 shrink-0 space-y-4">
          <SectionDivider>Status</SectionDivider>
          <div className="space-y-1.5">
            {statuses.map(s => {
              const active = status === s
              return (
                <label
                  key={s}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all',
                    active
                      ? 'border-[#0a0a0a] bg-[#0a0a0a]'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                    isReadOnly ? 'cursor-not-allowed opacity-70' : '',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="campaign-status"
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

          <SectionDivider>Assign To</SectionDivider>
          <div className="space-y-1.5">
            {teamMembers.map(m => {
              const active = assignedTo === m
              return (
                <label
                  key={m}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all',
                    active
                      ? 'border-[#0a0a0a] bg-[#0a0a0a]'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                    isReadOnly ? 'cursor-not-allowed opacity-70' : '',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="campaign-assignee"
                    checked={active}
                    onChange={() => !isReadOnly && setAssignedTo(m)}
                    disabled={isReadOnly}
                    className="sr-only"
                  />
                  <div
                    className={[
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                      active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600',
                    ].join(' ')}
                  >
                    {m[0]}
                  </div>
                  <span className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>
                    {m}
                  </span>
                </label>
              )
            })}
          </div>

          {/* Summary card */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
              Summary
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Order Value</span>
                <span className="font-semibold text-[#0a0a0a]">
                  ₹{parseFloat(orderValue || '0').toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Campaign Fee</span>
                <span className="font-semibold text-[#0a0a0a]">
                  ₹{parseFloat(campaignFee || '0').toLocaleString('en-IN')}
                </span>
              </div>
              <div className="h-px bg-gray-200 my-0.5" />
              <div className="flex justify-between text-[#0a0a0a] font-bold">
                <span>Refund</span>
                <span>₹{parseFloat(expectedRefund || '0').toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
