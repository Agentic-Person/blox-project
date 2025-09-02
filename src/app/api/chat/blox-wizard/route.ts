import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import OpenAI from 'openai'

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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

    // Search for relevant transcript chunks using multiple strategies
    let searchResults = []
    let searchMethod = 'none'
    
    try {
      // Try vector search first
      const embedding = await generateEmbedding(message)
      searchResults = await searchTranscriptChunks(embedding, 0.3, 10) // Lower threshold for better matches
      searchMethod = 'vector'
      
      console.log(`Vector search found ${searchResults.length} results`)
      
      // Fallback to text search if vector search returns few results
      if (searchResults.length < 3) {
        const textResults = await searchTranscriptText(message, 5)
        searchResults = [...searchResults, ...textResults]
        searchMethod = searchResults.length > 0 ? 'hybrid' : 'text'
        console.log(`Added ${textResults.length} text search results, total: ${searchResults.length}`)
      }
    } catch (searchError) {
      console.warn('Search failed, using fallback:', searchError)
      searchResults = await searchTranscriptText(message, 5)
      searchMethod = 'text-fallback'
    }
    
    // Generate AI response using OpenAI with relevant context
    const aiResponse = await generateAIResponse(message, searchResults, searchMethod)
    
    // Format video references from search results
    const videoReferences: VideoReference[] = searchResults.map(result => ({
      title: result.title,
      youtubeId: result.youtube_id,
      timestamp: result.start_timestamp,
      relevantSegment: result.chunk_text.substring(0, 200) + '...',
      thumbnailUrl: `https://img.youtube.com/vi/${result.youtube_id}/maxresdefault.jpg`,
      confidence: result.similarity_score
    }))
    
    // Generate contextual follow-up questions
    const suggestedQuestions = generateSuggestedQuestions(message, aiResponse)
    
    // TODO: Implement real usage tracking
    const usageRemaining = 5
    
    const responseTime = `${Date.now() - startTime}ms`
    
    const response: BloxWizardResponse = {
      answer: aiResponse,
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

/**
 * Generate embedding for a text using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

/**
 * Search transcript chunks using vector similarity
 */
async function searchTranscriptChunks(embedding: number[], similarityThreshold: number = 0.7, maxResults: number = 10) {
  const { data, error } = await supabaseAdmin
    .rpc('search_transcript_chunks', {
      query_embedding: embedding,
      similarity_threshold: similarityThreshold,
      max_results: maxResults
    })

  if (error) {
    console.error('Error searching transcript chunks:', error)
    throw new Error('Failed to search transcript chunks')
  }

  return data || []
}

/**
 * Search transcript chunks using text similarity (fallback)
 */
async function searchTranscriptText(query: string, maxResults: number = 5) {
  try {
    // Use PostgreSQL full-text search as fallback
    const { data, error } = await supabaseAdmin
      .from('transcript_chunks')
      .select(`
        id,
        transcript_id,
        chunk_text,
        start_timestamp,
        end_timestamp,
        start_seconds,
        end_seconds,
        video_transcripts!inner (
          video_id,
          youtube_id, 
          title,
          creator
        )
      `)
      .textSearch('chunk_text', query.replace(/[^\w\s]/g, ''), { 
        type: 'websearch',
        config: 'english'
      })
      .limit(maxResults)

    if (error) {
      console.warn('Text search error:', error)
      
      // Even simpler fallback: ILIKE search
      const { data: likeData, error: likeError } = await supabaseAdmin
        .from('transcript_chunks')
        .select(`
          id,
          transcript_id,
          chunk_text,
          start_timestamp,
          end_timestamp,
          start_seconds,
          end_seconds,
          video_transcripts!inner (
            video_id,
            youtube_id,
            title,
            creator
          )
        `)
        .ilike('chunk_text', `%${query}%`)
        .limit(maxResults)

      if (likeError) {
        console.error('Fallback search also failed:', likeError)
        return []
      }
      
      return transformTextSearchResults(likeData || [])
    }

    return transformTextSearchResults(data || [])
  } catch (error) {
    console.warn('Text search failed:', error)
    return []
  }
}

/**
 * Transform text search results to match vector search format
 */
function transformTextSearchResults(results: any[]) {
  return results.map(result => ({
    chunk_id: result.id,
    transcript_id: result.transcript_id,
    video_id: result.video_transcripts.video_id,
    youtube_id: result.video_transcripts.youtube_id,
    title: result.video_transcripts.title,
    creator: result.video_transcripts.creator,
    chunk_text: result.chunk_text,
    start_timestamp: result.start_timestamp,
    end_timestamp: result.end_timestamp,
    start_seconds: result.start_seconds,
    end_seconds: result.end_seconds,
    similarity_score: 0.8 // Default score for text matches
  }))
}

/**
 * Generate AI response using OpenAI with relevant context from search results
 */
async function generateAIResponse(userMessage: string, searchResults: any[], searchMethod: string = 'vector'): Promise<string> {
  const contextText = searchResults
    .map(result => `[${result.title} at ${result.start_timestamp}]: ${result.chunk_text}`)
    .join('\n\n')

  const contextPrompt = contextText 
    ? `Context from video transcripts:\n${contextText}\n\nUse this context to provide specific, helpful answers with video references.`
    : 'No specific video context found. Provide general Roblox development guidance based on your knowledge.'

  const systemPrompt = `You are Blox Wizard, an AI assistant specializing in Roblox game development education. You help young developers (ages 10-25) learn Roblox scripting, building, and game design.

${contextPrompt}

Guidelines:
- Be encouraging and supportive
- Use simple language appropriate for young developers
- Include practical examples when possible
- Reference specific video timestamps when they're relevant (format: "VideoTitle at MM:SS")
- If no specific context is available, provide helpful general guidance
- Always end with a suggestion for what to learn next`

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 500,
    temperature: 0.7,
  })

  return response.choices[0].message.content || "I'm sorry, I couldn't generate a response. Please try asking your question again."
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
