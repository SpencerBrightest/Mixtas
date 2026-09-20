// Admin dashboard error boundary ensuring dashboard failures do not break storefront.

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ShieldAlert, RefreshCw, LayoutDashboard } from 'lucide-react'

/** Renders admin section error fallback UI. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin Panel Exception:', error)
  }, [error])

  return (
    <div className="p-8 max-w-lg mx-auto bg-white rounded-xl border border-[#dedfdd] shadow-sm text-center space-y-4 my-12 text-[#182938]">
      <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
        <ShieldAlert className="w-6 h-6" />
      </div>

      <h2 className="font-serif text-2xl font-normal">Dashboard Exception</h2>
      <p className="text-xs text-[#727677]">
        An administrative error occurred while loading this section.
      </p>

      {error.digest && (
        <p className="text-[10px] font-mono text-[#727677] bg-[#f4f3f0] p-2 rounded">
          Digest: {error.digest}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={reset}
          className="w-full bg-[#182938] hover:bg-[#5d85a0] text-white text-xs uppercase tracking-wider py-2.5 rounded font-medium transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reload View
        </button>
        <Link
          href="/admin"
          className="w-full border border-[#dedfdd] text-[#182938] hover:bg-[#f4f3f0] text-xs uppercase tracking-wider py-2.5 rounded font-medium transition-colors flex items-center justify-center gap-2"
        >
          <LayoutDashboard className="w-3.5 h-3.5" /> Back to Overview
        </Link>
      </div>
    </div>
  )
}
