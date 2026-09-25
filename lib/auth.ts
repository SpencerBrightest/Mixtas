// Server-side authentication guard for verifying administrator privileges.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Verifies that the current user has an active session and an admin role in profiles. */
export async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const userId = user.id

  // Fetch profile to verify admin role permission
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !profile || profile.role !== 'admin') {
    redirect('/')
  }

  return { user, profile }
}

/** Verifies that the current user has an active session and returns the user object and supabase client. */
export async function requireUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  return { supabase, user }
}
