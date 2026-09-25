// Server actions for managing orders and updating order status via Supabase.

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { orderStatusSchema, type OrderStatusInput } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

/** Fetches all orders with their items and linked payment status. */
export async function getOrders() {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles (full_name, email, phone),
      order_items (id, product_id, product_name, unit_price, quantity),
      payments (id, status, provider, provider_reference)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

/** Fetches a single order by ID with full item and payment details. */
export async function getOrderById(id: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles (id, full_name, email, phone),
      order_items (id, product_id, product_name, unit_price, quantity),
      payments (id, status, provider, provider_reference, amount, payer_phone, payer_name, confirmed_by, confirmed_at)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Updates an order's status and optionally restocks items on cancellation. */
export async function updateOrderStatus(input: OrderStatusInput) {
  await requireAdmin()
  const validated = orderStatusSchema.parse(input)

  const supabase = await createClient()

  // If cancelling and restocking, increase product stock for each item
  if (validated.status === 'cancelled' && validated.restock_items) {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', validated.order_id)

    if (orderItems) {
      for (const item of orderItems) {
        if (item.product_id) {
          // Fetch current stock then increment
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single()

          if (product) {
            await supabase
              .from('products')
              .update({
                stock: product.stock + item.quantity,
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.product_id)
          }
        }
      }
    }
  }

  // Update the order status
  const { data, error } = await supabase
    .from('orders')
    .update({
      status: validated.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', validated.order_id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${validated.order_id}`)
  revalidatePath('/admin') // refresh overview stats
  return data
}
