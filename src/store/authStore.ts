import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@clerk/nextjs/server'

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      
      setUser: (user: User | null) =>
        set({ user, isLoading: false }),
      
      setLoading: (loading: boolean) =>
        set({ isLoading: loading }),
      
      clearUser: () =>
        set({ user: null, isLoading: false })
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user
      })
    }
  )
)