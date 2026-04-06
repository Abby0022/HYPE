'use client'

import React from 'react'

export interface PageHeaderAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: PageHeaderAction
  secondaryActions?: PageHeaderAction[]
  breadcrumbs?: BreadcrumbItem[]
}

export function PageHeader({
  title,
  subtitle,
  action,
  secondaryActions = [],
  breadcrumbs = [],
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-400">
          {breadcrumbs.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>/</span>}
              {item.href ? (
                <a href={item.href} className="hover:text-[#0a0a0a] transition-colors">{item.label}</a>
              ) : (
                <span className="text-[#0a0a0a] font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Title row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#0a0a0a] tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {secondaryActions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                a.variant === 'primary'
                  ? 'bg-[#0a0a0a] text-white hover:bg-gray-800 shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {a.icon && <span className="w-4 h-4 shrink-0">{a.icon}</span>}
              {a.label}
            </button>
          ))}

          {action && (
            <button
              onClick={action.onClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-sm ${
                action.variant === 'secondary'
                  ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  : 'bg-[#0a0a0a] text-white hover:bg-gray-800 hover:shadow-md'
              }`}
            >
              {action.icon && <span className="w-4 h-4 shrink-0">{action.icon}</span>}
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
