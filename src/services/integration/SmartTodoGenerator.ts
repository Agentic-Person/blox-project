/**
 * SmartTodoGenerator Service
 * 
 * AI-powered todo generation from video transcripts and chat context
 * Core service for the AI-Powered Learning System integration
 */

import OpenAI from 'openai'
import { supabase } from '../../lib/supabase/client'
import { 
  UnifiedVideoReference, 
  TodoSuggestion,
  ServiceResponse,
  IntegrationConfig 
} from '../../types/shared'

export class SmartTodoGenerator {
  private openai: OpenAI
  private config: IntegrationConfig

  constructor(config: IntegrationConfig) {
    this.config = config
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey
    })
  }

  /**
   * Generate todo suggestions from video transcript segments
   */
  async generateTodosFromTranscript(
    videoReference: UnifiedVideoReference,
    transcriptSegment: string,
    userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
    context?: string
  ): Promise<ServiceResponse<TodoSuggestion[]>> {
    try {
      const prompt = this.buildTodoGenerationPrompt(
        videoReference,
        transcriptSegment,
        userLevel,
        context
      )

      const response = await this.openai.chat.completions.create({
        model: this.config.openaiModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert learning coach who creates actionable practice todos from educational video content. Focus on hands-on activities that reinforce learning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })

      const aiResponse = response.choices[0]?.message?.content
      if (!aiResponse) throw new Error('No response from AI')

      const suggestions = this.parseAISuggestions(aiResponse, videoReference)
      
      // Store suggestions for future reference
      await this.storeTodoSuggestions(suggestions, transcriptSegment)

      return {
        success: true,
        data: suggestions,
        timestamp: new Date().toISOString(),
        source: 'SmartTodoGenerator'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate todos from transcript',
        timestamp: new Date().toISOString(),
        source: 'SmartTodoGenerator'
      }
    }
  }

  /**
   * Generate context-aware todos from chat conversation
   */
  async generateTodosFromChat(
    chatMessage: string,
    videoReferences: UnifiedVideoReference[],
    userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
    conversationHistory?: string
  ): Promise<ServiceResponse<TodoSuggestion[]>> {
    try {
      const prompt = this.buildChatTodoPrompt(
        chatMessage,
        videoReferences,
        userLevel,
        conversationHistory
      )

      const response = await this.openai.chat.completions.create({
        model: this.config.openaiModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert learning assistant who creates personalized practice todos based on student questions and interests. Make todos specific, actionable, and appropriately challenging.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })

      const aiResponse = response.choices[0]?.message?.content
      if (!aiResponse) throw new Error('No response from AI')

      const suggestions = this.parseAISuggestions(aiResponse, videoReferences[0])

      return {
        success: true,
        data: suggestions,
        timestamp: new Date().toISOString(),
        source: 'SmartTodoGenerator'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate todos from chat',
        timestamp: new Date().toISOString(),
        source: 'SmartTodoGenerator'
      }
    }
  }

  /**
   * Generate progressive learning todos for a video playlist
   */
  async generateLearningPath(
    videoReferences: UnifiedVideoReference[],
    objectives: string[],
    userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): Promise<ServiceResponse<TodoSuggestion[]>> {
    try {
      const prompt = this.buildLearningPathPrompt(videoReferences, objectives, userLevel)

      const response = await this.openai.chat.completions.create({
        model: this.config.openaiModel,
        messages: [
          {
            role: 'system',
            content: 'You are a curriculum designer who creates structured learning paths. Design a sequence of hands-on activities that build upon each other progressively.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 1200
      })

      const aiResponse = response.choices[0]?.message?.content
      if (!aiResponse) throw new Error('No response from AI')

      const suggestions = this.parseAISuggestions(aiResponse, videoReferences[0])

      return {
        success: true,
        data: suggestions,
        timestamp: new Date().toISOString(),
        source: 'SmartTodoGenerator'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate learning path',
        timestamp: new Date().toISOString(),
        source: 'SmartTodoGenerator'
      }
    }
  }

  /**
   * Get cached suggestions similar to current request
   */
  async getSimilarSuggestions(
    content: string,
    limit: number = 3
  ): Promise<ServiceResponse<TodoSuggestion[]>> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Generate embedding for content
      const embedResponse = await this.openai.embeddings.create({
        model: this.config.embeddingModel,
        input: content
      })

      const embedding = embedResponse.data[0]?.embedding
      if (!embedding) throw new Error('Failed to generate embedding')

      // TODO: Implement vector similarity search when RPC function is available
      // For now, return empty suggestions to allow build to succeed
      const todoSuggestions: TodoSuggestion[] = []

      return {
        success: true,
        data: todoSuggestions,
        timestamp: new Date().toISOString(),
        source: 'SmartTodoGenerator'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get similar suggestions',
        timestamp: new Date().toISOString(),
        source: 'SmartTodoGenerator'
      }
    }
  }

  /**
   * Build prompt for transcript-based todo generation
   */
  private buildTodoGenerationPrompt(
    videoReference: UnifiedVideoReference,
    transcriptSegment: string,
    userLevel: string,
    context?: string
  ): string {
    return `
Video: "${videoReference.title}" by ${videoReference.creatorName}
Timestamp: ${videoReference.timestamp}
User Level: ${userLevel}
${context ? `Context: ${context}` : ''}

Transcript Segment:
"${transcriptSegment}"

Generate 2-3 specific, actionable practice todos based on this video segment. Each todo should:

1. Be hands-on and practical (not just "watch" or "read")
2. Reinforce the concepts taught in this segment
3. Be appropriate for a ${userLevel} level learner
4. Include estimated completion time (15-120 minutes)
5. Have clear success criteria

Format as JSON array:
[
  {
    "title": "Create a simple Lua script with variables",
    "description": "Practice the variable syntax shown in the video by creating a script with at least 5 different variable types",
    "priority": "medium",
    "category": "practice",
    "estimatedMinutes": 30,
    "confidence": 0.9,
    "learningObjectives": ["Variable declaration", "Data types", "Naming conventions"],
    "prerequisites": ["Watch variables section"]
  }
]
`
  }

  /**
   * Build prompt for chat-based todo generation
   */
  private buildChatTodoPrompt(
    chatMessage: string,
    videoReferences: UnifiedVideoReference[],
    userLevel: string,
    conversationHistory?: string
  ): string {
    const videoContext = videoReferences.map(v => 
      `- "${v.title}" (${v.timestamp || 'full video'})`
    ).join('\n')

    return `
User Question: "${chatMessage}"
User Level: ${userLevel}
${conversationHistory ? `Previous Context: ${conversationHistory}` : ''}

Related Videos:
${videoContext}

Based on the user's question and the video content, generate 1-2 specific practice todos that would help them:
1. Apply what they're asking about
2. Build hands-on experience
3. Progress their learning

Each todo should be:
- Directly related to their question
- Practical and actionable
- Appropriately challenging for ${userLevel} level
- Include estimated time and clear objectives

Format as JSON array with the same structure as before.
`
  }

  /**
   * Build prompt for learning path generation
   */
  private buildLearningPathPrompt(
    videoReferences: UnifiedVideoReference[],
    objectives: string[],
    userLevel: string
  ): string {
    const videoList = videoReferences.map((v, i) => 
      `${i + 1}. "${v.title}" by ${v.creatorName}`
    ).join('\n')

    const objectivesList = objectives.join('\n- ')

    return `
Learning Objectives:
- ${objectivesList}

Video Sequence:
${videoList}

User Level: ${userLevel}

Create a progressive learning path with 3-5 hands-on practice todos that:
1. Build upon each other sequentially
2. Connect the concepts from multiple videos
3. Lead to mastering the stated objectives
4. Include a final project that demonstrates all skills

Each todo should reference specific videos and prepare for the next step.
Format as JSON array with the same structure.
`
  }

  /**
   * Parse AI response into TodoSuggestion objects
   */
  private parseAISuggestions(
    aiResponse: string,
    primaryVideo: UnifiedVideoReference
  ): TodoSuggestion[] {
    try {
      // Extract JSON from response (might be wrapped in markdown)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON found in AI response')

      const parsed = JSON.parse(jsonMatch[0])
      
      return parsed.map((suggestion: any) => ({
        title: suggestion.title,
        description: suggestion.description,
        priority: suggestion.priority || 'medium',
        category: suggestion.category || 'practice',
        estimatedMinutes: suggestion.estimatedMinutes || 30,
        videoReferences: [primaryVideo],
        suggestedDueDate: this.calculateDueDate(suggestion.estimatedMinutes),
        prerequisites: suggestion.prerequisites || [],
        learningObjectives: suggestion.learningObjectives || [],
        autoGenerated: true,
        confidence: suggestion.confidence || 0.8
      }))
    } catch (error) {
      // Fallback: create a simple suggestion
      return [{
        title: 'Practice the concepts from this video',
        description: 'Apply what you learned by creating your own example',
        priority: 'medium',
        category: 'practice',
        estimatedMinutes: 45,
        videoReferences: [primaryVideo],
        autoGenerated: true,
        confidence: 0.6
      }]
    }
  }

  /**
   * Calculate suggested due date based on task complexity
   */
  private calculateDueDate(estimatedMinutes: number): string {
    const now = new Date()
    const daysToAdd = estimatedMinutes <= 30 ? 1 : estimatedMinutes <= 60 ? 2 : 3
    now.setDate(now.getDate() + daysToAdd)
    return now.toISOString()
  }

  /**
   * Store suggestions in database for caching and analytics
   */
  private async storeTodoSuggestions(
    suggestions: TodoSuggestion[],
    sourceContent: string
  ): Promise<void> {
    try {
      if (!supabase) {
        console.warn('Supabase client not available for storing suggestions')
        return
      }

      const suggestionRecords = suggestions.map(s => ({
        session_id: `gen_${Date.now()}`,
        user_id: 'system', // Will be updated by calling service
        suggestion_title: s.title,
        suggestion_description: s.description,
        priority: s.priority,
        category: s.category,
        estimated_minutes: s.estimatedMinutes,
        confidence_score: s.confidence,
        video_references: s.videoReferences,
        auto_generated: s.autoGenerated,
        accepted: false,
        created_at: new Date().toISOString()
      }))

      // TODO: Create chat_todo_suggestions table when implementing suggestion caching
      // await supabase
      //   .from('chat_todo_suggestions')
      //   .insert(suggestionRecords)
    } catch (error) {
      console.warn('Failed to store todo suggestions:', error)
    }
  }

  /**
   * Get generation statistics for analytics
   */
  async getGenerationStats(userId?: string): Promise<ServiceResponse<{
    totalGenerated: number;
    acceptanceRate: number;
    averageConfidence: number;
    topCategories: Record<string, number>;
  }>> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // TODO: Return actual stats when chat_todo_suggestions table is implemented
      const stats = {
        totalGenerated: 0,
        acceptanceRate: 0,
        averageConfidence: 0,
        topCategories: {}
      }

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
        source: 'SmartTodoGenerator'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get generation stats',
        timestamp: new Date().toISOString(),
        source: 'SmartTodoGenerator'
      }
    }
  }
}