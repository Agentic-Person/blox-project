'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Clock, Play, Pause, AlertCircle, Coffee, Timer, TrendingUp } from 'lucide-react'
import { useTimeManagementStore } from '@/store/timeManagementStore'
import { formatSecondsAsDuration } from '@/lib/youtube'

export function TimeTracker() {
  const [currentTime, setCurrentTime] = useState(0)
  
  const {
    dailyLimitMinutes,
    currentSessionMinutes,
    currentSessionStart,
    isOnBreak,
    getTodayWatchTime,
    getRemainingTime,
    isOverDailyLimit,
    shouldShowBreakReminder,
    startSession,
    endSession,
    updateSessionTime,
    takeBreak,
    resumeFromBreak,
    getWeeklyStats
  } = useTimeManagementStore()

  const todayWatchTime = getTodayWatchTime()
  const remainingTime = getRemainingTime()
  const overLimit = isOverDailyLimit()
  const needsBreak = shouldShowBreakReminder()
  const weeklyStats = getWeeklyStats()

  // Update session time every minute
  useEffect(() => {
    if (currentSessionStart && !isOnBreak) {
      const interval = setInterval(() => {
        const start = new Date(currentSessionStart)
        const now = new Date()
        const minutes = Math.floor((now.getTime() - start.getTime()) / 60000)
        setCurrentTime(minutes)
        updateSessionTime(minutes)
      }, 60000) // Update every minute

      return () => clearInterval(interval)
    }
  }, [currentSessionStart, isOnBreak, updateSessionTime])

  const progressPercentage = Math.min(100, (todayWatchTime / dailyLimitMinutes) * 100)

  return (
    <div className="space-y-4">
      {/* Daily Progress Card */}
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-blox-white flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blox-teal" />
              <span>Daily Learning Time</span>
            </CardTitle>
            {currentSessionStart && (
              <Button
                size="sm"
                variant="ghost"
                onClick={isOnBreak ? resumeFromBreak : takeBreak}
                className="text-blox-off-white hover:text-blox-white"
              >
                {isOnBreak ? (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Coffee className="h-4 w-4 mr-1" />
                    Take Break
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-blox-off-white">
              <span>{formatSecondsAsDuration(todayWatchTime * 60)} watched</span>
              <span>{formatSecondsAsDuration(dailyLimitMinutes * 60)} daily limit</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className={`h-3 ${overLimit ? 'bg-blox-error/20' : 'bg-blox-medium-blue-gray'}`}
            />
          </div>

          {/* Status Messages */}
          {overLimit && (
            <div className="flex items-center space-x-2 text-blox-warning text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>You've reached your daily limit! Time to take a break 🎮</span>
            </div>
          )}

          {needsBreak && !isOnBreak && (
            <div className="flex items-center space-x-2 text-blox-teal text-sm">
              <Coffee className="h-4 w-4" />
              <span>Time for a 5-minute break! Stretch and rest your eyes 👀</span>
            </div>
          )}

          {remainingTime > 0 && !overLimit && (
            <div className="text-sm text-blox-off-white">
              <span className="text-blox-teal font-semibold">
                {formatSecondsAsDuration(remainingTime * 60)}
              </span>
              {' '}remaining today
            </div>
          )}

          {/* Session Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-blox-medium-blue-gray">
            {currentSessionStart ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-blox-off-white">
                  <Timer className="h-4 w-4 text-blox-teal" />
                  <span>Session: {formatSecondsAsDuration(currentSessionMinutes * 60)}</span>
                  {isOnBreak && <span className="text-blox-warning">(On Break)</span>}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={endSession}
                  className="border-blox-error text-blox-error hover:bg-blox-error/10"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  End Session
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm text-blox-off-white">No active session</span>
                <Button
                  size="sm"
                  onClick={startSession}
                  disabled={overLimit}
                  className="bg-blox-teal hover:bg-blox-teal-light text-white"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start Session
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Stats Card */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-blox-white flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blox-teal" />
            <span>This Week</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blox-teal">
                {Math.floor(weeklyStats.totalMinutes / 60)}h
              </div>
              <div className="text-xs text-blox-off-white">Total Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blox-white">
                {weeklyStats.averageDaily}m
              </div>
              <div className="text-xs text-blox-off-white">Daily Avg</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blox-warning">
                {weeklyStats.sessionsCount}
              </div>
              <div className="text-xs text-blox-off-white">Sessions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}