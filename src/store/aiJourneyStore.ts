import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type GameType = 'horror' | 'rpg' | 'racing' | 'battle-royale' | 'custom'

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
  isGenerating: boolean
  
  // Actions
  setJourney: (journey: AIJourney) => void
  updateProgress: (skillId: string, completed: boolean) => void
  completeTask: (date: string, taskIndex: number) => void
  setExpanded: (expanded: boolean) => void
  hideWelcomeOverlay: () => void
  generateJourneyFromGameType: (gameType: GameType, customGoal?: string) => void
  updateAIInsights: (insights: Partial<AIInsight>) => void
  
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
      showWelcomeOverlay: true, // Show for new users
      isGenerating: false,
      
      // Actions
      setJourney: (journey) => set({ journey }),
      
      updateProgress: (skillId, completed) => set((state) => {
        if (!state.journey) return state
        
        const updatedSkills = state.journey.skills.map(skill => {
          if (skill.id === skillId) {
            return { ...skill, status: (completed ? 'completed' : 'current') as 'locked' | 'current' | 'completed' }
          }
          return skill
        })
        
        const completedCount = updatedSkills.filter(s => s.status === 'completed').length
        const totalProgress = Math.round((completedCount / updatedSkills.length) * 100)
        
        return {
          journey: {
            ...state.journey,
            skills: updatedSkills,
            totalProgress,
            lastUpdated: new Date()
          }
        }
      }),
      
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
      
      resetJourney: () => set({ 
        journey: null, 
        showWelcomeOverlay: true,
        isExpanded: true
      })
    }),
    {
      name: 'ai-journey-storage',
      partialize: (state) => ({
        journey: state.journey,
        isExpanded: state.isExpanded,
        showWelcomeOverlay: state.showWelcomeOverlay
      })
    }
  )
)