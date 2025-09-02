'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flame, Target, Calendar, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

interface StreakData {
  currentStreak: number
  longestStreak: number
  streakHistory: { date: string; active: boolean }[]
}

interface StreakTrackerProps {
  data: StreakData
  currentStreak: number
  longestStreak: number
}

export function StreakTracker({ data, currentStreak, longestStreak }: StreakTrackerProps) {
  const streakPercentage = data.streakHistory.filter(day => day.active).length / data.streakHistory.length * 100
  
  // Group history into weeks for better visualization
  const weeks: { date: string; active: boolean }[][] = []
  for (let i = 0; i < data.streakHistory.length; i += 7) {
    weeks.push(data.streakHistory.slice(i, i + 7))
  }

  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return { level: 'Fire Master', color: 'text-red-500', icon: '🔥' }
    if (streak >= 21) return { level: 'Streak Legend', color: 'text-orange-500', icon: '⚡' }
    if (streak >= 14) return { level: 'Consistency King', color: 'text-yellow-500', icon: '👑' }
    if (streak >= 7) return { level: 'Week Warrior', color: 'text-green-500', icon: '💪' }
    if (streak >= 3) return { level: 'Getting Started', color: 'text-blue-500', icon: '🌱' }
    return { level: 'Just Beginning', color: 'text-gray-500', icon: '🎯' }
  }

  const currentLevel = getStreakLevel(currentStreak)
  const nextMilestone = currentStreak < 3 ? 3 : currentStreak < 7 ? 7 : currentStreak < 14 ? 14 : currentStreak < 21 ? 21 : 30
  const progressToNext = currentStreak >= 30 ? 100 : (currentStreak / nextMilestone) * 100

  return (
    <div className="space-y-6">
      {/* Streak Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-orange-500/20">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-blox-off-white/60">Current Streak</p>
                <p className="text-2xl font-bold text-blox-white">
                  {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-purple-500/20">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-blox-off-white/60">Best Streak</p>
                <p className="text-2xl font-bold text-blox-white">
                  {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <Calendar className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-blox-off-white/60">Active Days</p>
                <p className="text-2xl font-bold text-blox-white">
                  {streakPercentage.toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Level and Progress */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blox-white flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Streak Level</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{currentLevel.icon}</span>
                <div>
                  <h3 className={cn("text-lg font-semibold", currentLevel.color)}>
                    {currentLevel.level}
                  </h3>
                  <p className="text-sm text-blox-off-white/60">
                    {currentStreak} day streak
                  </p>
                </div>
              </div>
              
              <Badge variant={currentStreak >= 7 ? "default" : "outline"} className="text-xs">
                Level {currentStreak < 3 ? 1 : currentStreak < 7 ? 2 : currentStreak < 14 ? 3 : currentStreak < 21 ? 4 : currentStreak < 30 ? 5 : 6}
              </Badge>
            </div>

            {/* Progress to next level */}
            {currentStreak < 30 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-blox-off-white/60">
                    Progress to next milestone
                  </span>
                  <span className="text-xs text-blox-white">
                    {currentStreak}/{nextMilestone} days
                  </span>
                </div>
                <div className="w-full bg-blox-second-dark-blue/30 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blox-teal to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Streak Calendar */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blox-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Last 30 Days</span>
            </div>
            <span className="text-xs text-blox-off-white/60">
              {data.streakHistory.filter(day => day.active).length} active days
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex space-x-1">
                {week.map((day, dayIndex) => {
                  const date = parseISO(day.date)
                  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  
                  return (
                    <div
                      key={day.date}
                      className={cn(
                        "w-6 h-6 rounded-sm border flex items-center justify-center text-xs font-medium transition-colors",
                        day.active 
                          ? "bg-green-500/80 border-green-500 text-white" 
                          : "bg-blox-second-dark-blue/20 border-blox-second-dark-blue/30 text-blox-off-white/40",
                        isToday && "ring-2 ring-blox-teal/50"
                      )}
                      title={`${format(date, 'MMM d, yyyy')}${day.active ? ' - Active' : ' - Inactive'}`}
                    >
                      {day.active ? '✓' : ''}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-blox-off-white/60">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500/80 rounded-sm" />
              <span>Completed tasks</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blox-second-dark-blue/20 border border-blox-second-dark-blue/30 rounded-sm" />
              <span>No tasks</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}