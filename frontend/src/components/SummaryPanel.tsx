'use client'

import React, { useEffect, useState } from 'react'
import { fetchDashboardSummary } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import {
  RefreshCcw, TrendingUp, CreditCard, Activity,
  ArrowUpRight, Zap, CheckCircle2,
} from 'lucide-react'
import ArcGauge from './ArcGauge'

interface SummaryData {
  total_campaigns: number
  pending_campaigns: number
  matched_campaigns: number
  matched_credits: number
  unmatched_credits: number
  total_received: number
  unexplained_amount: number
  pending_settlements: number
  total_orders: number
  total_order_value: number
  processed_amount: number
  pending_amount: number
  avg_latency_seconds: number
  reject_rate_percent: number
  returns_percent: number
}

/* ── Skeleton ─────────────────────────────────────── */
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

function PanelSkeleton() {
  return (
    <aside className="hidden xl:flex flex-col w-[288px] h-full border-l border-gray-100 bg-white py-5 px-4 gap-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 !rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-2 w-14" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>
      <Skeleton className="h-[196px] !rounded-2xl" />
      <Skeleton className="h-[116px] !rounded-2xl" />
      <Skeleton className="h-[172px] !rounded-2xl" />
    </aside>
  )
}

/* ── Sub-components ───────────────────────────────── */

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-700">Live</span>
    </span>
  )
}

function SectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-gray-400">{icon}</span>
      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{title}</p>
    </div>
  )
}

function MiniStat({
  label, value, accent = 'gray',
}: {
  label: string
  value: string
  accent?: 'gray' | 'emerald' | 'amber'
}) {
  const cls: Record<string, string> = {
    gray:    'bg-white border-gray-100 text-[#0a0a0a]',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    amber:   'bg-amber-50 border-amber-100 text-amber-800',
  }
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${cls[accent]}`}>
      <p className="text-[8px] font-bold uppercase tracking-widest opacity-50 mb-1">{label}</p>
      <p className="text-[13px] font-extrabold tracking-tight leading-none">{value}</p>
    </div>
  )
}

function AmountTile({
  label, value, accent,
}: {
  label: string
  value: string
  accent: 'emerald' | 'amber'
}) {
  const cls = {
    emerald: { wrap: 'border-emerald-100 bg-emerald-50', val: 'text-emerald-800' },
    amber:   { wrap: 'border-amber-100 bg-amber-50',     val: 'text-amber-800' },
  }[accent]
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${cls.wrap}`}>
      <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className={`text-[12px] font-bold tracking-tight ${cls.val}`}>{value}</p>
    </div>
  )
}

function StatusRow({
  dot, label, value, sub,
}: {
  dot: string; label: string; value: string; sub: string
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2.5">
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
        <div>
          <p className="text-[11px] font-semibold text-[#0a0a0a] leading-none">{label}</p>
          <p className="text-[9px] text-gray-400 mt-0.5">{sub}</p>
        </div>
      </div>
      <span className="text-[12px] font-bold text-[#0a0a0a] tabular-nums">{value}</span>
    </div>
  )
}

function StatCard({
  label, value, accent = 'gray', icon,
}: {
  label: string; value: string; accent?: 'gray' | 'red'; icon?: React.ReactNode
}) {
  const cls = {
    gray: 'border-gray-100 bg-white text-[#0a0a0a]',
    red:  'border-red-100 bg-red-50 text-red-700',
  }[accent]
  return (
    <div className={`rounded-xl border p-3 min-h-[64px] ${cls}`}>
      <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{label}</p>
      <div className="flex items-center gap-1">
        {icon && <span className="opacity-50">{icon}</span>}
        <p className="text-[13px] font-bold tracking-tight leading-none">{value}</p>
      </div>
    </div>
  )
}

/* ── Main component ───────────────────────────────── */
export default function SummaryPanel() {
  const { session, loading: authLoading } = useAuth()
  const [data,        setData]        = useState<SummaryData | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing,  setRefreshing]  = useState(false)

  const loadData = async (manual = false) => {
    if (manual) setRefreshing(true); else setLoading(true)
    try {
      const summary = await fetchDashboardSummary()
      setData(summary)
      setLastUpdated(new Date())
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false) }
  }

  // Only fetch once auth is confirmed — prevents 401 on page load/refresh
  useEffect(() => {
    if (authLoading || !session) return;
    loadData()
    const t = setInterval(() => loadData(), 30_000)
    return () => clearInterval(t)
  }, [authLoading, session])

  if (loading && !data) return <PanelSkeleton />

  /* ── Derived values ── */
  const syncRate  = data && data.total_campaigns > 0
    ? Math.round((data.matched_campaigns / data.total_campaigns) * 100) : 0
  const avgOrder  = data && data.total_orders > 0 ? data.total_order_value / data.total_orders : 0
  const returnP   = data?.returns_percent ?? 0
  const pendingP  = data ? Math.round((data.pending_campaigns / Math.max(data.total_campaigns, 1)) * 100) : 0

  const inr = (v: number) =>
    v.toLocaleString('en-IN', { maximumFractionDigits: 0, style: 'currency', currency: 'INR' })
  const timeLabel = lastUpdated?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <aside className="hidden xl:flex flex-col w-[288px] h-full border-l border-gray-100 bg-white sticky top-0 overflow-y-auto">

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 rounded-xl bg-[#0a0a0a] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Live Insights</p>
              <p className="text-sm font-extrabold text-[#0a0a0a] tracking-tight truncate">Reconciliation</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => loadData(true)}
              title="Refresh"
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-[#0a0a0a]"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <LiveBadge />
          </div>
        </div>

        {timeLabel && (
          <p className="mt-2.5 text-[10px] text-gray-400 font-medium">
            Synced at <span className="text-[#0a0a0a] font-bold">{timeLabel}</span>
          </p>
        )}
      </div>

      {/* ── Body ── */}
      <div className="px-4 py-4 space-y-3 flex-1">

        {/* ── Gauge card ── */}
        <section className="rounded-2xl border border-gray-100 p-4">
          <div className="flex justify-center mb-1">
            <ArcGauge value={syncRate} label="Matching" />
          </div>

          {/* Mini stats row */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniStat label="Orders"  value={`${data?.total_orders ?? 0}`} />
            <MiniStat label="Matched" value={`${data?.matched_campaigns ?? 0}`} accent="emerald" />
            <MiniStat label="Pending" value={`${data?.pending_campaigns ?? 0}`} accent="amber" />
          </div>

          {/* Amount tiles */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <AmountTile label="Processed" value={inr(data?.processed_amount ?? 0)} accent="emerald" />
            <AmountTile label="Pending"   value={inr(data?.pending_amount ?? 0)}   accent="amber" />
          </div>
        </section>

        {/* ── Order Status ── */}
        <section className="rounded-2xl border border-gray-100 p-4">
          <SectionHead icon={<Activity className="w-3.5 h-3.5" />} title="Order Status" />

          {/* Segmented bar */}
          <div className="flex h-1.5 rounded-full overflow-hidden gap-px mb-3.5">
            <div
              className="h-full rounded-l-full bg-[#0a0a0a] transition-all duration-700"
              style={{ width: `${syncRate}%` }}
            />
            <div
              className="h-full bg-amber-400 transition-all duration-700"
              style={{ width: `${pendingP}%` }}
            />
            <div
              className="h-full rounded-r-full bg-red-400 transition-all duration-700"
              style={{ width: `${Math.max(returnP, 0)}%` }}
            />
          </div>

          <div className="divide-y divide-gray-50">
            <StatusRow dot="bg-[#0a0a0a]"  label="Synced"   value={`${syncRate}%`}  sub="Fully matched" />
            <StatusRow dot="bg-amber-400"   label="Pending"  value={`${pendingP}%`}  sub="Awaiting match" />
            <StatusRow dot="bg-red-400"     label="Returned" value={`${returnP}%`}   sub="Refunded / rejected" />
          </div>
        </section>

        {/* ── My Stats ── */}
        <section className="rounded-2xl border border-gray-100 p-4">
          <SectionHead icon={<TrendingUp className="w-3.5 h-3.5" />} title="My Stats" />

          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Avg Order"  value={inr(avgOrder)} />
            <StatCard label="Total Sales" value={inr(data?.total_order_value ?? 0)} />
            <StatCard
              label="Sync Speed"
              value={data?.avg_latency_seconds ? `${data.avg_latency_seconds}s` : '< 1m'}
              icon={<Zap className="w-3 h-3" />}
            />
            <StatCard label="Fail Rate" value={`${data?.reject_rate_percent ?? 0}%`} accent="red" />
          </div>

          {/* Verified total */}
          <div className="mt-3 rounded-xl bg-[#0a0a0a] px-4 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">Verified Total</p>
              <p className="text-[17px] font-extrabold text-white tracking-tight leading-none">
                {inr(data?.total_received ?? 0)}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </section>

      </div>
    </aside>
  )
}