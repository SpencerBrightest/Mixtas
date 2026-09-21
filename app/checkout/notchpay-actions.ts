// Handles server actions for initializing Notch Pay payment transactions and polling payment status.

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const NOTCH_API = 'https://api.notchpay.co'

type StartResult = { ok: true; url: string } | { ok: false; error: string }

/** Starts a payment transaction with Notch Pay REST API and stores the checkout authorization URL. */
export async function startNotchPayment(paymentId: string): Promise<StartResult> {
  if (!paymentId) {
    return { ok: false, error: 'Payment reference ID was not received. Please try placing your order again.' }
  }

  const admin = createAdminClient()

  const { data: payment, error: fetchError } = await admin
    .from('payments')
    .select('id, user_id, order_id, amount, currency, status, provider, raw_payload')
    .eq('id', paymentId)
    .maybeSingle()

  if (fetchError) {
    console.error('Fetch payment error:', fetchError)
    return { ok: false, error: fetchError.message }
  }

  if (!payment) {
    return { ok: false, error: 'Payment record could not be found in database.' }
  }

  if (payment.status !== 'pending') {
    return { ok: false, error: `Payment is already in ${payment.status} status.` }
  }

  const rawPayload = (payment.raw_payload as Record<string, any>) || {}

  // Reuse existing checkout URL from payload if already initialized to prevent duplicate transactions
  if (rawPayload.checkout_url) return { ok: true, url: rawPayload.checkout_url }

  const { data: order } = await admin
    .from('orders')
    .select('order_number, customer_name, customer_phone')
    .eq('id', payment.order_id)
    .single()

  const phone = order?.customer_phone ?? rawPayload.phone ?? ''
  const customer: Record<string, string> = {
    name: order?.customer_name ?? rawPayload.name ?? 'Customer',
  }
  if (rawPayload.email) customer.email = rawPayload.email
  
  // Format international telephone number if matching standard format
  const cleanPhone = phone.replace(/[\s-]/g, '')
  if (/^\+\d{8,15}$/.test(cleanPhone)) {
    customer.phone = cleanPhone
  } else if (/^\d{9}$/.test(cleanPhone)) {
    customer.phone = `+237${cleanPhone}`
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
        currency: payment.currency || 'XAF',
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
      .select('raw_payload')
      .eq('id', payment.id)
      .single()
    const againPayload = (again?.raw_payload as Record<string, any>) || {}
    if (againPayload?.checkout_url) return { ok: true, url: againPayload.checkout_url }
    return { ok: false, error: 'Your payment is already being set up. Please wait a moment and refresh.' }
  }

  if (!res.ok || !data?.authorization_url) {
    console.error('Notch Pay init failed', res.status, data)
    return { ok: false, error: data?.message || 'Could not start the payment. Please verify your phone number and try again.' }
  }

  // Update payment row with provider reference and authorization link in raw_payload
  await admin
    .from('payments')
    .update({
      provider_reference: data.transaction?.reference ?? null,
      raw_payload: {
        ...rawPayload,
        checkout_url: data.authorization_url,
      },
    })
    .eq('id', payment.id)

  return { ok: true, url: data.authorization_url }
}

/** Retrieves current payment status for status page polling. */
export async function getPaymentStatus(paymentId: string): Promise<string | null> {
  const admin = createAdminClient()

  const { data } = await admin
    .from('payments')
    .select('status')
    .eq('id', paymentId)
    .maybeSingle()

  return data?.status ?? null
}
