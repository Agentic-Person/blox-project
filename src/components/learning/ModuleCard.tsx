'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Clock, 
  Star, 
  Trophy,
  Coins,
  ArrowRight,
  CheckCircle,
  Lock,
  Users
} from 'lucide-react'
import { useLearningStore } from '@/store/learningStore'
import { formatBLOXAmount } from '@/lib/learning/xp-to-blox'
import { motion } from 'framer-motion'

interface Module {
  id: string
  title: string
  description: string
  totalHours: number
  totalXP: number
  bloxReward: number
  difficulty: string
  tools: string[]
  learningObjectives: string[]
  prerequisites?: string[]
  certification?: {
    available: boolean
  }
  weeks: any[]
}

interface ModuleCardProps {
  module: Module
  isLocked?: boolean
  onStartModule?: () => void
  onContinueModule?: () => void
  className?: string
}

export function ModuleCard({ 
  module, 
  isLocked = false, 
  onStartModule,
  onContinueModule,
  className 
}: ModuleCardProps) {
  const { calculateModuleProgress } = useLearningStore()
  const moduleProgress = calculateModuleProgress(module.id)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      default:
        return 'bg-blox-glass-bg text-blox-off-white border-blox-glass-border'
    }
  }

  const handleAction = () => {
    if (moduleProgress.status === 'not_started') {
      onStartModule?.()
    } else {
      onContinueModule?.()
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-xl glass-card border-blox-glass-border ${className}`}>
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-blox-teal/0 via-blox-teal/5 to-blox-teal/0 opacity-0 hover:opacity-100 transition-opacity duration-500" />
        
        {/* Header */}
        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-blox-white">
                {moduleProgress.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-blox-success" />
                )}
                {isLocked && <Lock className="h-5 w-5 text-blox-medium-blue-gray" />}
                <span className={isLocked ? 'text-blox-medium-blue-gray' : ''}>{module.title}</span>
              </CardTitle>
              <p className="text-sm text-blox-off-white mt-1 line-clamp-2">
                {module.description}
              </p>
            </div>
            <Badge variant="outline" className={getDifficultyColor(module.difficulty)}>
              {module.difficulty}
            </Badge>
          </div>

          {/* Progress Bar */}
          {!isLocked && moduleProgress.status !== 'not_started' && (
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blox-off-white">Progress</span>
                <span className="font-medium text-blox-teal">{moduleProgress.completionPercentage}%</span>
              </div>
              <Progress 
                value={moduleProgress.completionPercentage} 
                className="h-2 bg-blox-medium-blue-gray"
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          {/* Module Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blox-off-white" />
              <span className="text-blox-off-white">{module.totalHours}h total</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blox-off-white" />
              <span className="text-blox-off-white">{module.weeks.length} weeks</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-blox-off-white">{module.totalXP} XP</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-blox-teal" />
              <span className="text-blox-off-white">{formatBLOXAmount(module.bloxReward)}</span>
            </div>
          </div>

          {/* Earned Rewards (if in progress or completed) */}
          {!isLocked && moduleProgress.status !== 'not_started' && (
            <div className="bg-gradient-to-r from-blox-teal/10 to-purple-500/10 rounded-lg p-3 border border-blox-glass-border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-blox-white">{moduleProgress.xpEarned} XP earned</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-blox-teal" />
                  <span className="font-medium text-blox-white">{formatBLOXAmount(moduleProgress.bloxEarned)} earned</span>
                </div>
              </div>
            </div>
          )}

          {/* Tools & Technologies */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-blox-off-white">Tools & Technologies</h4>
            <div className="flex flex-wrap gap-1">
              {module.tools.slice(0, 4).map((tool) => (
                <Badge key={tool} variant="secondary" className="text-xs bg-blox-glass-bg border-blox-glass-border text-blox-off-white">
                  {tool}
                </Badge>
              ))}
              {module.tools.length > 4 && (
                <Badge variant="secondary" className="text-xs bg-blox-glass-bg border-blox-glass-border text-blox-off-white">
                  +{module.tools.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          {/* Learning Objectives Preview */}
          {module.learningObjectives && module.learningObjectives.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-blox-off-white">What you'll learn</h4>
              <ul className="text-sm space-y-1">
                {module.learningObjectives.slice(0, 3).map((objective, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-blox-success mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1 text-blox-off-white">{objective}</span>
                  </li>
                ))}
                {module.learningObjectives.length > 3 && (
                  <li className="text-blox-medium-blue-gray">
                    +{module.learningObjectives.length - 3} more objectives
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Prerequisites (if any) */}
          {module.prerequisites && module.prerequisites.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <h4 className="text-sm font-medium text-amber-400 mb-1">
                Prerequisites Required
              </h4>
              <p className="text-xs text-amber-300">
                Complete {module.prerequisites.length} previous module{module.prerequisites.length > 1 ? 's' : ''} first
              </p>
            </div>
          )}

          {/* Certification Info */}
          {module.certification?.available && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">
                  Certificate Available
                </span>
              </div>
              {moduleProgress.certificateEarned && (
                <Badge variant="secondary" className="mt-2 bg-purple-500/20 text-purple-300 border-purple-500/30">
                  Certificate Earned ✓
                </Badge>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {isLocked ? (
              <Button disabled className="w-full bg-blox-medium-blue-gray text-blox-off-white">
                <Lock className="h-4 w-4 mr-2" />
                Locked
              </Button>
            ) : moduleProgress.status === 'completed' ? (
              <Button variant="outline" className="w-full border-blox-glass-border hover:bg-blox-glass-bg text-blox-white" onClick={handleAction}>
                <Trophy className="h-4 w-4 mr-2" />
                Review Module
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : moduleProgress.status === 'in_progress' ? (
              <Button className="w-full bg-blox-teal hover:bg-blox-teal/80 text-white" onClick={handleAction}>
                <BookOpen className="h-4 w-4 mr-2" />
                Continue Learning
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button className="w-full bg-blox-teal hover:bg-blox-teal/80 text-white" onClick={handleAction}>
                <BookOpen className="h-4 w-4 mr-2" />
                Start Module
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Community Indicator */}
          <div className="flex items-center gap-2 text-xs text-blox-medium-blue-gray pt-2 border-t border-blox-glass-border">
            <Users className="h-3 w-3" />
            <span>Join 1,247 students learning this module</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}