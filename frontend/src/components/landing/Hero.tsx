import Link from 'next/link'
import { LayoutDashboard, ArrowRight } from 'lucide-react'

const mockStats = [
  { label: 'Total Refunds', val: '₹2,14,500', change: '+12.4%', color: 'text-emerald-600' },
  { label: 'Active Orders', val: '48', change: '+5', color: 'text-blue-600' },
  { label: 'Pending', val: '12', change: '-3', color: 'text-amber-600' },
  { label: 'Settled', val: '₹98,000', change: '+8.1%', color: 'text-emerald-600' },
]

const chartBars = [35, 55, 40, 70, 50, 85, 60, 90, 65, 100, 72, 88]

export default function Hero() {
  return (
    <section className="pt-36 pb-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold mb-8 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          AI-Powered Reconciliation — Live
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-[68px] font-extrabold tracking-tight leading-[1.06] text-[#0a0a0a] mb-6">
          Campaigns settled.<br />
          <span className="text-gray-400">No spreadsheets.</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto leading-relaxed mb-10 font-normal">
          Hype Tracker ingests Amazon orders, reconciles bank credits, and
          auto-settles campaigns — entirely without manual work.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#0a0a0a] hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Open Dashboard
          </Link>
        </div>
      </div>

      {/* Dashboard mockup */}
      <div className="max-w-5xl mx-auto mt-16">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 shadow-xl shadow-gray-200/60 overflow-hidden">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 mx-4 h-6 bg-gray-100 rounded-md flex items-center px-3">
              <span className="text-xs text-gray-400">thehype.app/dashboard</span>
            </div>
          </div>
          {/* Content */}
          <div className="p-5 bg-white">
            <div className="grid grid-cols-4 gap-4 mb-5">
              {mockStats.map((card) => (
                <div key={card.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[11px] text-gray-400 font-medium mb-1">{card.label}</p>
                  <p className="text-[17px] font-bold text-gray-900">{card.val}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${card.color}`}>{card.change}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-gray-600">Settlement Activity</p>
                <span className="text-[11px] text-gray-400">Last 12 weeks</span>
              </div>
              <div className="flex items-end gap-2 h-20">
                {chartBars.map((h, i) => (
                  <div key={i} className="flex-1">
                    <div
                      className="w-full rounded-sm bg-gradient-to-t from-gray-800 to-gray-600"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
