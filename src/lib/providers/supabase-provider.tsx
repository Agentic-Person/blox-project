'use client'

import { createContext, useContext, ReactNode } from 'react'

// Mock Supabase client interface
interface MockSupabaseClient {
  from: (table: string) => any
  auth: {
    getSession: () => Promise<any>
    signInWithOAuth: (options: any) => Promise<any>
    signOut: () => Promise<any>
  }
  storage: {
    from: (bucket: string) => any
  }
  realtime: {
    channel: (name: string) => any
  }
}

interface SupabaseContextType {
  supabase: MockSupabaseClient
  isReady: boolean
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

// Mock data store
const MOCK_DATABASE: Record<string, any[]> = {
  users: [],
  teams: [
    { id: '1', name: 'Alpha Builders', members: 3, recruiting: true },
    { id: '2', name: 'Code Wizards', members: 4, recruiting: false }
  ],
  content_items: [
    { id: '1', title: 'Introduction to Roblox Studio', videoId: 'abc123', duration: 600 },
    { id: '2', title: 'Basic Scripting', videoId: 'def456', duration: 900 }
  ],
  learning_progress: []
}

// Create mock Supabase client
const createMockSupabaseClient = (): MockSupabaseClient => {
  return {
    from: (table: string) => ({
      select: (columns = '*') => ({
        data: null,
        error: null,
        then: (callback: Function) => {
          const data = MOCK_DATABASE[table] || []
          console.log(`[Mock Supabase] SELECT from ${table}:`, data)
          callback({ data, error: null })
          return Promise.resolve({ data, error: null })
        }
      }),
      insert: (data: any) => ({
        then: (callback: Function) => {
          if (!MOCK_DATABASE[table]) MOCK_DATABASE[table] = []
          const newData = Array.isArray(data) ? data : [data]
          MOCK_DATABASE[table].push(...newData)
          console.log(`[Mock Supabase] INSERT into ${table}:`, newData)
          callback({ data: newData, error: null })
          return Promise.resolve({ data: newData, error: null })
        }
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          then: (callback: Function) => {
            console.log(`[Mock Supabase] UPDATE ${table} where ${column}=${value}`)
            callback({ data: [data], error: null })
            return Promise.resolve({ data: [data], error: null })
          }
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          then: (callback: Function) => {
            console.log(`[Mock Supabase] DELETE from ${table} where ${column}=${value}`)
            callback({ data: [], error: null })
            return Promise.resolve({ data: [], error: null })
          }
        })
      })
    }),
    auth: {
      getSession: async () => {
        console.log('[Mock Supabase] Getting session')
        return { data: { session: null }, error: null }
      },
      signInWithOAuth: async (options: any) => {
        console.log('[Mock Supabase] OAuth sign in:', options)
        return { data: { url: '#' }, error: null }
      },
      signOut: async () => {
        console.log('[Mock Supabase] Sign out')
        return { error: null }
      }
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: any) => {
          console.log(`[Mock Supabase] Upload to ${bucket}/${path}`)
          return { data: { path }, error: null }
        },
        download: async (path: string) => {
          console.log(`[Mock Supabase] Download from ${bucket}/${path}`)
          return { data: new Blob(), error: null }
        },
        getPublicUrl: (path: string) => {
          const url = `https://mock-storage.supabase.co/${bucket}/${path}`
          console.log(`[Mock Supabase] Public URL: ${url}`)
          return { data: { publicUrl: url } }
        }
      })
    },
    realtime: {
      channel: (name: string) => ({
        on: (event: string, callback: Function) => {
          console.log(`[Mock Supabase] Realtime subscription: ${name} - ${event}`)
          return { subscribe: () => console.log(`[Mock Supabase] Subscribed to ${name}`) }
        }
      })
    }
  }
}

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const mockClient = createMockSupabaseClient()

  const value: SupabaseContextType = {
    supabase: mockClient,
    isReady: true
  }

  return (
    <SupabaseContext.Provider value={value}>
      {process.env.NEXT_PUBLIC_DEV_MODE === 'true' && (
        <div className="fixed bottom-4 left-4 bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded z-50">
          Mock Supabase Active
        </div>
      )}
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

// Export mock client creator for server-side usage
export const createClient = () => {
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    return createMockSupabaseClient()
  }
  // TODO: Return real Supabase client when ready
  console.warn('Real Supabase client not configured, using mock')
  return createMockSupabaseClient()
}