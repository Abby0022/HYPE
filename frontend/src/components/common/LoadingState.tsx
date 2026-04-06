'use client'

import React from 'react'

export interface LoadingStateProps {
  count?: number
  type?: 'rows' | 'cards' | 'grid'
}

export function LoadingState({ count = 5, type = 'rows' }: LoadingStateProps) {
  if (type === 'rows') {
    return (
      <div className="divide-y divide-gray-100">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/5 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-3 w-1/4 bg-gray-100 rounded-full animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-gray-100 rounded-full animate-pulse" />
              <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
            </div>
            <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-3 w-20 bg-gray-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  // Grid type
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-2xl animate-pulse h-24" />
      ))}
    </div>
  )
}
