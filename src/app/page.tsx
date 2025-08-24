'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to dashboard after a brief moment
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 1500)

    return () => clearTimeout(timer)
  }, [router])

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
        
        <motion.p 
          className="text-xl text-blox-off-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Free learning and community platform for young Roblox developers
        </motion.p>
        
        <motion.div 
          className="flex items-center justify-center space-x-2 text-blox-teal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading your dashboard...</span>
        </motion.div>
      </motion.div>
    </div>
  )
}