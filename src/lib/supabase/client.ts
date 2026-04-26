import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

let _supabase: ReturnType<typeof createClient<Database>> | null = null

export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, prop) {
    if (!_supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          'Missing Supabase environment variables. Please check your .env.local file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
        )
      }
      _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
    }
    return (_supabase as any)[prop]
  }
})