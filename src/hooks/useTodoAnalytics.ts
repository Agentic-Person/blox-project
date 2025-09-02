// Todo Analytics Hook
// Part of: Phase A Analytics Implementation

import { useMemo } from 'react'
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, subDays, isSameDay } from 'date-fns'
import type { Todo } from '@/types/todo'

interface AnalyticsData {
  completionRate: number
  averageTaskTime: number
  totalCompleted: number
  totalTasks: number
  weeklyTrend: number
  categoryStats: CategoryStat[]
  priorityStats: PriorityStat[]
  streakData: StreakData
  velocityData: VelocityData[]
  timeAccuracyData: TimeAccuracyData[]
  loading: boolean
}

interface CategoryStat {
  category: string
  count: number
  completed: number
  percentage: number
  averageTime: number
}

interface PriorityStat {
  priority: string
  count: number
  completed: number
  percentage: number
  color: string
}

interface StreakData {
  currentStreak: number
  longestStreak: number
  streakHistory: { date: string; active: boolean }[]
}

interface VelocityData {
  date: string
  completed: number
  created: number
  net: number
}

interface TimeAccuracyData {
  date: string
  estimated: number
  actual: number
  accuracy: number
}

export function useTodoAnalytics(todos: Todo[]): AnalyticsData {
  return useMemo(() => {
    if (!todos || todos.length === 0) {
      return {
        completionRate: 0,
        averageTaskTime: 0,
        totalCompleted: 0,
        totalTasks: 0,
        weeklyTrend: 0,
        categoryStats: [],
        priorityStats: [],
        streakData: { currentStreak: 0, longestStreak: 0, streakHistory: [] },
        velocityData: [],
        timeAccuracyData: [],
        loading: false
      }
    }

    // Basic metrics
    const completedTodos = todos.filter(todo => todo.status === 'completed')
    const totalTasks = todos.length
    const totalCompleted = completedTodos.length
    const completionRate = totalTasks > 0 ? totalCompleted / totalTasks : 0

    // Average task time
    const todosWithTime = completedTodos.filter(todo => todo.actualMinutes && todo.actualMinutes > 0)
    const averageTaskTime = todosWithTime.length > 0 
      ? Math.round(todosWithTime.reduce((sum, todo) => sum + (todo.actualMinutes || 0), 0) / todosWithTime.length)
      : 0

    // Weekly trend (compare this week to last week)
    const now = new Date()
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 })
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 0 })
    const lastWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 0 })
    const lastWeekEnd = endOfWeek(subDays(now, 7), { weekStartsOn: 0 })

    const thisWeekCompleted = completedTodos.filter(todo => {
      if (!todo.completedAt) return false
      const completedDate = new Date(todo.completedAt)
      return completedDate >= thisWeekStart && completedDate <= thisWeekEnd
    }).length

    const lastWeekCompleted = completedTodos.filter(todo => {
      if (!todo.completedAt) return false
      const completedDate = new Date(todo.completedAt)
      return completedDate >= lastWeekStart && completedDate <= lastWeekEnd
    }).length

    const weeklyTrend = lastWeekCompleted > 0 
      ? ((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100
      : thisWeekCompleted > 0 ? 100 : 0

    // Category statistics
    const categoryGroups = todos.reduce((acc, todo) => {
      const category = todo.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = { total: 0, completed: 0, totalTime: 0, count: 0 }
      }
      acc[category].total++
      if (todo.status === 'completed') {
        acc[category].completed++
        if (todo.actualMinutes) {
          acc[category].totalTime += todo.actualMinutes
          acc[category].count++
        }
      }
      return acc
    }, {} as Record<string, { total: number; completed: number; totalTime: number; count: number }>)

    const categoryStats: CategoryStat[] = Object.entries(categoryGroups).map(([category, stats]) => ({
      category,
      count: stats.total,
      completed: stats.completed,
      percentage: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      averageTime: stats.count > 0 ? Math.round(stats.totalTime / stats.count) : 0
    })).sort((a, b) => b.count - a.count)

    // Priority statistics
    const priorityGroups = todos.reduce((acc, todo) => {
      const priority = todo.priority
      if (!acc[priority]) {
        acc[priority] = { total: 0, completed: 0 }
      }
      acc[priority].total++
      if (todo.status === 'completed') {
        acc[priority].completed++
      }
      return acc
    }, {} as Record<string, { total: number; completed: number }>)

    const priorityColors = {
      low: '#6B7280',
      medium: '#3B82F6',
      high: '#F97316',
      urgent: '#EF4444'
    }

    const priorityStats: PriorityStat[] = Object.entries(priorityGroups).map(([priority, stats]) => ({
      priority,
      count: stats.total,
      completed: stats.completed,
      percentage: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      color: priorityColors[priority as keyof typeof priorityColors] || '#6B7280'
    }))

    // Streak calculation
    const last30Days = eachDayOfInterval({ 
      start: subDays(now, 29), 
      end: now 
    })

    const streakHistory = last30Days.map(date => {
      const dayCompleted = completedTodos.some(todo => {
        if (!todo.completedAt) return false
        return isSameDay(new Date(todo.completedAt), date)
      })
      
      return {
        date: format(date, 'yyyy-MM-dd'),
        active: dayCompleted
      }
    })

    // Calculate current streak (working backwards from today)
    let currentStreak = 0
    for (let i = streakHistory.length - 1; i >= 0; i--) {
      if (streakHistory[i].active) {
        currentStreak++
      } else {
        break
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 0
    streakHistory.forEach(day => {
      if (day.active) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    })

    // Velocity data (last 14 days)
    const last14Days = eachDayOfInterval({ 
      start: subDays(now, 13), 
      end: now 
    })

    const velocityData: VelocityData[] = last14Days.map(date => {
      const dayCompleted = completedTodos.filter(todo => {
        if (!todo.completedAt) return false
        return isSameDay(new Date(todo.completedAt), date)
      }).length

      const dayCreated = todos.filter(todo => {
        return isSameDay(new Date(todo.createdAt), date)
      }).length

      return {
        date: format(date, 'MMM d'),
        completed: dayCompleted,
        created: dayCreated,
        net: dayCompleted - dayCreated
      }
    })

    // Time accuracy data
    const todosWithEstimates = completedTodos.filter(todo => 
      todo.estimatedMinutes && todo.actualMinutes && 
      todo.estimatedMinutes > 0 && todo.actualMinutes > 0
    )

    const timeAccuracyData: TimeAccuracyData[] = last14Days.map(date => {
      const dayTodos = todosWithEstimates.filter(todo => {
        if (!todo.completedAt) return false
        return isSameDay(new Date(todo.completedAt), date)
      })

      const totalEstimated = dayTodos.reduce((sum, todo) => sum + (todo.estimatedMinutes || 0), 0)
      const totalActual = dayTodos.reduce((sum, todo) => sum + (todo.actualMinutes || 0), 0)
      
      const accuracy = totalEstimated > 0 
        ? Math.min(100, (Math.min(totalEstimated, totalActual) / Math.max(totalEstimated, totalActual)) * 100)
        : 0

      return {
        date: format(date, 'MMM d'),
        estimated: totalEstimated,
        actual: totalActual,
        accuracy: Math.round(accuracy)
      }
    })

    return {
      completionRate,
      averageTaskTime,
      totalCompleted,
      totalTasks,
      weeklyTrend,
      categoryStats,
      priorityStats,
      streakData: {
        currentStreak,
        longestStreak,
        streakHistory
      },
      velocityData,
      timeAccuracyData,
      loading: false
    }
  }, [todos])
}