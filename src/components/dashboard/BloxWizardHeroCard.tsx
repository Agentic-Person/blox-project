'use client'

import { motion } from 'framer-motion'
import { Bot, FolderOpen, Search, Video, MessageSquare, Code, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface BloxWizardHeroCardProps {
  // No props needed anymore
}

const features = [
  {
    icon: FolderOpen,
    title: 'Workflow Organization',
    description: 'Keep your projects and tasks perfectly organized'
  },
  {
    icon: Search,
    title: 'Tutorial Discovery',
    description: 'Find the exact tutorials you need, when you need them'
  },
  {
    icon: Video,
    title: 'Video Search',
    description: 'Search through our entire curated YouTube library instantly'
  },
  {
    icon: MessageSquare,
    title: 'Interactive Learning',
    description: 'Chat with any video to get timestamps and explanations'
  },
  {
    icon: Code,
    title: 'Code Assistant',
    description: 'Get help with scripts, debug issues, and learn best practices'
  },
  {
    icon: Bot,
    title: 'Smart Learning',
    description: 'Personalized guidance based on your progress'
  }
]

export function BloxWizardHeroCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mb-6"
    >
      <Card className="relative overflow-hidden border border-blox-glass-border bg-gradient-to-br from-blox-black-blue/80 to-blox-very-dark-blue/80 backdrop-blur-lg">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blox-teal/10 via-transparent to-blox-purple/10" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blox-teal/20 to-blox-purple/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-to-tr from-blox-purple/30 to-blox-teal/20 rounded-full blur-2xl" />
        
        <CardContent className="relative p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            {/* Left Column - Hero Content */}
            <div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="flex items-center gap-4 mb-6"
              >
                <div className="p-4 bg-gradient-to-br from-blox-teal/20 to-blox-purple/20 rounded-full border border-blox-teal/30">
                  <Bot className="h-8 w-8 text-blox-teal" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-blox-white mb-1">
                    Blox Wizard
                  </h1>
                  <p className="text-lg text-blox-teal font-medium">
                    Super-powered assistant for organization
                  </p>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-blox-off-white/80 mb-8 leading-relaxed"
              >
                Your AI companion for workflow organization, tutorial discovery, and interactive learning. 
                Search videos, chat with content, and get personalized development assistance.
              </motion.p>

              {/* Action Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link href="/blox-wizard">
                  <Button
                    className="bg-gradient-to-r from-blox-teal to-blox-teal-dark hover:from-blox-teal-dark hover:to-blox-teal
                      px-6 py-3 text-lg font-semibold text-white border-0 hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                  >
                    Start Chatting
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Right Column - Features Grid */}
            <div>
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg font-semibold text-blox-white mb-6 text-center lg:text-left"
              >
                What can Blox Wizard do?
              </motion.h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="group p-4 bg-blox-second-dark-blue/40 rounded-xl border border-blox-glass-border/30 
                      hover:border-blox-teal/30 hover:bg-blox-second-dark-blue/60 transition-all duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gradient-to-br from-blox-teal/20 to-blox-purple/20 rounded-lg 
                        group-hover:from-blox-teal/30 group-hover:to-blox-purple/30 transition-all duration-300">
                        <feature.icon className="h-4 w-4 text-blox-teal" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-blox-white text-sm mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-xs text-blox-off-white/70 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}