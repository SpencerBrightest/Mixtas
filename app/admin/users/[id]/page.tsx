// User profile detail view showing order history, payment history, lifetime spend, and role toggles.

'use client'

import React, { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/lib/admin-store'
import { formatPrice, formatDate } from '@/lib/format'
import { StatusBadge } from '@/components/admin/status-badge'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { ArrowLeft, User as UserIcon, Mail, Phone, Calendar, ShoppingBag, CreditCard, Shield } from 'lucide-react'

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

/** Renders detailed customer profile view and role administration. */
export default function UserDetailPage({ params }: UserDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { users, orders, payments, updateUserRole } = useAdminStore()

  const [roleModalOpen, setRoleModalOpen] = useState(false)

  const user = users.find((u) => u.id === resolvedParams.id)

  if (!user) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="font-serif text-2xl text-[#182938]">User Profile Not Found</h2>
        <p className="text-xs text-[#727677]">The requested user account does not exist.</p>
        <button
          onClick={() => router.push('/admin/users')}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-[#182938] text-white px-4 py-2 rounded"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </button>
      </div>
    )
  }

  const userOrders = orders.filter((o) => o.userId === user.id)
  const userPayments = payments.filter((p) => p.userId === user.id)

  const isSelf = user.id === 'usr-admin'
  const newRole = user.role === 'admin' ? 'customer' : 'admin'

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Navigation & Profile Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dedfdd] pb-4">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#727677] hover:text-[#182938] mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Users
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-normal tracking-tight text-[#182938]">
              {user.fullName}
            </h1>
            <StatusBadge type="role" status={user.role} />
          </div>
          <p className="text-xs text-[#727677] mt-1">Joined {formatDate(user.createdAt)}</p>
        </div>

        {/* Promote / Demote Role Button */}
        {!isSelf ? (
          <button
            onClick={() => setRoleModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#182938] hover:bg-[#5d85a0] text-white text-xs uppercase tracking-wider px-4 py-2.5 rounded font-medium transition-colors shadow-xs"
          >
            <Shield className="w-4 h-4" /> Change Role to {newRole.toUpperCase()}
          </button>
        ) : (
          <span className="text-xs text-[#727677] italic bg-[#f4f3f0] px-3 py-1.5 rounded border border-[#dedfdd]">
            Current Admin Session (Self)
          </span>
        )}
      </div>

      {/* User Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-[#dedfdd] p-6 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#182938] text-white flex items-center justify-center font-serif text-xl font-semibold flex-shrink-0 overflow-hidden border border-[#dedfdd]">
            {user.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-7 h-7 text-gray-300" />
            )}
          </div>
          <div className="text-xs space-y-1">
            <p className="font-semibold text-[#182938]">{user.fullName}</p>
            <div className="flex items-center gap-1.5 text-[#727677]">
              <Mail className="w-3.5 h-3.5 text-[#5d85a0]" /> {user.email}
            </div>
            <div className="flex items-center gap-1.5 text-[#727677]">
              <Phone className="w-3.5 h-3.5 text-[#5d85a0]" /> {user.phone}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#dedfdd] p-6 shadow-xs">
          <span className="text-[10px] uppercase tracking-widest text-[#727677] block">
            Total Orders Placed
          </span>
          <p className="font-serif text-3xl text-[#182938] mt-2 font-normal">{userOrders.length}</p>
          <span className="text-[10px] text-[#727677] mt-1 block">Across store history</span>
        </div>

        <div className="bg-white rounded-lg border border-[#dedfdd] p-6 shadow-xs">
          <span className="text-[10px] uppercase tracking-widest text-[#727677] block">
            Lifetime Spend
          </span>
          <p className="font-serif text-3xl text-[#182938] mt-2 font-normal">
            {formatPrice(user.totalSpent)}
          </p>
          <span className="text-[10px] text-[#727677] mt-1 block">Completed payments</span>
        </div>
      </div>

      {/* User Orders & Payments Tables */}
      <div className="space-y-6">
        {/* User Orders */}
        <div className="bg-white rounded-lg border border-[#dedfdd] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#dedfdd] bg-[#f4f3f0]/40 flex items-center justify-between">
            <h3 className="font-serif text-lg text-[#182938] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#5d85a0]" /> Order History ({userOrders.length})
            </h3>
          </div>

          <div className="divide-y divide-[#dedfdd] text-xs">
            {userOrders.length > 0 ? (
              userOrders.map((ord) => (
                <div key={ord.id} className="p-4 flex items-center justify-between hover:bg-[#f4f3f0]/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/orders/${ord.id}`} className="font-semibold text-[#182938] hover:underline">
                        Order #{ord.orderNumber}
                      </Link>
                      <StatusBadge type="order" status={ord.status} />
                    </div>
                    <p className="text-[10px] text-[#727677] mt-1">{formatDate(ord.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif font-medium text-[#182938]">{formatPrice(ord.total)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-[#727677] text-xs">No orders recorded for this account yet.</p>
            )}
          </div>
        </div>

        {/* User Payments */}
        <div className="bg-white rounded-lg border border-[#dedfdd] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#dedfdd] bg-[#f4f3f0]/40 flex items-center justify-between">
            <h3 className="font-serif text-lg text-[#182938] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#5d85a0]" /> Payment History ({userPayments.length})
            </h3>
          </div>

          <div className="divide-y divide-[#dedfdd] text-xs">
            {userPayments.length > 0 ? (
              userPayments.map((pay) => (
                <div key={pay.id} className="p-4 flex items-center justify-between hover:bg-[#f4f3f0]/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/payments/${pay.id}`} className="font-mono font-medium text-[#182938] hover:underline">
                        {pay.providerReference}
                      </Link>
                      <StatusBadge type="payment" status={pay.status} />
                    </div>
                    <p className="text-[10px] text-[#727677] mt-1">
                      {pay.provider.toUpperCase()} &bull; {formatDate(pay.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif font-medium text-[#182938]">{formatPrice(pay.amount)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-[#727677] text-xs">No payments recorded for this account yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Role Promotion/Demotion Confirmation Modal */}
      <ConfirmDialog
        isOpen={roleModalOpen}
        title={`Change User Role to ${newRole.toUpperCase()}?`}
        description={`Are you sure you want to change ${user.fullName}'s role from ${user.role.toUpperCase()} to ${newRole.toUpperCase()}?`}
        confirmText={`Set as ${newRole.toUpperCase()}`}
        variant="warning"
        onConfirm={() => {
          updateUserRole(user.id, newRole)
          setRoleModalOpen(false)
        }}
        onClose={() => setRoleModalOpen(false)}
      />
    </div>
  )
}
