import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    
    if (process.env.NEXT_PUBLIC_USE_MOCK_STRIPE === 'true' || !key) {
      // Return mock Stripe in development
      stripePromise = Promise.resolve(null)
    } else {
      stripePromise = loadStripe(key)
    }
  }
  
  return stripePromise
}