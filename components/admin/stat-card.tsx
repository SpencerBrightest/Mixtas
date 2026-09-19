// StatCard component for displaying key administrative overview metrics.

import React from 'react'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  highlight?: boolean
}

/** Renders a dashboard statistic card matching the store typography and colors. */
export function StatCard({ title, value, description, icon: Icon, trend, highlight }: StatCardProps) {
  return (
    <div
      className={`p-6 rounded-lg border transition-all ${
        highlight
          ? 'bg-[#182938] text-white border-[#182938]'
          : 'bg-white border-[#dedfdd] text-[#182938] shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs uppercase tracking-widest ${
            highlight ? 'text-gray-300' : 'text-[#727677]'
          }`}
        >
          {title}
        </span>
        {Icon && (
          <div
            className={`p-2 rounded-md ${
              highlight ? 'bg-white/10 text-white' : 'bg-[#f4f3f0] text-[#5d85a0]'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-2xl lg:text-3xl font-normal tracking-tight">{value}</h3>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? highlight
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-emerald-50 text-emerald-700'
                : highlight
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {description && (
        <p className={`mt-2 text-xs ${highlight ? 'text-gray-400' : 'text-[#727677]'}`}>
          {description}
        </p>
      )}
    </div>
  )
}
