'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  ChevronRight,
  Clock, 
  Star, 
  Coins,
  Calendar,
  Target,
  Trophy,
  Users,
  TrendingUp,
  Grid,
  List,
  ArrowLeft
} from 'lucide-react'
import { useLearningStore } from '@/store/learningStore'
import { ModuleCard } from './ModuleCard'
import { formatBLOXAmount } from '@/lib/learning/xp-to-blox'
import curriculumData from '@/data/curriculum.json'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface Module {
  id: string
  title: string
  description: string
  weeks: Week[]
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
}

interface Week {
  id: string
  title: string
  description: string
  weekNumber: number
  days: Day[]
  estimatedHours: number
  xpReward: number
  bloxReward: number
}

interface Day {
  id: string
  title: string
  description: string
  dayNumber: number
  videos: any[]
  estimatedVideoTime: string
  estimatedPracticeTime: string
  totalEstimatedTime: string
  xpReward: number
  bloxReward: number
}

interface CurriculumBrowserProps {
  onNavigateToDay?: (moduleId: string, weekId: string, dayId: string) => void
  className?: string
}

export function CurriculumBrowser({ onNavigateToDay, className }: CurriculumBrowserProps) {
  const router = useRouter()
  const { 
    totalXP,
    totalBLOXEarned,
    currentStreak,
    completedLessons,
    calculateModuleProgress,
    calculateWeekProgress
  } = useLearningStore()
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null)
  const [activeTab, setActiveTab] = useState('modules')

  // Transform curriculum data to match our interface
  const modules: Module[] = curriculumData.modules.map(module => ({
    ...module,
    totalHours: module.totalHours || module.weeks.length * 10,
    totalXP: module.totalXP || module.weeks.length * 500,
    bloxReward: module.weeks.length * 100,
    difficulty: 'beginner',
    tools: ['Roblox Studio', 'Blender', 'AI Tools'],
    learningObjectives: [
      'Master modern Roblox Studio interface',
      'Create 3D models and assets',
      'Implement game mechanics',
      'Build complete games'
    ],
    weeks: module.weeks.map((week, weekIndex) => ({
      ...week,
      weekNumber: weekIndex + 1,
      estimatedHours: 10,
      xpReward: week.days.reduce((acc, day) => {
        const videoXP = day.videos?.reduce((vAcc, video) => vAcc + (video.xpReward || 50), 0) || 0
        return acc + videoXP + 50 // 50 bonus per day
      }, 0),
      bloxReward: week.days.length * 20,
      days: week.days.map((day, dayIndex) => ({
        ...day,
        description: day.title,
        dayNumber: dayIndex + 1,
        videos: day.videos || [],
        estimatedVideoTime: day.estimatedTime || '45 min',
        estimatedPracticeTime: '30 min',
        totalEstimatedTime: day.estimatedTime || '1h 15min',
        xpReward: day.videos?.reduce((acc, video) => acc + (video.xpReward || 50), 0) || 100,
        bloxReward: 20
      }))
    }))
  }))

  const handleModuleSelect = (module: Module) => {
    setSelectedModule(module)
    setSelectedWeek(null)
    setActiveTab('weeks')
  }

  const handleWeekSelect = (week: Week) => {
    setSelectedWeek(week)
    setActiveTab('days')
  }

  const handleDaySelect = (day: Day) => {
    if (selectedModule && selectedWeek) {
      const path = `/learning/${selectedModule.id}/${selectedWeek.id}/${day.id}`
      router.push(path)
      onNavigateToDay?.(selectedModule.id, selectedWeek.id, day.id)
    }
  }

  const calculateOverallProgress = () => {
    const totalModules = modules.length
    const completedModules = modules.filter(module => {
      const progress = calculateModuleProgress(module.id)
      return progress.status === 'completed'
    }).length
    
    return totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card border-blox-glass-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-blox-teal" />
                <span className="text-2xl font-bold text-blox-white">{calculateOverallProgress()}%</span>
              </div>
              <p className="text-sm text-blox-off-white">Overall Progress</p>
              <Progress value={calculateOverallProgress()} className="h-2 mt-2 bg-blox-medium-blue-gray" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card border-blox-glass-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold text-blox-white">{totalXP || 0}</span>
              </div>
              <p className="text-sm text-blox-off-white">Total XP Earned</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card border-blox-glass-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Coins className="h-5 w-5 text-blox-teal" />
                <span className="text-2xl font-bold text-blox-white">{totalBLOXEarned || 0}</span>
              </div>
              <p className="text-sm text-blox-off-white">BLOX Earned</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card border-blox-glass-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                <span className="text-2xl font-bold text-blox-white">{currentStreak || 0}</span>
              </div>
              <p className="text-sm text-blox-off-white">Day Streak</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-blox-second-dark-blue border border-blox-glass-border">
          <TabsTrigger value="modules" className="data-[state=active]:bg-blox-teal data-[state=active]:text-white">
            Modules
          </TabsTrigger>
          <TabsTrigger 
            value="weeks" 
            disabled={!selectedModule}
            className="data-[state=active]:bg-blox-teal data-[state=active]:text-white"
          >
            Weeks {selectedModule && `(${selectedModule.title})`}
          </TabsTrigger>
          <TabsTrigger 
            value="days" 
            disabled={!selectedWeek}
            className="data-[state=active]:bg-blox-teal data-[state=active]:text-white"
          >
            Days {selectedWeek && `(${selectedWeek.title})`}
          </TabsTrigger>
        </TabsList>

        {/* Modules View */}
        <TabsContent value="modules" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-blox-white">Learning Modules</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="border-blox-glass-border hover:bg-blox-glass-bg"
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
          </div>

          <div className={viewMode === 'grid' ? 
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
            "space-y-4"
          }>
            {modules.map((module, index) => {
              const isLocked = index > 0 && calculateModuleProgress(modules[index - 1].id).status !== 'completed'
              
              return (
                <ModuleCard
                  key={module.id}
                  module={module}
                  isLocked={isLocked}
                  onStartModule={() => handleModuleSelect(module)}
                  onContinueModule={() => handleModuleSelect(module)}
                />
              )
            })}
          </div>
        </TabsContent>

        {/* Weeks View */}
        <TabsContent value="weeks" className="space-y-4 mt-6">
          {selectedModule && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSelectedModule(null)
                    setActiveTab('modules')
                  }}
                  className="hover:bg-blox-glass-bg"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Modules
                </Button>
                <ChevronRight className="h-4 w-4 text-blox-medium-blue-gray" />
                <h2 className="text-xl font-bold text-blox-white">{selectedModule.title} - Weeks</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedModule.weeks.map((week, index) => {
                  const weekProgress = calculateWeekProgress(week.id)
                  const isLocked = index > 0 && calculateWeekProgress(selectedModule.weeks[index - 1].id).status !== 'completed'

                  return (
                    <motion.div
                      key={week.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all hover:shadow-lg glass-card border-blox-glass-border ${
                          isLocked ? 'opacity-50' : ''
                        }`}
                        onClick={() => !isLocked && handleWeekSelect(week)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg text-blox-white">{week.title}</CardTitle>
                              <p className="text-sm text-blox-off-white">{week.description}</p>
                            </div>
                            <Badge className="bg-blox-teal text-white">
                              Week {week.weekNumber}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="space-y-3">
                            {/* Progress */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-blox-off-white">Progress</span>
                                <span className="text-blox-teal">{weekProgress.completionPercentage}%</span>
                              </div>
                              <Progress 
                                value={weekProgress.completionPercentage} 
                                className="h-2 bg-blox-medium-blue-gray" 
                              />
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-blox-off-white" />
                                <span className="text-blox-off-white">{week.estimatedHours}h</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-blox-off-white" />
                                <span className="text-blox-off-white">{week.days.length} days</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-blox-off-white">{week.xpReward} XP</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Coins className="h-3 w-3 text-blox-teal" />
                                <span className="text-blox-off-white">{formatBLOXAmount(week.bloxReward)}</span>
                              </div>
                            </div>

                            {/* Earned Rewards */}
                            {weekProgress.status !== 'not_started' && (
                              <div className="bg-blox-glass-bg p-2 rounded text-sm border border-blox-glass-border">
                                <div className="flex justify-between">
                                  <span className="text-blox-off-white">Earned: {weekProgress.xpEarned} XP</span>
                                  <span className="text-blox-teal">{formatBLOXAmount(weekProgress.bloxEarned)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* Days View */}
        <TabsContent value="days" className="space-y-4 mt-6">
          {selectedWeek && selectedModule && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSelectedWeek(null)
                    setActiveTab('weeks')
                  }}
                  className="hover:bg-blox-glass-bg"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Weeks
                </Button>
                <ChevronRight className="h-4 w-4 text-blox-medium-blue-gray" />
                <h2 className="text-xl font-bold text-blox-white">{selectedWeek.title} - Days</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedWeek.days.map((day, index) => (
                  <motion.div
                    key={day.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 glass-card border-blox-glass-border"
                      onClick={() => handleDaySelect(day)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base text-blox-white">{day.title}</CardTitle>
                            <p className="text-xs text-blox-off-white line-clamp-2">
                              {day.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="border-blox-teal text-blox-teal">
                            Day {day.dayNumber}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-3">
                          {/* Content Info */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3 text-blox-off-white" />
                              <span className="text-blox-off-white">{day.videos.length} videos</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3 text-blox-off-white" />
                              <span className="text-blox-off-white">1 practice task</span>
                            </div>
                          </div>

                          {/* Time Breakdown */}
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-blox-off-white">Videos:</span>
                              <span className="text-blox-white">{day.estimatedVideoTime}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blox-off-white">Practice:</span>
                              <span className="text-blox-white">{day.estimatedPracticeTime}</span>
                            </div>
                            <div className="flex justify-between font-medium border-t border-blox-glass-border pt-1">
                              <span className="text-blox-off-white">Total:</span>
                              <span className="text-blox-white">{day.totalEstimatedTime}</span>
                            </div>
                          </div>

                          {/* Rewards */}
                          <div className="flex justify-between items-center text-xs bg-blox-glass-bg p-2 rounded border border-blox-glass-border">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-blox-off-white">{day.xpReward} XP</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Coins className="h-3 w-3 text-blox-teal" />
                              <span className="text-blox-off-white">{formatBLOXAmount(day.bloxReward)}</span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button size="sm" className="w-full bg-blox-teal hover:bg-blox-teal/80 text-white">
                            Start Day {day.dayNumber}
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}