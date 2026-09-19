// Renders color-coded status badges for orders, payments, roles, and product availability.

import React from 'react'

export type BadgeType = 'order' | 'payment' | 'role' | 'stock' | 'active'

interface StatusBadgeProps {
  type?: BadgeType
  status: string
  className?: string
}

/** Renders a stylized badge according to the design system palette. */
export function StatusBadge({ type = 'order', status, className = '' }: StatusBadgeProps) {
  const normalized = status.toLowerCase()

  let style = 'bg-gray-100 text-gray-800 border-gray-200'

  if (type === 'order') {
    switch (normalized) {
      case 'paid':
        style = 'bg-emerald-50 text-emerald-700 border-emerald-200'
        break
      case 'completed':
        style = 'bg-blue-50 text-blue-700 border-blue-200'
        break
      case 'processing':
        style = 'bg-amber-50 text-amber-700 border-amber-200'
        break
      case 'pending':
        style = 'bg-yellow-50 text-yellow-700 border-yellow-200'
        break
      case 'cancelled':
      case 'refunded':
        style = 'bg-rose-50 text-rose-700 border-rose-200'
        break
    }
  } else if (type === 'payment') {
    switch (normalized) {
      case 'successful':
        style = 'bg-emerald-50 text-emerald-700 border-emerald-200'
        break
      case 'pending':
        style = 'bg-amber-50 text-amber-700 border-amber-200'
        break
      case 'failed':
        style = 'bg-rose-50 text-rose-700 border-rose-200'
        break
      case 'refunded':
        style = 'bg-slate-100 text-slate-700 border-slate-200'
        break
    }
  } else if (type === 'role') {
    switch (normalized) {
      case 'admin':
        style = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
        break
      case 'customer':
        style = 'bg-slate-50 text-slate-600 border-slate-200'
        break
    }
  } else if (type === 'stock') {
    switch (normalized) {
      case 'in stock':
        style = 'bg-emerald-50 text-emerald-700 border-emerald-200'
        break
      case 'low stock':
        style = 'bg-amber-50 text-amber-700 border-amber-200 font-medium'
        break
      case 'out of stock':
        style = 'bg-rose-50 text-rose-700 border-rose-200 font-medium'
        break
    }
  } else if (type === 'active') {
    if (normalized === 'true' || normalized === 'active') {
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200'
    } else {
      style = 'bg-slate-100 text-slate-500 border-slate-200'
    }
  }

  const label =
    type === 'active'
      ? normalized === 'true' || normalized === 'active'
        ? 'Active'
        : 'Inactive'
      : status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border tracking-wide uppercase ${style} ${className}`}
    >
      {label}
    </span>
  )
}
