import { createClient } from '@supabase/supabase-js'

// Service role key bypasses RLS — required for server-side/Inngest writes.
export const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
