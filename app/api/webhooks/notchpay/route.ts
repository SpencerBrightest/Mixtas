// Webhook route handler for processing Notch Pay transaction completion and failure events.

import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const NOTCH_API = 'https://api.notchpay.co'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const HANDLED_EVENTS = new Set([
  'payment.complete',
  'payment.failed',
  'payment.canceled',
  'payment.expired',
])

/** Verifies the HMAC SHA-256 signature sent by Notch Pay. */
function verifySignature(rawBody: string, signature: string | null) {
  if (!signature) return false
  const expected = crypto
    .createHmac('sha256', process.env.NOTCHPAY_WEBHOOK_HASH!)
    .update(rawBody)
    .digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature.trim())
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/** Extracts merchant reference and Notch Pay reference defensively from webhook payload. */
function extractRefs(body: any) {
  const type: string | undefined = body?.type ?? body?.event
  const data = body?.data ?? {}
  const tx = data.transaction ?? data

  const merchantRef = [tx.trxref, tx.merchant_reference, data.trxref, tx.reference, data.reference].find(
    (v) => typeof v === 'string' && UUID_RE.test(v)
  ) as string | undefined

  const notchRef = [tx.reference, data.reference, tx.id, data.id].find(
    (v) => typeof v === 'string' && v.length > 0 && !UUID_RE.test(v)
  ) as string | undefined

  return { type, merchantRef, notchRef }
}

/**
 * Handles incoming POST notifications from Notch Pay webhook.
 * Expected Headers: x-notch-signature or notchpay-signature
 * Expected Body: JSON payload containing transaction status event
 * Returns: JSON status response ({ received: true } or status code error)
 */
export async function POST(request: Request) {
  // Read raw request body before JSON parsing to calculate exact signature hash
  const rawBody = await request.text()

  const signature =
    request.headers.get('x-notch-signature') ?? request.headers.get('notchpay-signature')

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, merchantRef, notchRef } = extractRefs(body)

  // Ignore unhandled event types like customer or transfer events
  if (!type || !HANDLED_EVENTS.has(type)) {
    return NextResponse.json({ received: true, ignored: true })
  }

  if (!merchantRef) {
    console.error('Notch Pay webhook: could not find our payment id in the payload', rawBody)
    return NextResponse.json({ received: true, ignored: true })
  }

  const admin = createAdminClient()

  const { data: payment } = await admin
    .from('payments')
    .select('id, order_id, user_id, amount, currency, status, provider, provider_reference')
    .eq('id', merchantRef)
    .eq('provider', 'notchpay')
    .maybeSingle()

  if (!payment) {
    console.error('Notch Pay webhook: unknown payment', merchantRef)
    return NextResponse.json({ received: true, ignored: true })
  }

  // Handle duplicate webhook delivery for already successful payments
  if (payment.status === 'successful') {
    if (payment.order_id) await admin.rpc('apply_paid_order', { p_order_id: payment.order_id })
    return NextResponse.json({ received: true })
  }

  // Query Notch Pay API directly to verify actual transaction state
  const lookupRef = notchRef ?? payment.provider_reference ?? payment.id
  let verified: any
  try {
    const res = await fetch(`${NOTCH_API}/payments/${encodeURIComponent(lookupRef)}`, {
      headers: { Authorization: process.env.NOTCHPAY_PUBLIC_KEY!, Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`Notch Pay verify returned ${res.status}`)
    verified = await res.json()
  } catch (e) {
    console.error('Notch Pay verification failed', e)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }

  const tx = verified?.transaction
  const status: string | undefined = tx?.status

  const base = {
    raw_payload: body as Record<string, unknown>,
    ...(notchRef ? { provider_reference: notchRef } : {}),
  }

  // Update payment status for failed or canceled transactions
  if (status === 'failed' || status === 'canceled' || status === 'expired') {
    await admin
      .from('payments')
      .update({ ...base, status: 'failed', note: `Notch Pay status: ${status}` })
      .eq('id', payment.id)
      .eq('status', 'pending')
    return NextResponse.json({ received: true })
  }

  // Exit early if transaction is not complete
  if (status !== 'complete') {
    return NextResponse.json({ received: true })
  }

  // Verify paid amount and currency match recorded database figures
  const paidAmount = Number(tx?.amount)
  const paidCurrency = String(tx?.currency ?? payment.currency)

  if (paidAmount !== payment.amount || paidCurrency !== payment.currency) {
    await admin
      .from('payments')
      .update({
        ...base,
        status: 'pending',
        note: `Amount mismatch: Notch Pay says ${paidAmount} ${paidCurrency}, expected ${payment.amount} ${payment.currency}. Needs manual review.`,
      })
      .eq('id', payment.id)
    return NextResponse.json({ received: true })
  }

  // Check for duplicate payment attempt on already paid or completed orders
  if (payment.order_id) {
    const { data: order } = await admin
      .from('orders')
      .select('status')
      .eq('id', payment.order_id)
      .single()

    if (order && order.status !== 'pending') {
      await admin
        .from('payments')
        .update({
          ...base,
          status: 'needs_refund',
          confirmed_at: new Date().toISOString(),
          note: 'DUPLICATE PAYMENT: order was already paid or closed. Refund this customer.',
        })
        .eq('id', payment.id)
      return NextResponse.json({ received: true })
    }
  }

  // Mark payment successful and execute apply_paid_order database RPC
  const { error: updateError } = await admin
    .from('payments')
    .update({ ...base, status: 'successful', confirmed_at: new Date().toISOString(), note: null })
    .eq('id', payment.id)

  if (updateError) {
    console.error('Could not mark payment successful', updateError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (payment.order_id) {
    const { error: rpcError } = await admin.rpc('apply_paid_order', { p_order_id: payment.order_id })
    if (rpcError) {
      console.error('apply_paid_order failed', rpcError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
