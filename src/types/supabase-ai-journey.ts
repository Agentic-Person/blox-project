// Supabase AI Journey Types
// Auto-generated types matching database schema

export type GameType = 'horror' | 'rpg' | 'racing' | 'battle-royale' | 'custom'
export type SkillStatus = 'locked' | 'current' | 'completed'
export type TaskType = 'video' | 'practice' | 'project' | 'review'
export type Priority = 'low' | 'medium' | 'high'
export type InsightType = 'pace' | 'suggestion' | 'milestone' | 'recommendation' | 'tip'
export type MessageRole = 'user' | 'assistant'
export type LearningPace = 'slow' | 'medium' | 'fast'

// Database table interfaces
export interface Database {
  public: {
    Tables: {
      ai_journeys: {
        Row: {
          id: string
          user_id: string
          game_type: GameType
          game_title: string
          custom_goal: string | null
          current_skill_id: string | null
          current_module: string | null
          current_week: number
          current_day: number
          total_progress: number
          streak_days: number
          last_activity_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_type: GameType
          game_title: string
          custom_goal?: string | null
          current_skill_id?: string | null
          current_module?: string | null
          current_week?: number
          current_day?: number
          total_progress?: number
          streak_days?: number
          last_activity_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_type?: GameType
          game_title?: string
          custom_goal?: string | null
          current_skill_id?: string | null
          current_module?: string | null
          current_week?: number
          current_day?: number
          total_progress?: number
          streak_days?: number
          last_activity_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      ai_journey_skills: {
        Row: {
          id: string
          journey_id: string
          skill_id: string
          skill_name: string
          skill_description: string | null
          skill_icon: string | null
          skill_order: number
          status: SkillStatus
          video_count: number
          estimated_hours: number
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          journey_id: string
          skill_id: string
          skill_name: string
          skill_description?: string | null
          skill_icon?: string | null
          skill_order: number
          status?: SkillStatus
          video_count?: number
          estimated_hours?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          journey_id?: string
          skill_id?: string
          skill_name?: string
          skill_description?: string | null
          skill_icon?: string | null
          skill_order?: number
          status?: SkillStatus
          video_count?: number
          estimated_hours?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_journey_schedule: {
        Row: {
          id: string
          journey_id: string
          scheduled_date: string
          task_type: TaskType
          task_title: string
          task_description: string | null
          duration_minutes: number
          priority: Priority
          skill_id: string | null
          module_id: string | null
          video_id: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          journey_id: string
          scheduled_date: string
          task_type: TaskType
          task_title: string
          task_description?: string | null
          duration_minutes: number
          priority?: Priority
          skill_id?: string | null
          module_id?: string | null
          video_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          journey_id?: string
          scheduled_date?: string
          task_type?: TaskType
          task_title?: string
          task_description?: string | null
          duration_minutes?: number
          priority?: Priority
          skill_id?: string | null
          module_id?: string | null
          video_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_journey_insights: {
        Row: {
          id: string
          journey_id: string
          insight_type: InsightType
          title: string | null
          message: string
          priority: Priority
          is_read: boolean
          expires_at: string | null
          metadata: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          journey_id: string
          insight_type: InsightType
          title?: string | null
          message: string
          priority?: Priority
          is_read?: boolean
          expires_at?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          journey_id?: string
          insight_type?: InsightType
          title?: string | null
          message?: string
          priority?: Priority
          is_read?: boolean
          expires_at?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
      }
      ai_journey_chat: {
        Row: {
          id: string
          journey_id: string
          message_role: MessageRole
          message_content: string
          context_data: Record<string, any> | null
          attachments: Record<string, any> | null
          suggestions: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          journey_id: string
          message_role: MessageRole
          message_content: string
          context_data?: Record<string, any> | null
          attachments?: Record<string, any> | null
          suggestions?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          journey_id?: string
          message_role?: MessageRole
          message_content?: string
          context_data?: Record<string, any> | null
          attachments?: Record<string, any> | null
          suggestions?: string[] | null
          created_at?: string
        }
      }
      ai_journey_preferences: {
        Row: {
          id: string
          user_id: string
          learning_pace: LearningPace
          preferred_study_times: string[] | null
          notification_settings: Record<string, any> | null
          ui_preferences: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          learning_pace?: LearningPace
          preferred_study_times?: string[] | null
          notification_settings?: Record<string, any> | null
          ui_preferences?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          learning_pace?: LearningPace
          preferred_study_times?: string[] | null
          notification_settings?: Record<string, any> | null
          ui_preferences?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      user_journey_summary: {
        Row: {
          journey_id: string
          user_id: string
          game_type: GameType
          game_title: string
          total_progress: number
          streak_days: number
          last_activity_date: string
          created_at: string
          total_skills: number
          completed_skills: number
          current_skills: number
          total_estimated_hours: number
          completed_hours: number
        }
      }
    }
  }
}

// Utility types for API operations
export type AIJourneyRow = Database['public']['Tables']['ai_journeys']['Row']
export type AIJourneyInsert = Database['public']['Tables']['ai_journeys']['Insert']
export type AIJourneyUpdate = Database['public']['Tables']['ai_journeys']['Update']

export type AIJourneySkillRow = Database['public']['Tables']['ai_journey_skills']['Row']
export type AIJourneySkillInsert = Database['public']['Tables']['ai_journey_skills']['Insert']
export type AIJourneySkillUpdate = Database['public']['Tables']['ai_journey_skills']['Update']

export type AIJourneyScheduleRow = Database['public']['Tables']['ai_journey_schedule']['Row']
export type AIJourneyScheduleInsert = Database['public']['Tables']['ai_journey_schedule']['Insert']
export type AIJourneyScheduleUpdate = Database['public']['Tables']['ai_journey_schedule']['Update']

export type AIJourneyInsightRow = Database['public']['Tables']['ai_journey_insights']['Row']
export type AIJourneyInsightInsert = Database['public']['Tables']['ai_journey_insights']['Insert']
export type AIJourneyInsightUpdate = Database['public']['Tables']['ai_journey_insights']['Update']

export type AIJourneyChatRow = Database['public']['Tables']['ai_journey_chat']['Row']
export type AIJourneyChatInsert = Database['public']['Tables']['ai_journey_chat']['Insert']
export type AIJourneyChatUpdate = Database['public']['Tables']['ai_journey_chat']['Update']

export type AIJourneyPreferencesRow = Database['public']['Tables']['ai_journey_preferences']['Row']
export type AIJourneyPreferencesInsert = Database['public']['Tables']['ai_journey_preferences']['Insert']
export type AIJourneyPreferencesUpdate = Database['public']['Tables']['ai_journey_preferences']['Update']

export type JourneySummaryRow = Database['public']['Views']['user_journey_summary']['Row']

// Extended types for application use
export interface AIJourneyWithSkills extends AIJourneyRow {
  skills: AIJourneySkillRow[]
  insights: AIJourneyInsightRow[]
  preferences?: AIJourneyPreferencesRow
}

export interface AIJourneyWithSchedule extends AIJourneyRow {
  skills: AIJourneySkillRow[]
  schedule: AIJourneyScheduleRow[]
  insights: AIJourneyInsightRow[]
}

export interface AIJourneyFullData extends AIJourneyRow {
  skills: AIJourneySkillRow[]
  schedule: AIJourneyScheduleRow[]
  insights: AIJourneyInsightRow[]
  chat_messages: AIJourneyChatRow[]
  preferences?: AIJourneyPreferencesRow
}

// API Response types
export interface APIResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface CreateJourneyRequest {
  userId: string
  gameType: GameType
  gameTitle: string
  customGoal?: string
  skills: Array<{
    skillId: string
    skillName: string
    skillDescription?: string
    skillIcon?: string
    skillOrder: number
    videoCount?: number
    estimatedHours?: number
  }>
}

export interface UpdateJourneyProgressRequest {
  journeyId: string
  updates: {
    currentSkillId?: string
    currentModule?: string
    currentWeek?: number
    currentDay?: number
    totalProgress?: number
    streakDays?: number
    lastActivityDate?: string
  }
  skillUpdates?: Array<{
    skillId: string
    status?: SkillStatus
    startedAt?: string
    completedAt?: string
  }>
}

export interface UpdateScheduleRequest {
  journeyId: string
  scheduleItems: Array<{
    id?: string
    scheduledDate: string
    taskType: TaskType
    taskTitle: string
    taskDescription?: string
    durationMinutes: number
    priority?: Priority
    skillId?: string
    moduleId?: string
    videoId?: string
  }>
}

export interface AddInsightRequest {
  journeyId: string
  insightType: InsightType
  title?: string
  message: string
  priority?: Priority
  expiresAt?: string
  metadata?: Record<string, any>
}

export interface SendMessageRequest {
  journeyId: string
  messageContent: string
  contextData?: Record<string, any>
  attachments?: Record<string, any>
}

export interface UpdatePreferencesRequest {
  userId: string
  learningPace?: LearningPace
  preferredStudyTimes?: string[]
  notificationSettings?: Record<string, any>
  uiPreferences?: Record<string, any>
}

// Real-time subscription payload types
export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
  errors: string[] | null
}

// Error types
export interface AIJourneyError {
  code: string
  message: string
  details?: Record<string, any>
}

export class AIJourneyAPIError extends Error {
  code: string
  details?: Record<string, any>

  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message)
    this.name = 'AIJourneyAPIError'
    this.code = code
    this.details = details
  }
}