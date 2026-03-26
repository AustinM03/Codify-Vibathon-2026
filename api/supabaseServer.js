import { createClient } from '@supabase/supabase-js'

// Service role key bypasses RLS — required for server-side/Inngest writes.
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set — server-side writes will fail due to RLS.')
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey || process.env.VITE_SUPABASE_ANON_KEY
)
