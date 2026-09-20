// Server actions for customer checkout, order placement, and payment initialization with idempotency.

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const checkoutItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string(),
  price: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  size: z.string().optional(),
})

const checkoutSchema = z.object({
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
  customerName: z.string().min(2, 'Name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().min(6, 'Valid phone number is required'),
  customerAddress: z.string().min(3, 'Address is required'),
  city: z.string().optional(),
  paymentMethod: z.enum(['mtn_momo', 'orange_money', 'card', 'cash_on_delivery', 'paypal']),
  momoNumber: z.string().optional(),
  items: z.array(checkoutItemSchema).min(1, 'Cart cannot be empty'),
  total: z.number().int().nonnegative(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

/** Creates an idempotent customer order and associated payment record in Supabase. */
export async function placeOrder(input: CheckoutInput) {
  const validated = checkoutSchema.parse(input)
  const supabase = await createClient()

  // Get current user session if signed in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || null

  // 1. Rate limit check: Maximum 5 pending unpaid orders per hour to prevent flood abuse
  if (userId) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentPending } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('created_at', since)

    if ((recentPending ?? 0) >= 5) {
      return {
        ok: false,
        error: 'You have several unpaid orders. Please pay an existing order or wait before creating another.',
      }
    }
  }

  // 2. Idempotency Check: Return existing order if identical key was already submitted
  if (userId && validated.idempotencyKey) {
    const { data: existing } = await supabase
      .from('orders')
      .select('id, order_number, total, payments(id, provider_reference, status)')
      .eq('user_id', userId)
      .eq('idempotency_key', validated.idempotencyKey)
      .maybeSingle()

    if (existing) {
      if (existing.total !== validated.total) {
        return { ok: false, error: 'Your cart changed. Please refresh and try again.' }
      }
      const openPayment = (existing.payments as any[])?.find(
        (p) => p.status === 'pending' || p.status === 'successful'
      )
      return {
        ok: true,
        orderId: existing.id,
        orderNumber: existing.order_number,
        paymentReference: openPayment?.provider_reference,
        total: existing.total,
      }
    }
  }

  // 3. Insert order record with idempotency key
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      idempotency_key: validated.idempotencyKey,
      status: 'pending',
      total: validated.total,
      currency: 'XAF',
      customer_name: validated.customerName,
      customer_phone: validated.customerPhone,
      customer_address: `${validated.customerAddress}${validated.city ? `, ${validated.city}` : ''}`,
      notes: `Email: ${validated.customerEmail} | Payment: ${validated.paymentMethod}`,
    })
    .select()
    .single()

  // Handle unique constraint race condition if twin request won race
  if (orderError?.code === '23505' && userId) {
    const { data: twin } = await supabase
      .from('orders')
      .select('id, order_number, total, payments(id, provider_reference, status)')
      .eq('user_id', userId)
      .eq('idempotency_key', validated.idempotencyKey)
      .single()

    const openPayment = (twin?.payments as any[])?.find(
      (p) => p.status === 'pending' || p.status === 'successful'
    )
    if (twin) {
      return {
        ok: true,
        orderId: twin.id,
        orderNumber: twin.order_number,
        paymentReference: openPayment?.provider_reference,
        total: twin.total,
      }
    }
  }

  if (orderError || !order) {
    console.error('Order creation error:', orderError)
    return { ok: false, error: orderError?.message || 'Could not create order.' }
  }

  // 4. Insert order items
  const orderItemsData = validated.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId && item.productId.length === 36 ? item.productId : null,
    product_name: item.size ? `${item.name} (Size ${item.size})` : item.name,
    unit_price: item.price,
    quantity: item.quantity,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData)
  if (itemsError) {
    console.error('Order items error:', itemsError)
  }

  // 5. Create initial payment record
  const reference = `MOM-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      order_id: order.id,
      user_id: userId,
      provider: validated.paymentMethod,
      provider_reference: reference,
      amount: validated.total,
      currency: 'XAF',
      status: 'pending',
      payer_phone: validated.momoNumber || validated.customerPhone,
      payer_name: validated.customerName,
      raw_payload: {
        channel: validated.paymentMethod,
        email: validated.customerEmail,
        placedAt: new Date().toISOString(),
      },
    })
    .select()
    .single()

  if (paymentError) {
    console.error('Payment record error:', paymentError)
  }

  // Revalidate dashboard routes
  revalidatePath('/admin')
  revalidatePath('/admin/orders')
  revalidatePath('/admin/payments')

  try {
    const { logSupabaseActivity } = await import('@/supabase/activity-logger')
    logSupabaseActivity('ACTION', `Order #${order.order_number || 1001} placed successfully`, {
      orderId: order.id,
      customerName: validated.customerName,
      total: validated.total,
      paymentMethod: validated.paymentMethod,
    })
  } catch {}

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.order_number || 1001,
    paymentReference: reference,
    total: validated.total,
  }
}
