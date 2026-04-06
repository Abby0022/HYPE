import Link from 'next/link'
import { Zap, ChevronRight } from 'lucide-react'

const navLinks = ['Features', 'How it works', 'Stats']

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0a0a0a]">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-[#0a0a0a]">THE HYPE</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="text-sm text-gray-500 hover:text-[#0a0a0a] transition-colors font-medium"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-[#0a0a0a] transition-colors rounded-lg hover:bg-gray-100"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0a0a0a] hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Open Dashboard
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  )
}
