'use client'

import { motion } from 'framer-motion'
import { PlayCircle, Clock, Zap } from 'lucide-react'
import { fadeInUp } from '@/styles/animations'

interface ContinueLearningProps {
  currentModule: {
    id: string
    title: string
    description: string
    progress: number
    timeRemaining: string
    xpToEarn: number
    week: number
  }
}

export function ContinueLearning({ currentModule }: ContinueLearningProps) {
  return (
    <motion.div 
      className="glass-card p-4 pb-6 rounded-xl"
      variants={fadeInUp}
      initial="initial"
      animate="animate"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="heading-secondary">Continue Learning</h2>
        <PlayCircle className="w-5 h-5 text-blox-teal animate-pulse" />
      </div>
      <div className="space-y-2.5">
        <h3 className="text-blox-teal font-semibold">{currentModule.title}</h3>
        <p className="text-sm text-blox-medium-blue-gray">{currentModule.description} • Week {currentModule.week}</p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blox-off-white">
            <Clock className="w-4 h-4 inline mr-1" />
            {currentModule.timeRemaining}
          </span>
          <span className="xp-badge">+{currentModule.xpToEarn} XP</span>
          <button className="btn-primary text-sm px-4 py-1.5 ml-auto">Resume</button>
        </div>
        <div className="progress-bar bg-blox-second-dark-blue/50 rounded-full h-6 overflow-hidden border-2 border-white/20">
          <div 
            className="progress-fill h-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 via-yellow-400 via-green-400 to-blue-500 transition-all duration-500 ease-out shadow-lg" 
            style={{ width: `${currentModule.progress}%` }} 
          />
        </div>
      </div>
    </motion.div>
  )
}