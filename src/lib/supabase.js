import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** @returns {boolean} */
export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let client = null

/** @returns {import('@supabase/supabase-js').SupabaseClient} */
export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey)
  }
  return client
}
