// Supabase clients - enabled for database integration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Debug logging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Supabase Environment Check:')
  console.log('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `✓ (${supabaseUrl.substring(0, 30)}...)` : '✗ MISSING')
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? `✓ (${supabaseAnonKey.substring(0, 20)}...)` : '✗ MISSING')
  console.log('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? `✓ (${supabaseServiceKey.substring(0, 20)}...)` : '✗ MISSING')
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('   Make sure .env.local exists in the project root with:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=...')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=...')
}

// Client-side Supabase client (uses anon key - safe for client)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Server-side client (uses service role key - server only)
// Note: This will be null in client components, use 'supabase' instead
export const supabaseServer = typeof window === 'undefined' && supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null
