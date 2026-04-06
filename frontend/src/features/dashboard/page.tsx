'use client'

import Link from 'next/link'
import { PageHeader, LoadingState } from '@/components'
import { MetricsGrid } from './components'
import { useDashboard } from './hooks'
import {
  Megaphone, ShoppingCart, Landmark, HandCoins,
  ArrowRight, DownloadCloud,
} from 'lucide-react'

const quickLinks = [
  {
    href: '/campaigns',
    label: 'Campaigns',
    icon: Megaphone,
    desc: 'View and manage all active refund campaigns.',
  },
  {
    href: '/orders',
    label: 'Orders',
    icon: ShoppingCart,
    desc: 'Browse parsed Amazon order history.',
  },
  {
    href: '/bank-credits',
    label: 'Bank Credits',
    icon: Landmark,
    desc: 'Upload statements and match credits.',
  },
  {
    href: '/settlements',
    label: 'Settlements',
    icon: HandCoins,
    desc: 'Review and approve pending settlements.',
  },
]

export default function DashboardPage() {
  const { metrics, loading } = useDashboard()

  return (
    <div className="flex flex-col p-6 lg:p-8 w-full bg-white min-h-screen">

      <PageHeader
        title="Dashboard"
        subtitle="Overview of your campaigns, orders, and settlements"
        secondaryActions={[
          {
            label: 'Export',
            onClick: () => {},
            icon: <DownloadCloud className="w-4 h-4" />,
            variant: 'secondary',
          },
        ]}
      />

      {/* Metrics */}
      {loading ? (
        <LoadingState count={6} type="cards" />
      ) : (
        <MetricsGrid metrics={metrics} loading={loading} />
      )}

      {/* Quick navigation */}
      <div className="mt-8">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Access</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map(({ href, label, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-3 p-5 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Icon className="w-[18px] h-[18px] text-gray-600" strokeWidth={1.8} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#0a0a0a] mb-0.5">{label}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-[#0a0a0a] transition-colors">
                Go to {label}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
