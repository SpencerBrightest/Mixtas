// Payments monitoring page displaying mobile money transfers, CSV export, and transaction status filters.

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAdminStore, Payment } from '@/lib/admin-store'
import { formatPrice, formatDate } from '@/lib/format'
import { DataTable, Column } from '@/components/admin/data-table'
import { StatusBadge } from '@/components/admin/status-badge'
import { StatCard } from '@/components/admin/stat-card'
import { Download, CreditCard, Eye, DollarSign, Clock, AlertCircle } from 'lucide-react'

/** Renders the administrative payment transfers monitoring table. */
export default function AdminPaymentsPage() {
  const { payments } = useAdminStore()

  const [statusFilter, setStatusFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('all')

  const filteredPayments = payments.filter((pay) => {
    if (statusFilter !== 'all' && pay.status !== statusFilter) return false
    if (providerFilter !== 'all' && pay.provider !== providerFilter) return false
    return true
  })

  // Top summary calculations
  const totalReceivedThisMonth = payments
    .filter((p) => p.status === 'successful')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const pendingCount = payments.filter((p) => p.status === 'pending').length
  const failedCount = payments.filter((p) => p.status === 'failed').length

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Date', 'Provider', 'Reference', 'Payer Name', 'Phone', 'Amount (XAF)', 'Status', 'Order Number']
    const rows = filteredPayments.map((p) => [
      formatDate(p.createdAt),
      p.provider.toUpperCase(),
      p.providerReference,
      `"${p.payerName}"`,
      p.payerPhone,
      p.amount,
      p.status,
      p.orderNumber || 'N/A',
    ])

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `mixtas_payments_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns: Column<Payment>[] = [
    {
      header: 'Transfer Ref',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#f4f3f0] text-[#5d85a0] rounded">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <Link
              href={`/admin/payments/${row.id}`}
              className="font-medium text-xs font-mono text-[#182938] hover:text-[#5d85a0] hover:underline"
            >
              {row.providerReference}
            </Link>
            <p className="text-[10px] text-[#727677]">{formatDate(row.createdAt)}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Provider',
      cell: (row) => {
        const providerName = row.provider.replace('_', ' ').toUpperCase()
        return (
          <span className="text-[11px] font-semibold text-[#182938] uppercase tracking-wider bg-[#f4f3f0] px-2 py-0.5 rounded border border-[#dedfdd]">
            {providerName}
          </span>
        )
      },
    },
    {
      header: 'Payer Info',
      cell: (row) => (
        <div>
          <p className="font-medium text-[#182938]">{row.payerName}</p>
          <p className="text-[10px] text-[#727677] font-mono">{row.payerPhone}</p>
        </div>
      ),
    },
    {
      header: 'Amount',
      cell: (row) => (
        <span className="font-serif font-medium text-sm text-[#182938]">
          {formatPrice(row.amount)}
        </span>
      ),
    },
    {
      header: 'Linked Order',
      cell: (row) =>
        row.orderId ? (
          <Link
            href={`/admin/orders/${row.orderId}`}
            className="text-xs font-serif font-semibold text-[#5d85a0] hover:underline"
          >
            #{row.orderNumber}
          </Link>
        ) : (
          <span className="text-xs text-[#727677]">Unlinked</span>
        ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge type="payment" status={row.status} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <Link
          href={`/admin/payments/${row.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#182938] bg-[#f4f3f0] hover:bg-[#dedfdd] rounded transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-[#5d85a0]" /> Details
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-[#182938]">
            Payment Monitor
          </h1>
          <p className="text-xs text-[#727677] mt-1">
            Track Mobile Money transfers, Flutterwave webhooks, and manual confirmations.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-2 bg-[#182938] hover:bg-[#5d85a0] text-white text-xs uppercase tracking-wider px-4 py-2.5 rounded font-medium transition-colors shadow-xs"
        >
          <Download className="w-4 h-4" /> Export Filtered CSV
        </button>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Received (This Month)"
          value={formatPrice(totalReceivedThisMonth)}
          description="Successful Mobile Money & Cards"
          icon={DollarSign}
          highlight
        />
        <StatCard
          title="Pending Verification"
          value={pendingCount}
          description="Awaiting provider or admin check"
          icon={Clock}
        />
        <StatCard
          title="Failed Transfers"
          value={failedCount}
          description="Rejected or cancelled payments"
          icon={AlertCircle}
        />
      </div>

      {/* Main Data Table */}
      <DataTable
        data={filteredPayments}
        columns={columns}
        searchPlaceholder="Search reference or phone..."
        searchKey={(row) => `${row.providerReference} ${row.payerPhone} ${row.payerName}`}
        filters={[
          {
            key: 'status',
            label: 'All Payment Statuses',
            options: [
              { label: 'Successful', value: 'successful' },
              { label: 'Pending', value: 'pending' },
              { label: 'Failed', value: 'failed' },
              { label: 'Refunded', value: 'refunded' },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            key: 'provider',
            label: 'All Providers',
            options: [
              { label: 'MTN Mobile Money', value: 'mtn_momo' },
              { label: 'Orange Money', value: 'orange_money' },
              { label: 'Flutterwave', value: 'flutterwave' },
              { label: 'Manual Transfer', value: 'manual' },
            ],
            value: providerFilter,
            onChange: setProviderFilter,
          },
        ]}
      />
    </div>
  )
}
