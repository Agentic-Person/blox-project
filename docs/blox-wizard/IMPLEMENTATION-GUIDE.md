# Chat Wizard Implementation Guide
## Senior Developer Documentation for Junior Developer Onboarding

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Technical Architecture](#technical-architecture)
3. [Implementation Phases](#implementation-phases)
4. [Database Schema](#database-schema)
5. [Core Services](#core-services)
6. [API Endpoints](#api-endpoints)
7. [Testing Strategy](#testing-strategy)
8. [Performance Considerations](#performance-considerations)

---

## System Overview

### What is Chat Wizard?

Chat Wizard is an intelligent AI learning assistant integrated into the Blox Buddy platform that provides:

- **Multi-Video Search**: Searches across ALL YouTube video transcripts simultaneously
- **Learning Path Generation**: Creates personalized learning calendars based on user requests
- **Smart Question Caching**: Reduces API costs by caching common questions
- **Video Recommendations**: Suggests relevant videos based on user queries
- **Progress Tracking**: Integrates with existing AI Journey system

### Key Business Requirements

1. **Cross-Video Intelligence**: When a user asks about "scripting errors", Chat Wizard should find relevant content from multiple videos across the entire curriculum
2. **Calendar Integration**: Users can say "Schedule these 3 videos for next week" and Chat Wizard creates calendar entries
3. **Performance Optimization**: Cache the 50 most common questions to reduce OpenAI API calls
4. **Real-Time Search**: Sub-3-second response times for queries

### Why This Architecture?

We chose **NOT** to use N8n workflows because:
- The core team doesn't need Discord bot automation
- Content health checks aren't a priority
- Direct Next.js implementation provides better control
- Reduces system complexity and maintenance overhead

---

## Technical Architecture

### High-Level Data Flow

```
User Query → Chat API → Smart Cache Check → Vector Search → OpenAI Processing → Response
                              ↓                    ↓              ↓
                        Cache Hit?          Find Similar     Generate Answer
                              ↓           Transcript Chunks   with Citations
                        Return Cached            ↓              ↓
                           Answer         Rank by Relevance  Store in Cache
```

### Component Breakdown

#### 1. **Transcript Processing Pipeline**
```typescript
curriculum.json → YouTube API → Text Chunking → OpenAI Embeddings → Supabase Storage
```

#### 2. **Query Processing System**
```typescript
User Query → Question Analysis → Cache Check → Vector Search → Result Ranking
```

#### 3. **Calendar Integration**
```typescript
Schedule Request → Intent Detection → Video Selection → Calendar Entry Creation
```

---

## Implementation Phases

### Phase 1: Database Foundation (Est: 30 minutes)

Create the database schema to support transcript storage and vector search.

**Key Tables:**
- `video_transcripts` - Full transcript storage
- `transcript_chunks` - Searchable chunks with embeddings
- `common_questions` - Question cache
- `question_answers` - Cached responses

**Why this approach?**
- Separating full transcripts from chunks allows for both detailed context and fast search
- Caching at the database level ensures persistence across server restarts
- Using pgvector in Supabase keeps everything in one database

### Phase 2: Transcript Processing (Est: 1 hour)

Build the system to fetch and process YouTube transcripts.

**Key Components:**
- YouTube transcript fetcher
- Text chunking with overlap
- Embedding generation
- Database storage

**Critical Decisions:**
- **Chunk Size**: 500 tokens with 100-token overlap
  - *Why?* Provides enough context while staying under OpenAI limits
- **Timestamp Preservation**: Each chunk maintains original video timestamps
  - *Why?* Users need to know exactly where in the video to look

### Phase 3: Vector Search Implementation (Est: 1 hour)

Implement the similarity search that powers multi-video queries.

**Key Features:**
- Semantic similarity search using pgvector
- Result ranking by relevance score
- Multiple video aggregation
- Timestamp extraction

**Performance Target:** < 500ms for vector search operations

### Phase 4: Smart Caching System (Est: 45 minutes)

Build the intelligent caching layer to reduce API costs.

**Cache Strategy:**
- Track all user questions
- Identify semantic similarity patterns
- Cache top 50 most common question types
- Auto-update cache based on usage

**Why this matters:**
If 80% of users ask variations of "How do I script a door?", we only need to generate that answer once.

### Phase 5: API Integration (Est: 1 hour)

Update the existing Chat API to use the new system.

**Current State:**
- `/api/chat/blox-wizard/route.ts` exists with mock data
- Connected to N8n (which we're removing)
- Basic error handling

**New Implementation:**
- Direct database connections
- Cache-first architecture
- Enhanced response formatting
- Calendar integration

### Phase 6: Testing & Optimization (Est: 30 minutes)

Ensure system reliability and performance.

**Testing Strategy:**
- Unit tests for core functions
- Integration tests for API endpoints
- Load testing for database queries
- Cache hit rate monitoring

---

## Database Schema

### Core Tables

#### video_transcripts
Stores complete transcript data for each video.

```sql
CREATE TABLE video_transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL,
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  creator TEXT,
  duration_seconds INT,
  full_transcript TEXT NOT NULL,
  transcript_json JSONB, -- Includes timestamps
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Why separate from curriculum.json?**
- Transcripts can be large (10MB+ for long videos)
- Allows for additional metadata not in curriculum
- Enables transcript updates without touching curriculum

#### transcript_chunks
Searchable segments with vector embeddings.

```sql
CREATE TABLE transcript_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transcript_id UUID REFERENCES video_transcripts(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INT NOT NULL,
  start_timestamp TEXT NOT NULL, -- "15:30"
  end_timestamp TEXT NOT NULL,   -- "16:45"
  embedding vector(1536), -- OpenAI ada-002 dimensions
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Chunking Strategy:**
- 500 tokens per chunk (roughly 2000 characters)
- 100-token overlap between chunks
- Preserves sentence boundaries
- Maintains timestamp accuracy

#### common_questions
Tracks frequently asked question patterns.

```sql
CREATE TABLE common_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_pattern TEXT NOT NULL,
  question_embedding vector(1536),
  usage_count INT DEFAULT 1,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### question_answers
Cached AI responses for common questions.

```sql
CREATE TABLE question_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES common_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  video_references JSONB, -- Array of relevant videos
  confidence_score DECIMAL(3,2),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes for Performance

```sql
-- Essential for vector similarity search
CREATE INDEX transcript_chunks_embedding_idx 
ON transcript_chunks USING ivfflat (embedding vector_cosine_ops);

-- Fast video lookup
CREATE INDEX transcript_chunks_transcript_idx 
ON transcript_chunks(transcript_id);

-- Timestamp-based queries
CREATE INDEX transcript_chunks_timestamp_idx 
ON transcript_chunks(transcript_id, chunk_index);

-- Question pattern matching
CREATE INDEX common_questions_embedding_idx 
ON common_questions USING ivfflat (embedding vector_cosine_ops);
```

---

## Core Services

### TranscriptProcessor Service

**Location:** `/lib/services/transcript-processor.ts`

**Responsibilities:**
1. Fetch transcripts from YouTube API
2. Clean and format transcript text
3. Split into searchable chunks
4. Generate embeddings
5. Store in database

**Key Methods:**

```typescript
class TranscriptProcessor {
  async fetchTranscript(youtubeId: string): Promise<TranscriptData>
  async processTranscript(transcript: TranscriptData): Promise<TranscriptChunk[]>
  async generateEmbeddings(chunks: TranscriptChunk[]): Promise<EmbeddedChunk[]>
  async storeInDatabase(chunks: EmbeddedChunk[]): Promise<void>
}
```

**Error Handling:**
- YouTube API rate limiting
- Missing transcripts (auto-generated vs manual)
- Embedding generation failures
- Database connection issues

### VectorSearch Service

**Location:** `/lib/services/vector-search.ts`

**Responsibilities:**
1. Convert user queries to embeddings
2. Perform similarity searches
3. Rank results by relevance
4. Format responses with metadata

**Key Methods:**

```typescript
class VectorSearch {
  async searchSimilarContent(query: string, limit: number = 10): Promise<SearchResult[]>
  async findRelevantVideos(query: string): Promise<VideoMatch[]>
  private async generateQueryEmbedding(query: string): Promise<number[]>
  private async rankResults(results: SearchResult[]): Promise<SearchResult[]>
}
```

**Search Algorithm:**
1. Generate query embedding using OpenAI
2. Find similar chunks using cosine similarity
3. Group results by video
4. Score videos by cumulative relevance
5. Return top matches with timestamps

### QuestionCache Service

**Location:** `/lib/services/question-cache.ts`

**Responsibilities:**
1. Detect similar questions
2. Manage cache lifecycle
3. Track usage patterns
4. Update cache based on popularity

**Key Methods:**

```typescript
class QuestionCache {
  async checkCache(question: string): Promise<CachedAnswer | null>
  async storeAnswer(question: string, answer: string, confidence: number): Promise<void>
  async updateUsageStats(questionId: string): Promise<void>
  private async findSimilarQuestions(question: string): Promise<CachedQuestion[]>
}
```

**Cache Strategy:**
- Semantic similarity threshold: 0.85
- Cache TTL: 30 days for active questions
- Auto-eviction for unused entries
- Periodic cache optimization

### RecommendationEngine Service

**Location:** `/lib/services/recommendation-engine.ts`

**Responsibilities:**
1. Analyze user intent
2. Generate video recommendations
3. Create learning sequences
4. Suggest follow-up content

**Key Methods:**

```typescript
class RecommendationEngine {
  async recommendVideos(query: string, userLevel: string): Promise<VideoRecommendation[]>
  async createLearningPath(topic: string, timeframe: string): Promise<LearningPath>
  async suggestFollowUp(completedVideo: string): Promise<VideoRecommendation[]>
}
```

### CalendarIntegration Service

**Location:** `/lib/services/calendar-integration.ts`

**Responsibilities:**
1. Parse scheduling requests
2. Create calendar entries
3. Manage learning schedules
4. Send reminders

**Key Methods:**

```typescript
class CalendarIntegration {
  async parseScheduleRequest(query: string): Promise<ScheduleIntent>
  async createScheduleEntries(videos: string[], timeframe: string): Promise<ScheduleEntry[]>
  async updateProgress(videoId: string, userId: string): Promise<void>
}
```

---

## API Endpoints

### POST /api/chat/blox-wizard

**Current Implementation:** Basic chat with mock data
**New Implementation:** Full Chat Wizard functionality

**Request Format:**
```typescript
interface ChatRequest {
  message: string
  sessionId: string
  userId?: string
  videoContext?: {
    videoId: string
    title: string
    youtubeId: string
    currentTime?: number
  }
}
```

**Response Format:**
```typescript
interface ChatResponse {
  answer: string
  videoReferences: VideoReference[]
  suggestedQuestions: string[]
  usageRemaining: number
  responseTime: string
  metadata: {
    cacheHit: boolean
    searchResults: number
    confidence: number
  }
}
```

**Processing Flow:**

1. **Input Validation**
   ```typescript
   if (!message || !sessionId) {
     return { error: 'Missing required fields' }
   }
   ```

2. **Cache Check**
   ```typescript
   const cachedAnswer = await questionCache.checkCache(message)
   if (cachedAnswer && cachedAnswer.confidence > 0.8) {
     return formatCachedResponse(cachedAnswer)
   }
   ```

3. **Vector Search**
   ```typescript
   const searchResults = await vectorSearch.searchSimilarContent(message)
   const relevantVideos = await vectorSearch.findRelevantVideos(message)
   ```

4. **AI Processing**
   ```typescript
   const context = searchResults.map(r => r.text).join('\n')
   const aiResponse = await openai.chat.completions.create({
     messages: [
       { role: 'system', content: SYSTEM_PROMPT },
       { role: 'user', content: `${message}\n\nContext: ${context}` }
     ]
   })
   ```

5. **Response Formatting**
   ```typescript
   const response = {
     answer: aiResponse.choices[0].message.content,
     videoReferences: formatVideoReferences(relevantVideos),
     suggestedQuestions: generateSuggestions(message),
     // ... metadata
   }
   ```

6. **Cache Update**
   ```typescript
   await questionCache.storeAnswer(message, response.answer, confidence)
   ```

### POST /api/transcripts/process

**Purpose:** Batch process videos from curriculum.json

**Request Format:**
```typescript
interface ProcessRequest {
  videoIds?: string[] // Process specific videos
  forceReprocess?: boolean // Ignore existing transcripts
}
```

**Processing Logic:**
1. Load curriculum.json
2. Extract video metadata
3. Check for existing transcripts
4. Fetch missing transcripts
5. Process and store chunks
6. Generate embeddings
7. Return processing summary

### GET /api/transcripts/status

**Purpose:** Monitor transcript processing status

**Response Format:**
```typescript
interface StatusResponse {
  totalVideos: number
  processedVideos: number
  failedVideos: string[]
  lastProcessed: string
  processingQueue: number
}
```

---

## Testing Strategy

### Unit Tests

**Core Functions to Test:**
- Transcript chunking algorithm
- Embedding generation
- Vector similarity search
- Cache hit/miss logic
- Question pattern matching

**Example Test:**
```typescript
describe('TranscriptProcessor', () => {
  it('should chunk transcript with proper overlap', () => {
    const transcript = 'Long transcript text...'
    const chunks = processor.chunkTranscript(transcript)
    
    expect(chunks).toHaveLength(expectedChunks)
    expect(chunks[0].text).toContain(expectedOverlap)
  })
})
```

### Integration Tests

**API Endpoint Testing:**
- Full chat flow from query to response
- Cache behavior under load
- Database connection handling
- Error scenarios

**Example Test:**
```typescript
describe('Chat API', () => {
  it('should return relevant videos for scripting query', async () => {
    const response = await fetch('/api/chat/blox-wizard', {
      method: 'POST',
      body: JSON.stringify({ message: 'How do I script a door?', sessionId: 'test' })
    })
    
    const data = await response.json()
    expect(data.videoReferences).toHaveLength.greaterThan(0)
    expect(data.videoReferences[0]).toHaveProperty('timestamp')
  })
})
```

### Performance Tests

**Load Testing Scenarios:**
- 100 concurrent chat requests
- Database query performance under load
- Cache hit rate optimization
- Memory usage monitoring

**Performance Targets:**
- API Response: < 3 seconds
- Vector Search: < 500ms
- Cache Lookup: < 50ms
- Database Query: < 200ms

---

## Performance Considerations

### Database Optimization

**Vector Index Configuration:**
```sql
-- Optimize for similarity search performance
CREATE INDEX CONCURRENTLY transcript_chunks_embedding_idx 
ON transcript_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Query Optimization:**
- Use connection pooling
- Implement query result caching
- Add database query monitoring
- Optimize JOIN operations

### OpenAI API Management

**Rate Limiting:**
- Implement exponential backoff
- Queue requests during high load
- Monitor token usage
- Cache embeddings aggressively

**Cost Optimization:**
- Smart caching reduces 70% of API calls
- Batch embedding generation
- Use appropriate model tiers
- Monitor and alert on usage spikes

### Memory Management

**Large Dataset Handling:**
- Stream large results
- Implement pagination
- Clear unused embeddings
- Monitor memory usage patterns

**Caching Strategy:**
- In-memory cache for hot queries
- Redis for session data
- Database for persistent cache
- LRU eviction policies

---

## Security Considerations

### Data Protection

**User Data:**
- Encrypt sensitive information
- Implement proper access controls
- Audit user queries
- GDPR compliance for EU users

**API Security:**
- Rate limiting per user
- Input validation and sanitization
- SQL injection prevention
- API key rotation

### Content Safety

**Transcript Content:**
- Filter inappropriate content
- Monitor for policy violations
- Implement content warnings
- Regular content audits

---

## Deployment Checklist

### Environment Setup

- [ ] Supabase database with pgvector extension
- [ ] OpenAI API key configuration
- [ ] YouTube API key setup
- [ ] Environment variables configured
- [ ] Database migrations applied

### Performance Monitoring

- [ ] Database query monitoring
- [ ] API response time tracking
- [ ] Cache hit rate monitoring
- [ ] Error rate alerting
- [ ] Resource usage tracking

### Testing Verification

- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Performance tests meeting targets
- [ ] Security scans completed
- [ ] Load testing successful

---

## Next Steps

Once this documentation is complete, the implementation order should be:

1. **Create database schema** - Foundation for everything else
2. **Build transcript processor** - Core data ingestion
3. **Implement vector search** - Core functionality
4. **Add smart caching** - Performance optimization
5. **Update Chat API** - User-facing features
6. **Add calendar integration** - Advanced features
7. **Testing and optimization** - Production readiness

Each phase builds on the previous one, allowing for incremental development and testing.

---

## Questions for Junior Developer

Before starting implementation, please review:

1. Do you understand the overall system architecture?
2. Are you comfortable with TypeScript and Next.js?
3. Have you worked with vector databases before?
4. Do you need clarification on any specific component?
5. Are there any tools or technologies you need to learn?

Remember: This is a complex system, but it's designed to be built incrementally. Start with the database schema, then move through each service one at a time. Don't hesitate to ask questions!

---

*This documentation is a living document. Update it as the implementation evolves and new requirements emerge.*