// Admin Login Page for authenticating store administrators into the hidden dashboard.

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/lib/admin-store'
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react'

/** Renders the admin login interface. */
export default function AdminLoginPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAdminStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Redirect to overview if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    setTimeout(() => {
      const success = login(email, password)
      if (success) {
        document.cookie = 'admin_authenticated=true; path=/; max-age=86400; SameSite=Lax'
        router.push('/admin')
      } else {
        setError('Invalid admin credentials. Please check your email and password.')
        setIsLoading(false)
      }
    }, 400)
  }

  return (
    <div className="min-h-screen bg-[#f4f3f0] flex flex-col justify-center items-center p-4 text-[#182938]">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#dedfdd] p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#182938] text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-[#5d85a0]" />
          </div>
          <span className="text-[10px] uppercase tracking-widest bg-[#5d85a0] text-white px-2.5 py-1 rounded font-sans font-semibold">
            Restricted Access
          </span>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-[#182938] pt-1">
            MIXTAS Admin Login
          </h1>
          <p className="text-xs text-[#727677]">
            Sign in with authorized administrator credentials to manage the store.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#182938] font-semibold mb-1">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#727677]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mixtas@spencer.gmail.com"
                className="w-full bg-[#f4f3f0] text-xs text-[#182938] pl-9 pr-3 py-3 rounded border border-[#dedfdd] focus:border-[#5d85a0] focus:bg-white outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#182938] font-semibold mb-1">
              Secret Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#727677]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#f4f3f0] text-xs text-[#182938] pl-9 pr-3 py-3 rounded border border-[#dedfdd] focus:border-[#5d85a0] focus:bg-white outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-[#182938] hover:bg-[#5d85a0] text-white text-xs uppercase tracking-wider py-3 rounded font-medium transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Sign In to Dashboard'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-[#dedfdd] text-center text-[11px] text-[#727677]">
          Need credentials? Contact the store owner for authorized credentials.
        </div>
      </div>
    </div>
  )
}
