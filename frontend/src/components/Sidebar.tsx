'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  ShoppingCart,
  Landmark,
  HandCoins,
  Megaphone,
  Zap,
  X,
  LogOut,
  ChevronRight,
  Settings,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

/* ── Nav structure ─────────────────────────────────────── */
const mainItems = [
  { href: '/dashboard',    label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/campaigns',    label: 'Campaigns',  icon: Megaphone },
  { href: '/orders',       label: 'Orders',     icon: ShoppingCart },
]

const financeItems = [
  { href: '/bank-credits', label: 'Bank Credits', icon: Landmark },
  { href: '/settlements',  label: 'Settlements',  icon: HandCoins, badge: 'new' },
]

/* ── Types ─────────────────────────────────────────────── */
interface SidebarProps {
  isMobile: boolean
  showMobile: boolean
  onCloseMobile: () => void
}

/* ── Helper: single nav link ───────────────────────────── */
function NavLink({
  href, label, icon: Icon, badge, collapsed,
}: {
  href: string; label: string; icon: React.ElementType
  badge?: string; collapsed: boolean
}) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
        ${active
          ? 'bg-[#0a0a0a] text-white'
          : 'text-gray-500 hover:text-[#0a0a0a] hover:bg-gray-100'
        }
        ${collapsed ? 'justify-center px-0' : ''}
      `}
    >
      <Icon
        className={`w-[18px] h-[18px] shrink-0 transition-colors ${active ? 'text-white' : 'text-gray-400 group-hover:text-[#0a0a0a]'}`}
        strokeWidth={active ? 2 : 1.8}
      />
      {!collapsed && (
        <span className="flex-1 truncate">{label}</span>
      )}
      {!collapsed && badge && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#0a0a0a] text-white leading-none">
          {badge}
        </span>
      )}
      {collapsed && badge && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0a0a0a]" />
      )}
    </Link>
  )
}

/* ── Section label ─────────────────────────────────────── */
function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-2 h-px bg-gray-100" />
  return (
    <p className="px-3 mb-1.5 mt-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
      {label}
    </p>
  )
}

/* ── Main component ────────────────────────────────────── */
export default function Sidebar({ isMobile, showMobile, onCloseMobile }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Fetch user email for the avatar/footer
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const initials = userEmail ? userEmail[0].toUpperCase() : 'A'

  return (
    <nav
      className={`
        fixed inset-y-0 left-0 z-[70] flex flex-col bg-white border-r border-gray-100
        transition-all duration-300 ease-in-out
        ${isMobile ? (showMobile ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
        ${collapsed && !isMobile ? 'w-[72px]' : 'w-64'}
      `}
    >
      {/* ── Logo ── */}
      <div className={`flex items-center justify-between h-14 border-b border-gray-100 px-4 shrink-0`}>
        <Link
          href="/"
          className={`flex items-center gap-2.5 min-w-0 ${collapsed ? 'justify-center w-full' : ''}`}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0a0a0a] shrink-0">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm tracking-tight text-[#0a0a0a] truncate">
              THE HYPE
            </span>
          )}
        </Link>

        {/* Close button on mobile */}
        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#0a0a0a] hover:bg-gray-100 transition-colors lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className={`flex-1 overflow-y-auto py-4 ${collapsed ? 'px-2' : 'px-3'}`}>

        {/* Main */}
        <SectionLabel label="Main" collapsed={collapsed} />
        <div className="space-y-0.5">
          {mainItems.map((item) => (
            <NavLink key={item.href} {...item} collapsed={collapsed} />
          ))}
        </div>

        {/* Finance */}
        <SectionLabel label="Finance" collapsed={collapsed} />
        <div className="space-y-0.5">
          {financeItems.map((item) => (
            <NavLink key={item.href} {...item} collapsed={collapsed} />
          ))}
        </div>

        {/* Settings */}
        <SectionLabel label="System" collapsed={collapsed} />
        <div className="space-y-0.5">
          <NavLink href="/settings" label="Settings" icon={Settings} collapsed={collapsed} />
        </div>
      </div>

      {/* ── User footer ── */}
      <div className={`shrink-0 border-t border-gray-100 p-3 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        {/* User row */}
        <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors ${collapsed ? 'justify-center' : ''}`}>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#0a0a0a] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#0a0a0a] truncate">
                {userEmail ?? 'Admin'}
              </p>
              <p className="text-[11px] text-gray-400">Active session</p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Logout when collapsed */}
        {collapsed && (
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 w-full flex justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>

      {/* ── Collapse toggle (desktop only) ── */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-[56px] w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-[#0a0a0a] hover:border-gray-300 transition-all"
        >
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>
      )}
    </nav>
  )
}
