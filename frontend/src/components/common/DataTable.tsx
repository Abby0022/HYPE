'use client'

import React from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ColumnDef<T = any> {
  key: Extract<keyof T, string> | string
  label: string
  width?: string
  sortable?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, row: T, index: number) => React.ReactNode
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DataTableProps<T = any> {
  columns: ColumnDef<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  keyField?: string
  emptyMessage?: string
  rowClassName?: (row: T) => string
}

export function DataTable<T extends object>({
  columns,
  data,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  keyField = 'id',
  emptyMessage = 'No data found',
  rowClassName,
}: DataTableProps<T>) {
  const handleSelectAll = () => {
    onSelectionChange?.(selectedIds.length === data.length ? [] : data.map((r) => String(r[keyField as keyof T])))
  }
  const handleSelectRow = (id: string) => {
    onSelectionChange?.(
      selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      {data.length === 0 ? (
        <div className="flex min-h-[320px] items-center justify-center px-6">
          <div className="text-center">
            <p className="text-sm font-semibold text-[#0a0a0a]">{emptyMessage}</p>
            <p className="mt-1 text-xs text-gray-400">Records will appear here once data is available.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-gray-50">
                {selectable && (
                  <th className="w-12 border-b border-gray-100 px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={data.length > 0 && selectedIds.length === data.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 accent-[#0a0a0a]"
                      aria-label="Select all"
                    />
                  </th>
                )}
                {columns.map((col, i) => (
                  <th
                    key={`h-${i}-${col.key}`}
                    style={{ width: col.width }}
                    className="border-b border-gray-100 px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {data.map((row, ri) => {
                const id = String(row[keyField as keyof T])
                const isSelected = selectedIds.includes(id)
                return (
                  <tr
                    key={id ?? ri}
                    onClick={() => onRowClick?.(row)}
                    className={`
                      group transition-colors duration-100
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50/60'}
                      ${rowClassName?.(row) ?? ''}
                    `}
                  >
                    {selectable && (
                      <td className="border-b border-gray-100 px-4 py-4 align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 accent-[#0a0a0a]"
                          aria-label={`Select row ${ri + 1}`}
                        />
                      </td>
                    )}
                    {columns.map((col, ci) => (
                      <td
                        key={`r${ri}-c${ci}`}
                        className="border-b border-gray-100 px-5 py-4 align-middle text-sm text-[#0a0a0a]"
                      >
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {col.render ? col.render((row as any)[col.key], row, ri) : ((row as any)[col.key] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
