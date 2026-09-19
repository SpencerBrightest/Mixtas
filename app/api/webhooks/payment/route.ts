// Server-side payment webhook handler for processing Mobile Money and card transaction webhooks.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ParsedPaymentEvent {
  provider: string
  providerReference: string
  orderId?: string
  amount: number
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

    // 1. Record/upsert payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .upsert(
        {
          provider: event.provider,
          provider_reference: event.providerReference,
          order_id: event.orderId || null,
          amount: event.amount,
          status: event.status,
          payer_phone: event.payerPhone,
          payer_name: event.payerName,
          raw_payload: rawBody,
        },
        { onConflict: 'provider_reference' }
      )
      .select()
      .single()

    if (paymentError) {
      console.error('Error recording payment webhook:', paymentError)
    }

    // 2. If payment was successful and linked to an order, verify amount and update order status
    if (event.status === 'successful' && event.orderId) {
      const { data: order } = await supabase
        .from('orders')
        .select('total, status')
        .eq('id', event.orderId)
        .single()

      if (order) {
        // Confirm payment amount matches order total
        if (order.total === event.amount) {
          await supabase
            .from('orders')
            .update({ status: 'paid', updated_at: new Date().toISOString() })
            .eq('id', event.orderId)
        } else {
          console.warn(`Payment amount mismatch for order ${event.orderId}: expected ${order.total}, got ${event.amount}`)
        }
      }
    }

    // Always respond 200 OK quickly so the payment gateway doesn't re-send
    return NextResponse.json({ received: true, status: 'processed' }, { status: 200 })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing exception', details: err.message }, { status: 500 })
  }
}
