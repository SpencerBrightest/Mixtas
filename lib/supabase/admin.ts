// Administrative Supabase client using Service Role key for backend operations bypassing RLS.

import { createClient } from '@supabase/supabase-js'

/** Returns an administrative Supabase client using the service role key. */
export function createAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.')
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.')
  }

  return createClient(
    url,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
