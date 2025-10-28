'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, Clock, Zap, Book, Trophy, Target, Users, Calendar, CheckCircle, PlayCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLearningStore } from '@/store/learningStore'
import { useRouter } from 'next/navigation'
import * as Progress from '@radix-ui/react-progress'
import { moduleColorScheme } from '@/lib/constants/moduleColors'
import { cn } from '@/lib/utils/cn'
import { Module } from '@/types/learning'

interface ModuleOverviewProps {
  module: Module
}

export function ModuleOverview({ module }: ModuleOverviewProps) {
  const router = useRouter()
  const { getModuleProgress, getWeekProgress, totalXP, totalHoursWatched } = useLearningStore()
  const [hoveredWeek, setHoveredWeek] = useState<string | null>(null)

  const moduleProgress = getModuleProgress(module.id)
  const moduleNumber = module.id.split('-')[1]
  const moduleIndex = parseInt(moduleNumber, 10) - 1
  
  // Get module colors
  const {
    moduleGradients,
    moduleBorders,
    textColors,
    progressBarColors,
    weekBackgrounds,
    weekActiveBackgrounds,
    weekBorders,
    weekActiveBorders
  } = moduleColorScheme
  
  // Define static color arrays for stats cards
  const statsBorderColors = [
    'border-blox-module-green/20',
    'border-blox-module-blue/20', 
    'border-blox-module-violet/20',
    'border-blox-module-red/20',
    'border-blox-module-orange/20',
    'border-blox-module-yellow/20'
  ]
  
  const iconColors = [
    'text-blox-module-green/30',
    'text-blox-module-blue/30',
    'text-blox-module-violet/30', 
    'text-blox-module-red/30',
    'text-blox-module-orange/30',
    'text-blox-module-yellow/30'
  ]
  
  const buttonHoverColors = [
    'hover:bg-blox-module-green/80',
    'hover:bg-blox-module-blue/80',
    'hover:bg-blox-module-violet/80',
    'hover:bg-blox-module-red/80',
    'hover:bg-blox-module-orange/80',
    'hover:bg-blox-module-yellow/80'
  ]

  const handleWeekClick = (weekId: string) => {
    // Navigate to week route to show week details in viewport
    router.push(`/learning/${module.id}/${weekId}`)
  }

  const totalVideos = module.weeks.reduce(
    (acc, week) => acc + week.days.reduce(
      (dayAcc, day) => dayAcc + day.videos.length, 0
    ), 0
  )

  const completedVideos = module.weeks.reduce(
    (acc, week) => acc + week.days.reduce(
      (dayAcc, day) => dayAcc + day.videos.filter(v => {
        const { isVideoCompleted } = useLearningStore.getState()
        return isVideoCompleted(v.id)
      }).length, 0
    ), 0
  )

  return (
    <div className="h-full flex flex-col bg-blox-very-dark-blue overflow-y-auto">
      {/* Module Header */}
      <div className="px-8 py-6 border-b border-blox-medium-blue-gray bg-gradient-to-r from-blox-very-dark-blue to-blox-dark-blue">
        
        <h1 className="text-3xl font-bold text-blox-white mb-3">
          {module.title}
        </h1>
        
        <p className="text-blox-off-white mb-6 max-w-3xl">
          {module.description}
        </p>

        {/* Module Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card className={cn("bg-blox-second-dark-blue/50", statsBorderColors[moduleIndex])}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blox-off-white/60">Progress</p>
                  <p className={cn("text-2xl font-bold", textColors[moduleIndex])}>{moduleProgress}%</p>
                </div>
                <Trophy className={cn("h-8 w-8", iconColors[moduleIndex])} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blox-second-dark-blue/50 border-blox-purple/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blox-off-white/60">Total Hours</p>
                  <p className="text-2xl font-bold text-blox-purple">{module.totalHours}h</p>
                </div>
                <Clock className="h-8 w-8 text-blox-purple/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blox-second-dark-blue/50 border-blox-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blox-off-white/60">Total XP</p>
                  <p className="text-2xl font-bold text-blox-warning">{module.totalXP}</p>
                </div>
                <Zap className="h-8 w-8 text-blox-warning/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blox-second-dark-blue/50 border-blox-success/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blox-off-white/60">Videos</p>
                  <p className="text-2xl font-bold text-blox-success">{completedVideos}/{totalVideos}</p>
                </div>
                <PlayCircle className="h-8 w-8 text-blox-success/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blox-second-dark-blue/50 border-blox-light-blue/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blox-off-white/60">Weeks</p>
                  <p className="text-2xl font-bold text-blox-light-blue">{module.weeks.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blox-light-blue/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-8 py-4 bg-blox-dark-blue/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-blox-off-white">Module Progress</span>
          <span className={cn("text-sm font-semibold", textColors[moduleIndex])}>{moduleProgress}% Complete</span>
        </div>
        <Progress.Root 
          className="relative overflow-hidden bg-blox-medium-blue-gray/30 rounded-full w-full h-3"
          value={moduleProgress}
        >
          <Progress.Indicator
            className={cn("h-full w-full flex-1 transition-transform duration-500 ease-out", progressBarColors[moduleIndex])}
            style={{ transform: `translateX(-${100 - moduleProgress}%)` }}
          />
        </Progress.Root>
      </div>

      {/* Weeks List */}
      <div className="flex-1 px-8 py-6">
        <h2 className="text-xl font-semibold text-blox-white mb-6">Weekly Breakdown</h2>
        
        <div className="space-y-6">
          {module.weeks.map((week, index) => {
            const weekProgress = getWeekProgress(week.id)
            const weekNumber = week.id.split('-')[1]
            const totalWeekVideos = week.days.reduce((acc, day) => acc + day.videos.length, 0)
            const totalWeekHours = week.days.reduce((acc, day) => {
              const hours = day.videos.reduce((vAcc, video) => {
                const [minutes] = video.duration.split(':').map(Number)
                return vAcc + minutes / 60
              }, 0)
              return acc + hours
            }, 0)
            
            // Get sample videos (first 3 videos from the week)
            const sampleVideos = week.days
              .flatMap(day => day.videos)
              .slice(0, 3)
            
            // Create learning objectives for the week
            const learningObjectives = week.days.map(day => day.title).slice(0, 4)

            return (
              <motion.div
                key={week.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredWeek(week.id)}
                onMouseLeave={() => setHoveredWeek(null)}
              >
                <Card 
                  className={cn(
                    "cursor-pointer transition-all duration-300",
                    hoveredWeek === week.id 
                      ? `${weekActiveBorders[moduleIndex]} transform -translate-y-1` 
                      : `${weekBorders[moduleIndex]}`,
                    weekProgress === 100 ? 'bg-blox-success/10' : weekBackgrounds[moduleIndex]
                  )}
                  onClick={() => handleWeekClick(week.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Left: Week Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl ${
                            weekProgress === 100 
                              ? 'bg-blox-success text-blox-very-dark-blue' 
                              : weekProgress > 0 
                                ? 'bg-blox-warning text-blox-very-dark-blue'
                                : cn('text-blox-off-white', progressBarColors[moduleIndex])
                          }`}>
                            W{weekNumber}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-blox-white mb-1">{week.title}</h3>
                            <p className="text-sm text-blox-off-white/80">{week.description}</p>
                          </div>
                          {weekProgress === 100 && (
                            <CheckCircle className="h-6 w-6 text-blox-success" />
                          )}
                        </div>
                        
                        {/* What you'll learn */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-blox-white mb-2 flex items-center gap-2">
                            <Target className={cn("h-4 w-4", textColors[moduleIndex])} />
                            What you'll learn
                          </h4>
                          <ul className="space-y-1">
                            {learningObjectives.map((objective, objIndex) => (
                              <li key={objIndex} className="text-xs text-blox-off-white/70 flex items-center gap-2">
                                <div className={cn("w-1.5 h-1.5 rounded-full", progressBarColors[moduleIndex])} />
                                {objective}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 text-xs mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-blox-off-white/50" />
                            <span className="text-blox-off-white/70">{week.days.length} days</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <PlayCircle className="h-3 w-3 text-blox-off-white/50" />
                            <span className="text-blox-off-white/70">{totalWeekVideos} videos</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blox-off-white/50" />
                            <span className="text-blox-off-white/70">{totalWeekHours.toFixed(1)}h</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className={cn("h-3 w-3", textColors[moduleIndex])} />
                            <span className={cn("font-semibold", textColors[moduleIndex])}>{weekProgress}%</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <Progress.Root 
                            className="relative overflow-hidden bg-blox-medium-blue-gray/30 rounded-full w-full h-2"
                            value={weekProgress}
                          >
                            <Progress.Indicator
                              className={cn("h-full w-full flex-1 transition-transform duration-300 ease-out", 
                                weekProgress === 100 ? 'bg-blox-success' : progressBarColors[moduleIndex]
                              )}
                              style={{ transform: `translateX(-${100 - weekProgress}%)` }}
                            />
                          </Progress.Root>
                        </div>

                        {/* Action Button */}
                        <Button 
                          className={cn("text-white", progressBarColors[moduleIndex], buttonHoverColors[moduleIndex])}
                          size="sm"
                        >
                          {weekProgress === 100 ? 'Review Week' : weekProgress > 0 ? 'Continue Week' : 'Start Week'}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>

                      {/* Right: Sample Videos */}
                      <div className="w-80 flex-shrink-0">
                        <h4 className="text-sm font-semibold text-blox-white mb-3 flex items-center gap-2">
                          <PlayCircle className={cn("h-4 w-4", textColors[moduleIndex])} />
                          Sample Videos
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {sampleVideos.map((video, videoIndex) => (
                            <div key={video.id} className="flex gap-3 p-2 rounded-lg bg-blox-second-dark-blue/30 hover:bg-blox-second-dark-blue/50 transition-colors">
                              <div className="w-16 h-12 bg-blox-very-dark-blue rounded overflow-hidden flex-shrink-0">
                                {(video as any).type === 'assignment' && (video as any).thumbnails?.[0] ? (
                                  <img
                                    src={(video as any).thumbnails[0]}
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : video.youtubeId && video.youtubeId !== 'YOUTUBE_ID_PLACEHOLDER' ? (
                                  <img
                                    src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blox-medium-blue-gray to-blox-dark-blue">
                                    <PlayCircle className="h-4 w-4 text-blox-off-white/50" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-blox-white line-clamp-2">{video.title}</p>
                                <p className="text-xs text-blox-off-white/60 mt-1">{video.duration}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}