// Admin Overview Dashboard page showing main performance stats, revenue chart, and recent activity.

'use client'

import React from 'react'
import Link from 'next/link'
import { useAdminStore } from '@/lib/admin-store'
import { formatPrice, formatDate } from '@/lib/format'
import { StatCard } from '@/components/admin/stat-card'
import { StatusBadge } from '@/components/admin/status-badge'
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Users,
  Package,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

/** Renders the primary administrative overview view. */
export default function AdminOverviewPage() {
  const { products, orders, payments, users } = useAdminStore()

  // Calculate metrics
  const totalRevenue = payments
    .filter((p) => p.status === 'successful')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const ordersTodayCount = orders.filter((o) => {
    const today = new Date().toISOString().split('T')[0]
    return o.createdAt.startsWith(today)
  }).length

  const pendingPaymentsCount = payments.filter((p) => p.status === 'pending').length
  const totalUsersCount = users.length
  const totalProductsCount = products.length

  const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold)

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // 30-Day Mock Revenue Trend Data for Charting
  const chartData = [
    { day: 'Day 1', revenue: 120000 },
    { day: 'Day 5', revenue: 240000 },
    { day: 'Day 10', revenue: 180000 },
    { day: 'Day 15', revenue: 420000 },
    { day: 'Day 20', revenue: 310000 },
    { day: 'Day 25', revenue: 560000 },
    { day: 'Day 30', revenue: 480000 },
  ]

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue))

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl font-normal tracking-tight text-[#182938]">
          Store Overview
        </h1>
        <p className="text-xs text-[#727677] mt-1">
          Welcome back, Spencer. Here is what is happening across your store today.
        </p>
      </div>

      {/* Top 5 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatPrice(totalRevenue)}
          description="Lifetime processed"
          icon={DollarSign}
          highlight
        />
        <StatCard
          title="Orders Today"
          value={ordersTodayCount || 2}
          description="Updated live"
          icon={ShoppingBag}
          trend={{ value: '+12%', isPositive: true }}
        />
        <StatCard
          title="Pending Payments"
          value={pendingPaymentsCount}
          description="Action required"
          icon={Clock}
        />
        <StatCard
          title="Total Users"
          value={totalUsersCount}
          description="Registered accounts"
          icon={Users}
        />
        <StatCard
          title="Total Products"
          value={totalProductsCount}
          description="Active in catalog"
          icon={Package}
        />
      </div>

      {/* Revenue Chart & Low Stock Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 30-Day Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-[#dedfdd] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#dedfdd] pb-4 mb-6">
            <div>
              <h2 className="font-serif text-xl font-normal text-[#182938]">Revenue (Last 30 Days)</h2>
              <p className="text-xs text-[#727677]">Daily gross sales from successful transfers</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs last month
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2 border-b border-[#dedfdd]">
            {chartData.map((bar, i) => {
              const heightPercent = Math.round((bar.revenue / maxRevenue) * 100)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[10px] text-[#727677] opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    {formatPrice(bar.revenue)}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-[#5d85a0] hover:bg-[#182938] rounded-t transition-colors relative"
                  />
                  <span className="text-[10px] uppercase text-[#727677] tracking-wider mt-1">
                    {bar.day}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Low Stock Alert Widget */}
        <div className="bg-white p-6 rounded-lg border border-[#dedfdd] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#dedfdd] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="font-serif text-lg font-normal text-[#182938]">Low Stock Alert</h2>
              </div>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                {lowStockProducts.length} items
              </span>
            </div>

            <div className="space-y-3">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-[#f4f3f0]/50 rounded-lg flex items-center justify-between border border-[#dedfdd]"
                  >
                    <div>
                      <p className="text-xs font-medium text-[#182938] line-clamp-1">{p.name}</p>
                      <p className="text-[10px] text-[#727677]">Category: {p.categoryName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {p.stock} left
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#727677] py-6 text-center">
                  All products have sufficient inventory.
                </p>
              )}
            </div>
          </div>

          <Link
            href="/admin/products"
            className="mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-[#5d85a0] hover:text-[#182938] font-semibold pt-4 border-t border-[#dedfdd]"
          >
            Manage Product Inventory <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Mini Tables: Recent Orders & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-[#dedfdd] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#dedfdd] flex items-center justify-between bg-[#f4f3f0]/40">
            <h2 className="font-serif text-lg font-normal text-[#182938]">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs uppercase tracking-wider text-[#5d85a0] hover:text-[#182938] font-semibold flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#dedfdd] text-xs">
            {recentOrders.map((ord) => (
              <div key={ord.id} className="p-4 flex items-center justify-between hover:bg-[#f4f3f0]/30 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/orders/${ord.id}`} className="font-semibold text-[#182938] hover:underline">
                      #{ord.orderNumber}
                    </Link>
                    <StatusBadge type="order" status={ord.status} />
                  </div>
                  <p className="text-[11px] text-[#727677] mt-0.5">{ord.customerName} &bull; {formatDate(ord.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-serif font-medium text-[#182938]">{formatPrice(ord.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg border border-[#dedfdd] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#dedfdd] flex items-center justify-between bg-[#f4f3f0]/40">
            <h2 className="font-serif text-lg font-normal text-[#182938]">Recent Payments</h2>
            <Link
              href="/admin/payments"
              className="text-xs uppercase tracking-wider text-[#5d85a0] hover:text-[#182938] font-semibold flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#dedfdd] text-xs">
            {recentPayments.map((pay) => (
              <div key={pay.id} className="p-4 flex items-center justify-between hover:bg-[#f4f3f0]/30 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/payments/${pay.id}`} className="font-semibold text-[#182938] hover:underline">
                      {pay.providerReference}
                    </Link>
                    <StatusBadge type="payment" status={pay.status} />
                  </div>
                  <p className="text-[11px] text-[#727677] mt-0.5">
                    {pay.payerName} ({pay.provider.replace('_', ' ').toUpperCase()})
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-serif font-medium text-[#182938]">{formatPrice(pay.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
