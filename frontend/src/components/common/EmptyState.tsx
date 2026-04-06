'use client'

import React from 'react'
import { Plus } from 'lucide-react'

export interface EmptyStateAction {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  hasSearch?: boolean
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  hasSearch = false,
}: EmptyStateProps) {
  const desc = description
    ?? (hasSearch ? 'Try adjusting your search or filters.' : 'Get started by creating your first item.')

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 mb-5">
        {icon ?? <Plus className="w-7 h-7" />}
      </div>

      <h3 className="text-base font-extrabold text-[#0a0a0a] mb-1.5 tracking-tight">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs text-center leading-relaxed mb-7">{desc}</p>

      <div className="flex items-center gap-2.5">
        {action && (
          <button
            onClick={action.onClick}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-sm ${
              action.variant === 'secondary'
                ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                : 'bg-[#0a0a0a] text-white hover:bg-gray-800'
            }`}
          >
            {action.icon && <span className="w-4 h-4 shrink-0">{action.icon}</span>}
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
          >
            {secondaryAction.icon && <span className="w-4 h-4 shrink-0">{secondaryAction.icon}</span>}
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  )
}
