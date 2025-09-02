# Task 01-03: Vector Search Service
**Phase 1: Foundation | Week 1**

---

## Task Overview

**Goal**: Build the core vector search service that can find relevant transcript chunks across ALL videos simultaneously.

**Estimated Time**: 4-5 hours  
**Priority**: High (core functionality)  
**Dependencies**: `01-01-database-schema`, `01-02-transcript-processor`

---

## Senior Developer Notes

This is the heart of the system. The user specifically said they want to "search across ALL video transcripts simultaneously" - this service makes that possible. 

**Key Requirements**:
- Sub-500ms vector similarity search
- Rank results by relevance and confidence
- Return video references with precise timestamps
- Handle typos and semantic similarity
- Support multi-video result aggregation

**Performance Target**: < 500ms average query time for 10,000+ chunks

---

## Technical Implementation

### 1. Service Architecture

Create: `src/lib/services/blox-wizard/vector-search.ts`

```typescript
interface SearchConfig {
  maxResults: number; // Default 20
  similarityThreshold: number; // Default 0.7
  multiVideoBoost: boolean; // Prefer diverse video sources
  confidenceWeighting: boolean; // Weight by transcript quality
}

interface SearchResult {
  chunkId: string;
  transcriptId: string;
  videoId: string;
  youtubeId: string;
  title: string;
  creator?: string;
  chunkText: string;
  startTimestamp: string; // "15:30"
  endTimestamp: string;   // "16:15"
  relevanceScore: number; // 0.0 to 1.0
  confidence: number;     // Quality of match
}

interface SearchResponse {
  results: SearchResult[];
  totalFound: number;
  searchTime: number;
  cacheHit: boolean;
  query: string;
  queryEmbedding?: number[];
}
```

### 2. Core Search Engine

```typescript
export class VectorSearchService {
  private supabase: SupabaseClient;
  private openai: OpenAI;
  private config: SearchConfig;

  async search(query: string, options?: Partial<SearchConfig>): Promise<SearchResponse> {
    const startTime = Date.now();
    const searchConfig = { ...this.config, ...options };

    try {
      // Step 1: Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(query);

      // Step 2: Perform vector similarity search
      const results = await this.performVectorSearch(queryEmbedding, searchConfig);

      // Step 3: Post-process and rank results
      const rankedResults = this.rankAndFilterResults(results, query, searchConfig);

      // Step 4: Enrich with video metadata
      const enrichedResults = await this.enrichWithMetadata(rankedResults);

      return {
        results: enrichedResults,
        totalFound: results.length,
        searchTime: Date.now() - startTime,
        cacheHit: false, // Will be handled by caching layer
        query,
        queryEmbedding
      };

    } catch (error) {
      console.error('Vector search failed:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  private async generateQueryEmbedding(query: string): Promise<number[]> {
    // Clean and prepare query
    const cleanQuery = this.cleanQuery(query);
    
    // Generate embedding via OpenAI
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: cleanQuery
    });

    return response.data[0].embedding;
  }

  private async performVectorSearch(
    queryEmbedding: number[], 
    config: SearchConfig
  ): Promise<RawSearchResult[]> {
    
    // Optimized PostgreSQL query with pgvector
    const { data, error } = await this.supabase.rpc('search_transcript_chunks', {
      query_embedding: queryEmbedding,
      similarity_threshold: config.similarityThreshold,
      max_results: config.maxResults * 2 // Get extra for filtering
    });

    if (error) {
      throw new Error(`Database search failed: ${error.message}`);
    }

    return data || [];
  }
}
```

---

## Database Functions

### 1. Core Search Function

Create this SQL function in a new migration:

```sql
CREATE OR REPLACE FUNCTION search_transcript_chunks(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  max_results int DEFAULT 20
)
RETURNS TABLE (
  chunk_id uuid,
  transcript_id uuid,
  video_id text,
  youtube_id text,
  title text,
  creator text,
  chunk_text text,
  start_timestamp text,
  end_timestamp text,
  start_seconds int,
  end_seconds int,
  similarity_score float
) 
LANGUAGE SQL STABLE
AS $$
  SELECT 
    tc.id as chunk_id,
    tc.transcript_id,
    vt.video_id,
    vt.youtube_id,
    vt.title,
    vt.creator,
    tc.chunk_text,
    tc.start_timestamp,
    tc.end_timestamp,
    tc.start_seconds,
    tc.end_seconds,
    1 - (tc.embedding <=> query_embedding) as similarity_score
  FROM transcript_chunks tc
  JOIN video_transcripts vt ON tc.transcript_id = vt.id
  WHERE 1 - (tc.embedding <=> query_embedding) > similarity_threshold
  ORDER BY tc.embedding <=> query_embedding
  LIMIT max_results;
$$;
```

### 2. Multi-Video Ranking Function

```sql
CREATE OR REPLACE FUNCTION search_diverse_sources(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  max_results int DEFAULT 20,
  max_per_video int DEFAULT 3
)
RETURNS TABLE (
  chunk_id uuid,
  transcript_id uuid,
  video_id text,
  youtube_id text,
  title text,
  creator text,
  chunk_text text,
  start_timestamp text,
  end_timestamp text,
  similarity_score float,
  video_rank int
) 
LANGUAGE SQL STABLE
AS $$
  WITH ranked_results AS (
    SELECT 
      tc.id as chunk_id,
      tc.transcript_id,
      vt.video_id,
      vt.youtube_id,
      vt.title,
      vt.creator,
      tc.chunk_text,
      tc.start_timestamp,
      tc.end_timestamp,
      1 - (tc.embedding <=> query_embedding) as similarity_score,
      ROW_NUMBER() OVER (PARTITION BY vt.youtube_id ORDER BY tc.embedding <=> query_embedding) as video_rank
    FROM transcript_chunks tc
    JOIN video_transcripts vt ON tc.transcript_id = vt.id
    WHERE 1 - (tc.embedding <=> query_embedding) > similarity_threshold
  )
  SELECT * FROM ranked_results
  WHERE video_rank <= max_per_video
  ORDER BY similarity_score DESC
  LIMIT max_results;
$$;
```

---

## Implementation Steps

### Step 1: Create Database Functions
```bash
# Create new migration for search functions
npx supabase migration new vector_search_functions

# Add the SQL functions above to the migration file
npx supabase db push
```

### Step 2: Build Search Service

Create the main service file:
```typescript
// src/lib/services/blox-wizard/vector-search.ts

export class VectorSearchService {
  // ... implementation from above

  private cleanQuery(query: string): string {
    // Remove common filler words that don't add semantic value
    const stopWords = ['how', 'do', 'i', 'can', 'what', 'is', 'the', 'a', 'an'];
    const words = query.toLowerCase().split(/\s+/);
    const cleanWords = words.filter(word => !stopWords.includes(word) || words.length <= 3);
    return cleanWords.join(' ');
  }

  private rankAndFilterResults(
    results: RawSearchResult[], 
    query: string, 
    config: SearchConfig
  ): SearchResult[] {
    
    return results
      .map(result => ({
        ...result,
        relevanceScore: this.calculateRelevanceScore(result, query),
        confidence: this.calculateConfidence(result)
      }))
      .filter(result => result.confidence > 0.5)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, config.maxResults);
  }

  private calculateRelevanceScore(result: RawSearchResult, query: string): number {
    let score = result.similarity_score;

    // Boost score for exact keyword matches
    const queryWords = query.toLowerCase().split(/\s+/);
    const textWords = result.chunk_text.toLowerCase().split(/\s+/);
    const matchCount = queryWords.filter(word => textWords.includes(word)).length;
    const keywordBoost = (matchCount / queryWords.length) * 0.2;

    // Boost score for popular creators (optional)
    const creatorBoost = this.getCreatorBoost(result.creator);

    return Math.min(1.0, score + keywordBoost + creatorBoost);
  }

  private calculateConfidence(result: RawSearchResult): number {
    // Higher confidence for longer chunks (more context)
    const lengthFactor = Math.min(1.0, result.chunk_text.length / 1000);
    
    // Higher confidence for higher similarity
    const similarityFactor = result.similarity_score;
    
    // Combine factors
    return (lengthFactor * 0.3) + (similarityFactor * 0.7);
  }
}
```

### Step 3: Create Utility Functions

```typescript
// src/lib/utils/search-utils.ts

export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function parseTimestamp(timestamp: string): number {
  const [mins, secs] = timestamp.split(':').map(Number);
  return (mins * 60) + secs;
}

export function generateVideoUrl(youtubeId: string, timestamp?: string): string {
  const baseUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  if (timestamp) {
    const seconds = parseTimestamp(timestamp);
    return `${baseUrl}&t=${seconds}s`;
  }
  return baseUrl;
}
```

### Step 4: Add TypeScript Types

```typescript
// src/types/blox-wizard.ts

export interface RawSearchResult {
  chunk_id: string;
  transcript_id: string;
  video_id: string;
  youtube_id: string;
  title: string;
  creator: string;
  chunk_text: string;
  start_timestamp: string;
  end_timestamp: string;
  start_seconds: number;
  end_seconds: number;
  similarity_score: number;
}

export interface SearchResult {
  chunkId: string;
  transcriptId: string;
  videoId: string;
  youtubeId: string;
  title: string;
  creator?: string;
  chunkText: string;
  startTimestamp: string;
  endTimestamp: string;
  relevanceScore: number;
  confidence: number;
  videoUrl: string;
  timestampUrl: string;
}
```

---

## Performance Optimization

### 1. Query Optimization
- Use proper vector indexes (ivfflat with optimal lists parameter)
- Limit results at database level, not application level
- Use covering indexes to avoid table lookups

### 2. Connection Management
```typescript
// Use connection pooling
const supabase = createClient(url, key, {
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
});
```

### 3. Query Caching Strategy
```typescript
// Simple in-memory cache for query embeddings
const embeddingCache = new Map<string, number[]>();

private async getCachedEmbedding(query: string): Promise<number[] | null> {
  const cacheKey = query.toLowerCase().trim();
  return embeddingCache.get(cacheKey) || null;
}

private setCachedEmbedding(query: string, embedding: number[]): void {
  const cacheKey = query.toLowerCase().trim();
  embeddingCache.set(cacheKey, embedding);
  
  // Simple LRU: Remove oldest entries when cache gets large
  if (embeddingCache.size > 1000) {
    const firstKey = embeddingCache.keys().next().value;
    embeddingCache.delete(firstKey);
  }
}
```

---

## Testing Requirements

### 1. Unit Tests
```typescript
// __tests__/vector-search.test.ts
describe('VectorSearchService', () => {
  test('should return relevant results for common queries', async () => {
    const service = new VectorSearchService();
    const results = await service.search('how to script a door');
    
    expect(results.results.length).toBeGreaterThan(0);
    expect(results.searchTime).toBeLessThan(1000);
    expect(results.results[0].relevanceScore).toBeGreaterThan(0.7);
  });
  
  test('should handle empty or invalid queries gracefully', async () => {
    const service = new VectorSearchService();
    const results = await service.search('');
    
    expect(results.results).toHaveLength(0);
  });
});
```

### 2. Performance Tests
```typescript
test('search performance benchmark', async () => {
  const service = new VectorSearchService();
  const queries = [
    'scripting basics',
    'gui creation',
    'datastore tutorial',
    'remote events',
    'tween animation'
  ];
  
  const startTime = Date.now();
  const results = await Promise.all(
    queries.map(q => service.search(q))
  );
  const totalTime = Date.now() - startTime;
  
  expect(totalTime).toBeLessThan(2500); // 5 searches in under 2.5s
  expect(results.every(r => r.results.length > 0)).toBe(true);
});
```

### 3. Integration Tests
- Test with real transcript data
- Verify video URLs are generated correctly
- Test various query types and edge cases

---

## Success Criteria

- [ ] Vector similarity search returns results < 500ms
- [ ] Search across all processed transcripts simultaneously  
- [ ] Results ranked by relevance and confidence
- [ ] Video URLs generated with correct timestamps
- [ ] Handles typos and semantic similarity
- [ ] Memory usage stays under 500MB
- [ ] 95% of queries return at least 1 relevant result

---

## Common Issues & Solutions

**Issue**: Slow vector search performance  
**Solution**: Check index configuration, consider reducing similarity threshold

**Issue**: Poor result relevance  
**Solution**: Tune ranking algorithm, check query preprocessing

**Issue**: Memory usage too high  
**Solution**: Implement proper cache eviction, limit result sets

---

## Next Task Dependencies

This task enables:
- `01-04-chat-api` (needs search functionality)
- `02-01-caching-system` (uses search results for caching)

**Estimated completion**: End of Day 3  
**Critical path**: Yes - API cannot function without search

---

*Task created by: Senior Developer*  
*Date: Current*  
*Performance target: < 500ms average search time*