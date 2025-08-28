'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Circle, Lock } from 'lucide-react'
import { useAIJourney } from '@/hooks/useAIJourney'
import type { Skill } from '@/store/aiJourneyStore'

interface PathNodeProps {
  skill: Skill
  index: number
  isActive: boolean
  progress: number
}

function PathNode({ skill, index, isActive, progress }: PathNodeProps) {
  const getStatusIcon = () => {
    switch (skill.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blox-success" />
      case 'current':
        return <Circle className="h-4 w-4 text-blox-teal" />
      case 'locked':
        return <Lock className="h-3 w-3 text-blox-off-white/30" />
    }
  }

  const getStatusColor = () => {
    switch (skill.status) {
      case 'completed':
        return 'bg-blox-success/20 border-blox-success/50'
      case 'current':
        return 'bg-blox-teal/20 border-blox-teal/50'
      case 'locked':
        return 'bg-blox-off-white/5 border-blox-off-white/10'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex flex-col items-center relative group"
    >
      {/* Progress line */}
      {index > 0 && (
        <div className="absolute left-0 top-6 w-full h-0.5 -translate-x-1/2 z-0">
          <div className="h-full bg-blox-off-white/10 relative overflow-hidden">
            {skill.status === 'completed' && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="h-full bg-gradient-to-r from-blox-teal to-blox-success"
              />
            )}
          </div>
        </div>
      )}

      {/* Node */}
      <motion.div
        className={`relative z-10 p-3 rounded-xl border ${getStatusColor()} 
          transition-all duration-300 cursor-pointer min-w-[120px]`}
        whileHover={{ 
          scale: 1.05,
          y: -2
        }}
        animate={isActive && skill.status === 'current' ? {
          boxShadow: [
            '0 0 0 0 rgba(54, 176, 217, 0.4)',
            '0 0 0 8px rgba(54, 176, 217, 0)',
            '0 0 0 0 rgba(54, 176, 217, 0.4)'
          ]
        } : {}}
        transition={{ 
          boxShadow: { duration: 2, repeat: Infinity },
          scale: { duration: 0.2 },
          y: { duration: 0.2 }
        }}
      >
        {/* Skill Icon */}
        <div className="flex items-center justify-center mb-2">
          <div className="text-lg mr-2">{skill.icon}</div>
          {getStatusIcon()}
        </div>

        {/* Skill Name */}
        <h4 className={`text-sm font-medium text-center ${
          skill.status === 'locked' ? 'text-blox-off-white/50' : 'text-blox-white'
        }`}>
          {skill.name}
        </h4>

        {/* Progress indicator for current skill */}
        {skill.status === 'current' && (
          <div className="mt-2">
            <div className="w-full bg-blox-off-white/10 rounded-full h-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-gradient-to-r from-blox-teal to-blox-teal-dark rounded-full"
              />
            </div>
            <p className="text-xs text-blox-off-white/70 mt-1 text-center">
              {progress}% complete
            </p>
          </div>
        )}

        {/* Video count */}
        <div className={`text-xs text-center mt-1 ${
          skill.status === 'locked' ? 'text-blox-off-white/30' : 'text-blox-off-white/60'
        }`}>
          {skill.videos} videos • {skill.estimatedHours}h
        </div>

        {/* Hover tooltip */}
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
          opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
          <div className="bg-blox-black-blue/90 backdrop-blur-sm text-blox-white text-xs 
            p-2 rounded-lg border border-blox-teal/30 whitespace-nowrap max-w-xs">
            {skill.description}
          </div>
          <div className="w-2 h-2 bg-blox-black-blue/90 border-r border-b border-blox-teal/30 
            transform rotate-45 mx-auto -mt-1" />
        </div>
      </motion.div>
    </motion.div>
  )
}

interface AIJourneyPathProps {
  className?: string
}

export function AIJourneyPath({ className = '' }: AIJourneyPathProps) {
  const { journey, progress } = useAIJourney()

  // Calculate current skill progress
  const currentSkillProgress = useMemo(() => {
    if (!journey) return 0
    
    // Mock progress calculation based on completed tasks and time
    const today = new Date().toISOString().split('T')[0]
    const todaySchedule = journey.schedule.find(day => day.date === today)
    const todayTasks = todaySchedule?.tasks || []
    const completedToday = todayTasks.filter(t => t.completed).length
    
    return todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 25
  }, [journey])

  if (!journey) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center p-8 text-blox-off-white/50">
          <p className="text-sm">Start your learning journey to see your path</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* Path Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-blox-white mb-1">
          Learning Path: {journey.gameTitle}
        </h3>
        <p className="text-sm text-blox-off-white/70">
          {progress.completedSkills} of {progress.totalSkills} skills completed • 
          {progress.estimatedTimeRemaining}h remaining
        </p>
      </div>

      {/* Journey Path */}
      <div className="relative">
        {/* Background path */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-blox-off-white/10 z-0" />
        
        {/* Skills Path - Horizontal scrollable */}
        <div className="flex gap-8 overflow-x-auto pb-4 scrollbar-thin">
          {journey.skills.map((skill, index) => (
            <PathNode
              key={skill.id}
              skill={skill}
              index={index}
              isActive={skill.status === 'current'}
              progress={skill.status === 'current' ? currentSkillProgress : 0}
            />
          ))}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mt-4 p-3 bg-blox-second-dark-blue/30 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blox-off-white/70">Overall Progress</span>
          <span className="text-blox-white font-medium">{progress.percentComplete}%</span>
        </div>
        <div className="mt-2 w-full bg-blox-off-white/10 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentComplete}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-blox-teal via-blox-teal-dark to-blox-success rounded-full 
              relative overflow-hidden"
          >
            <motion.div
              animate={{
                x: ['0%', '100%', '0%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}