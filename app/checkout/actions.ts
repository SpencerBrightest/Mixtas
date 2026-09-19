// Server actions for customer checkout, order placement, and payment initialization.

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

/** Creates a customer order and associated payment record in Supabase. */
export async function placeOrder(input: CheckoutInput) {
  const validated = checkoutSchema.parse(input)
  const supabase = await createClient()

  // Get current user session if signed in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. Insert order record
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user?.id || null,
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

  if (orderError) {
    console.error('Order creation error:', orderError)
    throw new Error(`Failed to place order: ${orderError.message}`)
  }

  // 2. Insert order items
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

  // 3. Create initial payment record
  const reference = `MOM-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      order_id: order.id,
      user_id: user?.id || null,
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

  return {
    success: true,
    orderId: order.id,
    orderNumber: order.order_number || 1001,
    paymentReference: reference,
    total: validated.total,
  }
}
