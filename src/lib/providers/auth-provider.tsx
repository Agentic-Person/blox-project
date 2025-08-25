'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  username: string
  discordId?: string
  avatar?: string
  role: 'student' | 'mentor' | 'admin'
  ageRange?: string
  parentEmail?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (provider?: string) => Promise<void>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user for development
const MOCK_USER: User = {
  id: 'mock-user-123',
  email: 'developer@bloxbuddy.com',
  username: 'DevUser',
  discordId: '123456789',
  avatar: '/images/avatars/jimmyWizard.jpg',
  role: 'student',
  ageRange: '13-17'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate authentication check
    const initAuth = async () => {
      setIsLoading(true)
      
      // In development mode, auto-login with mock user
      if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
        setUser(MOCK_USER)
      }
      
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const signIn = async (provider = 'discord') => {
    setIsLoading(true)
    
    // Simulate sign-in process
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      setUser(MOCK_USER)
      console.log(`[Mock Auth] Signed in with ${provider}`)
    } else {
      // TODO: Implement real Clerk authentication
      console.warn('Real authentication not yet implemented')
    }
    
    setIsLoading(false)
  }

  const signOut = async () => {
    setIsLoading(true)
    
    // Simulate sign-out process
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setUser(null)
    console.log('[Mock Auth] Signed out')
    
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
    signIn,
    signOut,
    updateUser
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