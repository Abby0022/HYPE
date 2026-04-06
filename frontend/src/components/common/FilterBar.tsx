'use client'

import React from 'react'
import { Search } from 'lucide-react'

export interface FilterAction {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'destructive'
}

export interface FilterBarProps {
  tabs?: string[]
  activeTab?: string
  onTabChange?: (tab: string) => void
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  actions?: FilterAction[]
  rightContent?: React.ReactNode
  loading?: boolean
}

export function FilterBar({
  tabs = [],
  activeTab = '',
  onTabChange,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  actions = [],
  rightContent,
  loading = false,
}: FilterBarProps) {
  return (
    <div className="mb-6 w-full">
      {/* Tab row */}
      {tabs.length > 0 && (
        <div className="flex items-center gap-1 mb-4 border-b border-gray-100">
          {tabs.map((tab) => {
            const active = activeTab === tab || (tab === 'All' && !activeTab)
            return (
              <button
                key={tab}
                onClick={() => onTabChange?.(tab)}
                className={`relative px-3 pb-3 pt-1 text-sm font-medium transition-colors shrink-0 ${
                  active ? 'text-[#0a0a0a]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab}
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#0a0a0a]" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Search + actions row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {onSearchChange && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={loading}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-[#0a0a0a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {rightContent}
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              disabled={loading}
              title={action.label}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                action.variant === 'primary'
                  ? 'bg-[#0a0a0a] text-white hover:bg-gray-800'
                  : action.variant === 'destructive'
                  ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {action.icon && <span className="w-4 h-4 shrink-0 flex items-center">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
