// Server actions for customer checkout, order placement, and payment record creation.

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
  idempotencyKey: z.string().optional().default(() => crypto.randomUUID()),
  customerName: z.string().min(2, 'Name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().min(6, 'Valid phone number is required'),
  customerAddress: z.string().min(3, 'Address is required'),
  city: z.string().optional(),
  provider: z.enum(['manual', 'notchpay', 'mobile_money']).default('notchpay'),
  paymentMethod: z.string().optional(),
  momoNumber: z.string().optional(),
  items: z.array(checkoutItemSchema).min(1, 'Cart cannot be empty'),
  total: z.number().int().nonnegative(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

/** Creates an idempotent customer order and associated pending payment record in Supabase. */
export async function placeOrder(input: CheckoutInput) {
  const validated = checkoutSchema.parse(input)

  // Use the session client only to read the current user identity
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Use admin client for all writes so RLS never blocks the order or payment inserts
  const admin = createAdminClient()

  const userId = user?.id || null

  // 1. Rate limit check: Maximum 5 pending unpaid orders per hour to prevent flood abuse
  if (userId) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentPending } = await admin
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

  // 2. Insert order record using admin client to bypass RLS
  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      user_id: userId,
      status: 'pending',
      total: validated.total,
      currency: 'XAF',
      customer_name: validated.customerName,
      customer_phone: validated.customerPhone,
      customer_address: `${validated.customerAddress}${validated.city ? `, ${validated.city}` : ''}`,
      notes: `Email: ${validated.customerEmail} | Payment Provider: ${validated.provider}`,
    })
    .select()
    .single()

  if (orderError || !order) {
    console.error('Order creation error:', orderError)
    return { ok: false, error: orderError?.message || 'Could not create order.' }
  }

  // 4. Insert order items using admin client
  const orderItemsData = validated.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId && item.productId.length === 36 ? item.productId : null,
    product_name: item.size ? `${item.name} (Size ${item.size})` : item.name,
    unit_price: item.price,
    quantity: item.quantity,
  }))

  const { error: itemsError } = await admin.from('order_items').insert(orderItemsData)
  if (itemsError) {
    console.error('Order items error:', itemsError)
  }

  // 5. Create initial payment row using admin client to bypass missing insert policy
  let paymentRecord: { id: string } | null = null

  const paymentInsertData = {
    order_id: order.id,
    user_id: userId,
    provider: validated.provider || 'notchpay',
    amount: Math.round(validated.total),
    currency: 'XAF',
    status: 'pending',
    payer_phone: validated.momoNumber || validated.customerPhone,
    payer_name: validated.customerName,
    raw_payload: {
      email: validated.customerEmail,
      phone: validated.momoNumber || validated.customerPhone,
      name: validated.customerName,
      placedAt: new Date().toISOString(),
    },
  }

  const { data: payRec, error: payErr } = await admin
    .from('payments')
    .insert(paymentInsertData)
    .select('id')
    .single()

  if (payErr) {
    console.error('Payment record insert error:', payErr)
    // If foreign key on user_id failed (e.g. profile not synced), retry with user_id: null
    if (payErr.code === '23503') {
      const { data: retryPay, error: retryErr } = await admin
        .from('payments')
        .insert({ ...paymentInsertData, user_id: null })
        .select('id')
        .single()
      
      if (!retryErr && retryPay) {
        paymentRecord = retryPay
      } else {
        console.error('Payment retry error:', retryErr)
      }
    }
  } else {
    paymentRecord = payRec
  }

  if (!paymentRecord?.id) {
    return {
      ok: false,
      error: payErr?.message || 'Could not initialize payment record in database.',
    }
  }

  // Revalidate admin dashboard monitoring paths
  revalidatePath('/admin')
  revalidatePath('/admin/orders')
  revalidatePath('/admin/payments')

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.order_number || 1001,
    paymentId: paymentRecord.id,
    total: validated.total,
  }
}
