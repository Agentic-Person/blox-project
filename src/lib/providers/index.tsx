'use client'

import { ReactNode } from 'react'
import { AuthProvider } from './auth-provider'
import { WalletProvider, ConnectionProvider } from './wallet-provider'
import { StripeProvider } from './stripe-provider'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ConnectionProvider>
        <WalletProvider>
          <StripeProvider>
            {children}
          </StripeProvider>
        </WalletProvider>
      </ConnectionProvider>
    </AuthProvider>
  )
}

// Re-export hooks for convenience
export { useAuth, useUser, useClerk } from './auth-provider'
export { useWallet, useConnection } from './wallet-provider'
export { useStripe, loadStripe, Elements } from './stripe-provider'