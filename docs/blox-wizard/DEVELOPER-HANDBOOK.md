# Chat Wizard Developer Handbook
## Practical Development Guide for Day-to-Day Work

---

## Quick Start Guide

### Prerequisites

Before you begin, ensure you have:

```bash
# Required tools
- Node.js 18+ 
- npm or yarn
- Git
- VS Code (recommended)

# Required accounts/keys
- Supabase account and project
- OpenAI API key
- YouTube Data API key (optional for development)
```

### Environment Setup

1. **Clone and Install**
```bash
git clone [repository-url]
cd BloxProject
npm install
```

2. **Environment Variables**
Create `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key

# YouTube API (optional for development)
YOUTUBE_API_KEY=your-youtube-api-key

# Development Settings
NODE_ENV=development
```

3. **Database Setup**
```bash
# Run migrations
npm run supabase:migrate

# Seed test data (optional)
npm run supabase:seed
```

4. **Start Development**
```bash
npm run dev
```

### Project Structure

```
/docs/blox-wizard/          # Documentation (you are here)
/src/
  /app/api/chat/blox-wizard/ # Main Chat API endpoint
  /lib/services/             # Core services (to be created)
    ├── transcript-processor.ts
    ├── vector-search.ts
    ├── question-cache.ts
    └── ...
  /components/ai/            # Chat interface components
/supabase/
  /migrations/               # Database schema changes
```

---

## Development Workflow

### Daily Development Tasks

#### 1. Working on Services

**Creating a New Service:**
```typescript
// /lib/services/example-service.ts
import { createClient } from '@/lib/supabase/client'

export class ExampleService {
  private supabase = createClient()

  async performTask(input: string): Promise<Result> {
    try {
      // Implementation here
    } catch (error) {
      console.error('ExampleService error:', error)
      throw error
    }
  }
}

export const exampleService = new ExampleService()
```

**Service Testing:**
```typescript
// /lib/services/__tests__/example-service.test.ts
import { ExampleService } from '../example-service'

describe('ExampleService', () => {
  let service: ExampleService

  beforeEach(() => {
    service = new ExampleService()
  })

  it('should perform task correctly', async () => {
    const result = await service.performTask('test input')
    expect(result).toBeDefined()
  })
})
```

#### 2. Database Changes

**Creating a Migration:**
```bash
# Create new migration file
npm run supabase:migration create_transcript_tables

# Edit the migration file in /supabase/migrations/
# Run migration
npm run supabase:migrate
```

**Migration Example:**
```sql
-- /supabase/migrations/005_chat_wizard.sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE video_transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  -- ... more columns
);

-- Add indexes
CREATE INDEX video_transcripts_youtube_id_idx ON video_transcripts(youtube_id);
```

#### 3. API Development

**Adding New Endpoints:**
```typescript
// /app/api/new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation
    if (!body.requiredField) {
      return NextResponse.json(
        { error: 'Missing required field' },
        { status: 400 }
      )
    }

    // Process request
    const result = await processRequest(body)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Common Tasks

#### Working with Embeddings

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Generate embedding for text
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  })
  
  return response.data[0].embedding
}

// Search similar content
async function searchSimilar(queryEmbedding: number[], limit = 10) {
  const { data, error } = await supabase
    .rpc('match_transcript_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit
    })
  
  if (error) throw error
  return data
}
```

#### Working with Vector Searches

```sql
-- Create the RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_transcript_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  chunk_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    transcript_chunks.id,
    transcript_chunks.chunk_text,
    1 - (transcript_chunks.embedding <=> query_embedding) AS similarity
  FROM transcript_chunks
  WHERE 1 - (transcript_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY transcript_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

#### Caching Implementation

```typescript
// Simple in-memory cache with TTL
class SimpleCache<T> {
  private cache = new Map<string, { data: T; expires: number }>()

  set(key: string, value: T, ttlMinutes = 60): void {
    const expires = Date.now() + (ttlMinutes * 60 * 1000)
    this.cache.set(key, { data: value, expires })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }
}

// Usage
const questionCache = new SimpleCache<string>()
```

---

## Testing Guide

### Test Structure

```
/src/lib/services/__tests__/
  ├── transcript-processor.test.ts
  ├── vector-search.test.ts
  └── question-cache.test.ts

/src/app/api/__tests__/
  └── chat-api.test.ts
```

### Unit Testing Examples

#### Service Testing
```typescript
import { TranscriptProcessor } from '../transcript-processor'

describe('TranscriptProcessor', () => {
  let processor: TranscriptProcessor

  beforeEach(() => {
    processor = new TranscriptProcessor()
  })

  describe('chunkText', () => {
    it('should split long text into chunks', () => {
      const longText = 'A'.repeat(2000) // 2000 characters
      const chunks = processor.chunkText(longText, 500, 100)
      
      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks[0].length).toBeLessThanOrEqual(500)
    })

    it('should handle overlap correctly', () => {
      const text = 'This is sentence one. This is sentence two. This is sentence three.'
      const chunks = processor.chunkText(text, 30, 10)
      
      // Check that chunks have overlap
      expect(chunks[0]).toContain('sentence one')
      expect(chunks[1]).toContain('sentence one') // overlap
    })
  })
})
```

#### API Testing
```typescript
import { NextRequest } from 'next/server'
import { POST } from '../../chat/blox-wizard/route'

describe('/api/chat/blox-wizard', () => {
  it('should return error for missing message', async () => {
    const request = new NextRequest('http://localhost/api/chat/blox-wizard', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'test' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Message')
  })

  it('should process valid chat request', async () => {
    const request = new NextRequest('http://localhost/api/chat/blox-wizard', {
      method: 'POST',
      body: JSON.stringify({
        message: 'How do I script a door?',
        sessionId: 'test-session'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.answer).toBeDefined()
    expect(data.videoReferences).toBeInstanceOf(Array)
  })
})
```

### Integration Testing

```typescript
// Test full pipeline from transcript to search
describe('Chat Wizard Integration', () => {
  it('should process transcript and enable search', async () => {
    // 1. Process a test transcript
    const processor = new TranscriptProcessor()
    await processor.processVideo('test-youtube-id', mockTranscript)

    // 2. Search for content
    const vectorSearch = new VectorSearch()
    const results = await vectorSearch.searchSimilarContent('scripting basics')

    // 3. Verify results
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]).toHaveProperty('videoTitle')
    expect(results[0]).toHaveProperty('timestamp')
  })
})
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test transcript-processor

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

---

## Debugging Guide

### Common Issues and Solutions

#### 1. Vector Search Not Working

**Problem**: Vector similarity search returns no results

**Debugging Steps:**
```typescript
// Check if embeddings exist
const { data: chunks } = await supabase
  .from('transcript_chunks')
  .select('id, embedding')
  .not('embedding', 'is', null)
  .limit(5)

console.log('Chunks with embeddings:', chunks?.length)

// Check embedding dimensions
if (chunks?.[0]?.embedding) {
  console.log('Embedding dimension:', chunks[0].embedding.length)
}

// Test similarity calculation
const testQuery = await generateEmbedding('test query')
const { data: similar } = await supabase
  .rpc('match_transcript_chunks', {
    query_embedding: testQuery,
    match_threshold: 0.1, // Lower threshold for testing
    match_count: 10
  })

console.log('Similar results:', similar)
```

**Common Solutions:**
- Ensure pgvector extension is installed
- Check embedding dimensions match (1536 for ada-002)
- Verify RPC function is created correctly
- Lower similarity threshold for testing

#### 2. OpenAI API Errors

**Problem**: Rate limiting or API failures

**Debugging:**
```typescript
async function safeOpenAICall<T>(
  operation: () => Promise<T>,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation()
    } catch (error: any) {
      if (error?.code === 'rate_limit_exceeded') {
        const delay = Math.pow(2, i) * 1000 // Exponential backoff
        console.log(`Rate limit hit, waiting ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

// Usage
const embedding = await safeOpenAICall(() =>
  openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  })
)
```

#### 3. Database Connection Issues

**Problem**: Supabase connection failures

**Debugging:**
```typescript
// Test database connection
async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('video_transcripts')
      .select('count(*)')
      .limit(1)

    if (error) {
      console.error('Database error:', error)
      return false
    }

    console.log('Database connected successfully')
    return true
  } catch (error) {
    console.error('Connection failed:', error)
    return false
  }
}

// Check environment variables
const requiredEnvs = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'OPENAI_API_KEY'
]

const missingEnvs = requiredEnvs.filter(env => !process.env[env])
if (missingEnvs.length > 0) {
  console.error('Missing environment variables:', missingEnvs)
}
```

### Debugging Tools

#### 1. Database Query Debugging
```sql
-- Enable query logging in Supabase
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### 2. API Response Debugging
```typescript
// Add request/response logging middleware
export function withDebugLogging(handler: Function) {
  return async (request: NextRequest) => {
    const startTime = Date.now()
    const body = await request.json()
    
    console.log('API Request:', {
      method: request.method,
      url: request.url,
      body,
      timestamp: new Date().toISOString()
    })

    const response = await handler(request)
    const responseBody = await response.json()
    
    console.log('API Response:', {
      status: response.status,
      body: responseBody,
      duration: Date.now() - startTime
    })

    return response
  }
}
```

#### 3. Vector Search Debugging
```typescript
// Debug vector similarity scores
async function debugVectorSearch(query: string) {
  const queryEmbedding = await generateEmbedding(query)
  
  const { data: results } = await supabase
    .rpc('match_transcript_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.0, // Get all results
      match_count: 50
    })

  console.log('Vector Search Debug:')
  console.log('Query:', query)
  console.log('Results by similarity:')
  
  results?.forEach((result, index) => {
    console.log(`${index + 1}. ${result.similarity.toFixed(3)} - ${result.content.substring(0, 100)}...`)
  })
}
```

---

## Performance Optimization

### Database Performance

#### 1. Index Optimization
```sql
-- Create optimal indexes for common queries
CREATE INDEX CONCURRENTLY transcript_chunks_embedding_idx 
ON transcript_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX transcript_chunks_transcript_id_idx 
ON transcript_chunks(transcript_id);

-- Monitor index usage
SELECT 
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public';
```

#### 2. Query Optimization
```typescript
// Optimize vector search with proper limits
async function optimizedVectorSearch(query: string, limit = 10) {
  const embedding = await generateEmbedding(query)
  
  // Use materialized view for better performance on large datasets
  const { data } = await supabase
    .from('transcript_chunks_with_metadata') // Pre-joined view
    .select(`
      chunk_text,
      start_timestamp,
      video_title,
      youtube_id,
      similarity
    `)
    .rpc('vector_similarity', {
      query_vector: embedding,
      similarity_threshold: 0.7
    })
    .order('similarity', { ascending: false })
    .limit(limit)

  return data
}
```

### API Performance

#### 1. Response Caching
```typescript
// Cache API responses at multiple levels
class ResponseCache {
  private memoryCache = new Map()
  private readonly TTL = 60 * 60 * 1000 // 1 hour

  async get(key: string): Promise<any> {
    // Check memory cache first
    const memoryResult = this.memoryCache.get(key)
    if (memoryResult && Date.now() < memoryResult.expires) {
      return memoryResult.data
    }

    // Check database cache
    const { data } = await supabase
      .from('question_answers')
      .select('*')
      .eq('question_pattern', key)
      .gte('generated_at', new Date(Date.now() - this.TTL).toISOString())
      .single()

    return data?.answer_text
  }

  async set(key: string, value: any): Promise<void> {
    // Store in memory cache
    this.memoryCache.set(key, {
      data: value,
      expires: Date.now() + this.TTL
    })

    // Store in database cache
    await supabase
      .from('question_answers')
      .upsert({
        question_pattern: key,
        answer_text: value,
        generated_at: new Date().toISOString()
      })
  }
}
```

#### 2. Request Batching
```typescript
// Batch multiple embedding requests
class EmbeddingBatcher {
  private queue: string[] = []
  private readonly BATCH_SIZE = 10
  private readonly BATCH_TIMEOUT = 100 // ms

  async getEmbedding(text: string): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.queue.push({ text, resolve, reject })
      
      if (this.queue.length >= this.BATCH_SIZE) {
        this.processBatch()
      } else {
        setTimeout(() => this.processBatch(), this.BATCH_TIMEOUT)
      }
    })
  }

  private async processBatch(): void {
    if (this.queue.length === 0) return

    const batch = this.queue.splice(0, this.BATCH_SIZE)
    const texts = batch.map(item => item.text)

    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts
      })

      batch.forEach((item, index) => {
        item.resolve(response.data[index].embedding)
      })
    } catch (error) {
      batch.forEach(item => item.reject(error))
    }
  }
}
```

---

## Code Style Guide

### TypeScript Guidelines

#### 1. Type Definitions
```typescript
// Use specific types over 'any'
interface ChatRequest {
  message: string
  sessionId: string
  userId?: string
}

// Use union types for known values
type ResponseStyle = 'detailed' | 'concise' | 'beginner' | 'advanced'

// Use generics for reusable types
interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  metadata?: ResponseMetadata
}
```

#### 2. Error Handling
```typescript
// Use proper error classes
class ChatWizardError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'ChatWizardError'
  }
}

// Handle errors consistently
async function safeApiCall<T>(
  operation: () => Promise<T>
): Promise<ApiResponse<T>> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    if (error instanceof ChatWizardError) {
      return {
        success: false,
        data: null,
        error: error.message
      }
    }
    
    // Log unexpected errors
    console.error('Unexpected error:', error)
    return {
      success: false,
      data: null,
      error: 'Internal server error'
    }
  }
}
```

#### 3. Async/Await Best Practices
```typescript
// Good: Handle multiple async operations efficiently
async function processMultipleVideos(videoIds: string[]): Promise<ProcessResult[]> {
  // Process in parallel
  const results = await Promise.allSettled(
    videoIds.map(id => processVideo(id))
  )

  return results.map((result, index) => ({
    videoId: videoIds[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }))
}

// Good: Use proper error boundaries
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) break
      
      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
```

### Naming Conventions

```typescript
// Services: PascalCase classes
class TranscriptProcessor { }
class VectorSearch { }

// Functions: camelCase
async function generateEmbedding(text: string) { }
function formatVideoReference(video: Video) { }

// Constants: SCREAMING_SNAKE_CASE
const MAX_CHUNK_SIZE = 500
const EMBEDDING_DIMENSIONS = 1536

// Types/Interfaces: PascalCase
interface VideoReference { }
type SearchResult = { }

// Files: kebab-case
// transcript-processor.ts
// vector-search.ts
// question-cache.ts
```

---

## Deployment Guide

### Pre-deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] API keys validated
- [ ] Performance benchmarks met

### Environment Configuration

#### Development
```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
OPENAI_API_KEY=sk-test-key
DEBUG=true
```

#### Production
```bash
# Vercel Environment Variables
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
OPENAI_API_KEY=sk-prod-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Deployment Steps

1. **Push to main branch**
```bash
git add .
git commit -m "feat(chat-wizard): implement vector search system"
git push origin main
```

2. **Verify Vercel deployment**
- Check build logs
- Verify environment variables
- Test API endpoints

3. **Run database migrations**
```bash
# If using Supabase CLI
supabase db push

# Or run migrations manually in Supabase dashboard
```

4. **Monitor deployment**
- Check error rates
- Verify performance metrics
- Test critical user flows

---

## Useful Resources

### Documentation Links
- [Supabase Vector/Embeddings Guide](https://supabase.com/docs/guides/ai/vector-embeddings)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### Code Examples Repository
- Check `/docs/blox-wizard/examples/` for complete working examples
- Reference implementations for common patterns
- Integration test examples

### Getting Help

1. **Internal Documentation**: Start with this handbook and architecture docs
2. **Code Comments**: Check inline comments in existing code
3. **Git History**: Review commit messages for context
4. **Team Communication**: Ask questions in team chat/meetings

---

## Appendix: Quick Reference

### Common Commands
```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm test                   # Run tests
npm run lint               # Run linting

# Database
npm run supabase:migrate   # Run migrations
npm run supabase:reset     # Reset database
npm run supabase:seed      # Seed test data

# Deployment
git push origin main       # Deploy to production
```

### Environment Variables Reference
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=

# Optional
YOUTUBE_API_KEY=
DEBUG=
NODE_ENV=
```

### Common SQL Queries
```sql
-- Check transcript processing status
SELECT 
  COUNT(*) as total_videos,
  COUNT(CASE WHEN processed_at IS NOT NULL THEN 1 END) as processed_videos
FROM video_transcripts;

-- Find popular questions
SELECT question_pattern, usage_count 
FROM common_questions 
ORDER BY usage_count DESC 
LIMIT 10;

-- Performance monitoring
SELECT 
  schemaname,
  tablename,
  n_tup_ins + n_tup_upd + n_tup_del as total_changes
FROM pg_stat_user_tables
ORDER BY total_changes DESC;
```

---

This handbook should be your go-to resource for daily development work. Keep it updated as you discover new patterns and solutions!

*Last updated: [Current Date]*