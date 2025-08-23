import { supabase } from './client'

export async function signInWithDiscord() {
  if (!supabase) {
    console.log('[Mock Auth] Sign in with Discord')
    return { data: null, error: null }
  }

  return await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}

export async function signOut() {
  if (!supabase) {
    console.log('[Mock Auth] Sign out')
    return { error: null }
  }

  return await supabase.auth.signOut()
}

export async function getSession() {
  if (!supabase) {
    return { data: { session: null }, error: null }
  }

  return await supabase.auth.getSession()
}

export async function getUser() {
  if (!supabase) {
    return { data: { user: null }, error: null }
  }

  return await supabase.auth.getUser()
}