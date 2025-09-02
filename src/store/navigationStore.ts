'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface NavigationState {
  // Current navigation position
  currentModuleId: string | null
  currentWeekId: string | null
  currentDayId: string | null
  currentVideoId: string | null
  
  // UI state
  showLearningNav: boolean
  expandedModules: Set<string>
  expandedWeeks: Set<string>
  
  // Actions
  setCurrentPosition: (moduleId?: string, weekId?: string, dayId?: string, videoId?: string) => void
  navigateToModule: (moduleId: string) => void
  navigateToWeek: (moduleId: string, weekId: string) => void
  navigateToDay: (moduleId: string, weekId: string, dayId: string) => void
  navigateToVideo: (moduleId: string, weekId: string, dayId: string, videoId: string) => void
  
  // UI state management
  setShowLearningNav: (show: boolean) => void
  toggleLearningNav: () => void
  expandModule: (moduleId: string) => void
  collapseModule: (moduleId: string) => void
  toggleModule: (moduleId: string) => void
  expandWeek: (moduleId: string, weekId: string) => void
  collapseWeek: (moduleId: string, weekId: string) => void
  toggleWeek: (moduleId: string, weekId: string) => void
  
  // Auto-expand utilities
  autoExpandForPosition: (moduleId?: string, weekId?: string, dayId?: string) => void
  resetNavigation: () => void
  
  // URL sync
  updateFromUrl: (pathname: string) => void
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentModuleId: null,
      currentWeekId: null,
      currentDayId: null,
      currentVideoId: null,
      showLearningNav: false,
      expandedModules: new Set<string>(),
      expandedWeeks: new Set<string>(),

      // Navigation actions
      setCurrentPosition: (moduleId, weekId, dayId, videoId) => {
        set({
          currentModuleId: moduleId || null,
          currentWeekId: weekId || null,
          currentDayId: dayId || null,
          currentVideoId: videoId || null,
        })
        
        // Auto-expand when position is set
        get().autoExpandForPosition(moduleId, weekId, dayId)
      },

      navigateToModule: (moduleId: string) => {
        set({
          currentModuleId: moduleId,
          currentWeekId: null,
          currentDayId: null,
          currentVideoId: null,
          showLearningNav: true
        })
        get().autoExpandForPosition(moduleId)
      },

      navigateToWeek: (moduleId: string, weekId: string) => {
        set({
          currentModuleId: moduleId,
          currentWeekId: weekId,
          currentDayId: null,
          currentVideoId: null,
          showLearningNav: true
        })
        get().autoExpandForPosition(moduleId, weekId)
      },

      navigateToDay: (moduleId: string, weekId: string, dayId: string) => {
        set({
          currentModuleId: moduleId,
          currentWeekId: weekId,
          currentDayId: dayId,
          currentVideoId: null,
          showLearningNav: true
        })
        get().autoExpandForPosition(moduleId, weekId, dayId)
      },

      navigateToVideo: (moduleId: string, weekId: string, dayId: string, videoId: string) => {
        set({
          currentModuleId: moduleId,
          currentWeekId: weekId,
          currentDayId: dayId,
          currentVideoId: videoId,
          showLearningNav: true
        })
        get().autoExpandForPosition(moduleId, weekId, dayId)
      },

      // UI state management
      setShowLearningNav: (show: boolean) => set({ showLearningNav: show }),
      
      toggleLearningNav: () => set((state) => ({ showLearningNav: !state.showLearningNav })),

      expandModule: (moduleId: string) => {
        set((state) => ({
          expandedModules: new Set(state.expandedModules).add(moduleId)
        }))
      },

      collapseModule: (moduleId: string) => {
        set((state) => {
          const newModules = new Set(state.expandedModules)
          newModules.delete(moduleId)
          
          // Also collapse all weeks in this module
          const newWeeks = new Set(state.expandedWeeks)
          state.expandedWeeks.forEach(weekKey => {
            if (weekKey.startsWith(`${moduleId}-`)) {
              newWeeks.delete(weekKey)
            }
          })
          
          return {
            expandedModules: newModules,
            expandedWeeks: newWeeks
          }
        })
      },

      toggleModule: (moduleId: string) => {
        const state = get()
        if (state.expandedModules.has(moduleId)) {
          state.collapseModule(moduleId)
        } else {
          state.expandModule(moduleId)
        }
      },

      expandWeek: (moduleId: string, weekId: string) => {
        const weekKey = `${moduleId}-${weekId}`
        set((state) => ({
          expandedWeeks: new Set(state.expandedWeeks).add(weekKey),
          expandedModules: new Set(state.expandedModules).add(moduleId) // Auto-expand module too
        }))
      },

      collapseWeek: (moduleId: string, weekId: string) => {
        const weekKey = `${moduleId}-${weekId}`
        set((state) => {
          const newWeeks = new Set(state.expandedWeeks)
          newWeeks.delete(weekKey)
          return { expandedWeeks: newWeeks }
        })
      },

      toggleWeek: (moduleId: string, weekId: string) => {
        const state = get()
        const weekKey = `${moduleId}-${weekId}`
        if (state.expandedWeeks.has(weekKey)) {
          state.collapseWeek(moduleId, weekId)
        } else {
          state.expandWeek(moduleId, weekId)
        }
      },

      // Auto-expand utilities
      autoExpandForPosition: (moduleId?: string, weekId?: string, dayId?: string) => {
        const state = get()
        
        if (moduleId) {
          // Always show learning nav when navigating to learning content
          set({ showLearningNav: true })
          
          // Expand the current module
          if (!state.expandedModules.has(moduleId)) {
            get().expandModule(moduleId)
          }
          
          // Expand the current week if specified
          if (weekId) {
            const weekKey = `${moduleId}-${weekId}`
            if (!state.expandedWeeks.has(weekKey)) {
              get().expandWeek(moduleId, weekId)
            }
          }
        }
      },

      resetNavigation: () => {
        set({
          currentModuleId: null,
          currentWeekId: null,
          currentDayId: null,
          currentVideoId: null,
          showLearningNav: false,
          expandedModules: new Set(),
          expandedWeeks: new Set()
        })
      },

      // URL sync - parse pathname and update state
      updateFromUrl: (pathname: string) => {
        const segments = pathname.split('/').filter(Boolean)
        
        if (segments[0] === 'learning') {
          const moduleId = segments[1]
          const weekId = segments[2]
          const dayId = segments[3]
          const videoId = segments[4]
          
          // Only update if the position actually changed
          const state = get()
          if (
            state.currentModuleId !== (moduleId || null) ||
            state.currentWeekId !== (weekId || null) ||
            state.currentDayId !== (dayId || null) ||
            state.currentVideoId !== (videoId || null)
          ) {
            get().setCurrentPosition(moduleId, weekId, dayId, videoId)
          }
        } else {
          // Not on learning path - hide learning nav but preserve expansion state
          set({ 
            showLearningNav: false,
            currentModuleId: null,
            currentWeekId: null,
            currentDayId: null,
            currentVideoId: null
          })
        }
      }
    }),
    {
      name: 'navigation-store',
      // Only persist expansion states and show flags
      partialize: (state) => ({
        expandedModules: Array.from(state.expandedModules),
        expandedWeeks: Array.from(state.expandedWeeks),
        showLearningNav: state.showLearningNav
      }),
      // Rehydrate Sets from arrays
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.expandedModules = new Set(state.expandedModules as unknown as string[])
          state.expandedWeeks = new Set(state.expandedWeeks as unknown as string[])
        }
      }
    }
  )
)