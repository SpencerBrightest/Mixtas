// Client component that polls payment status until confirmed, failed, or timed out.

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPaymentStatus } from '@/app/checkout/notchpay-actions'

interface PollerProps {
  paymentId: string
  initialStatus: string
}

/** Renders dynamic payment status indicators and polls status API every 3 seconds. */
export function PaymentStatusPoller({ paymentId, initialStatus }: PollerProps) {
  const [status, setStatus] = useState(initialStatus)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (status !== 'pending') return

    let tries = 0
    const timer = setInterval(async () => {
      tries += 1
      const latest = await getPaymentStatus(paymentId)
      if (latest && latest !== 'pending') {
        setStatus(latest)
        clearInterval(timer)
      } else if (tries >= 60) {
        // Stop polling after 3 minutes of waiting
        setTimedOut(true)
        clearInterval(timer)
      }
    }, 3000)

    return () => clearInterval(timer)
  }, [paymentId, status])

  if (status === 'successful') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-[#182938]">Payment received</h1>
        <p className="text-[#727677]">Thank you! Your order is confirmed and will be processed immediately.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center bg-[#182938] text-white text-xs uppercase tracking-wider px-5 py-2.5 rounded font-medium hover:bg-[#5d85a0] transition-colors"
          >
            Continue shopping
          </Link>
          <Link
            href="/account"
            className="inline-flex items-center justify-center border border-[#dedfdd] bg-[#f4f3f0] text-[#182938] text-xs uppercase tracking-wider px-5 py-2.5 rounded font-medium hover:bg-[#dedfdd] transition-colors"
          >
            View my account
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-rose-700">Payment not completed</h1>
        <p className="text-[#727677]">
          The payment failed, was cancelled, or expired. You were not charged for this attempt.
        </p>
        <Link
          href="/checkout"
          className="inline-flex items-center justify-center bg-[#182938] text-white text-xs uppercase tracking-wider px-5 py-2.5 rounded font-medium hover:bg-[#5d85a0] transition-colors"
        >
          Try again
        </Link>
      </div>
    )
  }

  if (status === 'needs_refund') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">We received an extra payment</h1>
        <p className="text-[#727677]">
          This order was already paid. We will refund this payment. Please contact us if you do not
          hear from us.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Confirming your payment...</h1>
      <p className="text-[#727677]">
        Please approve the prompt on your phone and <strong>do not pay again</strong>. This page updates automatically.
      </p>
      {timedOut && (
        <div className="space-y-3">
          <p className="text-sm text-[#727677]">
            This is taking longer than usual. If you approved the payment on your phone, it will
            show in My Orders shortly. Do not pay a second time.
          </p>
          <Link
            href="/account"
            className="inline-flex items-center justify-center border border-[#dedfdd] bg-[#f4f3f0] text-[#182938] text-xs uppercase tracking-wider px-5 py-2.5 rounded font-medium hover:bg-[#dedfdd] transition-colors"
          >
            Go to my account
          </Link>
        </div>
      )}
    </div>
  )
}

