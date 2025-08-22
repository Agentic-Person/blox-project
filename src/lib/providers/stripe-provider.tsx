'use client'

import { createContext, useContext, ReactNode } from 'react'

interface MockStripe {
  elements: () => any
  createPaymentMethod: (options: any) => Promise<any>
  confirmCardPayment: (clientSecret: string, options?: any) => Promise<any>
  redirectToCheckout: (options: any) => Promise<any>
}

interface StripeContextType {
  stripe: MockStripe | null
  isLoading: boolean
}

const StripeContext = createContext<StripeContextType | undefined>(undefined)

// Create mock Stripe instance
const createMockStripe = (): MockStripe => {
  return {
    elements: () => ({
      create: (type: string, options?: any) => {
        console.log(`[Mock Stripe] Creating ${type} element`, options)
        return {
          mount: (selector: string) => {
            console.log(`[Mock Stripe] Mounting element to ${selector}`)
          },
          destroy: () => {
            console.log('[Mock Stripe] Destroying element')
          },
          on: (event: string, handler: Function) => {
            console.log(`[Mock Stripe] Listening to ${event}`)
          }
        }
      }
    }),
    createPaymentMethod: async (options: any) => {
      console.log('[Mock Stripe] Creating payment method:', options)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        paymentMethod: {
          id: `pm_mock_${Date.now()}`,
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242'
          }
        },
        error: null
      }
    },
    confirmCardPayment: async (clientSecret: string, options?: any) => {
      console.log('[Mock Stripe] Confirming payment:', clientSecret, options)
      
      // Simulate payment confirmation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      return {
        paymentIntent: {
          id: `pi_mock_${Date.now()}`,
          status: 'succeeded',
          amount: 1000,
          currency: 'usd'
        },
        error: null
      }
    },
    redirectToCheckout: async (options: any) => {
      console.log('[Mock Stripe] Redirecting to checkout:', options)
      
      // Simulate redirect
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
        alert('Mock Stripe: Would redirect to checkout page')
        return { error: null }
      }
      
      return { error: { message: 'Stripe not configured' } }
    }
  }
}

export function StripeProvider({ children }: { children: ReactNode }) {
  const mockStripe = process.env.NEXT_PUBLIC_DEV_MODE === 'true' ? createMockStripe() : null

  const value: StripeContextType = {
    stripe: mockStripe,
    isLoading: false
  }

  return (
    <StripeContext.Provider value={value}>
      {process.env.NEXT_PUBLIC_DEV_MODE === 'true' && (
        <div className="fixed bottom-4 left-56 bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded z-50">
          Mock Stripe Active
        </div>
      )}
      {children}
    </StripeContext.Provider>
  )
}

export function useStripe() {
  const context = useContext(StripeContext)
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider')
  }
  return context
}

// Mock Elements provider for Stripe
export function Elements({ children }: { children: ReactNode }) {
  return <>{children}</>
}

// Mock loadStripe function
export const loadStripe = (publishableKey: string) => {
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    console.log('[Mock Stripe] Loading with key:', publishableKey?.slice(0, 10) + '...')
    return Promise.resolve(createMockStripe())
  }
  
  console.warn('Real Stripe not configured, using mock')
  return Promise.resolve(null)
}