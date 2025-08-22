'use client'

import { ReactNode } from 'react'
import { AuthProvider } from './auth-provider'
import { SupabaseProvider } from './supabase-provider'
import { WalletProvider, ConnectionProvider } from './wallet-provider'
import { StripeProvider } from './stripe-provider'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  const useMockAuth = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'
  const useMockSupabase = process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true'
  const useMockWallet = process.env.NEXT_PUBLIC_USE_MOCK_WALLET === 'true'
  const useMockStripe = process.env.NEXT_PUBLIC_USE_MOCK_STRIPE === 'true'

  // Show development mode indicator
  const showDevIndicator = isDev && (useMockAuth || useMockSupabase || useMockWallet || useMockStripe)

  return (
    <AuthProvider>
      <SupabaseProvider>
        <ConnectionProvider>
          <WalletProvider>
            <StripeProvider>
              {showDevIndicator && (
                <div className="fixed top-4 right-4 bg-blue-500/20 text-blue-400 text-xs px-3 py-1.5 rounded-md z-50 backdrop-blur-sm border border-blue-500/30">
                  🔧 Development Mode
                </div>
              )}
              {children}
            </StripeProvider>
          </WalletProvider>
        </ConnectionProvider>
      </SupabaseProvider>
    </AuthProvider>
  )
}

// Re-export hooks for convenience
export { useAuth, useUser, useClerk } from './auth-provider'
export { useSupabase, createClient } from './supabase-provider'
export { useWallet, useConnection } from './wallet-provider'
export { useStripe, loadStripe, Elements } from './stripe-provider'