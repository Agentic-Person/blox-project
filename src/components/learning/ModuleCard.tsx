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
import { getYouTubeThumbnail, getThumbnailAltText } from '@/lib/youtube'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { moduleColorScheme } from '@/lib/constants/moduleColors'
import { cn } from '@/lib/utils/cn'

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
  
  // Extract module index for color coding (e.g., "module-1" -> 0, "module-2" -> 1)
  const moduleNumber = module.id.split('-')[1]
  const moduleIndex = parseInt(moduleNumber, 10) - 1
  
  // Get module-specific colors
  const {
    moduleBackgrounds,
    textColors,
    progressBarColors
  } = moduleColorScheme

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
        className={cn(
          "relative overflow-hidden transition-all duration-300 cursor-pointer group border-2",
          moduleBackgrounds[moduleIndex],
          // Use predefined border classes instead of dynamic ones
          moduleIndex === 0 && 'border-blox-module-green/50 hover:border-blox-module-green/80',
          moduleIndex === 1 && 'border-blox-module-blue/50 hover:border-blox-module-blue/80',
          moduleIndex === 2 && 'border-blox-module-violet/50 hover:border-blox-module-violet/80',
          moduleIndex === 3 && 'border-blox-module-red/50 hover:border-blox-module-red/80',
          moduleIndex === 4 && 'border-blox-module-orange/50 hover:border-blox-module-orange/80',
          moduleIndex === 5 && 'border-blox-module-yellow/50 hover:border-blox-module-yellow/80',
          "hover:shadow-xl hover:scale-[1.02]",
          className
        )}
        onClick={() => handleAction()}
      >
        {/* Module-specific glow effect on hover */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          moduleIndex === 0 && 'from-blox-module-green/0 via-blox-module-green/10 to-blox-module-green/0',
          moduleIndex === 1 && 'from-blox-module-blue/0 via-blox-module-blue/10 to-blox-module-blue/0',
          moduleIndex === 2 && 'from-blox-module-violet/0 via-blox-module-violet/10 to-blox-module-violet/0',
          moduleIndex === 3 && 'from-blox-module-red/0 via-blox-module-red/10 to-blox-module-red/0',
          moduleIndex === 4 && 'from-blox-module-orange/0 via-blox-module-orange/10 to-blox-module-orange/0',
          moduleIndex === 5 && 'from-blox-module-yellow/0 via-blox-module-yellow/10 to-blox-module-yellow/0'
        )} />
        
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
            <Badge variant="outline" className={cn(
              "border-2",
              textColors[moduleIndex],
              moduleIndex === 0 && 'border-blox-module-green/30 bg-blox-module-green/10',
              moduleIndex === 1 && 'border-blox-module-blue/30 bg-blox-module-blue/10',
              moduleIndex === 2 && 'border-blox-module-violet/30 bg-blox-module-violet/10',
              moduleIndex === 3 && 'border-blox-module-red/30 bg-blox-module-red/10',
              moduleIndex === 4 && 'border-blox-module-orange/30 bg-blox-module-orange/10',
              moduleIndex === 5 && 'border-blox-module-yellow/30 bg-blox-module-yellow/10'
            )}>
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
                        src={getYouTubeThumbnail(video.youtubeId, 'medium')}
                        alt={getThumbnailAltText(video.title, video.youtubeId)}
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
                <span className={cn("font-medium", textColors[moduleIndex])}>{moduleProgress.completionPercentage}%</span>
              </div>
              <div className="w-full bg-blox-medium-blue-gray rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-500",
                    progressBarColors[moduleIndex]
                  )}
                  style={{ width: `${moduleProgress.completionPercentage}%` }}
                />
              </div>
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
              <Button variant="outline" className={cn(
                "w-full text-white border-2",
                textColors[moduleIndex],
                moduleIndex === 0 && 'border-blox-module-green/50 hover:bg-blox-module-green/20',
                moduleIndex === 1 && 'border-blox-module-blue/50 hover:bg-blox-module-blue/20',
                moduleIndex === 2 && 'border-blox-module-violet/50 hover:bg-blox-module-violet/20',
                moduleIndex === 3 && 'border-blox-module-red/50 hover:bg-blox-module-red/20',
                moduleIndex === 4 && 'border-blox-module-orange/50 hover:bg-blox-module-orange/20',
                moduleIndex === 5 && 'border-blox-module-yellow/50 hover:bg-blox-module-yellow/20'
              )} onClick={(e) => handleAction(e)}>
                <Trophy className="h-4 w-4 mr-2" />
                Review Module
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : moduleProgress.status === 'in_progress' ? (
              <Button className={cn(
                "w-full text-white",
                moduleIndex === 0 && 'bg-blox-module-green hover:bg-blox-module-green/80',
                moduleIndex === 1 && 'bg-blox-module-blue hover:bg-blox-module-blue/80',
                moduleIndex === 2 && 'bg-blox-module-violet hover:bg-blox-module-violet/80',
                moduleIndex === 3 && 'bg-blox-module-red hover:bg-blox-module-red/80',
                moduleIndex === 4 && 'bg-blox-module-orange hover:bg-blox-module-orange/80',
                moduleIndex === 5 && 'bg-blox-module-yellow hover:bg-blox-module-yellow/80'
              )} onClick={(e) => handleAction(e)}>
                <BookOpen className="h-4 w-4 mr-2" />
                Continue Learning
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button className={cn(
                "w-full text-white",
                moduleIndex === 0 && 'bg-blox-module-green hover:bg-blox-module-green/80',
                moduleIndex === 1 && 'bg-blox-module-blue hover:bg-blox-module-blue/80',
                moduleIndex === 2 && 'bg-blox-module-violet hover:bg-blox-module-violet/80',
                moduleIndex === 3 && 'bg-blox-module-red hover:bg-blox-module-red/80',
                moduleIndex === 4 && 'bg-blox-module-orange hover:bg-blox-module-orange/80',
                moduleIndex === 5 && 'bg-blox-module-yellow hover:bg-blox-module-yellow/80'
              )} onClick={(e) => handleAction(e)}>
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