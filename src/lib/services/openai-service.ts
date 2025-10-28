/**
 * OpenAI Service for Blox Wizard
 * Direct integration with OpenAI API for chat completions
 */

import OpenAI from 'openai'
import { supabaseTranscriptService, type VideoReference } from './supabase-transcript-service'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface VideoContext {
  videoId?: string
  title?: string
  youtubeId?: string
  currentTime?: number
  transcript?: string
}

export interface ChatCompletionRequest {
  message: string
  conversationHistory?: ChatMessage[]
  videoContext?: VideoContext
  responseStyle?: 'detailed' | 'concise' | 'beginner' | 'advanced'
  userId?: string
  sessionId?: string
}

export interface ChatCompletionResponse {
  answer: string
  videoReferences: Array<{
    title: string
    youtubeId: string
    timestamp: string
    relevantSegment: string
    thumbnailUrl: string
    confidence: number
  }>
  suggestedQuestions: string[]
  responseTime: number
  tokensUsed?: number
}

class OpenAIService {
  private openai: OpenAI | null = null
  private readonly model: string

  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  }

  private initializeOpenAI() {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.')
      }

      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    }
    return this.openai
  }

  /**
   * Generate a chat completion with context awareness
   * NEW ARCHITECTURE: Search database FIRST, then respond with video-aware context
   */
  async generateChatCompletion({
    message,
    conversationHistory = [],
    videoContext,
    responseStyle = 'beginner',
    userId,
    sessionId
  }: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const startTime = Date.now()

    try {
      // STEP 1: SEARCH DATABASE FIRST - Find relevant video references BEFORE calling GPT
      console.log('[OpenAI] Searching database for relevant videos...')
      const videoReferences = await this.findRelevantVideoReferences(message, videoContext)
      console.log(`[OpenAI] Found ${videoReferences.length} video references`)

      // STEP 2: Build system prompt WITH search results - GPT now knows what videos exist
      const systemPrompt = await this.buildSystemPromptWithVideos(
        videoReferences,
        videoContext,
        responseStyle,
        message
      )

      // Prepare conversation history
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: message }
      ]

      // STEP 3: Call OpenAI - GPT responds knowing what videos are available
      const completion = await this.initializeOpenAI().chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      })

      const aiResponse = completion.choices[0]?.message?.content || "I'm having trouble processing your request right now. Please try again!"

      // Generate suggested questions based on the response
      const suggestedQuestions = await this.generateSuggestedQuestions(message, aiResponse, videoContext)

      const responseTime = Date.now() - startTime

      return {
        answer: aiResponse,
        videoReferences, // Already fetched in Step 1
        suggestedQuestions,
        responseTime,
        tokensUsed: completion.usage?.total_tokens
      }
    } catch (error) {
      console.error('OpenAI API error:', error)

      // Fallback response
      return {
        answer: "I'm having trouble connecting to my AI brain right now. Please try again in a moment! In the meantime, you can ask me about Roblox scripting, building, or game design concepts.",
        videoReferences: [],
        suggestedQuestions: [
          "How do I start learning Roblox development?",
          "What are the basics of Lua scripting?",
          "How do I build my first Roblox game?"
        ],
        responseTime: Date.now() - startTime
      }
    }
  }

  /**
   * Build context-aware system prompt WITH video search results
   * NEW: GPT knows what videos exist BEFORE responding
   */
  private async buildSystemPromptWithVideos(
    videoReferences: VideoReference[],
    videoContext?: VideoContext,
    responseStyle: string = 'beginner',
    userQuestion?: string
  ): Promise<string> {
    let prompt = `You are Blox Wizard, the AI learning companion for Blox Buddy - a platform that helps young developers (ages 10-25) learn Roblox game development.

PERSONALITY:
- Enthusiastic, encouraging, and patient mentor
- Use age-appropriate language (teen-friendly but not childish)
- Be supportive and celebrate small wins
- Make learning fun and engaging

EXPERTISE:
- Roblox Studio and development
- Lua scripting fundamentals to advanced
- Game design principles
- Building and modeling in Roblox
- UI/UX design for games
- Publishing and monetization

RESPONSE STYLE: ${responseStyle}
${responseStyle === 'beginner' ? '- Explain concepts step-by-step\n- Use simple analogies\n- Provide practical examples' : ''}
${responseStyle === 'advanced' ? '- Go deeper into technical details\n- Assume familiarity with basics\n- Focus on best practices and optimization' : ''}

GUIDELINES:
- Keep responses concise but helpful (2-3 paragraphs max)
- Always provide actionable advice
- Encourage hands-on practice
- If asked about non-Roblox topics, gently redirect to game development
- Never provide inappropriate content - this is for young learners`

    // Add video context if available
    if (videoContext?.title) {
      prompt += `\n\nCURRENT VIDEO CONTEXT:
- Video: "${videoContext.title}"
- YouTube ID: ${videoContext.youtubeId || 'N/A'}`

      if (videoContext.currentTime) {
        prompt += `\n- Current timestamp: ${Math.floor(videoContext.currentTime / 60)}:${(videoContext.currentTime % 60).toString().padStart(2, '0')}`
      }

      if (videoContext.transcript) {
        prompt += `\n- Transcript context: ${videoContext.transcript.slice(0, 500)}...`
      }

      prompt += `\n\nUse this video context to provide more relevant and specific answers. Reference the video content when appropriate.`
    }

    // CRITICAL: Add search results to prompt - GPT now knows what videos exist!
    if (videoReferences.length > 0) {
      prompt += `\n\n🎯 AVAILABLE VIDEO RESOURCES (I searched our database for the user's question):\n`
      prompt += `I found ${videoReferences.length} relevant video(s) in our library:\n\n`

      videoReferences.forEach((video, index) => {
        prompt += `${index + 1}. "${video.title}"\n`
        prompt += `   - YouTube ID: ${video.youtubeId}\n`
        if (video.timestamp) {
          prompt += `   - Relevant timestamp: ${video.timestamp}\n`
        }
        if (video.relevantSegment) {
          prompt += `   - Content preview: "${video.relevantSegment.slice(0, 150)}..."\n`
        }
        if (video.confidence) {
          prompt += `   - Match confidence: ${Math.round(video.confidence * 100)}%\n`
        }
        prompt += `\n`
      })

      prompt += `IMPORTANT: Reference these specific videos in your response! Tell the user about these videos by name and explain why they're helpful for their question. Don't give generic internet advice - use our actual video library!\n`
    } else {
      // No videos found - get available topics and explain what we DO have
      const availableTopics = await this.getAvailableVideoTopics()

      prompt += `\n\n⚠️ VIDEO SEARCH RESULT: No exact matches found\n`
      prompt += `I searched our video database for content related to: "${userQuestion}"\n`
      prompt += `Unfortunately, we don't have videos specifically about this topic yet.\n\n`

      if (availableTopics.length > 0) {
        prompt += `However, our video library currently includes these topics:\n`
        availableTopics.forEach(topic => {
          prompt += `- ${topic}\n`
        })
        prompt += `\nIMPORTANT: Let the user know we don't have videos on their specific question yet, but suggest related topics from our library above that might help. Be honest that this content isn't available yet, and offer alternatives.\n`
      } else {
        prompt += `IMPORTANT: Our video database appears to be empty or unavailable. Let the user know that video recommendations are temporarily unavailable, but still provide helpful general guidance about Roblox development.\n`
      }
    }

    return prompt
  }

  /**
   * Legacy method - kept for backward compatibility
   * @deprecated Use buildSystemPromptWithVideos instead
   */
  private buildSystemPrompt(videoContext?: VideoContext, responseStyle: string = 'beginner'): string {
    let prompt = `You are Blox Wizard, the AI learning companion for Blox Buddy - a platform that helps young developers (ages 10-25) learn Roblox game development.

PERSONALITY:
- Enthusiastic, encouraging, and patient mentor
- Use age-appropriate language (teen-friendly but not childish)
- Be supportive and celebrate small wins
- Make learning fun and engaging

EXPERTISE:
- Roblox Studio and development
- Lua scripting fundamentals to advanced
- Game design principles
- Building and modeling in Roblox
- UI/UX design for games
- Publishing and monetization

RESPONSE STYLE: ${responseStyle}
${responseStyle === 'beginner' ? '- Explain concepts step-by-step\n- Use simple analogies\n- Provide practical examples' : ''}
${responseStyle === 'advanced' ? '- Go deeper into technical details\n- Assume familiarity with basics\n- Focus on best practices and optimization' : ''}

GUIDELINES:
- Keep responses concise but helpful (2-3 paragraphs max)
- Always provide actionable advice
- Encourage hands-on practice
- If asked about non-Roblox topics, gently redirect to game development
- Never provide inappropriate content - this is for young learners`

    // Add video context if available
    if (videoContext?.title) {
      prompt += `\n\nCURRENT VIDEO CONTEXT:
- Video: "${videoContext.title}"
- YouTube ID: ${videoContext.youtubeId || 'N/A'}`

      if (videoContext.currentTime) {
        prompt += `\n- Current timestamp: ${Math.floor(videoContext.currentTime / 60)}:${(videoContext.currentTime % 60).toString().padStart(2, '0')}`
      }

      if (videoContext.transcript) {
        prompt += `\n- Transcript context: ${videoContext.transcript.slice(0, 500)}...`
      }

      prompt += `\n\nUse this video context to provide more relevant and specific answers. Reference the video content when appropriate.`
    }

    return prompt
  }

  /**
   * Generate contextual follow-up questions
   */
  private async generateSuggestedQuestions(
    userMessage: string, 
    aiResponse: string, 
    videoContext?: VideoContext
  ): Promise<string[]> {
    try {
      const prompt = `Based on this conversation about Roblox development, suggest 3 short follow-up questions (max 8 words each) that would help the user learn more:

User asked: "${userMessage}"
AI responded: "${aiResponse.slice(0, 200)}..."

${videoContext?.title ? `Current video: "${videoContext.title}"` : ''}

Return only the questions, one per line:`

      const completion = await this.initializeOpenAI().chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 150,
      })

      const response = completion.choices[0]?.message?.content || ''
      const questions = response
        .split('\n')
        .map(q => q.trim().replace(/^[\d.-]\s*/, '').replace(/^[*-]\s*/, ''))
        .filter(q => q.length > 0)
        .slice(0, 3)

      return questions.length > 0 ? questions : [
        'Tell me more about this',
        'Show me an example',
        'What should I learn next?'
      ]
    } catch (error) {
      console.error('Error generating suggested questions:', error)
      return [
        'Can you explain this further?',
        'What\'s the next step?',
        'How do I practice this?'
      ]
    }
  }

  /**
   * Get available video topics from database when search finds nothing
   * Provides fallback information to tell users what content IS available
   */
  private async getAvailableVideoTopics(): Promise<string[]> {
    try {
      // Get unique video titles from the database to show what's available
      const videos = await supabaseTranscriptService.getAllVideoTitles()

      if (videos && videos.length > 0) {
        // Return unique titles (limit to 10 for brevity)
        return videos.slice(0, 10)
      }

      // Fallback: Return known Module 1 topics if database query fails
      return [
        "Roblox Studio Basics",
        "Lua Programming Fundamentals",
        "Game Design Principles",
        "Building and Modeling Techniques",
        "Scripting for Beginners"
      ]
    } catch (error) {
      console.error('Error getting available video topics:', error)
      // Return generic Roblox topics as ultimate fallback
      return [
        "Roblox Studio Basics",
        "Lua Programming Fundamentals",
        "Game Design Principles"
      ]
    }
  }

  /**
   * Find relevant video references using Supabase transcript search
   */
  private async findRelevantVideoReferences(
    message: string,
    videoContext?: VideoContext
  ): Promise<VideoReference[]> {
    try {
      // Search for relevant video segments based on the user's message
      // Lower threshold to 0.3 for more results (was 0.6 in supabaseTranscriptService)
      const videoReferences = await supabaseTranscriptService.findRelevantVideoSegments(message, 5)
      
      // If we found relevant videos, return them
      if (videoReferences.length > 0) {
        return videoReferences
      }
      
      // Fallback to contextual references if current video context exists
      if (videoContext?.title && videoContext?.youtubeId) {
        return [{
          title: videoContext.title,
          youtubeId: videoContext.youtubeId,
          timestamp: videoContext.currentTime ? 
            `${Math.floor(videoContext.currentTime / 60)}:${(videoContext.currentTime % 60).toString().padStart(2, '0')}` : 
            "0:00",
          relevantSegment: videoContext.transcript?.slice(0, 150) + "..." || "Current video section",
          thumbnailUrl: `https://img.youtube.com/vi/${videoContext.youtubeId}/maxresdefault.jpg`,
          confidence: 0.9
        }]
      }
      
      // Ultimate fallback - empty array (no mock data)
      return []
      
    } catch (error) {
      console.error('Error finding relevant video references:', error)
      
      // Fallback to mock data if Supabase search fails
      return this.generateFallbackReferences(message, videoContext)
    }
  }

  /**
   * Generate fallback references when Supabase search fails
   */
  private generateFallbackReferences(
    message: string, 
    videoContext?: VideoContext
  ): VideoReference[] {
    // If we have video context, use it
    if (videoContext?.title && videoContext?.youtubeId) {
      return [{
        title: videoContext.title,
        youtubeId: videoContext.youtubeId,
        timestamp: videoContext.currentTime ? 
          `${Math.floor(videoContext.currentTime / 60)}:${(videoContext.currentTime % 60).toString().padStart(2, '0')}` : 
          "0:00",
        relevantSegment: "Current video context - continue watching for more details...",
        thumbnailUrl: `https://img.youtube.com/vi/${videoContext.youtubeId}/maxresdefault.jpg`,
        confidence: 0.95
      }]
    }

    // Return empty array - no fallback mock data
    return []
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.initializeOpenAI().models.list()
      return true
    } catch (error) {
      console.error('OpenAI health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService()
export default openaiService