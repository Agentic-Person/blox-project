import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { aiJourneyAPI } from '@/lib/api/aiJourney'
import type { 
  GameType, 
  AIJourneyWithSkills, 
  CreateJourneyRequest,
  UpdateJourneyProgressRequest 
} from '@/types/supabase-ai-journey'

export type { GameType }

export interface Skill {
  id: string
  name: string
  status: 'locked' | 'current' | 'completed'
  videos: number
  estimatedHours: number
  description: string
  icon: string
}

export interface DailyTask {
  type: 'video' | 'practice' | 'project'
  title: string
  duration: number
  completed: boolean
  videoId?: string
  module?: string
  week?: number
}

export interface AIInsight {
  pace: string
  nextMilestone: string
  suggestion: string
  motivationalTip: string
}

export interface AIJourney {
  id: string
  userId?: string
  gameType: GameType
  gameTitle: string
  customGoal?: string
  currentSkill: string
  currentModule: string
  currentWeek: number
  currentDay: number
  totalProgress: number
  skills: Skill[]
  schedule: Array<{
    date: string
    tasks: DailyTask[]
  }>
  aiInsights: AIInsight
  createdAt: Date
  lastUpdated: Date
}

export interface AIJourneyState {
  // Journey data
  journey: AIJourney | null
  
  // UI states
  isExpanded: boolean
  showWelcomeOverlay: boolean
  hasCompletedOnboarding: boolean
  isGenerating: boolean
  isLoading: boolean
  
  // Database sync states
  userId: string | null
  syncEnabled: boolean
  lastSyncAt: Date | null
  
  // Actions
  setJourney: (journey: AIJourney) => void
  setUserId: (userId: string) => void
  initializeFromDatabase: () => Promise<void>
  createJourneyInDatabase: (gameType: GameType, customGoal?: string) => Promise<void>
  updateProgress: (skillId: string, completed: boolean) => void
  completeTask: (date: string, taskIndex: number) => void
  setExpanded: (expanded: boolean) => void
  hideWelcomeOverlay: () => void
  forceShowWelcomeOverlay: () => void
  generateJourneyFromGameType: (gameType: GameType, customGoal?: string) => void
  updateAIInsights: (insights: Partial<AIInsight>) => void
  
  // Database sync functions
  syncToDatabase: () => Promise<void>
  enableSync: () => void
  disableSync: () => void
  
  // Reset functions
  resetJourney: () => void
}

const defaultSkills: Record<GameType, Skill[]> = {
  'horror': [
    { id: 'basics', name: 'Scripting Basics', status: 'current', videos: 8, estimatedHours: 12, description: 'Core Lua scripting for horror games', icon: '🎯' },
    { id: 'lighting', name: 'Spooky Lighting', status: 'locked', videos: 6, estimatedHours: 8, description: 'Create atmospheric horror lighting', icon: '💡' },
    { id: 'sound', name: 'Horror Audio', status: 'locked', videos: 5, estimatedHours: 6, description: 'Implement scary sound effects', icon: '🔊' },
    { id: 'ai', name: 'AI Enemies', status: 'locked', videos: 10, estimatedHours: 15, description: 'Program intelligent horror NPCs', icon: '👻' },
    { id: 'mechanics', name: 'Jump Scares', status: 'locked', videos: 7, estimatedHours: 10, description: 'Master horror game mechanics', icon: '⚡' }
  ],
  'rpg': [
    { id: 'basics', name: 'RPG Foundations', status: 'current', videos: 10, estimatedHours: 15, description: 'Core RPG mechanics and systems', icon: '⚔️' },
    { id: 'inventory', name: 'Inventory System', status: 'locked', videos: 8, estimatedHours: 12, description: 'Build item management systems', icon: '🎒' },
    { id: 'stats', name: 'Character Stats', status: 'locked', videos: 6, estimatedHours: 9, description: 'Level progression and attributes', icon: '📊' },
    { id: 'combat', name: 'Combat System', status: 'locked', videos: 12, estimatedHours: 18, description: 'Turn-based and real-time combat', icon: '⚔️' },
    { id: 'quests', name: 'Quest System', status: 'locked', videos: 9, estimatedHours: 14, description: 'Create engaging quest mechanics', icon: '📜' }
  ],
  'racing': [
    { id: 'basics', name: 'Vehicle Physics', status: 'current', videos: 8, estimatedHours: 12, description: 'Realistic car movement and physics', icon: '🏎️' },
    { id: 'tracks', name: 'Track Building', status: 'locked', videos: 6, estimatedHours: 9, description: 'Design racing circuits and courses', icon: '🏁' },
    { id: 'ui', name: 'Racing UI', status: 'locked', videos: 5, estimatedHours: 7, description: 'Speedometers and race interfaces', icon: '📱' },
    { id: 'multiplayer', name: 'Multiplayer Racing', status: 'locked', videos: 10, estimatedHours: 15, description: 'Online racing systems', icon: '👥' },
    { id: 'customization', name: 'Car Tuning', status: 'locked', videos: 7, estimatedHours: 10, description: 'Vehicle customization systems', icon: '🔧' }
  ],
  'battle-royale': [
    { id: 'basics', name: 'BR Mechanics', status: 'current', videos: 12, estimatedHours: 18, description: 'Core battle royale systems', icon: '🎯' },
    { id: 'zone', name: 'Safe Zone System', status: 'locked', videos: 8, estimatedHours: 12, description: 'Shrinking play area mechanics', icon: '⭕' },
    { id: 'weapons', name: 'Weapon Systems', status: 'locked', videos: 10, estimatedHours: 15, description: 'Loot and combat mechanics', icon: '🔫' },
    { id: 'lobby', name: 'Match Lobbies', status: 'locked', videos: 7, estimatedHours: 10, description: 'Player matchmaking systems', icon: '🏢' },
    { id: 'spectator', name: 'Spectator Mode', status: 'locked', videos: 6, estimatedHours: 8, description: 'Post-elimination viewing', icon: '👁️' }
  ],
  'custom': [
    { id: 'basics', name: 'Custom Game Basics', status: 'current', videos: 8, estimatedHours: 12, description: 'Foundation for your unique game', icon: '✨' },
    { id: 'mechanics', name: 'Core Mechanics', status: 'locked', videos: 10, estimatedHours: 15, description: 'Your game\'s unique features', icon: '⚙️' },
    { id: 'ui', name: 'User Interface', status: 'locked', videos: 6, estimatedHours: 9, description: 'Custom UI for your game', icon: '📱' },
    { id: 'polish', name: 'Game Polish', status: 'locked', videos: 8, estimatedHours: 12, description: 'Audio, effects, and refinement', icon: '✨' },
    { id: 'publishing', name: 'Game Publishing', status: 'locked', videos: 5, estimatedHours: 7, description: 'Launch and promote your game', icon: '🚀' }
  ]
}

// Helper functions for converting between local and database types
const convertToSupabaseJourney = (journey: AIJourney, userId: string): CreateJourneyRequest => {
  return {
    userId,
    gameType: journey.gameType,
    gameTitle: journey.gameTitle,
    customGoal: journey.customGoal,
    skills: journey.skills.map((skill, index) => ({
      skillId: skill.id,
      skillName: skill.name,
      skillDescription: skill.description,
      skillIcon: skill.icon,
      skillOrder: index + 1,
      videoCount: skill.videos,
      estimatedHours: skill.estimatedHours
    }))
  }
}

const convertFromSupabaseJourney = (dbJourney: AIJourneyWithSkills): AIJourney => {
  return {
    id: dbJourney.id,
    userId: dbJourney.user_id,
    gameType: dbJourney.game_type,
    gameTitle: dbJourney.game_title,
    customGoal: dbJourney.custom_goal || undefined,
    currentSkill: dbJourney.current_skill_id || 'Getting Started',
    currentModule: dbJourney.current_module || 'Module 1',
    currentWeek: dbJourney.current_week,
    currentDay: dbJourney.current_day,
    totalProgress: dbJourney.total_progress,
    skills: dbJourney.skills
      .sort((a, b) => a.skill_order - b.skill_order)
      .map(skill => ({
        id: skill.skill_id,
        name: skill.skill_name,
        status: skill.status,
        videos: skill.video_count,
        estimatedHours: skill.estimated_hours,
        description: skill.skill_description || '',
        icon: skill.skill_icon || '⭐'
      })),
    schedule: [], // TODO: Convert from ai_journey_schedule
    aiInsights: {
      pace: 'on-track',
      nextMilestone: 'Continue your learning journey',
      suggestion: 'Focus on your current skill',
      motivationalTip: 'You\'re making great progress!'
    }, // TODO: Convert from ai_journey_insights
    createdAt: new Date(dbJourney.created_at),
    lastUpdated: new Date(dbJourney.updated_at)
  }
}

const generateMockTasks = (gameType: GameType): DailyTask[] => {
  const baseTasks: Record<GameType, DailyTask[]> = {
    'horror': [
      { type: 'video', title: 'Introduction to Horror Game Scripting', duration: 15, completed: false },
      { type: 'practice', title: 'Create Your First Script', duration: 30, completed: false },
      { type: 'video', title: 'Understanding Variables and Functions', duration: 12, completed: false }
    ],
    'rpg': [
      { type: 'video', title: 'RPG Game Design Principles', duration: 18, completed: false },
      { type: 'practice', title: 'Build a Character Controller', duration: 45, completed: false },
      { type: 'video', title: 'Inventory Systems Overview', duration: 14, completed: false }
    ],
    'racing': [
      { type: 'video', title: 'Vehicle Physics in Roblox', duration: 20, completed: false },
      { type: 'practice', title: 'Program a Basic Car', duration: 40, completed: false },
      { type: 'video', title: 'Understanding BodyVelocity', duration: 16, completed: false }
    ],
    'battle-royale': [
      { type: 'video', title: 'Battle Royale Game Flow', duration: 22, completed: false },
      { type: 'practice', title: 'Create Player Spawning System', duration: 35, completed: false },
      { type: 'video', title: 'Managing Game States', duration: 18, completed: false }
    ],
    'custom': [
      { type: 'video', title: 'Planning Your Custom Game', duration: 15, completed: false },
      { type: 'practice', title: 'Prototype Core Mechanic', duration: 50, completed: false },
      { type: 'video', title: 'Basic Scripting Fundamentals', duration: 20, completed: false }
    ]
  }
  
  return baseTasks[gameType] || baseTasks.custom
}

export const useAIJourneyStore = create<AIJourneyState>()(
  persist(
    (set, get) => ({
      // Initial state
      journey: null,
      isExpanded: true, // Default expanded for new users
      showWelcomeOverlay: false, // Will be set to true for first-time users
      hasCompletedOnboarding: false,
      isGenerating: false,
      isLoading: false,
      
      // Database sync states
      userId: null,
      syncEnabled: false,
      lastSyncAt: null,
      
      // Actions
      setJourney: (journey) => set({ journey }),
      
      setUserId: (userId) => {
        set({ userId, syncEnabled: true })
        // Auto-initialize from database when user is set
        get().initializeFromDatabase()
      },
      
      initializeFromDatabase: async () => {
        const { userId } = get()
        if (!userId) return
        
        set({ isLoading: true })
        
        try {
          const response = await aiJourneyAPI.getJourney(userId)
          if (response.success && response.data) {
            const journey = convertFromSupabaseJourney(response.data)
            set({ 
              journey,
              isLoading: false,
              lastSyncAt: new Date(),
              hasCompletedOnboarding: true,
              showWelcomeOverlay: false
            })
          } else {
            // No journey found in database - user needs to create one
            set({ 
              isLoading: false,
              showWelcomeOverlay: true
            })
          }
        } catch (error) {
          console.error('Failed to initialize from database:', error)
          set({ isLoading: false })
        }
      },
      
      createJourneyInDatabase: async (gameType, customGoal) => {
        const { userId } = get()
        if (!userId) {
          // Fallback to local generation if no user
          get().generateJourneyFromGameType(gameType, customGoal)
          return
        }
        
        set({ isGenerating: true })
        
        try {
          // Create journey locally first for immediate UI response
          const gameTitle = customGoal || `${gameType.charAt(0).toUpperCase() + gameType.slice(1).replace('-', ' ')} Game`
          const skills = defaultSkills[gameType] || defaultSkills.custom
          const todayTasks = generateMockTasks(gameType)
          
          const localJourney: AIJourney = {
            id: `temp-${Date.now()}`, // Temporary ID
            userId,
            gameType,
            gameTitle,
            customGoal,
            currentSkill: skills[0].name,
            currentModule: 'Module 1',
            currentWeek: 1,
            currentDay: 1,
            totalProgress: 0,
            skills,
            schedule: [{
              date: new Date().toISOString().split('T')[0],
              tasks: todayTasks
            }],
            aiInsights: {
              pace: 'on-track',
              nextMilestone: `Complete ${skills[0].name} in 2 weeks`,
              suggestion: `Focus on understanding the basics before moving to advanced topics`,
              motivationalTip: `You're starting your ${gameTitle} journey! Take it step by step.`
            },
            createdAt: new Date(),
            lastUpdated: new Date()
          }
          
          // Optimistic update
          set({ 
            journey: localJourney,
            isGenerating: false,
            hasCompletedOnboarding: true,
            showWelcomeOverlay: false,
            isExpanded: true
          })
          
          // Create in database
          const createRequest = convertToSupabaseJourney(localJourney, userId)
          const response = await aiJourneyAPI.createJourney(createRequest)
          
          if (response.success && response.data) {
            // Update with real database journey
            const dbJourney = convertFromSupabaseJourney(response.data)
            set({ 
              journey: dbJourney,
              lastSyncAt: new Date()
            })
          }
        } catch (error) {
          console.error('Failed to create journey in database:', error)
          // Keep the local journey even if database fails
        }
      },
      
      updateProgress: (skillId, completed) => {
        const state = get()
        if (!state.journey) return
        
        // Optimistic update
        const updatedSkills = state.journey.skills.map(skill => {
          if (skill.id === skillId) {
            return { ...skill, status: (completed ? 'completed' : 'current') as 'locked' | 'current' | 'completed' }
          }
          return skill
        })
        
        const completedCount = updatedSkills.filter(s => s.status === 'completed').length
        const totalProgress = Math.round((completedCount / updatedSkills.length) * 100)
        
        const updatedJourney = {
          ...state.journey,
          skills: updatedSkills,
          totalProgress,
          lastUpdated: new Date()
        }
        
        set({ journey: updatedJourney })
        
        // Sync to database if enabled
        if (state.syncEnabled && state.userId) {
          aiJourneyAPI.updateProgress({
            journeyId: state.journey.id,
            updates: { totalProgress },
            skillUpdates: [{
              skillId,
              status: completed ? 'completed' : 'current',
              completedAt: completed ? new Date().toISOString() : undefined
            }]
          }).then(response => {
            if (response.success) {
              set({ lastSyncAt: new Date() })
            }
          }).catch(error => {
            console.error('Failed to sync progress to database:', error)
          })
        }
      },
      
      completeTask: (date, taskIndex) => set((state) => {
        if (!state.journey) return state
        
        const updatedSchedule = state.journey.schedule.map(day => {
          if (day.date === date) {
            const updatedTasks = [...day.tasks]
            if (updatedTasks[taskIndex]) {
              updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], completed: true }
            }
            return { ...day, tasks: updatedTasks }
          }
          return day
        })
        
        return {
          journey: {
            ...state.journey,
            schedule: updatedSchedule,
            lastUpdated: new Date()
          }
        }
      }),
      
      setExpanded: (expanded) => set({ isExpanded: expanded }),
      
      hideWelcomeOverlay: () => set({ showWelcomeOverlay: false }),
      forceShowWelcomeOverlay: () => set({ showWelcomeOverlay: true }),
      
      generateJourneyFromGameType: (gameType, customGoal) => {
        set({ isGenerating: true })
        
        // Simulate AI generation delay
        setTimeout(() => {
          const gameTitle = customGoal || `${gameType.charAt(0).toUpperCase() + gameType.slice(1).replace('-', ' ')} Game`
          const skills = defaultSkills[gameType] || defaultSkills.custom
          const todayTasks = generateMockTasks(gameType)
          
          const journey: AIJourney = {
            id: `journey-${Date.now()}`,
            gameType,
            gameTitle,
            customGoal,
            currentSkill: skills[0].name,
            currentModule: 'Module 1',
            currentWeek: 1,
            currentDay: 1,
            totalProgress: 0,
            skills,
            schedule: [
              {
                date: new Date().toISOString().split('T')[0],
                tasks: todayTasks
              }
            ],
            aiInsights: {
              pace: 'on-track',
              nextMilestone: `Complete ${skills[0].name} in 2 weeks`,
              suggestion: `Focus on understanding the basics before moving to advanced topics`,
              motivationalTip: `You're starting your ${gameTitle} journey! Take it step by step.`
            },
            createdAt: new Date(),
            lastUpdated: new Date()
          }
          
          set({ 
            journey,
            isGenerating: false,
            hasCompletedOnboarding: true,
            showWelcomeOverlay: false,
            isExpanded: true
          })
        }, 2000) // 2 second "AI generation" delay
      },
      
      updateAIInsights: (insights) => set((state) => {
        if (!state.journey) return state
        
        return {
          journey: {
            ...state.journey,
            aiInsights: { ...state.journey.aiInsights, ...insights },
            lastUpdated: new Date()
          }
        }
      }),
      
      // Database sync functions
      syncToDatabase: async () => {
        const { journey, userId, syncEnabled } = get()
        if (!journey || !userId || !syncEnabled) return
        
        try {
          // This is a full sync - would implement based on what needs syncing
          set({ lastSyncAt: new Date() })
        } catch (error) {
          console.error('Failed to sync to database:', error)
        }
      },
      
      enableSync: () => set({ syncEnabled: true }),
      disableSync: () => set({ syncEnabled: false }),
      
      resetJourney: () => set({ 
        journey: null, 
        showWelcomeOverlay: true,
        isExpanded: true,
        lastSyncAt: null
      })
    }),
    {
      name: 'ai-journey-storage',
      partialize: (state) => ({
        journey: state.journey,
        isExpanded: state.isExpanded,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        userId: state.userId,
        syncEnabled: state.syncEnabled,
        lastSyncAt: state.lastSyncAt
      }),
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null
          const str = localStorage.getItem(name)
          if (!str) return null
          try {
            const data = JSON.parse(str)
            // Convert date strings back to Date objects
            if (data.state?.journey?.createdAt) {
              data.state.journey.createdAt = new Date(data.state.journey.createdAt)
            }
            if (data.state?.journey?.lastUpdated) {
              data.state.journey.lastUpdated = new Date(data.state.journey.lastUpdated)
            }
            if (data.state?.lastSyncAt) {
              data.state.lastSyncAt = new Date(data.state.lastSyncAt)
            }
            return data
          } catch (error) {
            console.error('Error parsing persisted state:', error)
            return null
          }
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return
          try {
            localStorage.setItem(name, JSON.stringify(value))
          } catch (error) {
            console.error('Error persisting state:', error)
          }
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return
          localStorage.removeItem(name)
        }
      }
    }
  )
)