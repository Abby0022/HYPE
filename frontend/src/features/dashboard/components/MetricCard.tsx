'use client'

import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  change?: { percentage: number; isPositive: boolean }
  loading?: boolean
  isCurrency?: boolean
}

export function MetricCard({ title, value, icon, change, loading = false, isCurrency = false }: MetricCardProps) {
  const display = isCurrency && typeof value === 'number'
    ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    : value

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 bg-gray-100 rounded-full animate-pulse" />
          <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse" />
        </div>
        <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-3 w-20 bg-gray-100 rounded-full animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 hover:shadow-sm transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-gray-200 transition-colors">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <p className="text-2xl font-extrabold text-[#0a0a0a] tracking-tight mb-3">{display}</p>

      {/* Change */}
      {change && (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
            change.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {change.isPositive
              ? <ArrowUpRight className="w-3 h-3" />
              : <ArrowDownRight className="w-3 h-3" />}
            {change.isPositive ? '+' : ''}{Math.abs(change.percentage)}%
          </span>
          <span className="text-[11px] text-gray-400">vs last month</span>
        </div>
      )}
    </div>
  )
}
