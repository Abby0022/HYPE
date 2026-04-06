import Link from 'next/link'
import { Zap, ShieldCheck, CheckCircle } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 px-6 py-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-white">
            <Zap className="w-3.5 h-3.5 text-[#0a0a0a]" fill="#0a0a0a" />
          </div>
          <span className="text-white/60 text-sm font-semibold">THE HYPE</span>
        </Link>

        {/* Trust badges */}
        <div className="flex items-center gap-6 text-xs text-white/25">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Automated
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Instant
          </span>
        </div>

        <p className="text-xs text-white/20">© 2025 The Hype. All rights reserved.</p>
      </div>
    </footer>
  )
}
