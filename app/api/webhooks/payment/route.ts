// Server-side payment webhook handler for processing Mobile Money and card transaction webhooks.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ParsedPaymentEvent {
  provider: string
  providerReference: string
  orderId?: string
  amount: number
  currency?: string
  status: 'successful' | 'failed' | 'pending' | 'refunded'
  payerPhone?: string
  payerName?: string
}

/** Parses payment payload into a standardized event format across providers. */
function parsePaymentEvent(body: any, headers: Headers): ParsedPaymentEvent | null {
  // Check for Flutterwave format
  if (body?.event || body?.data?.tx_ref) {
    const data = body.data || body
    return {
      provider: 'flutterwave',
      providerReference: String(data.flw_ref || data.tx_ref || data.id),
      orderId: data.meta?.order_id || data.tx_ref,
      amount: Number(data.amount || 0),
      currency: data.currency || 'XAF',
      status: data.status === 'successful' ? 'successful' : 'failed',
      payerPhone: data.customer?.phone_number || '',
      payerName: data.customer?.name || '',
    }
  }

  // Check for CamPay / MTN MoMo direct webhook format
  if (body?.external_reference || body?.financialTransactionId) {
    return {
      provider: body.operator || 'mtn_momo',
      providerReference: String(body.financialTransactionId || body.reference || body.external_reference),
      orderId: body.external_reference,
      amount: Number(body.amount || 0),
      currency: body.currency || 'XAF',
      status: body.status === 'SUCCESSFUL' || body.status === 'SUCCESS' ? 'successful' : 'failed',
      payerPhone: body.payer_phone_number || body.phoneNumber || '',
      payerName: body.payer_name || '',
    }
  }

  // Fallback default parser
  if (body?.reference) {
    return {
      provider: body.provider || 'manual',
      providerReference: String(body.reference),
      orderId: body.order_id,
      amount: Number(body.amount || 0),
      currency: body.currency || 'XAF',
      status: body.status === 'successful' || body.status === 'paid' ? 'successful' : 'pending',
      payerPhone: body.phone,
      payerName: body.name,
    }
  }

  return null
}

/** Receives and validates payment webhooks from Mobile Money and card providers. */
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret') || req.headers.get('verif-hash')
    const configuredSecret = process.env.PAYMENT_WEBHOOK_SECRET

    // Verify webhook signature header
    if (configuredSecret && secret !== configuredSecret) {
      return NextResponse.json({ error: 'Invalid webhook signature secret' }, { status: 401 })
    }

    const rawBody = await req.json()
    const event = parsePaymentEvent(rawBody, req.headers)

    if (!event || !event.providerReference) {
      return NextResponse.json({ error: 'Unrecognized webhook payload structure' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Check if linked order exists and its current status
    let linkedOrder: { id: string; user_id: string | null; total: number; status: string } | null = null
    if (event.orderId) {
      const { data: orderData } = await supabase
        .from('orders')
        .select('id, user_id, total, status')
        .eq('id', event.orderId)
        .maybeSingle()
      linkedOrder = orderData
    }

    // Check if payment with this provider reference already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('provider_reference', event.providerReference)
      .maybeSingle()

    // 2. Duplicate Payment Protection:
    // If order is ALREADY paid and this is a NEW different successful transaction: flag for refund
    if (!existingPayment && linkedOrder && linkedOrder.status !== 'pending' && event.status === 'successful') {
      await supabase.from('payments').insert({
        provider: event.provider,
        provider_reference: event.providerReference,
        order_id: linkedOrder.id,
        user_id: linkedOrder.user_id,
        amount: event.amount,
        currency: event.currency || 'XAF',
        status: 'needs_refund',
        payer_phone: event.payerPhone ?? null,
        payer_name: event.payerName ?? null,
        raw_payload: rawBody,
      })
      return NextResponse.json({ received: true, note: 'duplicate_flagged_for_refund' }, { status: 200 })
    }

    // 3. Record/upsert payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .upsert(
        {
          provider: event.provider,
          provider_reference: event.providerReference,
          order_id: linkedOrder?.id || event.orderId || null,
          user_id: linkedOrder?.user_id || null,
          amount: event.amount,
          currency: event.currency || 'XAF',
          status: event.status,
          payer_phone: event.payerPhone,
          payer_name: event.payerName,
          raw_payload: rawBody,
        },
        { onConflict: 'provider_reference' }
      )

    if (paymentError) {
      console.error('Error recording payment webhook:', paymentError)
    }

    // 4. Update order to paid status if payment successful and amount matches
    if (event.status === 'successful' && linkedOrder && linkedOrder.status === 'pending') {
      if (linkedOrder.total === event.amount) {
        await supabase
          .from('orders')
          .update({ status: 'paid', updated_at: new Date().toISOString() })
          .eq('id', linkedOrder.id)
      } else {
        console.warn(`Payment amount mismatch for order ${linkedOrder.id}: expected ${linkedOrder.total}, got ${event.amount}`)
      }
    }

    // Always respond 200 OK quickly so the payment gateway doesn't retry forever
    return NextResponse.json({ received: true, status: 'processed' }, { status: 200 })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing exception', details: err.message }, { status: 500 })
  }
}
