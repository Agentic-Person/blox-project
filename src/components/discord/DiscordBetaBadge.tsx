'use client'

import { motion } from 'framer-motion'
import { Hash, Zap } from 'lucide-react'

interface DiscordBetaBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'boost'
}

export default function DiscordBetaBadge({ size = 'md', variant = 'default' }: DiscordBetaBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  }

  const Icon = variant === 'boost' ? Zap : Hash

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="inline-block relative"
    >
      <div className={`
        ${sizeClasses[size]}
        ${variant === 'boost' 
          ? 'bg-gradient-to-r from-[#ff73fa] to-[#ffc0cb]' 
          : 'bg-gradient-to-r from-[#5865F2] to-[#7289DA]'
        }
        text-white font-bold rounded-full
        flex items-center gap-1.5
        shadow-lg ${variant === 'boost' ? 'shadow-pink-500/30' : 'shadow-[#5865F2]/30'}
        relative overflow-hidden
      `}>
        <Icon className={size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />
        <span>Beta</span>
        
        {/* Animated shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 3
          }}
        />
      </div>
      
      {/* Glow effect */}
      <div className={`
        absolute inset-0 rounded-full blur-xl opacity-50
        ${variant === 'boost' 
          ? 'bg-gradient-to-r from-[#ff73fa] to-[#ffc0cb]' 
          : 'bg-gradient-to-r from-[#5865F2] to-[#7289DA]'
        }
      `} />
    </motion.div>
  )
}