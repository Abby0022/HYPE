'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/lib/auth/actions'
import { Zap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex font-[var(--font-geist-sans)]">

      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#0a0a0a] flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white">
            <Zap className="w-4 h-4 text-[#0a0a0a]" fill="#0a0a0a" />
          </div>
          <span className="font-bold text-sm text-white tracking-tight">THE HYPE</span>
        </Link>

        <div>
          <blockquote className="text-2xl font-semibold text-white leading-snug mb-6">
            &ldquo;From WhatsApp order to settled campaign —{' '}
            <span className="text-gray-400">without touching a spreadsheet.</span>&rdquo;
          </blockquote>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Automated reconciliation', sub: 'Credits matched in under 2 seconds' },
              { label: 'Live campaign tracking', sub: 'All statuses in one dashboard' },
              { label: 'Instant settlements', sub: 'Auto-logged when credits clear' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="mt-1 w-4 h-4 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-600">© 2025 The Hype. All rights reserved.</p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0a0a0a]">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-bold text-sm text-[#0a0a0a]">THE HYPE</span>
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-[#0a0a0a] tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500">
              Sign in to your account to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 focus:border-gray-400 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 focus:border-gray-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0a0a0a] hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-[#0a0a0a] hover:underline underline-offset-4">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
