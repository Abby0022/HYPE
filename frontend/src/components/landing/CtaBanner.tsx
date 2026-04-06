import Link from 'next/link'
import { TrendingUp, ArrowRight } from 'lucide-react'

export default function CtaBanner() {
  return (
    <section className="py-24 px-6 bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
          Stop reconciling manually.<br />Start settling automatically.
        </h2>
        <p className="text-gray-400 text-base mb-10 max-w-md mx-auto leading-relaxed">
          Everything you need to run high-volume Amazon refund campaigns — in one clean dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-gray-100 text-[#0a0a0a] text-sm font-bold rounded-xl transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-7 py-3.5 border border-white/20 hover:border-white/40 text-white/70 hover:text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </section>
  )
}
