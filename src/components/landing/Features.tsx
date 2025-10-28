'use client'

import { motion } from 'framer-motion'
import {
  Bot,
  BookOpen,
  Users,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Code,
  Calendar
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Bot,
    title: 'Blox Wizard AI',
    description: 'Your personal AI assistant that helps you learn, organizes your workflow, and answers questions 24/7',
    gradient: 'from-blox-teal/20 to-blox-teal-dark/20',
    iconColor: 'text-blox-teal'
  },
  {
    icon: BookOpen,
    title: '6-Month Learning Journey',
    description: 'Structured curriculum with curated YouTube tutorials taking you from beginner to confident Roblox developer',
    gradient: 'from-blox-purple/20 to-blox-purple-dark/20',
    iconColor: 'text-blox-purple'
  },
  {
    icon: Users,
    title: 'Team Formation',
    description: 'Find teammates, collaborate on projects, and build amazing games together with other young developers',
    gradient: 'from-blox-teal-light/20 to-blox-teal/20',
    iconColor: 'text-blox-teal-light'
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description: 'Track your learning milestones, earn achievements, and see your skills grow with detailed analytics',
    gradient: 'from-blox-purple-light/20 to-blox-purple/20',
    iconColor: 'text-blox-purple-light'
  },
  {
    icon: MessageSquare,
    title: 'Interactive Learning',
    description: 'Chat with video content, get timestamps, ask questions, and learn at your own pace with AI assistance',
    gradient: 'from-blox-teal/20 to-blox-purple/20',
    iconColor: 'text-blox-teal'
  },
  {
    icon: Code,
    title: 'Code Assistant',
    description: 'Get help debugging scripts, learn best practices, and receive personalized coding guidance',
    gradient: 'from-blox-purple/20 to-blox-teal/20',
    iconColor: 'text-blox-purple'
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Plan your learning sessions, set goals, and stay organized with built-in calendar and todo features',
    gradient: 'from-blox-teal-dark/20 to-blox-teal-light/20',
    iconColor: 'text-blox-teal-dark'
  },
  {
    icon: Sparkles,
    title: '100% Free',
    description: 'Complete access to all features, forever. No hidden fees, no premium tiers. Just pure learning.',
    gradient: 'from-blox-teal-light/20 to-blox-purple-light/20',
    iconColor: 'text-blox-teal-light'
  }
]

export function Features() {
  return (
    <section className="relative py-20 px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blox-second-dark-blue/30 to-transparent" />

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-blox-white mb-4">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-blox-teal to-blox-purple bg-clip-text text-transparent">
              succeed
            </span>
          </h2>
          <p className="text-xl text-blox-off-white/80 max-w-2xl mx-auto">
            Built specifically for young Roblox developers aged 10-25
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="h-full bg-blox-black-blue/50 border-blox-glass-border/30 hover:border-blox-teal/30
                hover:bg-blox-black-blue/70 transition-all duration-300 backdrop-blur-sm group">
                <CardContent className="p-6">
                  {/* Icon */}
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient}
                      border border-blox-glass-border/20 mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-blox-white mb-2">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-blox-off-white/70 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-lg text-blox-off-white/80 mb-6">
            Ready to start your Roblox development journey?
          </p>
          <a
            href="/signup"
            className="inline-flex items-center text-blox-teal hover:text-blox-teal-light
              font-semibold text-lg transition-colors duration-300"
          >
            Create your free account
            <Sparkles className="ml-2 h-5 w-5" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
