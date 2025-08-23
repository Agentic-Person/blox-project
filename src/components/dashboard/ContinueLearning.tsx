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
      className="glass-card p-6 rounded-xl"
      variants={fadeInUp}
      initial="initial"
      animate="animate"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="heading-secondary">Continue Learning</h2>
        <PlayCircle className="w-6 h-6 text-blox-teal animate-pulse" />
      </div>
      <div className="space-y-3">
        <h3 className="text-blox-teal font-semibold">{currentModule.title}</h3>
        <p className="text-sm text-blox-medium-blue-gray">{currentModule.description} • Week {currentModule.week}</p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blox-off-white">
            <Clock className="w-4 h-4 inline mr-1" />
            {currentModule.timeRemaining}
          </span>
          <span className="xp-badge">+{currentModule.xpToEarn} XP</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${currentModule.progress}%` }} />
        </div>
        <button className="btn-primary w-full mt-4">Resume</button>
      </div>
    </motion.div>
  )
}