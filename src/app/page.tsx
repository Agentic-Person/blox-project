'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/providers/auth-provider'
import { LandingPage } from '@/components/landing/LandingPage'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function RootPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return

    // If user is authenticated, redirect to dashboard
    if (user) {
      router.push('/dashboard')
      return
    }

    // User is not authenticated, show landing page
    setIsChecking(false)
  }, [user, isLoading, router])

  // Show loading state while checking authentication
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blox-very-dark-blue via-blox-dark-blue to-blox-very-dark-blue flex items-center justify-center">
        <motion.div
          className="text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1
            className="text-7xl font-bold bg-gradient-to-r from-blox-teal to-blox-purple bg-clip-text text-transparent"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            BLOX BUDDY
          </motion.h1>

          <motion.div
            className="flex items-center justify-center space-x-2 text-blox-teal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading...</span>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // User is not authenticated, show landing page
  return <LandingPage />
}