'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, Clock, Zap, Book, Trophy, Target, Users, Calendar, CheckCircle, PlayCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLearningStore } from '@/store/learningStore'
import { useRouter } from 'next/navigation'
import * as Progress from '@radix-ui/react-progress'
import { Breadcrumb } from './Breadcrumb'

interface Week {
  id: string
  title: string
  description: string
  days: Array<{
    id: string
    title: string
    videos: Array<{
      id: string
      title: string
      youtubeId: string
      duration: string
      xpReward: number
    }>
    practiceTask?: string
    estimatedTime?: string
  }>
}

interface Module {
  id: string
  title: string
  description: string
  totalHours: number
  totalXP: number
  weeks: Week[]
}

interface ModuleOverviewProps {
  module: Module
}

export function ModuleOverview({ module }: ModuleOverviewProps) {
  const router = useRouter()
  const { getModuleProgress, getWeekProgress, totalXP, totalHoursWatched } = useLearningStore()
  const [hoveredWeek, setHoveredWeek] = useState<string | null>(null)

  const moduleProgress = getModuleProgress(module.id)
  const moduleNumber = module.id.split('-')[1]

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
        <div className="mb-3">
          <Breadcrumb />
        </div>
        
        <h1 className="text-3xl font-bold text-blox-white mb-3">
          {module.title}
        </h1>
        
        <p className="text-blox-off-white mb-6 max-w-3xl">
          {module.description}
        </p>

        {/* Module Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="bg-blox-second-dark-blue/50 border-blox-teal/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blox-off-white/60">Progress</p>
                  <p className="text-2xl font-bold text-blox-teal">{moduleProgress}%</p>
                </div>
                <Trophy className="h-8 w-8 text-blox-teal/30" />
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
          <span className="text-sm font-semibold text-blox-teal">{moduleProgress}% Complete</span>
        </div>
        <Progress.Root 
          className="relative overflow-hidden bg-blox-medium-blue-gray/30 rounded-full w-full h-3"
          value={moduleProgress}
        >
          <Progress.Indicator
            className="h-full w-full flex-1 bg-gradient-to-r from-blox-teal to-blox-light-green transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${100 - moduleProgress}%)` }}
          />
        </Progress.Root>
      </div>

      {/* Weeks Grid */}
      <div className="flex-1 px-8 py-6">
        <h2 className="text-xl font-semibold text-blox-white mb-6">Weekly Breakdown</h2>
        
        <div className="grid grid-cols-2 gap-6">
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
                  className={`cursor-pointer transition-all duration-300 ${
                    hoveredWeek === week.id 
                      ? 'border-blox-teal shadow-lg shadow-blox-teal/20 transform -translate-y-1' 
                      : 'border-blox-medium-blue-gray/50 hover:border-blox-teal/50'
                  } ${weekProgress === 100 ? 'bg-blox-success/10' : 'bg-blox-second-dark-blue/30'}`}
                  onClick={() => handleWeekClick(week.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                          weekProgress === 100 
                            ? 'bg-blox-success text-blox-very-dark-blue' 
                            : weekProgress > 0 
                              ? 'bg-blox-warning text-blox-very-dark-blue'
                              : 'bg-blox-medium-blue-gray/50 text-blox-off-white'
                        }`}>
                          {weekNumber}
                        </div>
                        <div>
                          <CardTitle className="text-blox-white text-base">{week.title}</CardTitle>
                          <p className="text-xs text-blox-off-white/60 mt-1">{week.description}</p>
                        </div>
                      </div>
                      {weekProgress === 100 && (
                        <CheckCircle className="h-5 w-5 text-blox-success" />
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Week Progress Bar */}
                    <Progress.Root 
                      className="relative overflow-hidden bg-blox-medium-blue-gray/30 rounded-full w-full h-2 mb-4"
                      value={weekProgress}
                    >
                      <Progress.Indicator
                        className={`h-full w-full flex-1 transition-transform duration-300 ease-out ${
                          weekProgress === 100 
                            ? 'bg-blox-success' 
                            : weekProgress > 0 
                              ? 'bg-blox-warning'
                              : 'bg-blox-medium-blue-gray'
                        }`}
                        style={{ transform: `translateX(-${100 - weekProgress}%)` }}
                      />
                    </Progress.Root>

                    {/* Week Stats */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="text-center">
                        <p className="text-blox-off-white/60">Days</p>
                        <p className="text-blox-white font-semibold">{week.days.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-blox-off-white/60">Videos</p>
                        <p className="text-blox-white font-semibold">{totalWeekVideos}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-blox-off-white/60">Hours</p>
                        <p className="text-blox-white font-semibold">{totalWeekHours.toFixed(1)}</p>
                      </div>
                    </div>

                    {/* Day Pills */}
                    <div className="flex items-center gap-1 mt-4">
                      {week.days.map((day, dayIndex) => {
                        const { isDayCompleted, getDayProgress } = useLearningStore.getState()
                        const isCompleted = isDayCompleted(day.id)
                        const dayProgress = getDayProgress(day.id)
                        
                        return (
                          <div
                            key={day.id}
                            className={`flex-1 h-6 rounded-sm flex items-center justify-center text-xs font-bold ${
                              isCompleted 
                                ? 'bg-blox-success text-blox-very-dark-blue' 
                                : dayProgress.completionPercentage > 0
                                  ? 'bg-blox-warning text-blox-very-dark-blue'
                                  : 'bg-blox-medium-blue-gray/30 text-blox-off-white/60 border border-blox-medium-blue-gray/50'
                            }`}
                            title={day.title}
                          >
                            D{dayIndex + 1}
                          </div>
                        )
                      })}
                    </div>

                    {/* Action Button */}
                    <Button 
                      className="w-full mt-4 bg-blox-teal hover:bg-blox-teal-light text-white"
                      size="sm"
                    >
                      {weekProgress === 100 ? 'Review Week' : weekProgress > 0 ? 'Continue' : 'Start Week'}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
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