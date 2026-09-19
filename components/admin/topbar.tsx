// Top navigation header bar component for the admin layout.

'use client'

import React, { useState } from 'react'
import { Menu, Search, Bell, User, LogOut, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useAdminStore } from '@/lib/admin-store'

interface TopbarProps {
  onOpenMobileMenu: () => void
}

/** Renders the top header bar of the admin panel. */
export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const { logout } = useAdminStore()

  return (
    <header className="h-20 bg-white border-b border-[#dedfdd] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Left side: Mobile menu toggle and search input */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-md text-[#182938] hover:bg-[#f4f3f0]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#727677]" />
          <input
            type="text"
            placeholder="Search products, orders, customers..."
            className="w-full bg-[#f4f3f0] text-xs text-[#182938] placeholder-[#727677] pl-9 pr-4 py-2 rounded-md border border-transparent focus:border-[#5d85a0] focus:bg-white outline-none transition-all"
          />
        </div>
      </div>

      {/* Right side: Notifications & Admin User Profile */}
      <div className="flex items-center gap-3">
        <button
          className="p-2 text-[#727677] hover:text-[#182938] hover:bg-[#f4f3f0] rounded-full relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-[#dedfdd] mx-1" />

        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-[#f4f3f0] transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-[#182938] text-white flex items-center justify-center font-serif text-sm font-semibold">
              S
            </div>
            <div className="hidden sm:block text-xs">
              <div className="font-semibold text-[#182938]">Spencer Admin</div>
              <div className="text-[10px] text-[#727677]">Administrator</div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#727677]" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#dedfdd] rounded-lg shadow-lg py-1 z-30">
              <div className="px-4 py-2 border-b border-[#dedfdd] text-xs">
                <p className="font-semibold text-[#182938]">Spencer Store Owner</p>
                <p className="text-[10px] text-[#727677] truncate">admin@mixtas.com</p>
              </div>
              <Link
                href="/admin/users/usr-admin"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-[#182938] hover:bg-[#f4f3f0]"
              >
                <User className="w-4 h-4 text-[#727677]" />
                <span>My Profile</span>
              </Link>
              <button
                onClick={() => {
                  setProfileOpen(false)
                  logout()
                }}
                className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
