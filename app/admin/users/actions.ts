// Server actions for managing user accounts and role assignments via Supabase.

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { userRoleSchema, type UserRoleInput } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

/** Fetches all user profiles with order counts and total spend. */
export async function getUsers() {
  await requireAdmin()
  const supabase = await createClient()
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  // Enrich each user with order count and total spend from the orders table
  const enriched = await Promise.all(
    (profiles || []).map(async (profile) => {
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)

      const { data: spendData } = await supabase
        .from('orders')
        .select('total')
        .eq('user_id', profile.id)
        .in('status', ['paid', 'processing', 'completed'])

      const totalSpent = (spendData || []).reduce(
        (sum, o) => sum + (o.total || 0),
        0
      )

      return {
        ...profile,
        orders_count: ordersCount ?? 0,
        total_spent: totalSpent,
      }
    })
  )

  return enriched
}

/** Fetches a single user profile by ID with their orders and payments. */
export async function getUserById(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)

  // Fetch user's orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(id, product_name, unit_price, quantity)')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  // Fetch user's payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*, orders(order_number)')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  // Calculate lifetime spend
  const totalSpent = (orders || [])
    .filter((o) => ['paid', 'processing', 'completed'].includes(o.status))
    .reduce((sum, o) => sum + (o.total || 0), 0)

  return {
    profile,
    orders: orders || [],
    payments: payments || [],
    totalSpent,
  }
}

/** Changes a user's role between customer and admin. Cannot demote yourself. */
export async function updateUserRole(input: UserRoleInput) {
  const { user: currentAdmin } = await requireAdmin()
  const validated = userRoleSchema.parse(input)

  // Prevent the current admin from demoting themselves
  if (validated.user_id === currentAdmin.id && validated.role === 'customer') {
    throw new Error('You cannot demote your own admin account')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: validated.role })
    .eq('id', validated.user_id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${validated.user_id}`)
  return data
}
