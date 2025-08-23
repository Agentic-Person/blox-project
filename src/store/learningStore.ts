import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { xpToBLOX, calculateStreakBonus } from '@/lib/learning/xp-to-blox'
import curriculumData from '@/data/curriculum.json'

interface ModuleProgress {
  status: 'not_started' | 'in_progress' | 'completed'
  completionPercentage: number
  xpEarned: number
  bloxEarned: number
  certificateEarned?: boolean
}

interface WeekProgress {
  status: 'not_started' | 'in_progress' | 'completed'
  completionPercentage: number
  xpEarned: number
  bloxEarned: number
}

interface DayProgress {
  status: 'not_started' | 'in_progress' | 'completed'
  completionPercentage: number
  xpEarned: number
  bloxEarned: number
  videosCompleted: string[]
  practiceCompleted: boolean
}

interface VideoProgress {
  videoId: string
  completed: boolean
  watchedDuration: number
  totalDuration: number
  xpEarned: number
  completedAt?: Date
}

interface LearningState {
  completedLessons: string[]
  completedVideos: string[]
  completedDays: string[]
  completedWeeks: string[]
  completedModules: string[]
  currentLesson: string | null
  videoProgress: Record<string, VideoProgress>
  totalHoursWatched: number
  totalXP: number
  totalBLOXEarned: number
  currentStreak: number
  lastActivityDate: string | null
  // Day-level actions
  markDayComplete: (dayId: string) => void
  markDayIncomplete: (dayId: string) => void
  isDayCompleted: (dayId: string) => boolean
  // Video-level actions
  markVideoComplete: (videoId: string, xpReward: number) => void
  markVideoIncomplete: (videoId: string) => void
  isVideoCompleted: (videoId: string) => boolean
  updateVideoProgress: (videoId: string, watchedDuration: number, totalDuration: number) => void
  // Legacy lesson actions (for backward compatibility)
  markLessonComplete: (lessonId: string, xpReward?: number) => void
  markLessonIncomplete: (lessonId: string) => void
  setCurrentLesson: (lessonId: string | null) => void
  isLessonCompleted: (lessonId: string) => boolean
  // Progress calculation
  getModuleProgress: (moduleId: string) => number
  getWeekProgress: (weekId: string) => number
  getDayProgress: (dayId: string) => DayProgress
  calculateModuleProgress: (moduleId: string) => ModuleProgress
  calculateWeekProgress: (weekId: string) => WeekProgress
  // Utility functions
  addWatchTime: (hours: number) => void
  addXP: (xp: number) => void
  addBLOX: (blox: number) => void
  updateStreak: () => void
  claimDailyBonus: () => number
  getTotalDaysInCurriculum: () => number
  getCompletedDaysCount: () => number
  getOverallProgress: () => number
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      completedLessons: [],
      completedVideos: [],
      completedDays: [],
      completedWeeks: [],
      completedModules: [],
      currentLesson: null,
      videoProgress: {},
      totalHoursWatched: 0,
      totalXP: 0,
      totalBLOXEarned: 0,
      currentStreak: 0,
      lastActivityDate: null,
      
      // Day-level actions
      markDayComplete: (dayId: string) =>
        set((state) => ({
          completedDays: Array.from(new Set([...state.completedDays, dayId]))
        })),
      
      markDayIncomplete: (dayId: string) =>
        set((state) => ({
          completedDays: state.completedDays.filter(id => id !== dayId)
        })),
      
      isDayCompleted: (dayId: string) => {
        return get().completedDays.includes(dayId)
      },
      
      // Video-level actions
      markVideoComplete: (videoId: string, xpReward: number) =>
        set((state) => {
          const bloxReward = xpToBLOX(xpReward)
          const bonusBlox = calculateStreakBonus(bloxReward, state.currentStreak)
          
          return {
            completedVideos: Array.from(new Set([...state.completedVideos, videoId])),
            videoProgress: {
              ...state.videoProgress,
              [videoId]: {
                ...state.videoProgress[videoId],
                videoId,
                completed: true,
                xpEarned: xpReward,
                completedAt: new Date()
              }
            },
            totalXP: state.totalXP + xpReward,
            totalBLOXEarned: state.totalBLOXEarned + bonusBlox
          }
        }),
      
      markVideoIncomplete: (videoId: string) =>
        set((state) => ({
          completedVideos: state.completedVideos.filter(id => id !== videoId),
          videoProgress: {
            ...state.videoProgress,
            [videoId]: {
              ...state.videoProgress[videoId],
              completed: false,
              completedAt: undefined
            }
          }
        })),
      
      isVideoCompleted: (videoId: string) => {
        return get().completedVideos.includes(videoId)
      },
      
      updateVideoProgress: (videoId: string, watchedDuration: number, totalDuration: number) =>
        set((state) => ({
          videoProgress: {
            ...state.videoProgress,
            [videoId]: {
              ...state.videoProgress[videoId],
              videoId,
              watchedDuration,
              totalDuration,
              completed: watchedDuration >= totalDuration * 0.9 // 90% completion threshold
            }
          }
        })),
      
      // Legacy lesson actions (for backward compatibility)
      markLessonComplete: (lessonId: string, xpReward: number = 100) =>
        set((state) => {
          const bloxReward = xpToBLOX(xpReward)
          const bonusBlox = calculateStreakBonus(bloxReward, state.currentStreak)
          
          return {
            completedLessons: Array.from(new Set([...state.completedLessons, lessonId])),
            totalXP: state.totalXP + xpReward,
            totalBLOXEarned: state.totalBLOXEarned + bonusBlox
          }
        }),
      
      markLessonIncomplete: (lessonId: string) =>
        set((state) => ({
          completedLessons: state.completedLessons.filter(id => id !== lessonId)
        })),
      
      setCurrentLesson: (lessonId: string | null) =>
        set({ currentLesson: lessonId }),
      
      isLessonCompleted: (lessonId: string) => {
        return get().completedLessons.includes(lessonId)
      },
      
      // Progress calculation using real curriculum data
      getModuleProgress: (moduleId: string) => {
        const { completedDays } = get()
        const module = curriculumData.modules.find(m => m.id === moduleId)
        if (!module) return 0
        
        const totalDays = module.weeks.reduce((acc, week) => acc + week.days.length, 0)
        const completedModuleDays = completedDays.filter(dayId => {
          return module.weeks.some(week => 
            week.days.some(day => day.id === dayId)
          )
        }).length
        
        return totalDays > 0 ? Math.round((completedModuleDays / totalDays) * 100) : 0
      },
      
      getWeekProgress: (weekId: string) => {
        const { completedDays } = get()
        let targetWeek = null
        
        for (const module of curriculumData.modules) {
          const week = module.weeks.find(w => w.id === weekId)
          if (week) {
            targetWeek = week
            break
          }
        }
        
        if (!targetWeek) return 0
        
        const totalDays = targetWeek.days.length
        const completedWeekDays = completedDays.filter(dayId => 
          targetWeek.days.some(day => day.id === dayId)
        ).length
        
        return totalDays > 0 ? Math.round((completedWeekDays / totalDays) * 100) : 0
      },
      
      getDayProgress: (dayId: string): DayProgress => {
        const { completedVideos, isDayCompleted } = get()
        let targetDay = null
        
        for (const module of curriculumData.modules) {
          for (const week of module.weeks) {
            const day = week.days.find(d => d.id === dayId)
            if (day) {
              targetDay = day
              break
            }
          }
          if (targetDay) break
        }
        
        if (!targetDay) {
          return {
            status: 'not_started',
            completionPercentage: 0,
            xpEarned: 0,
            bloxEarned: 0,
            videosCompleted: [],
            practiceCompleted: false
          }
        }
        
        const videosCompleted = targetDay.videos.filter(video => 
          completedVideos.includes(video.id)
        ).map(video => video.id)
        
        const totalVideos = targetDay.videos.length
        const completedCount = videosCompleted.length
        const practiceCompleted = isDayCompleted(dayId)
        
        const videoProgress = totalVideos > 0 ? (completedCount / totalVideos) * 80 : 80 // 80% for videos
        const practiceProgress = practiceCompleted ? 20 : 0 // 20% for practice
        const completionPercentage = Math.round(videoProgress + practiceProgress)
        
        const xpEarned = targetDay.videos
          .filter(video => completedVideos.includes(video.id))
          .reduce((acc, video) => acc + video.xpReward, 0)
        
        return {
          status: completionPercentage === 0 ? 'not_started' : 
                 completionPercentage === 100 ? 'completed' : 'in_progress',
          completionPercentage,
          xpEarned,
          bloxEarned: Math.round(xpEarned * 0.1), // Convert XP to BLOX
          videosCompleted,
          practiceCompleted
        }
      },
      
      calculateModuleProgress: (moduleId: string): ModuleProgress => {
        const { completedDays, completedVideos } = get()
        const module = curriculumData.modules.find(m => m.id === moduleId)
        
        if (!module) {
          return {
            status: 'not_started',
            completionPercentage: 0,
            xpEarned: 0,
            bloxEarned: 0,
            certificateEarned: false
          }
        }
        
        const totalDays = module.weeks.reduce((acc, week) => acc + week.days.length, 0)
        const completedModuleDays = completedDays.filter(dayId => {
          return module.weeks.some(week => 
            week.days.some(day => day.id === dayId)
          )
        }).length
        
        const percentage = totalDays > 0 ? Math.round((completedModuleDays / totalDays) * 100) : 0
        
        // Calculate XP earned from completed videos in this module
        let xpEarned = 0
        for (const week of module.weeks) {
          for (const day of week.days) {
            for (const video of day.videos) {
              if (completedVideos.includes(video.id)) {
                xpEarned += video.xpReward
              }
            }
          }
        }
        
        return {
          status: percentage === 0 ? 'not_started' : percentage === 100 ? 'completed' : 'in_progress',
          completionPercentage: percentage,
          xpEarned,
          bloxEarned: Math.round(xpEarned * 0.1),
          certificateEarned: percentage === 100
        }
      },
      
      calculateWeekProgress: (weekId: string): WeekProgress => {
        const { completedDays, completedVideos } = get()
        let targetWeek = null
        
        for (const module of curriculumData.modules) {
          const week = module.weeks.find(w => w.id === weekId)
          if (week) {
            targetWeek = week
            break
          }
        }
        
        if (!targetWeek) {
          return {
            status: 'not_started',
            completionPercentage: 0,
            xpEarned: 0,
            bloxEarned: 0
          }
        }
        
        const totalDays = targetWeek.days.length
        const completedWeekDays = completedDays.filter(dayId => 
          targetWeek.days.some(day => day.id === dayId)
        ).length
        
        const percentage = totalDays > 0 ? Math.round((completedWeekDays / totalDays) * 100) : 0
        
        // Calculate XP earned from completed videos in this week
        let xpEarned = 0
        for (const day of targetWeek.days) {
          for (const video of day.videos) {
            if (completedVideos.includes(video.id)) {
              xpEarned += video.xpReward
            }
          }
        }
        
        return {
          status: percentage === 0 ? 'not_started' : percentage === 100 ? 'completed' : 'in_progress',
          completionPercentage: percentage,
          xpEarned,
          bloxEarned: Math.round(xpEarned * 0.1)
        }
      },
      
      addWatchTime: (hours: number) =>
        set((state) => ({
          totalHoursWatched: state.totalHoursWatched + hours
        })),
      
      addXP: (xp: number) =>
        set((state) => {
          const bloxEarned = xpToBLOX(xp)
          return {
            totalXP: state.totalXP + xp,
            totalBLOXEarned: state.totalBLOXEarned + bloxEarned
          }
        }),
      
      addBLOX: (blox: number) =>
        set((state) => ({
          totalBLOXEarned: state.totalBLOXEarned + blox
        })),
      
      updateStreak: () =>
        set((state) => {
          const today = new Date().toDateString()
          const lastDate = state.lastActivityDate
          
          if (!lastDate) {
            return { currentStreak: 1, lastActivityDate: today }
          }
          
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toDateString()
          
          if (lastDate === today) {
            return state // Already updated today
          } else if (lastDate === yesterdayStr) {
            return { 
              currentStreak: state.currentStreak + 1, 
              lastActivityDate: today 
            }
          } else {
            return { currentStreak: 1, lastActivityDate: today }
          }
        }),
      
      claimDailyBonus: () => {
        const { currentStreak } = get()
        const baseBonus = 50 // 50 BLOX daily bonus
        const streakBonus = calculateStreakBonus(baseBonus, currentStreak)
        
        set((state) => ({
          totalBLOXEarned: state.totalBLOXEarned + streakBonus
        }))
        
        return streakBonus
      },
      
      // New utility functions
      getTotalDaysInCurriculum: () => {
        return curriculumData.modules.reduce((total, module) => {
          return total + module.weeks.reduce((weekTotal, week) => {
            return weekTotal + week.days.length
          }, 0)
        }, 0)
      },
      
      getCompletedDaysCount: () => {
        return get().completedDays.length
      },
      
      getOverallProgress: () => {
        const { getTotalDaysInCurriculum, getCompletedDaysCount } = get()
        const totalDays = getTotalDaysInCurriculum()
        const completedDays = getCompletedDaysCount()
        
        return totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
      }
    }),
    {
      name: 'learning-store',
      partialize: (state) => ({
        completedLessons: state.completedLessons,
        completedVideos: state.completedVideos,
        completedDays: state.completedDays,
        completedWeeks: state.completedWeeks,
        completedModules: state.completedModules,
        currentLesson: state.currentLesson,
        videoProgress: state.videoProgress,
        totalHoursWatched: state.totalHoursWatched,
        totalXP: state.totalXP,
        totalBLOXEarned: state.totalBLOXEarned,
        currentStreak: state.currentStreak,
        lastActivityDate: state.lastActivityDate
      })
    }
  )
)