'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  comingSoon?: string
  highlight?: boolean
}

interface TeamFeaturePreviewProps {
  features: Feature[]
}

export default function TeamFeaturePreview({ features }: TeamFeaturePreviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => {
        const Icon = feature.icon
        return (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`
              glass-card h-full
              ${feature.highlight ? 'border-blox-purple shadow-lg shadow-blox-purple/20' : ''}
              hover:shadow-teal-glow transition-all duration-300
            `}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center
                    ${feature.highlight 
                      ? 'bg-gradient-to-r from-blox-purple to-blox-purple-dark' 
                      : 'bg-blox-glass-teal backdrop-blur-sm'
                    }
                  `}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    {feature.comingSoon && (
                      <div className="mt-1">
                        <span className="text-xs text-blox-purple font-medium">
                          {feature.comingSoon}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-blox-off-white">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}