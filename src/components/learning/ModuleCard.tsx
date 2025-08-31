'use client'

import React, { useMemo } from 'react'
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
  Users,
  PlayCircle
} from 'lucide-react'
import { useLearningStore } from '@/store/learningStore'
import { formatBLOXAmount } from '@/lib/learning/xp-to-blox'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface Video {
  id: string
  title: string
  youtubeId: string
  duration?: string
  xpReward?: number
}

interface Week {
  id: string
  title: string
  days: Day[]
}

interface Day {
  id: string
  videos?: Video[]
}

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
  weeks: Week[]
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

  // Get two random videos from the module for thumbnails
  const sampleVideos = useMemo(() => {
    const allVideos: Video[] = []
    module.weeks.forEach(week => {
      week.days.forEach(day => {
        if (day.videos && day.videos.length > 0) {
          allVideos.push(...day.videos)
        }
      })
    })
    
    // Take first 3 videos deterministically to avoid hydration issues
    return allVideos.slice(0, 3)
  }, [module])

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

  const handleAction = (e?: React.MouseEvent) => {
    // Prevent double navigation if clicking on the button
    if (e) {
      e.stopPropagation()
    }
    if (isLocked) return
    
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
      <Card 
        className={`relative overflow-hidden transition-all duration-200 hover:shadow-xl glass-card border-blox-glass-border cursor-pointer ${className}`}
        onClick={() => handleAction()}
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-blox-teal/0 via-blox-teal/5 to-blox-teal/0 opacity-0 hover:opacity-100 transition-opacity duration-500" />
        
        {/* Header with Title and Badge */}
        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold flex items-center gap-2 text-blox-white">
                {moduleProgress.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-blox-success" />
                )}
                {isLocked && <Lock className="h-5 w-5 text-blox-medium-blue-gray" />}
                <span className={isLocked ? 'text-blox-medium-blue-gray' : ''}>{module.title}</span>
              </CardTitle>
            </div>
            <Badge variant="outline" className={getDifficultyColor(module.difficulty)}>
              {module.difficulty}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          {/* Description */}
          <p className="text-base text-blox-off-white line-clamp-2">
            {module.description}
          </p>

          {/* What You'll Learn */}
          {module.learningObjectives && module.learningObjectives.length > 0 && (
            <div>
              <h4 className="text-base font-medium mb-2 text-blox-off-white">What you'll learn</h4>
              <ul className="space-y-1">
                {module.learningObjectives.slice(0, 3).map((objective, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blox-success mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1 text-blox-off-white text-sm">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Video Thumbnails Section */}
          {sampleVideos.length > 0 && (
            <div>
              <h4 className="text-base font-medium mb-2 text-blox-off-white">Sample Videos</h4>
              <div className="flex gap-2">
                {sampleVideos.map((video, index) => (
                  <div key={video.id || index} className="relative group flex-1">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-blox-medium-blue-gray border border-blox-glass-border">
                      <Image
                        src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                        alt={video.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <p className="text-xs text-blox-off-white mt-1 line-clamp-1">{video.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {!isLocked && moduleProgress.status !== 'not_started' && (
            <div className="space-y-2">
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

          {/* Module Stats - Single Row */}
          <div className="flex justify-between items-center text-sm bg-blox-glass-bg rounded-lg p-3 border border-blox-glass-border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blox-off-white" />
              <span className="text-blox-off-white font-medium">{module.totalHours}h</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blox-off-white" />
              <span className="text-blox-off-white font-medium">{module.weeks.length} weeks</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-blox-off-white font-medium">{module.totalXP}</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-blox-teal" />
              <span className="text-blox-off-white font-medium">{formatBLOXAmount(module.bloxReward)}</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            {isLocked ? (
              <Button disabled className="w-full bg-blox-medium-blue-gray text-blox-off-white">
                <Lock className="h-4 w-4 mr-2" />
                Locked
              </Button>
            ) : moduleProgress.status === 'completed' ? (
              <Button variant="outline" className="w-full border-blox-glass-border hover:bg-blox-glass-bg text-blox-white" onClick={(e) => handleAction(e)}>
                <Trophy className="h-4 w-4 mr-2" />
                Review Module
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : moduleProgress.status === 'in_progress' ? (
              <Button className="w-full bg-blox-teal hover:bg-blox-teal/80 text-white" onClick={(e) => handleAction(e)}>
                <BookOpen className="h-4 w-4 mr-2" />
                Continue Learning
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button className="w-full bg-blox-teal hover:bg-blox-teal/80 text-white" onClick={(e) => handleAction(e)}>
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