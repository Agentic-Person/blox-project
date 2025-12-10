'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/providers/auth-provider'

interface RequireAuthProps {
  children: React.ReactNode
}

/**
 * Auth guard component that protects routes from unauthenticated access.
 * Redirects to /login if user is not authenticated.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect after loading is complete and we confirm no auth
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blox-very-dark-blue">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blox-teal mx-auto"></div>
          <p className="mt-4 text-blox-off-white">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated (redirect is happening)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blox-very-dark-blue">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blox-teal mx-auto"></div>
          <p className="mt-4 text-blox-off-white">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // User is authenticated, render children
  return <>{children}</>
}
