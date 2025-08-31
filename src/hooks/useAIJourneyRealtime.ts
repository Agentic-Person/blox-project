import { useEffect, useRef } from 'react'
import { useAIJourneyStore } from '@/store/aiJourneyStore'
import { aiJourneyAPI, aiJourneySubscriptions } from '@/lib/api/aiJourney'
import type { RealtimePayload } from '@/types/supabase-ai-journey'

export const useAIJourneyRealtime = () => {
  const { 
    journey, 
    userId, 
    syncEnabled, 
    setJourney, 
    initializeFromDatabase 
  } = useAIJourneyStore()
  
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const isSubscribed = useRef(false)

  useEffect(() => {
    // Only setup realtime if user is logged in, sync is enabled, and we have a journey
    if (!userId || !syncEnabled || !journey || isSubscribed.current) {
      return
    }

    console.log('Setting up realtime subscription for journey:', journey.id)

    // Subscribe to journey changes
    const setupSubscription = async () => {
      try {
        const subscription = aiJourneySubscriptions.subscribeToJourney(
          journey.id,
          (payload: RealtimePayload) => {
            console.log('Realtime update received:', payload.eventType, payload)
            
            switch (payload.eventType) {
              case 'UPDATE':
                if (payload.new) {
                  // Refresh journey data from database
                  initializeFromDatabase()
                }
                break
                
              case 'INSERT':
                // Handle new related records (skills, insights, etc.)
                console.log('New record inserted:', payload.new)
                break
                
              case 'DELETE':
                console.log('Record deleted:', payload.old)
                break
            }
          }
        )

        subscriptionRef.current = subscription
        isSubscribed.current = true
        console.log('Realtime subscription established')
        
      } catch (error) {
        console.error('Failed to setup realtime subscription:', error)
      }
    }

    setupSubscription()

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      if (subscriptionRef.current) {
        console.log('Cleaning up realtime subscription')
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
        isSubscribed.current = false
      }
    }
  }, [userId, syncEnabled, journey?.id, initializeFromDatabase])

  // Cleanup subscription when user logs out or sync is disabled
  useEffect(() => {
    if ((!userId || !syncEnabled) && subscriptionRef.current) {
      console.log('Cleaning up realtime subscription due to auth/sync change')
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
      isSubscribed.current = false
    }
  }, [userId, syncEnabled])

  return {
    isSubscribed: isSubscribed.current,
    hasActiveSubscription: !!subscriptionRef.current
  }
}