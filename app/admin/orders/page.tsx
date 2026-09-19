// Orders list page for monitoring order transactions, status badges, and filtering.

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAdminStore, Order } from '@/lib/admin-store'
import { formatPrice, formatDate } from '@/lib/format'
import { DataTable, Column } from '@/components/admin/data-table'
import { StatusBadge } from '@/components/admin/status-badge'
import { Eye, ShoppingBag } from 'lucide-react'

/** Renders the administrative orders table view. */
export default function AdminOrdersPage() {
  const { orders, payments } = useAdminStore()
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredOrders = orders.filter((ord) => {
    if (statusFilter !== 'all' && ord.status !== statusFilter) return false
    return true
  })

  const columns: Column<Order>[] = [
    {
      header: 'Order #',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#f4f3f0] text-[#5d85a0] rounded">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <Link
              href={`/admin/orders/${row.id}`}
              className="font-serif font-medium text-sm text-[#182938] hover:text-[#5d85a0] hover:underline"
            >
              #{row.orderNumber}
            </Link>
            <p className="text-[10px] text-[#727677]">{formatDate(row.createdAt)}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      cell: (row) => (
        <div>
          <p className="font-medium text-[#182938]">{row.customerName}</p>
          <p className="text-[10px] text-[#727677]">{row.customerPhone}</p>
        </div>
      ),
    },
    {
      header: 'Items',
      cell: (row) => {
        const totalItems = row.items.reduce((acc, item) => acc + item.quantity, 0)
        return (
          <span className="text-xs text-[#727677]">
            {totalItems} item{totalItems > 1 ? 's' : ''}
          </span>
        )
      },
    },
    {
      header: 'Total',
      cell: (row) => (
        <span className="font-serif font-medium text-sm text-[#182938]">
          {formatPrice(row.total)}
        </span>
      ),
    },
    {
      header: 'Order Status',
      cell: (row) => <StatusBadge type="order" status={row.status} />,
    },
    {
      header: 'Payment Status',
      cell: (row) => {
        const linkedPayment = payments.find((p) => p.orderId === row.id)
        const payStatus = linkedPayment ? linkedPayment.status : row.status === 'paid' ? 'successful' : 'pending'
        return <StatusBadge type="payment" status={payStatus} />
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <Link
          href={`/admin/orders/${row.id}`}
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
      <div>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-[#182938]">
          Orders List
        </h1>
        <p className="text-xs text-[#727677] mt-1">
          Review customer orders, update order status, and view transaction details.
        </p>
      </div>

      {/* Main Data Table */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        searchPlaceholder="Search order # or customer..."
        searchKey={(row) => `${row.orderNumber} ${row.customerName}`}
        filters={[
          {
            key: 'status',
            label: 'All Order Statuses',
            options: [
              { label: 'Pending', value: 'pending' },
              { label: 'Paid', value: 'paid' },
              { label: 'Processing', value: 'processing' },
              { label: 'Completed', value: 'completed' },
              { label: 'Cancelled', value: 'cancelled' },
              { label: 'Refunded', value: 'refunded' },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
      />
    </div>
  )
}
