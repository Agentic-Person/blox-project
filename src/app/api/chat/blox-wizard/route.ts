import { NextRequest, NextResponse } from 'next/server'
import { createN8nService, createSessionId, determineResponseStyle, type VideoContext } from '@/lib/services/n8n-integration'

interface BloxWizardRequest {
  message: string
  sessionId: string
  userId?: string
  videoContext?: VideoContext
}

interface VideoReference {
  title: string
  youtubeId: string
  timestamp: string
  relevantSegment: string
  thumbnailUrl: string
  confidence: number
}

interface BloxWizardResponse {
  answer: string
  videoReferences: VideoReference[]
  suggestedQuestions: string[]
  usageRemaining: number
  responseTime: string
  citations?: Array<{
    id: number
    videoTitle: string
    timestamp: string
    url: string
    relevanceScore: number
  }>
}

// Mock video database for testing
const mockVideoReferences: VideoReference[] = [
  {
    title: "Roblox Studio 2024 Complete Beginner Guide",
    youtubeId: "dQw4w9WgXcQ",
    timestamp: "15:30",
    relevantSegment: "This section covers workspace customization and basic interface navigation for new developers...",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    confidence: 0.92
  },
  {
    title: "Modern Studio Interface 2024",
    youtubeId: "dQw4w9WgXcQ",
    timestamp: "8:45",
    relevantSegment: "Learn about the new Creator Hub features and how to set up your development environment...",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    confidence: 0.87
  }
]

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const { message, sessionId, userId = 'anonymous', videoContext }: BloxWizardRequest = await request.json()

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400 }
      )
    }

    // Initialize N8n service
    const n8nService = createN8nService()

    try {
      // First, check if N8n is available
      const isHealthy = await n8nService.healthCheck()
      if (!isHealthy) {
        console.warn('N8n system is not healthy, falling back to mock responses')
        return generateMockResponse(message, startTime)
      }

      // Determine response style based on user context
      const responseStyle = determineResponseStyle(undefined, videoContext)

      // Create chat query request for N8n
      const chatRequest = {
        eventType: 'chat_query' as const,
        userId,
        sessionId,
        data: {
          query: message,
          responseStyle,
          conversationHistory: [], // TODO: Implement conversation history
          videoContext
        },
        timestamp: new Date().toISOString()
      }

      // Send to N8n Knowledge Engine via orchestrator
      const n8nResponse = await n8nService.sendChatQuery(chatRequest)

      if (!n8nResponse.success) {
        throw new Error('N8n processing failed')
      }

      // Track user interaction asynchronously (don't await)
      n8nService.trackInteraction({
        eventType: 'user_interaction',
        userId,
        sessionId,
        data: {
          interactionType: 'CHAT_QUERY',
          query: message,
          satisfaction: undefined // Will be tracked later
        },
        timestamp: new Date().toISOString()
      }).catch(err => console.warn('Failed to track interaction:', err))

      // Transform N8n response to our API format
      const videoReferences: VideoReference[] = n8nResponse.data.citations.map(citation => ({
        title: citation.videoTitle,
        youtubeId: extractYouTubeId(citation.url) || 'unknown',
        timestamp: citation.timestamp,
        relevantSegment: `From "${citation.videoTitle}" at ${citation.timestamp}`,
        thumbnailUrl: `https://img.youtube.com/vi/${extractYouTubeId(citation.url)}/maxresdefault.jpg`,
        confidence: citation.relevanceScore
      }))

      // Generate intelligent follow-up questions based on the response
      const suggestedQuestions = generateSuggestedQuestions(message, n8nResponse.data.answer)

      // Mock usage tracking (TODO: Implement real usage tracking)
      const usageRemaining = 5

      const responseTime = `${Date.now() - startTime}ms`

      const response: BloxWizardResponse = {
        answer: n8nResponse.data.answer,
        videoReferences,
        suggestedQuestions,
        usageRemaining,
        responseTime,
        citations: n8nResponse.data.citations
      }

      return NextResponse.json(response)

    } catch (n8nError) {
      console.error('N8n integration error:', n8nError)
      console.log('Falling back to mock response due to N8n error')
      
      // Fall back to mock response if N8n fails
      return generateMockResponse(message, startTime)
    }

  } catch (error) {
    console.error('Blox Wizard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate mock response as fallback when N8n is unavailable
 */
function generateMockResponse(message: string, startTime: number): NextResponse {
  let answer = "I understand you're asking about Roblox development. Let me help you with that!"
  let videoReferences: VideoReference[] = []
  let suggestedQuestions: string[] = []

  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('script') || lowerMessage.includes('lua') || lowerMessage.includes('code')) {
    answer = "Great question about scripting! 🔧 Lua is the programming language used in Roblox, and it's perfect for creating game logic, handling player interactions, and building complex systems. Here are some video tutorials that will help you master Roblox scripting from beginner to advanced levels."
    videoReferences = mockVideoReferences
    suggestedQuestions = [
      "How do I create my first script?",
      "What's the difference between ServerScript and LocalScript?",
      "How do I handle player events in Lua?",
      "Show me how to create a simple GUI script"
    ]
  } else if (lowerMessage.includes('studio') || lowerMessage.includes('interface') || lowerMessage.includes('2024')) {
    answer = "Roblox Studio 2024 has amazing new features! 🚀 The interface has been completely redesigned with better organization, new tools, and improved workflow. The Creator Hub integration makes publishing and managing your games much easier. I've found some excellent tutorials that cover all the modern Studio features."
    videoReferences = [mockVideoReferences[1]]
    suggestedQuestions = [
      "What are the best new 2024 Studio features?",
      "How do I customize my Studio workspace?",
      "Where can I find the new terrain tools?",
      "How do I use the new animation editor?"
    ]
  } else {
    answer = `I see you're asking about "${message}". 🤔 While I'm currently running in fallback mode (N8n system unavailable), I can still help with general Roblox development concepts! Try asking about specific areas like scripting, Studio features, or game mechanics.`
    suggestedQuestions = [
      "How do I get started with Roblox scripting?",
      "What are the basics of Roblox Studio 2024?",
      "How do I create my first game?",
      "Show me how to make a simple obby"
    ]
  }

  const responseTime = `${Date.now() - startTime}ms`

  const response: BloxWizardResponse = {
    answer,
    videoReferences,
    suggestedQuestions,
    usageRemaining: 2,
    responseTime
  }

  return NextResponse.json(response)
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

/**
 * Generate contextual follow-up questions based on the query and response
 */
function generateSuggestedQuestions(query: string, response: string): string[] {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes('script') || lowerQuery.includes('code')) {
    return [
      "How do I debug my script?",
      "What are common scripting mistakes?",
      "Show me advanced scripting techniques",
      "How do I optimize my code performance?"
    ]
  }
  
  if (lowerQuery.includes('gui') || lowerQuery.includes('ui')) {
    return [
      "How do I make responsive GUIs?",
      "What are best practices for UI design?",
      "How do I add animations to my interface?",
      "Can you show me mobile-friendly UI tips?"
    ]
  }
  
  if (lowerQuery.includes('game') || lowerQuery.includes('create')) {
    return [
      "How do I publish my game?",
      "What makes a game successful?",
      "How do I monetize my creation?",
      "Can you help me plan my next feature?"
    ]
  }
  
  // Default suggestions
  return [
    "Can you explain this in more detail?",
    "What's the next step I should take?",
    "Are there any common mistakes to avoid?",
    "Do you have related video tutorials?"
  ]
}

export async function GET() {
  return NextResponse.json({
    message: 'Blox Wizard API is running! 🧙‍♂️',
    version: '1.0.0',
    features: [
      'AI-powered responses',
      'Video transcript search',
      'Premium subscription support',
      'Usage tracking',
      'Smart question suggestions'
    ],
    status: 'active'
  })
}
