import { getStripe } from './client'

export interface CheckoutItem {
  price: string
  quantity: number
}

export async function createCheckoutSession(
  items: CheckoutItem[],
  successUrl: string,
  cancelUrl: string
): Promise<string | null> {
  try {
    if (process.env.NEXT_PUBLIC_USE_MOCK_STRIPE === 'true') {
      // Mock checkout in development
      console.log('[Mock Stripe] Creating checkout session:', items)
      return 'mock_session_' + Date.now()
    }

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items,
        successUrl,
        cancelUrl,
      }),
    })

    const { sessionId } = await response.json()
    return sessionId
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return null
  }
}

export async function redirectToCheckout(sessionId: string) {
  const stripe = await getStripe()
  
  if (!stripe) {
    console.log('[Mock Stripe] Would redirect to checkout:', sessionId)
    return
  }

  const { error } = await stripe.redirectToCheckout({ sessionId })
  
  if (error) {
    console.error('Stripe redirect error:', error)
  }
}