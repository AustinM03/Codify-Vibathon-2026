import { createClient } from '@supabase/supabase-js'

// Service role key bypasses RLS — required for server-side/Inngest writes.
// VITE_ prefix vars are set for the frontend build; SUPABASE_URL is the server-side fallback.
export const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)
