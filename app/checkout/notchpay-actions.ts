// Handles server actions for initializing Notch Pay payment transactions and polling payment status.

'use server'

import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const NOTCH_API = 'https://api.notchpay.co'

type StartResult = { ok: true; url: string } | { ok: false; error: string }

/** Starts a payment transaction with Notch Pay REST API and stores the checkout authorization URL. */
export async function startNotchPayment(paymentId: string): Promise<StartResult> {
  const { user } = await requireUser()
  const admin = createAdminClient()

  const { data: payment } = await admin
    .from('payments')
    .select('id, user_id, order_id, amount, currency, status, provider, checkout_url')
    .eq('id', paymentId)
    .single()

  // Verify payment ownership, provider, and pending status
  if (
    !payment ||
    payment.user_id !== user.id ||
    payment.provider !== 'notchpay' ||
    payment.status !== 'pending'
  ) {
    return { ok: false, error: 'Payment not found.' }
  }

  // Reuse existing checkout URL if already initialized to prevent duplicate transactions
  if (payment.checkout_url) return { ok: true, url: payment.checkout_url }

  const [{ data: profile }, { data: order }] = await Promise.all([
    admin.from('profiles').select('full_name, email, phone').eq('id', user.id).single(),
    admin.from('orders').select('order_number, customer_name, customer_phone').eq('id', payment.order_id).single(),
  ])

  const phone = order?.customer_phone ?? profile?.phone ?? ''
  const customer: Record<string, string> = {
    name: order?.customer_name ?? profile?.full_name ?? 'Customer',
  }
  if (profile?.email) customer.email = profile.email
  
  // Format international telephone number if matching regex
  if (/^\+\d{8,15}$/.test(phone.replace(/\s/g, ''))) {
    customer.phone = phone.replace(/\s/g, '')
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  let res: Response
  try {
    res = await fetch(`${NOTCH_API}/payments`, {
      method: 'POST',
      headers: {
        Authorization: process.env.NOTCHPAY_PUBLIC_KEY!,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        amount: payment.amount,
        currency: payment.currency,
        reference: payment.id,
        description: `Order #${order?.order_number ?? ''}`.trim(),
        callback: `${site}/checkout/status/${payment.id}`,
        customer,
      }),
    })
  } catch (e) {
    console.error('Notch Pay init network error', e)
    return { ok: false, error: 'Could not reach the payment service. Please try again.' }
  }

  const data = await res.json().catch(() => null)

  // Handle request race condition when reference already exists at Notch Pay
  if (res.status === 409) {
    const { data: again } = await admin
      .from('payments')
      .select('checkout_url')
      .eq('id', payment.id)
      .single()
    if (again?.checkout_url) return { ok: true, url: again.checkout_url }
    return { ok: false, error: 'Your payment is already being set up. Please wait a moment and refresh.' }
  }

  if (!res.ok || !data?.authorization_url) {
    console.error('Notch Pay init failed', res.status, data)
    return { ok: false, error: 'Could not start the payment. Please try again.' }
  }

  // Update payment row with provider reference and authorization link
  await admin
    .from('payments')
    .update({
      provider_reference: data.transaction?.reference ?? null,
      checkout_url: data.authorization_url,
    })
    .eq('id', payment.id)

  return { ok: true, url: data.authorization_url }
}

/** Retrieves current payment status for status page polling. */
export async function getPaymentStatus(paymentId: string): Promise<string | null> {
  const { supabase, user } = await requireUser()

  const { data } = await supabase
    .from('payments')
    .select('status')
    .eq('id', paymentId)
    .eq('user_id', user.id)
    .maybeSingle()

  return data?.status ?? null
}
