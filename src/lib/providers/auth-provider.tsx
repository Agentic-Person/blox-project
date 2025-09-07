'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'

interface User {
  id: string
  email: string
  username: string
  discordId?: string
  avatar?: string
  role: 'student' | 'mentor' | 'admin'
  ageRange?: string
  parentEmail?: string
  // Admin-specific fields
  adminRole?: 'super_admin' | 'admin' | 'moderator'
  adminPermissions?: Record<string, boolean>
  isAdminActive?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  adminRole: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  checkAdminStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const supabase = createClientComponentClient()

  // Function to check admin status in Supabase
  const checkAdminStatus = async (userId: string) => {
    try {
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (adminData) {
        return {
          adminRole: adminData.role as 'super_admin' | 'admin' | 'moderator',
          adminPermissions: adminData.permissions || {},
          isAdminActive: adminData.is_active
        }
      }
      return null
    } catch (error) {
      console.error('Error checking admin status:', error)
      return null
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      setSession(initialSession)
      
      if (initialSession?.user) {
        // Check admin status
        const adminStatus = await checkAdminStatus(initialSession.user.id)
        
        setUser({
          id: initialSession.user.id,
          email: initialSession.user.email || '',
          username: initialSession.user.user_metadata?.full_name || initialSession.user.email?.split('@')[0] || 'User',
          avatar: initialSession.user.user_metadata?.avatar_url,
          role: adminStatus ? 'admin' : 'student',
          adminRole: adminStatus?.adminRole,
          adminPermissions: adminStatus?.adminPermissions,
          isAdminActive: adminStatus?.isAdminActive
        })
      }
      
      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        
        if (session?.user) {
          const adminStatus = await checkAdminStatus(session.user.id)
          
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            avatar: session.user.user_metadata?.avatar_url,
            role: adminStatus ? 'admin' : 'student',
            adminRole: adminStatus?.adminRole,
            adminPermissions: adminStatus?.adminPermissions,
            isAdminActive: adminStatus?.isAdminActive
          })
        } else {
          setUser(null)
        }
        
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('Sign in error:', error)
        setIsLoading(false)
        throw error
      }
      // Loading will be set to false by the auth state change listener
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
    
    setIsLoading(false)
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates })
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: !!(user?.role === 'admin' || user?.adminRole),
    adminRole: user?.adminRole || null,
    signIn,
    signOut,
    updateUser,
    checkAdminStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Mock Clerk hooks for compatibility
export function useUser() {
  const { user, isLoading } = useAuth()
  return { user, isLoaded: !isLoading, isSignedIn: !!user }
}

export function useClerk() {
  const { signIn, signOut } = useAuth()
  return { 
    signIn: () => signIn('discord'),
    signOut,
    openSignIn: () => signIn('discord'),
    openSignUp: () => signIn('discord')
  }
}