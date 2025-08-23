import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true'
  ? null // Use mock provider instead
  : createClient<Database>(supabaseUrl, supabaseAnonKey)