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
    router.push(`/learning/${module.id}`)
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
      {/* Modules View */}
      <div className="space-y-4">
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
            "grid grid-cols-1 md:grid-cols-2 gap-6" : 
            "space-y-4"
          }>
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                isLocked={false}
                onStartModule={() => handleModuleSelect(module)}
                onContinueModule={() => handleModuleSelect(module)}
              />
            ))}
          </div>
      </div>
    </div>
  )
}