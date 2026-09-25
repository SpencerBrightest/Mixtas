// Public cacheable Supabase client without cookies for public SEO component queries.

import { createClient } from '@supabase/supabase-js'

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

if (!url || !key) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
}

export const supabasePublic = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})
