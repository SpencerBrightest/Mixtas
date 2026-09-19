// Layout component wrapping all admin dashboard pages with authentication guard protection.

'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { AdminStoreProvider, useAdminStore } from '@/lib/admin-store'
import { Sidebar } from '@/components/admin/sidebar'
import { Topbar } from '@/components/admin/topbar'
import AdminLoginPage from './login/page'

function AdminContentGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated } = useAdminStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // If on login route, render children cleanly without sidebar/topbar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // If not authenticated, render login page gate
  if (!isAuthenticated) {
    return <AdminLoginPage />
  }

  return (
    <div className="min-h-screen bg-[#f4f3f0] text-[#182938]">
      {/* Navigation Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Topbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>

        <footer className="py-4 px-8 border-t border-[#dedfdd] text-center text-xs text-[#727677] bg-white">
          Mixtas Fashion Store Admin Panel &copy; {new Date().getFullYear()} — Built with Next.js & shadcn/ui design tokens
        </footer>
      </div>
    </div>
  )
}

/** Primary layout component for the /admin section. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminContentGuard>{children}</AdminContentGuard>
}
