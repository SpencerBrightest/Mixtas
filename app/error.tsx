// Root error boundary component catching unhandled application exceptions gracefully.

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'

/** Renders user-friendly error UI when an exception occurs. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled Storefront Exception:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] bg-[#f4f3f0] flex flex-col justify-center items-center p-4 text-[#182938]">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#dedfdd] p-8 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-6 h-6" />
        </div>

        <h1 className="font-serif text-2xl text-[#182938]">Something went wrong</h1>
        <p className="text-xs text-[#727677]">
          We encountered an unexpected issue. Please try refreshing or contact support if the problem persists.
        </p>

        {error.digest && (
          <p className="text-[10px] font-mono text-[#727677] bg-[#f4f3f0] p-2 rounded">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={reset}
            className="w-full bg-[#182938] hover:bg-[#5d85a0] text-white text-xs uppercase tracking-wider py-2.5 rounded font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
          <Link
            href="/"
            className="w-full border border-[#dedfdd] text-[#182938] hover:bg-[#f4f3f0] text-xs uppercase tracking-wider py-2.5 rounded font-medium transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}
