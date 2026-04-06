'use client'

import React from 'react'

export interface StatusBadgeProps {
  status: string
  variant?: 'pending' | 'success' | 'error' | 'warning' | 'info'
  size?: 'sm' | 'md'
}

const STYLES: Record<string, { wrap: string; dot: string }> = {
  pending: { wrap: 'bg-amber-50 text-amber-700 border border-amber-200',     dot: 'bg-amber-400 animate-pulse' },
  success: { wrap: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-400' },
  error:   { wrap: 'bg-red-50 text-red-700 border border-red-200',            dot: 'bg-red-400' },
  warning: { wrap: 'bg-orange-50 text-orange-700 border border-orange-200',   dot: 'bg-orange-400' },
  info:    { wrap: 'bg-gray-100 text-gray-600 border border-gray-200',        dot: 'bg-gray-400' },
}

const SIZE: Record<string, string> = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-[11px] gap-1.5',
}

export function StatusBadge({ status, variant = 'info', size = 'md' }: StatusBadgeProps) {
  const s = STYLES[variant]
  return (
    <span className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${SIZE[size]} ${s.wrap}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status}
    </span>
  )
}
