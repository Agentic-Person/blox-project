# Task 01-04: Chat API Endpoint
**Phase 1: Foundation | Week 1**

---

## Task Overview

**Goal**: Build the main chat API endpoint that orchestrates search, AI processing, and response generation.

**Estimated Time**: 5-6 hours  
**Priority**: High (user-facing functionality)  
**Dependencies**: `01-01-database-schema`, `01-03-vector-search`

---

## Senior Developer Notes

This API endpoint is what the user will interact with. It needs to be fast, reliable, and cost-effective. The existing file `src/app/api/chat/blox-wizard/route.ts` has mock data - we'll replace it with the real implementation.

**Key Requirements from User**:
- Sub-3 second response times (95th percentile)  
- Must integrate with existing UI in `BloxChatInterface.tsx`
- Return video references with precise timestamps
- Handle educational content appropriately (ages 10-25)
- Support session management for conversation context

**Cost Optimization**: This is where smart caching will save 60-80% on OpenAI costs

---

## API Design

### 1. Request/Response Format

Update the existing API to match this spec:

```typescript
// POST /api/chat/blox-wizard
interface ChatRequest {
  message: string;
  sessionId: string;
  userId?: string; // From Supabase auth
  videoContext?: {
    videoId: string;
    youtubeId: string;  
    currentTime?: number; // If watching a video
  };
  preferences?: {
    maxVideos?: number; // Default 5
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    focusAreas?: string[]; // ['scripting', 'building', 'ui']
  };
}

interface ChatResponse {
  answer: string;
  videoReferences: VideoReference[];
  suggestedQuestions: string[];
  sessionId: string;
  usageRemaining: number;
  responseTime: number;
  metadata: {
    cacheHit: boolean;
    searchResultsCount: number;
    confidence: number;
    tokensUsed?: number;
  };
}

interface VideoReference {
  title: string;
  youtubeId: string;
  creator?: string;
  timestamp: string; // "15:30"
  relevantSegment: string; // The actual text that matched
  thumbnailUrl: string;
  videoUrl: string; // Direct YouTube link
  timestampUrl: string; // YouTube link with timestamp
  confidence: number;
  duration?: string;
}
```

---

## Implementation Steps

### Step 1: Update Existing API File

Replace `src/app/api/chat/blox-wizard/route.ts` with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { VectorSearchService } from '@/lib/services/blox-wizard/vector-search';
import { ResponseGenerator } from '@/lib/services/blox-wizard/response-generator';
import { QuestionCache } from '@/lib/services/blox-wizard/question-cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const vectorSearch = new VectorSearchService(supabase);
const responseGenerator = new ResponseGenerator();
const questionCache = new QuestionCache(supabase);

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse and validate request
    const body: ChatRequest = await request.json();
    const { message, sessionId, userId, videoContext, preferences } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Step 1: Check question cache first
    const cachedResponse = await questionCache.findSimilarQuestion(message);
    if (cachedResponse) {
      return NextResponse.json({
        ...cachedResponse,
        responseTime: Date.now() - startTime,
        metadata: { ...cachedResponse.metadata, cacheHit: true }
      });
    }

    // Step 2: Perform vector search across all transcripts
    const searchResults = await vectorSearch.search(message, {
      maxResults: preferences?.maxVideos || 5,
      similarityThreshold: 0.7,
      multiVideoBoost: true
    });

    if (searchResults.results.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find any relevant content in our video library for that question. Try asking about Roblox scripting, building, or game development topics!",
        videoReferences: [],
        suggestedQuestions: [
          "How do I create a basic script in Roblox Studio?",
          "What are the fundamentals of Lua programming?",
          "How do I make a GUI for my game?"
        ],
        sessionId,
        usageRemaining: 100, // TODO: Implement usage tracking
        responseTime: Date.now() - startTime,
        metadata: {
          cacheHit: false,
          searchResultsCount: 0,
          confidence: 0
        }
      });
    }

    // Step 3: Generate AI response with video context
    const aiResponse = await responseGenerator.generateResponse({
      query: message,
      searchResults: searchResults.results,
      videoContext,
      userId,
      sessionId
    });

    // Step 4: Format video references
    const videoReferences: VideoReference[] = searchResults.results.map(result => ({
      title: result.title,
      youtubeId: result.youtubeId,
      creator: result.creator,
      timestamp: result.startTimestamp,
      relevantSegment: this.truncateText(result.chunkText, 200),
      thumbnailUrl: `https://img.youtube.com/vi/${result.youtubeId}/mqdefault.jpg`,
      videoUrl: `https://www.youtube.com/watch?v=${result.youtubeId}`,
      timestampUrl: `https://www.youtube.com/watch?v=${result.youtubeId}&t=${this.parseTimestamp(result.startTimestamp)}s`,
      confidence: result.confidence,
      duration: result.duration
    }));

    // Step 5: Generate suggested follow-up questions
    const suggestedQuestions = await responseGenerator.generateFollowUpQuestions(
      message,
      searchResults.results.slice(0, 3)
    );

    const response: ChatResponse = {
      answer: aiResponse.text,
      videoReferences,
      suggestedQuestions,
      sessionId,
      usageRemaining: 100, // TODO: Implement rate limiting
      responseTime: Date.now() - startTime,
      metadata: {
        cacheHit: false,
        searchResultsCount: searchResults.results.length,
        confidence: searchResults.results[0]?.confidence || 0,
        tokensUsed: aiResponse.tokensUsed
      }
    };

    // Step 6: Cache the response for future use
    await questionCache.cacheQuestion(message, response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Something went wrong processing your request. Please try again.'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

function parseTimestamp(timestamp: string): number {
  const [mins, secs] = timestamp.split(':').map(Number);
  return (mins * 60) + secs;
}
```

### Step 2: Create Response Generator Service

Create: `src/lib/services/blox-wizard/response-generator.ts`

```typescript
import OpenAI from 'openai';

interface ResponseGeneratorConfig {
  model: string; // 'gpt-4o-mini'
  maxTokens: number; // 500
  temperature: number; // 0.7
  systemPrompt: string;
}

export class ResponseGenerator {
  private openai: OpenAI;
  private config: ResponseGeneratorConfig;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.config = {
      model: 'gpt-4o-mini',
      maxTokens: 500,
      temperature: 0.7,
      systemPrompt: `You are an expert Roblox development tutor helping young developers (ages 10-25) learn game creation.

CONTEXT: You have access to transcript segments from educational YouTube videos about Roblox development.

GUIDELINES:
- Be encouraging and educational
- Use age-appropriate language
- Always reference specific videos when providing information
- Include precise timestamps for video segments
- Break down complex concepts into simple steps
- Encourage hands-on practice
- Be concise but thorough

RESPONSE FORMAT:
- Start with a direct answer to their question
- Reference specific video segments with timestamps
- Provide actionable next steps
- Keep responses under 400 words`
    };
  }

  async generateResponse(params: {
    query: string;
    searchResults: SearchResult[];
    videoContext?: VideoContext;
    userId?: string;
    sessionId: string;
  }): Promise<{ text: string; tokensUsed: number }> {
    
    const contextText = this.buildContextFromResults(params.searchResults);
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: this.config.systemPrompt
      },
      {
        role: 'user',
        content: `Question: ${params.query}

Relevant video content:
${contextText}

Please provide a helpful response that references specific videos and timestamps.`
      }
    ];

    const completion = await this.openai.chat.completions.create({
      model: this.config.model,
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature
    });

    return {
      text: completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try rephrasing your question.',
      tokensUsed: completion.usage?.total_tokens || 0
    };
  }

  async generateFollowUpQuestions(
    originalQuery: string, 
    topResults: SearchResult[]
  ): Promise<string[]> {
    
    const videoTopics = topResults.map(r => r.title).slice(0, 3);
    
    // Simple rule-based follow-up generation
    // TODO: Could enhance with AI generation if needed
    const followUps: string[] = [];
    
    if (originalQuery.toLowerCase().includes('script')) {
      followUps.push('What are the basic components of a Roblox script?');
      followUps.push('How do I test my scripts in Studio?');
    }
    
    if (originalQuery.toLowerCase().includes('gui')) {
      followUps.push('How do I make my GUI responsive to different screen sizes?');
      followUps.push('What are the best practices for GUI design?');
    }
    
    // Add topic-specific questions based on video content
    if (videoTopics.some(title => title.toLowerCase().includes('datastore'))) {
      followUps.push('How do I save player data safely?');
    }
    
    return followUps.slice(0, 3); // Max 3 suggestions
  }

  private buildContextFromResults(results: SearchResult[]): string {
    return results.map((result, index) => 
      `Video ${index + 1}: "${result.title}" by ${result.creator || 'Unknown'}
Timestamp: ${result.startTimestamp}
Content: ${result.chunkText}
---`
    ).join('\n\n');
  }
}
```

### Step 3: Add Rate Limiting and Usage Tracking

```typescript
// Add to the API route
interface UserUsage {
  userId: string;
  requestsToday: number;
  lastReset: Date;
  plan: 'free' | 'premium';
}

async function checkRateLimit(userId?: string): Promise<{ allowed: boolean; remaining: number }> {
  if (!userId) {
    // Anonymous users get limited requests
    return { allowed: true, remaining: 10 };
  }
  
  // TODO: Implement proper rate limiting with Redis or database
  // For now, return generous limits
  return { allowed: true, remaining: 100 };
}
```

---

## Error Handling

### 1. Common Errors to Handle

```typescript
try {
  // ... main logic
} catch (error) {
  // OpenAI API errors
  if (error.code === 'rate_limit_exceeded') {
    return NextResponse.json(
      { error: 'We\'re experiencing high demand. Please try again in a moment.' },
      { status: 429 }
    );
  }
  
  // Database connection errors  
  if (error.message.includes('connection')) {
    return NextResponse.json(
      { error: 'Database temporarily unavailable. Please try again.' },
      { status: 503 }
    );
  }
  
  // Generic error
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Something went wrong. Please try again.' },
    { status: 500 }
  );
}
```

### 2. Input Validation

```typescript
function validateChatRequest(body: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!body.message || typeof body.message !== 'string') {
    errors.push('Message is required and must be a string');
  }
  
  if (body.message && body.message.length > 1000) {
    errors.push('Message too long (max 1000 characters)');
  }
  
  if (!body.sessionId || typeof body.sessionId !== 'string') {
    errors.push('Session ID is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

---

## Integration with Existing UI

### 1. Update Frontend Component

The existing `BloxChatInterface.tsx` needs to handle the new response format:

```typescript
// In the component, update the message handling:
const handleSendMessage = async (message: string) => {
  try {
    const response = await fetch('/api/chat/blox-wizard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sessionId: sessionId.current,
        userId: user?.id,
        videoContext: currentVideo ? {
          videoId: currentVideo.id,
          youtubeId: currentVideo.youtubeId,
          currentTime: videoCurrentTime
        } : undefined
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    
    // Add to chat history
    setChatHistory(prev => [...prev, {
      id: Date.now().toString(),
      type: 'bot',
      message: data.answer,
      videoReferences: data.videoReferences,
      suggestedQuestions: data.suggestedQuestions,
      timestamp: new Date(),
      responseTime: data.responseTime
    }]);

  } catch (error) {
    console.error('Chat error:', error);
    // Handle error in UI
  }
};
```

---

## Testing Requirements

### 1. Unit Tests

```typescript
// __tests__/chat-api.test.ts
describe('/api/chat/blox-wizard', () => {
  test('should return relevant response for valid query', async () => {
    const response = await request(app)
      .post('/api/chat/blox-wizard')
      .send({
        message: 'how to script a door',
        sessionId: 'test-session'
      });
      
    expect(response.status).toBe(200);
    expect(response.body.answer).toBeDefined();
    expect(response.body.videoReferences).toBeInstanceOf(Array);
    expect(response.body.responseTime).toBeLessThan(5000);
  });

  test('should handle invalid requests', async () => {
    const response = await request(app)
      .post('/api/chat/blox-wizard')
      .send({});
      
    expect(response.status).toBe(400);
  });
});
```

### 2. Integration Tests

```typescript
test('end-to-end chat flow', async () => {
  // Test the complete flow from user input to final response
  const testQuery = 'What is a RemoteEvent?';
  
  const response = await request(app)
    .post('/api/chat/blox-wizard')
    .send({
      message: testQuery,
      sessionId: 'integration-test'
    });
    
  expect(response.status).toBe(200);
  expect(response.body.answer).toContain('RemoteEvent');
  expect(response.body.videoReferences.length).toBeGreaterThan(0);
  expect(response.body.videoReferences[0]).toHaveProperty('timestampUrl');
});
```

---

## Performance Optimization

### 1. Response Time Targets
- **Target**: 95% of requests under 3 seconds
- **Method**: Parallel processing of search and AI generation where possible

### 2. Cost Optimization
- Cache frequently asked questions
- Use shorter context windows when possible
- Implement smart truncation of search results

### 3. Memory Management
- Stream responses for long answers
- Clean up temporary objects
- Use efficient JSON serialization

---

## Success Criteria

- [ ] API responds to chat messages with relevant answers
- [ ] Integration with existing `BloxChatInterface.tsx` works
- [ ] Response time < 3 seconds for 95% of requests
- [ ] Returns video references with working timestamps
- [ ] Proper error handling for all edge cases
- [ ] Input validation prevents malformed requests
- [ ] Rate limiting prevents abuse

---

## Next Task Dependencies

This task enables:
- `01-05-frontend-integration` (connects API to UI)
- `02-01-caching-system` (uses this API for caching)

**Estimated completion**: End of Day 4  
**Critical path**: Yes - this is the main user-facing feature

---

*Task created by: Senior Developer*  
*Date: Current*  
*Integration note: Updates existing file, doesn't create new ones*