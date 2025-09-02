'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductivityChart } from './ProductivityChart'
import { TimeEstimateAccuracy } from './TimeEstimateAccuracy'
import { CategoryBreakdown } from './CategoryBreakdown'
import { StreakTracker } from './StreakTracker'
import { TaskVelocity } from './TaskVelocity'
import { PriorityDistribution } from './PriorityDistribution'
import { useTodoCalendar } from '@/hooks/useTodoCalendar'
import { useTodoAnalytics } from '@/hooks/useTodoAnalytics'
import { 
  TrendingUp, 
  Target, 
  Clock, 
  CheckCircle, 
  Calendar,
  BarChart3,
  Loader2,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TodoAnalyticsProps {
  className?: string
}

export function TodoAnalytics({ className }: TodoAnalyticsProps) {
  const { todos, todoStats, loadingTodos } = useTodoCalendar()
  
  const {
    completionRate,
    averageTaskTime,
    totalCompleted,
    totalTasks,
    weeklyTrend,
    categoryStats,
    priorityStats,
    streakData,
    velocityData,
    timeAccuracyData,
    loading: analyticsLoading
  } = useTodoAnalytics(todos)

  const loading = loadingTodos || analyticsLoading

  const handleExportReport = () => {
    // Future: Export analytics as PDF/CSV
    console.log('Export analytics report')
  }

  if (loading) {
    return (
      <Card className="card-hover">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blox-teal" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-blox-off-white/60">Completion Rate</p>
                <p className="text-2xl font-bold text-blox-white">
                  {(completionRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-blox-off-white/60">Avg Task Time</p>
                <p className="text-2xl font-bold text-blox-white">
                  {averageTaskTime}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-blox-off-white/60">Total Completed</p>
                <p className="text-2xl font-bold text-blox-white">
                  {totalCompleted}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-blox-off-white/60">Weekly Trend</p>
                <p className="text-2xl font-bold text-blox-white">
                  {weeklyTrend > 0 ? '+' : ''}{weeklyTrend.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blox-teal" />
              <CardTitle className="text-blox-white">Analytics Dashboard</CardTitle>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportReport}
              className="border-blox-teal/30 text-blox-teal hover:bg-blox-teal/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="productivity" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="productivity">Productivity</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="priority">Priority</TabsTrigger>
              <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
              <TabsTrigger value="velocity">Velocity</TabsTrigger>
              <TabsTrigger value="streaks">Streaks</TabsTrigger>
            </TabsList>

            <TabsContent value="productivity" className="space-y-4">
              <ProductivityChart
                data={velocityData}
                completionRate={completionRate}
                weeklyTrend={weeklyTrend}
              />
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <CategoryBreakdown
                data={categoryStats}
                totalTasks={totalTasks}
              />
            </TabsContent>

            <TabsContent value="priority" className="space-y-4">
              <PriorityDistribution
                data={priorityStats}
                totalTasks={totalTasks}
              />
            </TabsContent>

            <TabsContent value="accuracy" className="space-y-4">
              <TimeEstimateAccuracy
                data={timeAccuracyData}
                averageAccuracy={timeAccuracyData.reduce((acc, item) => acc + item.accuracy, 0) / timeAccuracyData.length}
              />
            </TabsContent>

            <TabsContent value="velocity" className="space-y-4">
              <TaskVelocity
                data={velocityData}
                averageVelocity={velocityData.reduce((acc, item) => acc + item.completed, 0) / velocityData.length}
              />
            </TabsContent>

            <TabsContent value="streaks" className="space-y-4">
              <StreakTracker
                data={streakData}
                currentStreak={streakData.currentStreak}
                longestStreak={streakData.longestStreak}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}