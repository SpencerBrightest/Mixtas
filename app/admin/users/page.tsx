// Users management page for viewing customer accounts, order counts, and total spend.

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAdminStore, UserAccount } from '@/lib/admin-store'
import { formatPrice, formatDate } from '@/lib/format'
import { DataTable, Column } from '@/components/admin/data-table'
import { StatusBadge } from '@/components/admin/status-badge'
import { Eye, User as UserIcon } from 'lucide-react'

/** Renders the administrative user list table. */
export default function AdminUsersPage() {
  const { users } = useAdminStore()
  const [roleFilter, setRoleFilter] = useState('all')

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    return true
  })

  const columns: Column<UserAccount>[] = [
    {
      header: 'User Account',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#182938] text-white flex items-center justify-center font-serif text-sm font-semibold flex-shrink-0 overflow-hidden border border-[#dedfdd]">
            {row.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={row.avatarUrl} alt={row.fullName} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-5 h-5 text-gray-300" />
            )}
          </div>
          <div>
            <Link
              href={`/admin/users/${row.id}`}
              className="font-medium text-[#182938] hover:text-[#5d85a0] hover:underline"
            >
              {row.fullName}
            </Link>
            <p className="text-[10px] text-[#727677]">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Phone',
      cell: (row) => <span className="font-mono text-xs text-[#727677]">{row.phone}</span>,
    },
    {
      header: 'Role',
      cell: (row) => <StatusBadge type="role" status={row.role} />,
    },
    {
      header: 'Orders',
      cell: (row) => (
        <span className="font-medium text-xs text-[#182938]">
          {row.ordersCount} order{row.ordersCount !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      header: 'Total Spent',
      cell: (row) => (
        <span className="font-serif font-medium text-sm text-[#182938]">
          {formatPrice(row.totalSpent)}
        </span>
      ),
    },
    {
      header: 'Joined',
      cell: (row) => <span className="text-xs text-[#727677]">{formatDate(row.createdAt)}</span>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <Link
          href={`/admin/users/${row.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#182938] bg-[#f4f3f0] hover:bg-[#dedfdd] rounded transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-[#5d85a0]" /> Profile
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-[#182938]">
          User Accounts
        </h1>
        <p className="text-xs text-[#727677] mt-1">
          Inspect registered user profiles, order histories, and assign administrative roles.
        </p>
      </div>

      {/* Main Data Table */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        searchPlaceholder="Search user by name, email, or phone..."
        searchKey={(row) => `${row.fullName} ${row.email} ${row.phone}`}
        filters={[
          {
            key: 'role',
            label: 'All Roles',
            options: [
              { label: 'Customer', value: 'customer' },
              { label: 'Admin', value: 'admin' },
            ],
            value: roleFilter,
            onChange: setRoleFilter,
          },
        ]}
      />
    </div>
  )
}
