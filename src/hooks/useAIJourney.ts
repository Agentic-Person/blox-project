import { useEffect, useMemo } from 'react'
import { useAIJourneyStore, type GameType, type AIJourney } from '@/store/aiJourneyStore'

export interface JourneyProgress {
  completedSkills: number
  totalSkills: number
  completedTasks: number
  totalTasks: number
  percentComplete: number
  estimatedTimeRemaining: number
}

export interface TodayFocus {
  primaryTask?: {
    type: 'video' | 'practice' | 'project'
    title: string
    duration: number
  }
  skillInProgress: string
  progressToday: number
  tasksRemaining: number
}

export interface WeekOverview {
  currentWeek: number
  weeklyGoal: string
  weekProgress: number
  daysRemaining: number
  milestoneReward?: string
}

export const useAIJourney = () => {
  const {
    journey,
    isExpanded,
    showWelcomeOverlay,
    isGenerating,
    setJourney,
    updateProgress,
    completeTask,
    setExpanded,
    hideWelcomeOverlay,
    generateJourneyFromGameType,
    updateAIInsights,
    resetJourney
  } = useAIJourneyStore()

  // Calculate overall progress
  const progress: JourneyProgress = useMemo(() => {
    if (!journey) {
      return {
        completedSkills: 0,
        totalSkills: 0,
        completedTasks: 0,
        totalTasks: 0,
        percentComplete: 0,
        estimatedTimeRemaining: 0
      }
    }

    const completedSkills = journey.skills.filter(s => s.status === 'completed').length
    const totalSkills = journey.skills.length
    
    const totalTasks = journey.schedule.reduce((sum, day) => sum + day.tasks.length, 0)
    const completedTasks = journey.schedule.reduce(
      (sum, day) => sum + day.tasks.filter(t => t.completed).length, 
      0
    )
    
    const percentComplete = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0
    
    const remainingSkills = journey.skills.filter(s => s.status !== 'completed')
    const estimatedTimeRemaining = remainingSkills.reduce((sum, skill) => sum + skill.estimatedHours, 0)

    return {
      completedSkills,
      totalSkills,
      completedTasks,
      totalTasks,
      percentComplete,
      estimatedTimeRemaining
    }
  }, [journey])

  // Get today's focus information
  const todayFocus: TodayFocus = useMemo(() => {
    if (!journey) {
      return {
        skillInProgress: 'No active journey',
        progressToday: 0,
        tasksRemaining: 0
      }
    }

    const today = new Date().toISOString().split('T')[0]
    const todaySchedule = journey.schedule.find(day => day.date === today)
    const todayTasks = todaySchedule?.tasks || []
    
    const primaryTask = todayTasks.find(task => !task.completed)
    const completedToday = todayTasks.filter(t => t.completed).length
    const progressToday = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0
    const tasksRemaining = todayTasks.length - completedToday

    return {
      primaryTask,
      skillInProgress: journey.currentSkill,
      progressToday,
      tasksRemaining
    }
  }, [journey])

  // Get week overview
  const weekOverview: WeekOverview = useMemo(() => {
    if (!journey) {
      return {
        currentWeek: 0,
        weeklyGoal: 'No active journey',
        weekProgress: 0,
        daysRemaining: 0
      }
    }

    const currentSkill = journey.skills.find(s => s.status === 'current')
    const weeklyGoal = currentSkill ? `Master ${currentSkill.name}` : 'Continue learning'
    
    // Mock week progress calculation
    const weekProgress = Math.min(Math.round((journey.currentDay / 7) * 100), 100)
    const daysRemaining = Math.max(7 - (journey.currentDay % 7), 0)

    return {
      currentWeek: journey.currentWeek,
      weeklyGoal,
      weekProgress,
      daysRemaining,
      milestoneReward: currentSkill?.estimatedHours && currentSkill.estimatedHours > 10 ? '🏆 Epic Achievement' : '⭐ Skill Badge'
    }
  }, [journey])

  // Initialize journey for first-time users
  const initializeJourney = (gameType: GameType, customGoal?: string) => {
    generateJourneyFromGameType(gameType, customGoal)
  }

  // Mark task as complete
  const markTaskComplete = (taskIndex: number) => {
    if (!journey) return
    
    const today = new Date().toISOString().split('T')[0]
    completeTask(today, taskIndex)
  }

  // Mark skill as complete
  const markSkillComplete = (skillId: string) => {
    updateProgress(skillId, true)
    
    // Update AI insights based on progress
    if (journey) {
      const skill = journey.skills.find(s => s.id === skillId)
      if (skill) {
        updateAIInsights({
          suggestion: `Great job completing ${skill.name}! Ready for the next challenge?`,
          motivationalTip: `You're making excellent progress on your ${journey.gameTitle}!`
        })
      }
    }
  }

  // Get next action suggestion
  const getNextAction = (): string => {
    if (!journey) return 'Start your learning journey'
    
    const today = new Date().toISOString().split('T')[0]
    const todaySchedule = journey.schedule.find(day => day.date === today)
    const nextTask = todaySchedule?.tasks.find(task => !task.completed)
    
    if (nextTask) {
      return `Continue with: ${nextTask.title}`
    }
    
    const currentSkill = journey.skills.find(s => s.status === 'current')
    if (currentSkill) {
      return `Focus on: ${currentSkill.name}`
    }
    
    return 'Check your learning path'
  }

  // Calculate streak (mock implementation)
  const getStreak = (): number => {
    if (!journey) return 0
    
    // Mock streak calculation based on journey age
    const daysSinceCreated = Math.floor((new Date().getTime() - journey.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    return Math.min(daysSinceCreated + 1, 7) // Cap at 7 days for demo
  }

  // Auto-save journey changes
  useEffect(() => {
    if (journey) {
      // Auto-save logic would go here for Supabase integration
      console.log('AI Journey auto-saved', journey.id)
    }
  }, [journey])

  return {
    // State
    journey,
    isExpanded,
    showWelcomeOverlay,
    isGenerating,
    
    // Calculated data
    progress,
    todayFocus,
    weekOverview,
    
    // Actions
    initializeJourney,
    markTaskComplete,
    markSkillComplete,
    setExpanded,
    hideWelcomeOverlay,
    resetJourney,
    updateAIInsights,
    
    // Helper functions
    getNextAction,
    getStreak,
    
    // Raw store actions for advanced use
    setJourney,
    updateProgress,
    completeTask,
    generateJourneyFromGameType
  }
}