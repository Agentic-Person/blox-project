'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import * as Progress from '@radix-ui/react-progress'
import Link from 'next/link'
import { useLearningStore } from '@/store/learningStore'
import curriculumData from '@/data/curriculum.json'
import { useMemo } from 'react'

interface ModuleProgress {
  id: string
  title: string
  progress: number
  completed: boolean
  isCurrentModule?: boolean
  daysCompleted: number
  totalDays: number
}

interface LearningProgressProps {
  modules?: ModuleProgress[]
  overallProgress?: number
}

export function LearningProgress({ 
  modules, 
  overallProgress 
}: LearningProgressProps) {
  const { 
    getModuleProgress, 
    getOverallProgress,
    getCompletedDaysCount,
    getTotalDaysInCurriculum,
    completedDays
  } = useLearningStore()

  // Calculate real module progress from curriculum data - memoized for performance
  const realModules: ModuleProgress[] = useMemo(() => {
    return curriculumData.modules.map((module, index) => {
      const progress = getModuleProgress(module.id)
      const totalDays = module.weeks.reduce((acc, week) => acc + week.days.length, 0)
      const daysCompleted = completedDays.filter(dayId => {
        return module.weeks.some(week => 
          week.days.some(day => day.id === dayId)
        )
      }).length

      // Determine current module (first incomplete module with progress)
      const isCurrentModule = progress > 0 && progress < 100 && 
        index === curriculumData.modules.findIndex(m => {
        const moduleProgress = getModuleProgress(m.id)
        return moduleProgress > 0 && moduleProgress < 100
      })

    // Clean up module title for better display
    let displayTitle = module.title
    if (displayTitle.startsWith('Month ')) {
      displayTitle = displayTitle.replace(/^Month \d+ – /, '')
    }

      return {
        id: module.id,
        title: displayTitle,
        progress,
        completed: progress === 100,
        isCurrentModule,
        daysCompleted,
        totalDays
      }
    })
  }, [getModuleProgress, completedDays])

  const actualModules = modules || realModules
  const actualOverallProgress = overallProgress || getOverallProgress()

  // Calculate stats - memoized for performance
  const moduleStats = useMemo(() => {
    const completedModules = actualModules.filter(m => m.completed).length
    const inProgressModules = actualModules.filter(m => m.progress > 0 && !m.completed).length
    const remainingModules = actualModules.filter(m => m.progress === 0).length
    
    return {
      completedModules,
      inProgressModules,
      remainingModules
    }
  }, [actualModules])
  
  const { completedModules, inProgressModules, remainingModules } = moduleStats
  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-blox-teal" />
          <CardTitle className="text-lg font-semibold text-blox-white">
            Learning Path
          </CardTitle>
        </div>
        
        <Link href="/learning">
          <Button variant="ghost" size="sm" className="text-blox-teal hover:text-blox-teal-light">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blox-off-white">Overall Progress</span>
            <span className="text-blox-white font-medium">{actualOverallProgress}% Complete</span>
          </div>
          
          <Progress.Root 
            className="relative overflow-hidden bg-blox-second-dark-blue rounded-full w-full h-2"
            value={actualOverallProgress}
          >
            <Progress.Indicator
              className="bg-gradient-to-r from-blox-teal to-blox-teal-light h-full w-full flex-1 transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${100 - actualOverallProgress}%)` }}
            />
          </Progress.Root>
        </div>

        {/* Module List */}
        <div className="space-y-3">
          {actualModules.map((module, index) => (
            <div 
              key={module.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                module.isCurrentModule 
                  ? 'bg-blox-teal/10 border border-blox-teal/20' 
                  : 'bg-blox-second-dark-blue/30 hover:bg-blox-second-dark-blue/50'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* Module Status Icon */}
                <div className="flex-shrink-0">
                  {module.completed ? (
                    <CheckCircle className="h-5 w-5 text-blox-success" />
                  ) : module.progress > 0 ? (
                    <div className="relative">
                      <Clock className="h-5 w-5 text-blox-teal" />
                      {module.isCurrentModule && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blox-teal rounded-full animate-pulse" />
                      )}
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-blox-medium-blue-gray" />
                  )}
                </div>

                {/* Module Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm font-medium truncate ${
                      module.completed 
                        ? 'text-blox-success' 
                        : module.isCurrentModule 
                        ? 'text-blox-teal' 
                        : 'text-blox-white'
                    }`}>
                      {module.title}
                    </h4>
                    <span className={`text-xs font-medium ml-2 flex-shrink-0 ${
                      module.completed 
                        ? 'text-blox-success' 
                        : module.progress > 0 
                        ? 'text-blox-teal' 
                        : 'text-blox-off-white'
                    }`}>
                      {module.progress}%
                    </span>
                  </div>

                  {/* Module Progress Bar */}
                  <Progress.Root 
                    className="relative overflow-hidden bg-blox-very-dark-blue rounded-full w-full h-1.5"
                    value={module.progress}
                  >
                    <Progress.Indicator
                      className={`h-full w-full flex-1 transition-transform duration-300 ease-out ${
                        module.completed 
                          ? 'bg-blox-success' 
                          : 'bg-gradient-to-r from-blox-teal to-blox-teal-light'
                      }`}
                      style={{ transform: `translateX(-${100 - module.progress}%)` }}
                    />
                  </Progress.Root>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-blox-medium-blue-gray/30">
          <div className="text-center">
            <div className="text-lg font-bold text-blox-success">{completedModules}</div>
            <div className="text-xs text-blox-off-white">Complete</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blox-teal">{inProgressModules}</div>
            <div className="text-xs text-blox-off-white">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blox-off-white">{remainingModules}</div>
            <div className="text-xs text-blox-off-white">Remaining</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}