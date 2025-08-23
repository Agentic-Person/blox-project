'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface DiscordFeature {
  icon: LucideIcon
  title: string
  description: string
  status?: 'live' | 'coming-soon' | 'planned'
  highlight?: boolean
}

interface DiscordFeatureCardProps {
  features: DiscordFeature[]
}

export default function DiscordFeatureCard({ features }: DiscordFeatureCardProps) {
  const statusColors = {
    'live': 'bg-green-500',
    'coming-soon': 'bg-[#5865F2]',
    'planned': 'bg-gray-500'
  }

  const statusLabels = {
    'live': 'Live',
    'coming-soon': 'Coming Soon',
    'planned': 'Planned'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {features.map((feature, index) => {
        const Icon = feature.icon
        return (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <Card className={`
              h-full bg-[#2B2D31] border-[#1E1F22] 
              ${feature.highlight ? 'ring-2 ring-[#5865F2] shadow-lg shadow-[#5865F2]/20' : ''}
              hover:border-[#5865F2]/50 transition-all duration-300
              overflow-hidden relative group
            `}>
              {/* Discord-style gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${feature.highlight 
                      ? 'bg-gradient-to-r from-[#5865F2] to-[#7289DA]' 
                      : 'bg-[#404249]'
                    }
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  
                  {feature.status && (
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${statusColors[feature.status]} animate-pulse`} />
                      <span className="text-xs text-[#949BA4]">
                        {statusLabels[feature.status]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#5865F2] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#949BA4] leading-relaxed">
                  {feature.description}
                </p>

                {/* Discord-style hover effect */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5865F2] to-[#7289DA]"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}