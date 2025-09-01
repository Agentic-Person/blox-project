// AI Journey API Layer
// Handles all database operations for AI Journey system

import { createClient } from '@supabase/supabase-js'
import type { 
  Database,
  AIJourneyRow,
  AIJourneyInsert,
  AIJourneyUpdate,
  AIJourneyWithSkills,
  AIJourneyWithSchedule,
  AIJourneyFullData,
  AIJourneySkillRow,
  AIJourneySkillInsert,
  AIJourneyScheduleRow,
  AIJourneyScheduleInsert,
  AIJourneyInsightRow,
  AIJourneyInsightInsert,
  AIJourneyChatInsert,
  AIJourneyPreferencesRow,
  APIResponse,
  CreateJourneyRequest,
  UpdateJourneyProgressRequest,
  UpdateScheduleRequest,
  AddInsightRequest,
  SendMessageRequest,
  UpdatePreferencesRequest,
  RealtimePayload
} from '@/types/supabase-ai-journey'
import { AIJourneyAPIError } from '@/types/supabase-ai-journey'

// Check if we're in mock mode
const USE_MOCK_SUPABASE = process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true'

// Initialize Supabase client only if not in mock mode and credentials are available
let supabase: any = null
const initializeSupabase = () => {
  if (USE_MOCK_SUPABASE) {
    return null
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (supabaseUrl && supabaseKey) {
    return createClient<Database>(supabaseUrl, supabaseKey)
  }
  
  return null
}

// Initialize once
supabase = initializeSupabase()

// Error handling utility
const handleError = (error: any, operation: string): never => {
  console.error(`AI Journey API Error [${operation}]:`, error)
  
  if (error.code) {
    throw new AIJourneyAPIError(
      error.message || `Failed to ${operation}`,
      error.code,
      error.details
    )
  }
  
  throw new AIJourneyAPIError(
    `Failed to ${operation}`,
    'UNKNOWN_ERROR',
    { originalError: error }
  )
}

// Retry utility for transient failures
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
    }
  }
  
  throw new Error('Max retries exceeded')
}

// Mock data generator for development
const createMockJourney = (request: CreateJourneyRequest): AIJourneyWithSkills => {
  const journeyId = `mock-journey-${Date.now()}`
  return {
    id: journeyId,
    user_id: request.userId,
    game_type: request.gameType,
    game_title: request.gameTitle,
    custom_goal: request.customGoal || null,
    current_skill_id: request.skills[0]?.skillId || null,
    current_module: 'Module 1',
    current_week: 1,
    current_day: 1,
    total_progress: 0,
    streak_days: 0,
    last_activity_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    skills: request.skills.map((skill, index) => ({
      id: `mock-skill-${index}`,
      journey_id: journeyId,
      skill_id: skill.skillId,
      skill_name: skill.skillName,
      skill_description: skill.skillDescription || null,
      skill_icon: skill.skillIcon || null,
      skill_order: skill.skillOrder,
      status: index === 0 ? 'current' as const : 'locked' as const,
      video_count: skill.videoCount || 0,
      estimated_hours: skill.estimatedHours || 0,
      started_at: index === 0 ? new Date().toISOString() : null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })),
    insights: [],
    preferences: undefined
  }
}

// Journey Operations
export const aiJourneyAPI = {
  // Create a new AI journey
  async createJourney(request: CreateJourneyRequest): Promise<APIResponse<AIJourneyWithSkills>> {
    try {
      // Return mock data if in mock mode
      if (USE_MOCK_SUPABASE || !supabase) {
        console.log('🎭 Mock Mode: Creating mock journey')
        const mockJourney = createMockJourney(request)
        return {
          success: true,
          data: mockJourney,
          message: 'Mock journey created successfully'
        }
      }

      // Start transaction by creating journey first
      const { data: journey, error: journeyError } = await supabase
        .from('ai_journeys')
        .insert({
          user_id: request.userId,
          game_type: request.gameType,
          game_title: request.gameTitle,
          custom_goal: request.customGoal,
          current_skill_id: request.skills[0]?.skillId || null,
          current_module: 'Module 1',
          current_week: 1,
          current_day: 1,
          total_progress: 0,
          streak_days: 0,
          last_activity_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (journeyError) {
        handleError(journeyError, 'create journey')
      }

      // Create skills for the journey
      if (request.skills.length > 0) {
        const skillsToInsert: AIJourneySkillInsert[] = request.skills.map(skill => ({
          journey_id: journey.id,
          skill_id: skill.skillId,
          skill_name: skill.skillName,
          skill_description: skill.skillDescription,
          skill_icon: skill.skillIcon,
          skill_order: skill.skillOrder,
          status: skill.skillOrder === 1 ? 'current' : 'locked',
          video_count: skill.videoCount || 0,
          estimated_hours: skill.estimatedHours || 0
        }))

        const { data: skills, error: skillsError } = await supabase
          .from('ai_journey_skills')
          .insert(skillsToInsert)
          .select()

        if (skillsError) {
          // Rollback journey creation
          await supabase.from('ai_journeys').delete().eq('id', journey.id)
          handleError(skillsError, 'create journey skills')
        }

        return {
          success: true,
          data: {
            ...journey,
            skills: skills || [],
            insights: []
          }
        }
      }

      return {
        success: true,
        data: {
          ...journey,
          skills: [],
          insights: []
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof AIJourneyAPIError ? error.message : 'Failed to create journey'
      }
    }
  },

  // Get journey for a user
  async getJourney(userId: string): Promise<APIResponse<AIJourneyWithSkills | null>> {
    try {
      // Return mock data if in mock mode
      if (USE_MOCK_SUPABASE || !supabase) {
        console.log('🎭 Mock Mode: No existing journey found')
        return {
          success: true,
          data: null,
          message: 'No journey found in mock mode'
        }
      }

      const { data: journey, error: journeyError } = await supabase
        .from('ai_journeys')
        .select(`
          *,
          skills:ai_journey_skills(*),
          insights:ai_journey_insights(*)
        `)
        .eq('user_id', userId)
        .single()

      if (journeyError) {
        if (journeyError.code === 'PGRST116') {
          // No journey found
          return { success: true, data: null }
        }
        handleError(journeyError, 'get journey')
      }

      return {
        success: true,
        data: journey as AIJourneyWithSkills
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof AIJourneyAPIError ? error.message : 'Failed to get journey'
      }
    }
  },

  // Get journey with schedule
  async getJourneyWithSchedule(userId: string): Promise<APIResponse<AIJourneyWithSchedule | null>> {
    try {
      const { data: journey, error } = await supabase
        .from('ai_journeys')
        .select(`
          *,
          skills:ai_journey_skills(*),
          schedule:ai_journey_schedule(*),
          insights:ai_journey_insights(*)
        `)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: true, data: null }
        }
        handleError(error, 'get journey with schedule')
      }

      return {
        success: true,
        data: journey as AIJourneyWithSchedule
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof AIJourneyAPIError ? error.message : 'Failed to get journey with schedule'
      }
    }
  },

  // Update journey progress
  async updateProgress(request: UpdateJourneyProgressRequest): Promise<APIResponse<AIJourneyRow>> {
    try {
      // Return mock response if in mock mode
      if (USE_MOCK_SUPABASE || !supabase) {
        console.log('🎭 Mock Mode: Progress update simulated')
        return {
          success: true,
          data: {
            id: request.journeyId,
            user_id: 'mock-user',
            game_type: 'horror',
            game_title: 'Mock Game',
            custom_goal: null,
            current_skill_id: null,
            current_module: 'Module 1',
            current_week: 1,
            current_day: 1,
            total_progress: request.updates.totalProgress || 0,
            streak_days: 0,
            last_activity_date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as AIJourneyRow,
          message: 'Mock progress updated successfully'
        }
      }

      return await withRetry(async () => {
        // Update main journey
        const { data: journey, error: journeyError } = await supabase
          .from('ai_journeys')
          .update({
            ...request.updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', request.journeyId)
          .select()
          .single()

        if (journeyError) {
          handleError(journeyError, 'update journey progress')
        }

        // Update skills if provided
        if (request.skillUpdates && request.skillUpdates.length > 0) {
          for (const skillUpdate of request.skillUpdates) {
            const { error: skillError } = await supabase
              .from('ai_journey_skills')
              .update({
                status: skillUpdate.status,
                started_at: skillUpdate.startedAt,
                completed_at: skillUpdate.completedAt,
                updated_at: new Date().toISOString()
              })
              .eq('journey_id', request.journeyId)
              .eq('skill_id', skillUpdate.skillId)

            if (skillError) {
              handleError(skillError, 'update skill progress')
            }
          }
        }

        return {
          success: true,
          data: journey
        }
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof AIJourneyAPIError ? error.message : 'Failed to update progress'
      }
    }
  },

  // Update schedule
  async updateSchedule(request: UpdateScheduleRequest): Promise<APIResponse<AIJourneyScheduleRow[]>> {
    try {
      const operations = request.scheduleItems.map(item => {
        if (item.id) {
          // Update existing item
          return supabase
            .from('ai_journey_schedule')
            .update({
              scheduled_date: item.scheduledDate,
              task_type: item.taskType,
              task_title: item.taskTitle,
              task_description: item.taskDescription,
              duration_minutes: item.durationMinutes,
              priority: item.priority,
              skill_id: item.skillId,
              module_id: item.moduleId,
              video_id: item.videoId,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)
            .select()
            .single()
        } else {
          // Insert new item
          return supabase
            .from('ai_journey_schedule')
            .insert({
              journey_id: request.journeyId,
              scheduled_date: item.scheduledDate,
              task_type: item.taskType,
              task_title: item.taskTitle,
              task_description: item.taskDescription,
              duration_minutes: item.durationMinutes,
              priority: item.priority,
              skill_id: item.skillId,
              module_id: item.moduleId,
              video_id: item.videoId
            })
            .select()
            .single()
        }
      })

      const results = await Promise.all(operations)
      
      // Check for errors
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        handleError(errors[0].error, 'update schedule')
      }

      const scheduleItems = results.map(result => result.data).filter(Boolean) as AIJourneyScheduleRow[]

      return {
        success: true,
        data: scheduleItems
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof AIJourneyAPIError ? error.message : 'Failed to update schedule'
      }
    }
  },

  // Complete a task
  async completeTask(taskId: string): Promise<APIResponse<AIJourneyScheduleRow>> {
    try {
      const { data: task, error } = await supabase
        .from('ai_journey_schedule')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) {
        handleError(error, 'complete task')
      }

      return {
        success: true,
        data: task
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof AIJourneyAPIError ? error.message : 'Failed to complete task'
      }
    }
  },

  // Add AI insight
  async addInsight(request: AddInsightRequest): Promise<APIResponse<AIJourneyInsightRow>> {
    try {
      const { data: insight, error } = await supabase
        .from('ai_journey_insights')
        .insert({
          journey_id: request.journeyId,
          insight_type: request.insightType,
          title: request.title,
          message: request.message,
          priority: request.priority,
          expires_at: request.expiresAt,
          metadata: request.metadata
        })
        .select()
        .single()

      if (error) {
        handleError(error, 'add insight')
      }

      return {
        success: true,
        data: insight
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof AIJourneyAPIError ? error.message : 'Failed to add insight'
      }
    }
  },

  // Mark insight as read
  async markInsightRead(insightId: string): Promise<APIResponse<AIJourneyInsightRow>> {
    try {
      const { data: insight, error } = await supabase
        .from('ai_journey_insights')
        .update({ is_read: true })
        .eq('id', insightId)
        .select()
        .single()

      if (error) {
        handleError(error, 'mark insight as read')
      }

      return {
        success: true,
        data: insight
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof AIJourneyAPIError ? error.message : 'Failed to mark insight as read'
      }
    }
  },

  // Send chat message
  async sendMessage(request: SendMessageRequest): Promise<APIResponse<string>> {
    try {
      const { error } = await supabase
        .from('ai_journey_chat')
        .insert({
          journey_id: request.journeyId,
          message_role: 'user',
          message_content: request.messageContent,
          context_data: request.contextData,
          attachments: request.attachments
        })

      if (error) {
        handleError(error, 'send message')
      }

      return {
        success: true,
        data: 'Message sent successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof AIJourneyAPIError ? error.message : 'Failed to send message'
      }
    }
  },

  // Get chat history
  async getChatHistory(journeyId: string, limit: number = 50): Promise<APIResponse<any[]>> {
    try {
      const { data: messages, error } = await supabase
        .from('ai_journey_chat')
        .select('*')
        .eq('journey_id', journeyId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        handleError(error, 'get chat history')
      }

      return {
        success: true,
        data: messages || []
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof AIJourneyAPIError ? error.message : 'Failed to get chat history'
      }
    }
  },

  // Update user preferences
  async updatePreferences(request: UpdatePreferencesRequest): Promise<APIResponse<AIJourneyPreferencesRow>> {
    try {
      const { data: preferences, error } = await supabase
        .from('ai_journey_preferences')
        .upsert({
          user_id: request.userId,
          learning_pace: request.learningPace,
          preferred_study_times: request.preferredStudyTimes,
          notification_settings: request.notificationSettings,
          ui_preferences: request.uiPreferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        handleError(error, 'update preferences')
      }

      return {
        success: true,
        data: preferences
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof AIJourneyAPIError ? error.message : 'Failed to update preferences'
      }
    }
  },

  // Get journey summary
  async getJourneySummary(userId: string): Promise<APIResponse<any>> {
    try {
      const { data: summary, error } = await supabase
        .from('user_journey_summary')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: true, data: null }
        }
        handleError(error, 'get journey summary')
      }

      return {
        success: true,
        data: summary
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof AIJourneyAPIError ? error.message : 'Failed to get journey summary'
      }
    }
  },

  // Delete journey (careful!)
  async deleteJourney(journeyId: string): Promise<APIResponse<string>> {
    try {
      const { error } = await supabase
        .from('ai_journeys')
        .delete()
        .eq('id', journeyId)

      if (error) {
        handleError(error, 'delete journey')
      }

      return {
        success: true,
        data: 'Journey deleted successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof AIJourneyAPIError ? error.message : 'Failed to delete journey'
      }
    }
  }
}

// Real-time subscriptions
export const aiJourneySubscriptions = {
  // Subscribe to journey changes
  subscribeToJourney(journeyId: string, callback: (payload: RealtimePayload<AIJourneyRow>) => void) {
    if (USE_MOCK_SUPABASE || !supabase) {
      console.log('🎭 Mock Mode: Journey subscription simulated')
      return { unsubscribe: () => console.log('🎭 Mock journey subscription unsubscribed') }
    }
    
    return supabase
      .channel(`journey-${journeyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_journeys',
        filter: `id=eq.${journeyId}`
      }, callback)
      .subscribe()
  },

  // Subscribe to skill changes
  subscribeToSkills(journeyId: string, callback: (payload: RealtimePayload<AIJourneySkillRow>) => void) {
    return supabase
      .channel(`skills-${journeyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_journey_skills',
        filter: `journey_id=eq.${journeyId}`
      }, callback)
      .subscribe()
  },

  // Subscribe to schedule changes
  subscribeToSchedule(journeyId: string, callback: (payload: RealtimePayload<AIJourneyScheduleRow>) => void) {
    return supabase
      .channel(`schedule-${journeyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_journey_schedule',
        filter: `journey_id=eq.${journeyId}`
      }, callback)
      .subscribe()
  },

  // Subscribe to new insights
  subscribeToInsights(journeyId: string, callback: (payload: RealtimePayload<AIJourneyInsightRow>) => void) {
    return supabase
      .channel(`insights-${journeyId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_journey_insights',
        filter: `journey_id=eq.${journeyId}`
      }, callback)
      .subscribe()
  },

  // Unsubscribe from all channels
  unsubscribeAll() {
    if (USE_MOCK_SUPABASE || !supabase) {
      console.log('🎭 Mock Mode: All subscriptions unsubscribed')
      return Promise.resolve()
    }
    return supabase.removeAllChannels()
  },

  // Alias methods for backward compatibility
  async getUserJourney(userId: string): Promise<APIResponse<AIJourneyWithSkills | null>> {
    return aiJourneyAPI.getJourney(userId)
  },

  async updateJourneyProgress(request: UpdateJourneyProgressRequest): Promise<APIResponse<AIJourneyRow>> {
    return aiJourneyAPI.updateProgress(request)
  }
}

// Export Supabase client for direct use if needed
export { supabase }