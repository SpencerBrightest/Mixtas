// Left navigation sidebar component for the admin dashboard.

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  CreditCard,
  Users,
  Store,
  X,
  ShieldCheck,
} from 'lucide-react'

interface SidebarProps {
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

const navItems = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Users', href: '/admin/users', icon: Users },
]

/** Renders the admin sidebar navigation menu. */
export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname()

  // Checks if a route is currently active
  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(path)
  }

  const content = (
    <div className="flex flex-col h-full bg-[#182938] text-white w-64 border-r border-[#2c3e50]">
      {/* Brand & Title */}
      <div className="h-20 px-6 flex items-center justify-between border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold tracking-tight">MIXTAS</span>
          <span className="text-[10px] uppercase tracking-widest bg-[#5d85a0] text-white px-2 py-0.5 rounded font-sans">
            Admin
          </span>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden text-gray-400 hover:text-white p-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation links */}
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs uppercase tracking-wider transition-colors ${
                active
                  ? 'bg-[#5d85a0] text-white font-medium shadow-xs'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 opacity-80" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>

      {/* Footer / Back to storefront */}
      <div className="p-4 border-t border-white/10 bg-black/20 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-xs uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Store className="w-4 h-4" />
          <span>Back to Storefront</span>
        </Link>
        <div className="flex items-center gap-2 px-3 pt-2 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Admin Session Active</span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:block fixed inset-y-0 left-0 z-30 w-64">
        {content}
      </aside>

      {/* Mobile drawer backdrop and panel */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 flex-1 max-w-xs w-full bg-[#182938]">
            {content}
          </div>
        </div>
      )}
    </>
  )
}
