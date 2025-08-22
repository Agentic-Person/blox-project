'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight, Play, CheckCircle, Clock, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import * as Accordion from '@radix-ui/react-accordion'

interface VideoItem {
  id: string
  title: string
  duration: string
  completed: boolean
  xp: number
}

interface DayItem {
  id: string
  title: string
  videos: VideoItem[]
  completed: boolean
  estimatedTime: string
}

interface WeekItem {
  id: string
  title: string
  days: DayItem[]
  completed: boolean
  progress: number
}

interface ModuleItem {
  id: string
  title: string
  description: string
  weeks: WeekItem[]
  completed: boolean
  progress: number
  estimatedHours: number
}

// Mock data - this would come from your data store
const learningModules: ModuleItem[] = [
  {
    id: 'module-1',
    title: 'Modern Foundations & 3D Introduction',
    description: 'Master Roblox Studio 2024, Blender 4.1+, and AI tools for 3D creation',
    completed: true,
    progress: 100,
    estimatedHours: 20,
    weeks: [
      {
        id: 'week-1',
        title: 'Roblox Studio 2024 Basics',
        completed: true,
        progress: 100,
        days: [
          {
            id: 'day-1',
            title: 'New Creator Hub & Studio Interface Part 1',
            completed: true,
            estimatedTime: '3 hrs',
            videos: [
              { id: 'v1', title: 'Roblox Studio 2024 Basics', duration: '12:36', completed: true, xp: 50 },
              { id: 'v2', title: 'New Creator Hub Tutorial 2024', duration: '25:00', completed: true, xp: 100 }
            ]
          },
          {
            id: 'day-2',
            title: 'New Creator Hub & Studio Interface Part 2',
            completed: true,
            estimatedTime: '2.5 hrs',
            videos: [
              { id: 'v3', title: 'Modern Studio Interface 2024', duration: '18:45', completed: true, xp: 75 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'module-2',
    title: 'Introduction to Scripting',
    description: 'Learn Lua fundamentals and basic Roblox scripting',
    completed: true,
    progress: 100,
    estimatedHours: 20,
    weeks: []
  },
  {
    id: 'module-3',
    title: 'Advanced Building Techniques',
    description: 'Creating Dynamic Lighting Systems',
    completed: false,
    progress: 67,
    estimatedHours: 20,
    weeks: [
      {
        id: 'week-10',
        title: 'Week 10',
        completed: false,
        progress: 67,
        days: [
          {
            id: 'day-1-w10',
            title: 'Day 1: New Creator Hub & Studio Interface Part 1',
            completed: false,
            estimatedTime: '3 hrs',
            videos: [
              { id: 'v10', title: 'Blender 4.1 Introduction (Part 1)', duration: '50h', completed: false, xp: 50 },
              { id: 'v11', title: 'Blender & Game Assets Continued', duration: '13:26', completed: false, xp: 100 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'module-4',
    title: 'Game Mechanics & Systems',
    description: 'Build complex game systems and mechanics',
    completed: false,
    progress: 0,
    estimatedHours: 20,
    weeks: []
  },
  {
    id: 'module-5',
    title: 'Professional Development',
    description: 'Portfolio building and advanced techniques',
    completed: false,
    progress: 0,
    estimatedHours: 20,
    weeks: []
  },
  {
    id: 'module-6',
    title: 'Capstone Project',
    description: 'Create your final project and portfolio',
    completed: false,
    progress: 0,
    estimatedHours: 20,
    weeks: []
  }
]

export function NavigationTree() {
  const pathname = usePathname()
  const [expandedModules, setExpandedModules] = useState<string[]>(['module-3'])
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>(['week-10'])

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks(prev => 
      prev.includes(weekId) 
        ? prev.filter(id => id !== weekId)
        : [...prev, weekId]
    )
  }

  return (
    <div className="space-y-1">
      {learningModules.map((module) => (
        <div key={module.id} className="space-y-1">
          {/* Module Level */}
          <button
            onClick={() => toggleModule(module.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
              module.completed
                ? "text-blox-success bg-blox-success/10"
                : module.progress > 0
                ? "text-blox-teal bg-blox-teal/10"
                : "text-blox-off-white hover:bg-blox-second-dark-blue hover:text-white"
            )}
          >
            <div className="flex items-center flex-1 text-left">
              <div className="mr-2 flex-shrink-0">
                {expandedModules.includes(module.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
              
              <div className="mr-2 flex-shrink-0">
                {module.completed ? (
                  <CheckCircle className="h-4 w-4 text-blox-success" />
                ) : module.progress > 0 ? (
                  <Play className="h-4 w-4 text-blox-teal" />
                ) : (
                  <Clock className="h-4 w-4 text-blox-off-white" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{module.title}</div>
                <div className="text-xs text-blox-off-white/70 truncate">
                  {module.estimatedHours}hrs • {module.progress}% complete
                </div>
              </div>
            </div>
            
            {module.completed && (
              <Trophy className="h-4 w-4 text-blox-success ml-2 flex-shrink-0" />
            )}
          </button>

          {/* Weeks Level */}
          {expandedModules.includes(module.id) && module.weeks.length > 0 && (
            <div className="ml-6 space-y-1">
              {module.weeks.map((week) => (
                <div key={week.id} className="space-y-1">
                  <button
                    onClick={() => toggleWeek(week.id)}
                    className={cn(
                      "w-full flex items-center px-3 py-1.5 rounded-md text-xs transition-all duration-200",
                      week.completed
                        ? "text-blox-success bg-blox-success/5"
                        : week.progress > 0
                        ? "text-blox-teal bg-blox-teal/5"
                        : "text-blox-off-white hover:bg-blox-second-dark-blue/50"
                    )}
                  >
                    <div className="mr-2">
                      {expandedWeeks.includes(week.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </div>
                    
                    <div className="mr-2">
                      {week.completed ? (
                        <CheckCircle className="h-3 w-3 text-blox-success" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                    </div>
                    
                    <span className="flex-1 text-left truncate">{week.title}</span>
                    <span className="text-xs text-blox-off-white/50 ml-2">
                      {week.progress}%
                    </span>
                  </button>

                  {/* Days Level */}
                  {expandedWeeks.includes(week.id) && (
                    <div className="ml-6 space-y-1">
                      {week.days.map((day) => (
                        <Link
                          key={day.id}
                          href={`/learning/${module.id}/${week.id}/${day.id}`}
                          className={cn(
                            "flex items-center px-3 py-1.5 rounded-md text-xs transition-all duration-200",
                            pathname.includes(day.id)
                              ? "bg-blox-teal text-white"
                              : day.completed
                              ? "text-blox-success hover:bg-blox-success/5"
                              : "text-blox-off-white hover:bg-blox-second-dark-blue/30"
                          )}
                        >
                          <div className="mr-2">
                            {day.completed ? (
                              <CheckCircle className="h-3 w-3 text-blox-success" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{day.title}</div>
                            <div className="text-blox-off-white/50 text-xs">
                              {day.videos.length} videos • {day.estimatedTime}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}