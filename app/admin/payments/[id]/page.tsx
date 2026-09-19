// Payment detail page showing transaction information, collapsible raw webhook payload, and manual verification dialog.

'use client'

import React, { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/lib/admin-store'
import { formatPrice, formatDateTime } from '@/lib/format'
import { StatusBadge } from '@/components/admin/status-badge'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { ArrowLeft, CreditCard, ChevronDown, ChevronUp, CheckCircle, ShieldCheck } from 'lucide-react'

interface PaymentDetailPageProps {
  params: Promise<{ id: string }>
}

/** Renders individual payment transaction details and manual approval triggers. */
export default function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { payments, markPaymentSuccessful } = useAdminStore()

  const [payloadOpen, setPayloadOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  const payment = payments.find((p) => p.id === resolvedParams.id)

  if (!payment) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="font-serif text-2xl text-[#182938]">Payment Record Not Found</h2>
        <p className="text-xs text-[#727677]">The requested payment transaction could not be found.</p>
        <button
          onClick={() => router.push('/admin/payments')}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-[#182938] text-white px-4 py-2 rounded"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Payments
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dedfdd] pb-4">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#727677] hover:text-[#182938] mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Payments
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-normal tracking-tight text-[#182938]">
              {payment.providerReference}
            </h1>
            <StatusBadge type="payment" status={payment.status} />
          </div>
          <p className="text-xs text-[#727677] mt-1">Processed on {formatDateTime(payment.createdAt)}</p>
        </div>

        {/* Manual Mark as Successful button */}
        {payment.status === 'pending' && (
          <button
            onClick={() => setConfirmModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs uppercase tracking-wider px-4 py-2.5 rounded font-medium transition-colors shadow-xs"
          >
            <CheckCircle className="w-4 h-4" /> Mark as Successful
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Main Details Card */}
        <div className="bg-white rounded-lg border border-[#dedfdd] p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-normal text-[#182938] border-b border-[#dedfdd] pb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#5d85a0]" /> Transaction Summary
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-[#dedfdd]/50">
              <span className="text-[#727677]">Provider</span>
              <span className="font-semibold text-[#182938] uppercase">
                {payment.provider.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#dedfdd]/50">
              <span className="text-[#727677]">Provider Reference</span>
              <span className="font-mono text-[#182938]">{payment.providerReference}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#dedfdd]/50">
              <span className="text-[#727677]">Amount Paid</span>
              <span className="font-serif text-base font-medium text-[#182938]">
                {formatPrice(payment.amount)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#dedfdd]/50">
              <span className="text-[#727677]">Currency</span>
              <span className="font-medium text-[#182938]">{payment.currency}</span>
            </div>
            {payment.confirmedBy && (
              <div className="p-3 bg-emerald-50 rounded border border-emerald-200 mt-2">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4" /> Manually Confirmed by Admin
                </div>
                <p className="text-[10px] text-emerald-700 mt-1">
                  Confirmed by {payment.confirmedBy} on {formatDateTime(payment.confirmedAt || '')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payer & Linked Order Information */}
        <div className="bg-white rounded-lg border border-[#dedfdd] p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-normal text-[#182938] border-b border-[#dedfdd] pb-3">
            Payer & Linked Order
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#727677]">Payer Name</p>
              <p className="font-medium text-[#182938]">{payment.payerName}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#727677]">Payer Phone / Account</p>
              <p className="font-mono font-medium text-[#182938]">{payment.payerPhone}</p>
            </div>
            <div className="pt-3 border-t border-[#dedfdd]">
              <p className="text-[10px] uppercase tracking-wider text-[#727677]">Associated Order</p>
              {payment.orderId ? (
                <div className="mt-1 flex items-center justify-between">
                  <Link
                    href={`/admin/orders/${payment.orderId}`}
                    className="font-serif font-medium text-sm text-[#5d85a0] hover:underline"
                  >
                    Order #{payment.orderNumber}
                  </Link>
                  <Link
                    href={`/admin/orders/${payment.orderId}`}
                    className="text-[10px] uppercase tracking-wider text-[#182938] bg-[#f4f3f0] px-2.5 py-1 rounded"
                  >
                    View Order &rarr;
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-[#727677] mt-1">No store order linked to this payment.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Webhook Raw Payload Code Viewer */}
      <div className="bg-white rounded-lg border border-[#dedfdd] overflow-hidden shadow-xs">
        <button
          onClick={() => setPayloadOpen(!payloadOpen)}
          className="w-full p-4 flex items-center justify-between bg-[#f4f3f0]/60 hover:bg-[#f4f3f0] transition-colors text-left"
        >
          <span className="font-serif text-base font-normal text-[#182938]">
            Raw Webhook Payload JSON
          </span>
          <div className="flex items-center gap-2 text-xs text-[#727677]">
            <span>{payloadOpen ? 'Collapse Payload' : 'Expand Payload'}</span>
            {payloadOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {payloadOpen && (
          <div className="p-4 bg-[#182938] text-emerald-400 font-mono text-xs overflow-x-auto border-t border-[#dedfdd]">
            <pre>{JSON.stringify(payment.rawPayload || { note: 'No payload data stored' }, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Manual Payment Approval */}
      <ConfirmDialog
        isOpen={confirmModalOpen}
        title="Confirm Manual Payment?"
        description="Are you sure you want to mark this payment as Successful? This action will set the status to Successful and update the associated order to Paid."
        confirmText="Mark as Successful"
        variant="success"
        onConfirm={() => {
          markPaymentSuccessful(payment.id, 'Spencer Admin')
          setConfirmModalOpen(false)
        }}
        onClose={() => setConfirmModalOpen(false)}
      />
    </div>
  )
}
