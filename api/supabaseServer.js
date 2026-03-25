import { createClient } from '@supabase/supabase-js'

// Uses anon key with permissive RLS policies — no service role key needed.
// VITE_ prefix env vars are available server-side via dotenv / Vercel.
export const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)
