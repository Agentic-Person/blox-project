import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DailySession {
  date: string
  minutesWatched: number
  videosWatched: number
  sessionsCount: number
  lastSessionEnd?: string
}

interface TimeManagementState {
  // Settings
  dailyLimitMinutes: number
  breakReminderMinutes: number
  parentalControlsEnabled: boolean
  ageGroup: '10-12' | '13-15' | '16-18' | '19-25' | null
  
  // Current session tracking
  currentSessionStart: string | null
  currentSessionMinutes: number
  isOnBreak: boolean
  
  // Daily tracking
  todaySession: DailySession | null
  sessionHistory: DailySession[]
  
  // Actions
  setDailyLimit: (minutes: number) => void
  setBreakReminder: (minutes: number) => void
  setAgeGroup: (ageGroup: '10-12' | '13-15' | '16-18' | '19-25') => void
  enableParentalControls: (enabled: boolean) => void
  
  // Session management
  startSession: () => void
  endSession: () => void
  updateSessionTime: (minutes: number) => void
  takeBreak: () => void
  resumeFromBreak: () => void
  
  // Analytics
  getTodayWatchTime: () => number
  getRemainingTime: () => number
  isOverDailyLimit: () => boolean
  getWeeklyStats: () => {
    totalMinutes: number
    averageDaily: number
    sessionsCount: number
  }
  shouldShowBreakReminder: () => boolean
}

// Default limits by age group (in minutes)
const AGE_GROUP_LIMITS = {
  '10-12': 90,  // 1.5 hours
  '13-15': 120, // 2 hours
  '16-18': 150, // 2.5 hours
  '19-25': 180  // 3 hours
}

// Break reminder intervals by age group (in minutes)
const BREAK_INTERVALS = {
  '10-12': 30,  // Every 30 minutes
  '13-15': 45,  // Every 45 minutes
  '16-18': 60,  // Every hour
  '19-25': 90   // Every 1.5 hours
}

export const useTimeManagementStore = create<TimeManagementState>()(
  persist(
    (set, get) => ({
      // Default settings
      dailyLimitMinutes: 150, // 2.5 hours default
      breakReminderMinutes: 45, // 45 minutes default
      parentalControlsEnabled: false,
      ageGroup: null,
      
      // Session tracking
      currentSessionStart: null,
      currentSessionMinutes: 0,
      isOnBreak: false,
      
      // Daily tracking
      todaySession: null,
      sessionHistory: [],
      
      // Settings actions
      setDailyLimit: (minutes) => set({ dailyLimitMinutes: minutes }),
      
      setBreakReminder: (minutes) => set({ breakReminderMinutes: minutes }),
      
      setAgeGroup: (ageGroup) => 
        set({
          ageGroup,
          dailyLimitMinutes: AGE_GROUP_LIMITS[ageGroup],
          breakReminderMinutes: BREAK_INTERVALS[ageGroup]
        }),
      
      enableParentalControls: (enabled) => set({ parentalControlsEnabled: enabled }),
      
      // Session management
      startSession: () => {
        const now = new Date()
        const today = now.toDateString()
        const { todaySession, sessionHistory } = get()
        
        // Initialize or update today's session
        if (!todaySession || todaySession.date !== today) {
          const newSession: DailySession = {
            date: today,
            minutesWatched: 0,
            videosWatched: 0,
            sessionsCount: 1
          }
          set({
            todaySession: newSession,
            currentSessionStart: now.toISOString(),
            currentSessionMinutes: 0,
            isOnBreak: false
          })
        } else {
          set({
            currentSessionStart: now.toISOString(),
            currentSessionMinutes: 0,
            isOnBreak: false,
            todaySession: {
              ...todaySession,
              sessionsCount: todaySession.sessionsCount + 1
            }
          })
        }
      },
      
      endSession: () => {
        const { todaySession, currentSessionMinutes, sessionHistory } = get()
        const now = new Date()
        
        if (todaySession) {
          const updatedSession = {
            ...todaySession,
            minutesWatched: todaySession.minutesWatched + currentSessionMinutes,
            lastSessionEnd: now.toISOString()
          }
          
          // Archive old sessions
          const today = now.toDateString()
          if (todaySession.date !== today) {
            set({
              sessionHistory: [...sessionHistory, todaySession].slice(-30), // Keep last 30 days
              todaySession: null,
              currentSessionStart: null,
              currentSessionMinutes: 0
            })
          } else {
            set({
              todaySession: updatedSession,
              currentSessionStart: null,
              currentSessionMinutes: 0
            })
          }
        }
      },
      
      updateSessionTime: (minutes) => {
        const { todaySession, currentSessionMinutes } = get()
        const additionalMinutes = minutes - currentSessionMinutes
        
        if (todaySession && additionalMinutes > 0) {
          set({
            currentSessionMinutes: minutes,
            todaySession: {
              ...todaySession,
              minutesWatched: todaySession.minutesWatched + additionalMinutes
            }
          })
        } else {
          set({ currentSessionMinutes: minutes })
        }
      },
      
      takeBreak: () => set({ isOnBreak: true }),
      
      resumeFromBreak: () => set({ isOnBreak: false }),
      
      // Analytics
      getTodayWatchTime: () => {
        const { todaySession } = get()
        const today = new Date().toDateString()
        
        if (todaySession && todaySession.date === today) {
          return todaySession.minutesWatched
        }
        return 0
      },
      
      getRemainingTime: () => {
        const { dailyLimitMinutes, getTodayWatchTime } = get()
        const watched = getTodayWatchTime()
        return Math.max(0, dailyLimitMinutes - watched)
      },
      
      isOverDailyLimit: () => {
        const { dailyLimitMinutes, getTodayWatchTime } = get()
        return getTodayWatchTime() >= dailyLimitMinutes
      },
      
      getWeeklyStats: () => {
        const { sessionHistory, todaySession } = get()
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        const recentSessions = [
          ...sessionHistory.filter(s => new Date(s.date) >= weekAgo),
          todaySession
        ].filter(Boolean) as DailySession[]
        
        const totalMinutes = recentSessions.reduce((sum, s) => sum + s.minutesWatched, 0)
        const sessionsCount = recentSessions.reduce((sum, s) => sum + s.sessionsCount, 0)
        const averageDaily = recentSessions.length > 0 ? totalMinutes / recentSessions.length : 0
        
        return {
          totalMinutes,
          averageDaily: Math.round(averageDaily),
          sessionsCount
        }
      },
      
      shouldShowBreakReminder: () => {
        const { currentSessionMinutes, breakReminderMinutes, isOnBreak } = get()
        return !isOnBreak && currentSessionMinutes >= breakReminderMinutes
      }
    }),
    {
      name: 'time-management-store'
    }
  )
)