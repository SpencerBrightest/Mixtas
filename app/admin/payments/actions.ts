// Server actions for monitoring payments and manual confirmation via Supabase.

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { paymentConfirmSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

/** Fetches all payment records with linked order and user details. */
export async function getPayments() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      orders (id, order_number, total, status),
      profiles (full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

/** Fetches a single payment by ID with full details including raw payload. */
export async function getPaymentById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      orders (id, order_number, total, status, customer_name),
      profiles (id, full_name, email, phone)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Manually marks a pending payment as successful and updates the linked order. */
export async function confirmPaymentManually(paymentId: string) {
  const { user } = await requireAdmin()
  paymentConfirmSchema.parse({ payment_id: paymentId })

  const supabase = await createClient()
  const now = new Date().toISOString()

  // Fetch the payment to get linked order reference
  const { data: payment, error: fetchErr } = await supabase
    .from('payments')
    .select('order_id, amount, status')
    .eq('id', paymentId)
    .single()

  if (fetchErr) throw new Error(fetchErr.message)
  if (payment.status === 'successful') {
    throw new Error('Payment is already marked as successful')
  }

  // Mark payment as successful with admin confirmation metadata
  const { error: updateErr } = await supabase
    .from('payments')
    .update({
      status: 'successful',
      confirmed_by: user.id,
      confirmed_at: now,
    })
    .eq('id', paymentId)

  if (updateErr) throw new Error(updateErr.message)

  // Update the linked order to paid status
  if (payment.order_id) {
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        updated_at: now,
      })
      .eq('id', payment.order_id)
  }

  revalidatePath('/admin/payments')
  revalidatePath(`/admin/payments/${paymentId}`)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  return { success: true }
}

/** Fetches summary statistics for the payments overview section. */
export async function getPaymentStats() {
  const supabase = await createClient()

  // Total successful payments this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: monthlyPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'successful')
    .gte('created_at', startOfMonth.toISOString())

  const totalReceivedThisMonth = (monthlyPayments || []).reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  )

  // Count pending and failed
  const { count: pendingCount } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: failedCount } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')

  return {
    totalReceivedThisMonth,
    pendingCount: pendingCount ?? 0,
    failedCount: failedCount ?? 0,
  }
}
