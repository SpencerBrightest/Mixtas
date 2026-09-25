// Administrative audit trail log page for inspecting administrator actions and system events.

'use client'

import React, { useState } from 'react'
import { formatDate } from '@/lib/format'
import { ShieldCheck, History, Filter } from 'lucide-react'

interface AuditLogEntry {
  id: string
  adminId: string
  adminEmail?: string
  action: string
  entity: string
  entityId?: string
  details?: Record<string, any>
  createdAt: string
}

// Initial mock logs for display
const sampleLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    adminId: 'usr-1',
    adminEmail: 'mixtas@spencer.gmail.com',
    action: 'payment.confirm',
    entity: 'payment',
    entityId: 'pay-101',
    details: { amount: 15000, provider: 'mtn_momo' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'log-2',
    adminId: 'usr-1',
    adminEmail: 'mixtas@spencer.gmail.com',
    action: 'product.create',
    entity: 'product',
    entityId: 'prod-202',
    details: { name: 'Classic Silk Shirt', price: 25000 },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
]

/** Renders the administrative audit log viewer. */
export default function AdminAuditPage() {
  const [logs] = useState<AuditLogEntry[]>(sampleLogs)

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between border-b border-[#dedfdd] pb-4">
        <div>
          <h1 className="font-serif text-3xl font-normal text-[#182938]">System Audit Trail</h1>
          <p className="text-xs text-[#727677] mt-1">
            Immutable log of administrative operations, security events, and payment verifications.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-[#dedfdd] text-xs text-[#182938]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Security Logging Active</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#dedfdd] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#dedfdd] bg-[#f4f3f0]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#727677]" />
            <h2 className="font-serif text-base font-normal text-[#182938]">Recent Administrator Activity</h2>
          </div>
          <span className="text-xs text-[#727677] font-mono">{logs.length} entries recorded</span>
        </div>

        <div className="divide-y divide-[#dedfdd] text-xs">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-[#f4f3f0]/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-[#182938] bg-[#f4f3f0] px-2 py-0.5 rounded border border-[#dedfdd]">
                    {log.action}
                  </span>
                  <span className="text-[#727677]">by {log.adminEmail || log.adminId}</span>
                </div>
                <p className="text-[11px] text-[#727677]">
                  Entity: <strong className="text-[#182938]">{log.entity}</strong> {log.entityId && `(#${log.entityId})`}
                </p>
                {log.details && (
                  <pre className="text-[10px] font-mono bg-[#f4f3f0] p-2 rounded text-[#182938] overflow-x-auto">
                    {JSON.stringify(log.details)}
                  </pre>
                )}
              </div>
              <div className="text-right text-[11px] text-[#727677] whitespace-nowrap">
                {formatDate(log.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
