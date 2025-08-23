import { NextRequest, NextResponse } from 'next/server'

interface BloxWizardRequest {
  message: string
  sessionId: string
  userId?: string
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
    const { message, sessionId, userId }: BloxWizardRequest = await request.json()

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400 }
      )
    }

    // Simulate processing delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock intelligent response based on question keywords
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
    } else if (lowerMessage.includes('teleport')) {
      answer = "Teleporting players is a super useful game mechanic! ✨ You can either teleport players within the same game using CFrame positioning, or between different games using TeleportService. Both methods have their specific use cases and I can show you exactly how to implement them."
      videoReferences = mockVideoReferences
      suggestedQuestions = [
        "How do I teleport between different games?",
        "What's the difference between CFrame and TeleportService?",
        "How do I create a teleport GUI?",
        "Can I teleport players to specific coordinates?"
      ]
    } else if (lowerMessage.includes('gui') || lowerMessage.includes('interface') || lowerMessage.includes('ui')) {
      answer = "Creating GUIs in Roblox is essential for player interaction! 🎨 You can build everything from simple buttons to complex inventory systems using ScreenGuis, Frames, and various UI elements. The new UI system in 2024 has some great improvements for responsive design."
      videoReferences = mockVideoReferences
      suggestedQuestions = [
        "How do I make a GUI that follows the player?",
        "What's the best way to create responsive UIs?",
        "How do I add animations to my GUI?",
        "Can you show me how to make a shop interface?"
      ]
    } else if (lowerMessage.includes('tweenservice') || lowerMessage.includes('tween') || lowerMessage.includes('animation')) {
      answer = "TweenService is perfect for smooth animations! 🎭 It's one of the most powerful tools in Roblox for creating professional-looking movements, transitions, and effects. You can animate almost any property of any object with smooth easing functions."
      videoReferences = mockVideoReferences
      suggestedQuestions = [
        "How do I use TweenService for smooth animations?",
        "What are the different easing styles?",
        "Can I animate GUI elements with TweenService?",
        "How do I create complex animation sequences?"
      ]
    } else {
      answer = `I see you're asking about "${message}". 🤔 While I don't have specific video tutorials for this exact topic in my current database, I can definitely help you with general Roblox development concepts! Try asking about specific areas like scripting, Studio features, GUI creation, or game mechanics.`
      suggestedQuestions = [
        "How do I get started with Roblox scripting?",
        "What are the basics of Roblox Studio 2024?",
        "How do I create my first game?",
        "Show me how to make a simple obby"
      ]
    }

    // Mock usage tracking
    const usageRemaining = 2 // Mock remaining questions

    const responseTime = `${Date.now() - startTime}ms`

    const response: BloxWizardResponse = {
      answer,
      videoReferences,
      suggestedQuestions,
      usageRemaining,
      responseTime
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Blox Wizard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
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
