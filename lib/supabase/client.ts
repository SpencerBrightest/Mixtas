// Creates browser-side Supabase client for client-side authentication and queries.

import { createBrowserClient } from '@supabase/ssr'

/** Returns a Supabase client instance for browser execution. */
export function createClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

  return createBrowserClient(url, key)
}
