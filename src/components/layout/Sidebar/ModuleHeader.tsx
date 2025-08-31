'use client'

import { Trophy, Clock, Zap, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { moduleColorScheme } from '@/lib/constants/moduleColors'
import { cn } from '@/lib/utils/cn'

interface ModuleHeaderProps {
  module: {
    id: string
    title: string
    description: string
    weeks: any[]
  }
  totalHours: number
  totalXP: number
  progress: number
}

export function ModuleHeader({ module, totalHours, totalXP, progress }: ModuleHeaderProps) {
  const moduleNumber = module.id.split('-')[1]
  const moduleIndex = parseInt(moduleNumber, 10) - 1 // Convert to 0-based index
  
  // Get colors for this specific module
  const {
    moduleGradients,
    moduleBorders,
    textColors,
    progressBarColors
  } = moduleColorScheme
  
  return (
    <motion.div 
      className={cn(
        "rounded-lg p-3 space-y-2 bg-gradient-to-br",
        moduleGradients[moduleIndex],
        moduleBorders[moduleIndex]
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Module indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-blox-off-white/80">
          <span className={cn("font-semibold", textColors[moduleIndex])}>Module {moduleNumber}</span>
          <span>•</span>
          <span>Month {moduleNumber}</span>
        </div>
        {progress === 100 && (
          <Trophy className="h-4 w-4 text-blox-golden-yellow" />
        )}
      </div>
      
      {/* Title */}
      <h3 className="text-sm font-bold text-blox-white leading-tight">
        {module.title}
      </h3>
      
      {/* Description */}
      <p className="text-xs text-blox-off-white/70 leading-relaxed line-clamp-2">
        {module.description}
      </p>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-1.5">
        <div className={cn("bg-blox-second-dark-blue/50 rounded px-1.5 py-1 text-center border", `border-${textColors[moduleIndex]}/10`)}>
          <div className="flex items-center justify-center gap-0.5">
            <Clock className={cn("h-2.5 w-2.5", `${textColors[moduleIndex]}/60`)} />
            <div className="text-xs font-bold text-blox-white">{totalHours}h</div>
          </div>
          <div className="text-[10px] text-blox-off-white/50">hours</div>
        </div>
        
        <div className="bg-blox-second-dark-blue/50 rounded px-1.5 py-1 text-center border border-blox-xp/10">
          <div className="flex items-center justify-center gap-0.5">
            <Zap className="h-2.5 w-2.5 text-blox-xp/60" />
            <div className="text-xs font-bold text-blox-white">{totalXP}</div>
          </div>
          <div className="text-[10px] text-blox-off-white/50">XP</div>
        </div>
        
        <div className="bg-blox-second-dark-blue/50 rounded px-1.5 py-1 text-center border border-blox-purple/10">
          <div className="flex items-center justify-center gap-0.5">
            <Calendar className="h-2.5 w-2.5 text-blox-purple/60" />
            <div className="text-xs font-bold text-blox-white">{module.weeks.length}</div>
          </div>
          <div className="text-[10px] text-blox-off-white/50">Weeks</div>
        </div>
        
        <div className="bg-blox-second-dark-blue/50 rounded px-1.5 py-1 text-center border border-blox-success/10">
          <div className="text-xs font-bold text-blox-success">{progress}%</div>
          <div className="text-[10px] text-blox-off-white/50">Done</div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1 bg-blox-medium-blue-gray/30 rounded-full overflow-hidden">
        <motion.div 
          className={cn("h-full rounded-full", progressBarColors[moduleIndex])}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  )
}