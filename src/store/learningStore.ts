import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LearningState {
  completedLessons: string[]
  currentLesson: string | null
  completedModules: string[]
  completedWeeks: string[]
  totalHoursWatched: number
  totalXP: number
  markLessonComplete: (lessonId: string) => void
  markLessonIncomplete: (lessonId: string) => void
  setCurrentLesson: (lessonId: string | null) => void
  isLessonCompleted: (lessonId: string) => boolean
  getModuleProgress: (moduleId: string) => number
  getWeekProgress: (weekId: string) => number
  addWatchTime: (hours: number) => void
  addXP: (xp: number) => void
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      completedLessons: [],
      currentLesson: null,
      completedModules: [],
      completedWeeks: [],
      totalHoursWatched: 0,
      totalXP: 0,
      
      markLessonComplete: (lessonId: string) =>
        set((state) => ({
          completedLessons: [...new Set([...state.completedLessons, lessonId])]
        })),
      
      markLessonIncomplete: (lessonId: string) =>
        set((state) => ({
          completedLessons: state.completedLessons.filter(id => id !== lessonId)
        })),
      
      setCurrentLesson: (lessonId: string | null) =>
        set({ currentLesson: lessonId }),
      
      isLessonCompleted: (lessonId: string) => {
        return get().completedLessons.includes(lessonId)
      },
      
      getModuleProgress: (moduleId: string) => {
        // Calculate module progress based on completed lessons
        // This is a simplified version - you can enhance this based on your data structure
        const { completedLessons } = get()
        // For now, return a placeholder - you can implement based on your curriculum structure
        return completedLessons.filter(id => id.includes(moduleId)).length * 10
      },
      
      getWeekProgress: (weekId: string) => {
        // Calculate week progress based on completed lessons
        const { completedLessons } = get()
        return completedLessons.filter(id => id.includes(weekId)).length * 20
      },
      
      addWatchTime: (hours: number) =>
        set((state) => ({
          totalHoursWatched: state.totalHoursWatched + hours
        })),
      
      addXP: (xp: number) =>
        set((state) => ({
          totalXP: state.totalXP + xp
        }))
    }),
    {
      name: 'learning-store',
      partialize: (state) => ({
        completedLessons: state.completedLessons,
        currentLesson: state.currentLesson,
        completedModules: state.completedModules,
        completedWeeks: state.completedWeeks,
        totalHoursWatched: state.totalHoursWatched,
        totalXP: state.totalXP
      })
    }
  )
)