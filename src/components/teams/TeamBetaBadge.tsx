'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface TeamBetaBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  showPulse?: boolean
}

export default function TeamBetaBadge({ size = 'md', showPulse = true }: TeamBetaBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-block relative"
    >
      <div className={`
        ${sizeClasses[size]}
        bg-gradient-to-r from-blox-purple to-blox-purple-dark
        text-white font-semibold rounded-full
        flex items-center gap-1.5
        shadow-lg shadow-blox-purple/20
        ${showPulse ? 'animate-pulse-slow' : ''}
      `}>
        <Sparkles className={size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />
        <span>Beta</span>
      </div>
      {showPulse && (
        <div className="absolute inset-0 bg-gradient-to-r from-blox-purple to-blox-purple-dark rounded-full blur-xl opacity-40 animate-pulse-slow" />
      )}
    </motion.div>
  )
}