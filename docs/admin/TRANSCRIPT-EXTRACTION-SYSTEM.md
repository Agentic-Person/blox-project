# YouTube Transcript Extraction & Processing System
> Complete technical documentation for the automated transcript pipeline with vector embeddings

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Extraction Methods](#extraction-methods)
3. [Processing Pipeline](#processing-pipeline)
4. [Chunking Strategy](#chunking-strategy)
5. [Embedding Generation](#embedding-generation)
6. [Vector Search Implementation](#vector-search-implementation)
7. [API Integration](#api-integration)
8. [Error Handling](#error-handling)
9. [Performance Optimization](#performance-optimization)
10. [Testing & Validation](#testing--validation)

---

## System Overview

The Transcript Extraction System is a robust, multi-layered pipeline that:
- 📝 **Extracts transcripts** from YouTube videos using multiple fallback methods
- 🔪 **Chunks text** into semantic segments for optimal search
- 🧠 **Generates embeddings** using OpenAI's ada-002 model
- 🔍 **Enables vector search** for intelligent content discovery
- 🔄 **Handles failures** gracefully with automatic retries

### Architecture Flow
```
YouTube Video → Extract Transcript → Chunk Text → Generate Embeddings → Store in Supabase → Enable Vector Search
     ↓              ↓                    ↓              ↓                    ↓                  ↓
  Metadata      Raw Text           30-sec chunks    1536-dim vectors    pgvector DB      Semantic Search
```

### Current Statistics
- **Success Rate**: ~85% with all fallback methods
- **Processing Time**: 15-30 seconds per video
- **Chunk Size**: 30-second segments (~500 tokens)
- **Embedding Model**: text-embedding-ada-002 (1536 dimensions)
- **Vector Search**: Hybrid (70% semantic + 30% keyword)

---

## Extraction Methods

### Method 1: youtube-transcript Package (Primary)
```javascript
// src/lib/extractors/youtube-transcript-extractor.js
const { YoutubeTranscript } = require('youtube-transcript');

async function extractWithYoutubeTranscript(videoId) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return {
      success: true,
      method: 'youtube-transcript',
      segments: transcript,
      text: transcript.map(s => s.text).join(' ')
    };
  } catch (error) {
    console.error(`youtube-transcript failed: ${error.message}`);
    return { success: false, error };
  }
}
```

**Pros**: Fast, simple, no API key needed
**Cons**: Doesn't work for all videos, limited to available captions

### Method 2: YouTube Data API v3 (Fallback 1)
```javascript
// src/lib/extractors/youtube-api-extractor.js
async function extractWithYouTubeAPI(videoId) {
  const youtube = google.youtube({ version: 'v3', auth: API_KEY });
  
  // Get caption tracks
  const captions = await youtube.captions.list({
    part: 'snippet',
    videoId: videoId
  });
  
  if (captions.data.items.length > 0) {
    // Download caption track
    const captionId = captions.data.items[0].id;
    const transcript = await youtube.captions.download({
      id: captionId,
      tfmt: 'srt'
    });
    
    return parseSRT(transcript.data);
  }
}
```

**Pros**: Official API, reliable
**Cons**: Requires API key, quota limits, not all videos have captions

### Method 3: yt-dlp Python Script (Fallback 2)
```python
# scripts/extract-with-ytdlp.py
import yt_dlp
import json
import sys

def extract_transcript(video_id):
    ydl_opts = {
        'skip_download': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitlesformat': 'json3',
        'quiet': True,
        'no_warnings': True
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(f"https://youtube.com/watch?v={video_id}")
        
        # Get subtitles (prefer manual over auto-generated)
        subtitles = info.get('subtitles', {})
        auto_subs = info.get('automatic_captions', {})
        
        # Extract text from subtitle data
        if 'en' in subtitles:
            return parse_subtitles(subtitles['en'])
        elif 'en' in auto_subs:
            return parse_subtitles(auto_subs['en'])
```

**Pros**: Most reliable, works with most videos
**Cons**: Requires Python, slower, complex setup

### Method 4: Manual Upload (Last Resort)
```typescript
// UI component for manual transcript upload
export function ManualTranscriptUpload({ videoId }: { videoId: string }) {
  return (
    <div className="p-4 border-2 border-dashed">
      <h3>Manual Transcript Upload</h3>
      <p>Automatic extraction failed. Please upload transcript manually.</p>
      <input type="file" accept=".txt,.srt,.vtt" />
      <button onClick={processManualUpload}>Upload & Process</button>
    </div>
  );
}
```

---

## Processing Pipeline

### Complete Processing Flow
```javascript
// src/lib/services/video-processing-pipeline.js

export class VideoProcessingPipeline {
  async process(youtubeId: string): Promise<ProcessingResult> {
    // Step 1: Fetch video metadata
    const metadata = await this.fetchMetadata(youtubeId);
    
    // Step 2: Extract transcript (with fallbacks)
    const transcript = await this.extractTranscript(youtubeId);
    
    // Step 3: Chunk transcript
    const chunks = await this.chunkTranscript(transcript);
    
    // Step 4: Generate embeddings
    const embeddings = await this.generateEmbeddings(chunks);
    
    // Step 5: Store in database
    await this.storeInSupabase(metadata, chunks, embeddings);
    
    // Step 6: Update search index
    await this.updateSearchIndex(youtubeId);
    
    return { success: true, videoId: youtubeId };
  }
  
  async extractTranscript(youtubeId: string) {
    const methods = [
      this.extractWithYoutubeTranscript,
      this.extractWithYouTubeAPI,
      this.extractWithYtDlp,
      this.promptManualUpload
    ];
    
    for (const method of methods) {
      const result = await method(youtubeId);
      if (result.success) {
        await this.logExtraction(youtubeId, method.name, 'success');
        return result;
      }
      await this.logExtraction(youtubeId, method.name, 'failed');
    }
    
    throw new Error('All extraction methods failed');
  }
}
```

---

## Chunking Strategy

### Semantic Chunking Algorithm
```javascript
// src/lib/services/transcript-chunker.js

export class TranscriptChunker {
  constructor(options = {}) {
    this.chunkDuration = options.chunkDuration || 30; // seconds
    this.overlapDuration = options.overlapDuration || 5; // seconds
    this.minChunkSize = options.minChunkSize || 100; // characters
    this.maxChunkSize = options.maxChunkSize || 2000; // characters
  }
  
  chunkByTime(segments: TranscriptSegment[]): Chunk[] {
    const chunks = [];
    let currentChunk = {
      segments: [],
      startTime: 0,
      endTime: 0,
      text: ''
    };
    
    for (const segment of segments) {
      const segmentStart = segment.offset / 1000; // Convert to seconds
      
      // Start new chunk if duration exceeded
      if (segmentStart - currentChunk.startTime >= this.chunkDuration) {
        if (currentChunk.segments.length > 0) {
          chunks.push(this.finalizeChunk(currentChunk));
        }
        
        // Start new chunk with overlap
        currentChunk = {
          segments: this.getOverlapSegments(currentChunk.segments),
          startTime: segmentStart,
          endTime: segmentStart,
          text: ''
        };
      }
      
      currentChunk.segments.push(segment);
      currentChunk.endTime = segmentStart + (segment.duration / 1000);
    }
    
    // Add final chunk
    if (currentChunk.segments.length > 0) {
      chunks.push(this.finalizeChunk(currentChunk));
    }
    
    return chunks;
  }
  
  chunkBySentence(text: string): Chunk[] {
    // Alternative: Chunk by complete sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const chunks = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > this.maxChunkSize) {
        if (currentChunk.length >= this.minChunkSize) {
          chunks.push({ text: currentChunk.trim() });
        }
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }
    
    if (currentChunk.length >= this.minChunkSize) {
      chunks.push({ text: currentChunk.trim() });
    }
    
    return chunks;
  }
}
```

### Chunking Best Practices
1. **Time-based**: 30-second segments for video context
2. **Overlap**: 5-second overlap for continuity
3. **Size limits**: 100-2000 characters per chunk
4. **Sentence boundaries**: Preserve complete thoughts
5. **Metadata preservation**: Keep timestamps with chunks

---

## Embedding Generation

### OpenAI Embedding Service
```javascript
// src/lib/services/embedding-service.js

export class EmbeddingService {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = 'text-embedding-ada-002';
    this.batchSize = 10;
    this.rateLimitDelay = 1000; // ms between batches
  }
  
  async generateEmbeddings(chunks: Chunk[]): Promise<EmbeddingResult[]> {
    const results = [];
    
    // Process in batches to avoid rate limits
    for (let i = 0; i < chunks.length; i += this.batchSize) {
      const batch = chunks.slice(i, i + this.batchSize);
      
      const embeddings = await Promise.all(
        batch.map(chunk => this.generateSingleEmbedding(chunk))
      );
      
      results.push(...embeddings);
      
      // Rate limiting
      if (i + this.batchSize < chunks.length) {
        await this.sleep(this.rateLimitDelay);
      }
    }
    
    return results;
  }
  
  async generateSingleEmbedding(chunk: Chunk): Promise<EmbeddingResult> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: this.preprocessText(chunk.text)
      });
      
      return {
        chunkId: chunk.id,
        embedding: response.data[0].embedding, // 1536 dimensions
        model: this.model,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Embedding generation failed for chunk ${chunk.id}:`, error);
      throw error;
    }
  }
  
  preprocessText(text: string): string {
    // Clean and normalize text for better embeddings
    return text
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?-]/g, '')
      .trim()
      .substring(0, 8000); // Token limit
  }
}
```

### Embedding Storage Schema
```sql
-- Supabase table for storing embeddings
CREATE TABLE video_transcript_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id),
  youtube_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  start_time DECIMAL(10, 3),
  end_time DECIMAL(10, 3),
  text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimensions
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  UNIQUE(video_id, chunk_index)
);

-- Create vector similarity index
CREATE INDEX idx_chunks_embedding 
  ON video_transcript_chunks 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

---

## Vector Search Implementation

### Search Service
```typescript
// src/lib/services/vector-search-service.ts

export class VectorSearchService {
  async search(query: string, options: SearchOptions = {}) {
    const {
      limit = 10,
      threshold = 0.7,
      hybridMode = true,
      textWeight = 0.3,
      vectorWeight = 0.7
    } = options;
    
    if (hybridMode) {
      return this.hybridSearch(query, limit, threshold, textWeight, vectorWeight);
    } else {
      return this.vectorSearch(query, limit, threshold);
    }
  }
  
  async vectorSearch(query: string, limit: number, threshold: number) {
    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Search using cosine similarity
    const { data } = await supabase.rpc('search_similar_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit
    });
    
    return this.formatResults(data);
  }
  
  async hybridSearch(
    query: string, 
    limit: number,
    threshold: number,
    textWeight: number,
    vectorWeight: number
  ) {
    const queryEmbedding = await this.generateEmbedding(query);
    
    const { data } = await supabase.rpc('search_transcripts_hybrid', {
      search_query: query,
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      text_weight: textWeight,
      vector_weight: vectorWeight
    });
    
    return this.formatResults(data);
  }
}
```

### Search Functions in Supabase
```sql
-- Hybrid search combining text and vector similarity
CREATE OR REPLACE FUNCTION search_transcripts_hybrid(
  search_query TEXT,
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.6,
  match_count INT DEFAULT 10,
  text_weight FLOAT DEFAULT 0.3,
  vector_weight FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  chunk_id UUID,
  video_title TEXT,
  chunk_text TEXT,
  start_time DECIMAL,
  end_time DECIMAL,
  combined_score FLOAT,
  text_relevance FLOAT,
  vector_similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vtc.id as chunk_id,
    v.title as video_title,
    vtc.text as chunk_text,
    vtc.start_time,
    vtc.end_time,
    (
      (text_weight * ts_rank(to_tsvector('english', vtc.text), plainto_tsquery('english', search_query))) +
      (vector_weight * (1 - (vtc.embedding <=> query_embedding)))
    ) as combined_score,
    ts_rank(to_tsvector('english', vtc.text), plainto_tsquery('english', search_query)) as text_relevance,
    (1 - (vtc.embedding <=> query_embedding)) as vector_similarity
  FROM video_transcript_chunks vtc
  JOIN videos v ON v.id = vtc.video_id
  WHERE 
    vtc.embedding IS NOT NULL
    AND (
      to_tsvector('english', vtc.text) @@ plainto_tsquery('english', search_query)
      OR (1 - (vtc.embedding <=> query_embedding)) > match_threshold
    )
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

---

## API Integration

### REST API Endpoints
```typescript
// app/api/admin/transcripts/extract/route.ts
export async function POST(request: Request) {
  const { youtubeId, priority = 0 } = await request.json();
  
  // Add to processing queue
  const { data: queueItem } = await supabase
    .from('video_queue')
    .insert({
      youtube_id: youtubeId,
      status: 'pending',
      priority
    })
    .select()
    .single();
  
  // Trigger processing
  await processVideo(queueItem.id);
  
  return Response.json({ 
    success: true, 
    queueId: queueItem.id 
  });
}

// app/api/admin/transcripts/status/[queueId]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { queueId: string } }
) {
  const { data } = await supabase
    .from('video_queue')
    .select('*')
    .eq('id', params.queueId)
    .single();
  
  return Response.json(data);
}

// app/api/search/route.ts
export async function POST(request: Request) {
  const { query, limit = 10 } = await request.json();
  
  const searchService = new VectorSearchService();
  const results = await searchService.search(query, { limit });
  
  return Response.json({ results });
}
```

---

## Error Handling

### Error Types and Recovery
```javascript
const errorHandlers = {
  'RATE_LIMIT': async (error, videoId) => {
    // Wait and retry with exponential backoff
    await scheduleRetry(videoId, 3600000); // 1 hour
  },
  
  'VIDEO_PRIVATE': async (error, videoId) => {
    // Mark as permanently failed
    await markAsFailed(videoId, 'Video is private or deleted');
  },
  
  'NO_CAPTIONS': async (error, videoId) => {
    // Try alternative extraction methods
    await tryAlternativeExtraction(videoId);
  },
  
  'NETWORK_ERROR': async (error, videoId) => {
    // Immediate retry with short delay
    await scheduleRetry(videoId, 5000);
  },
  
  'PARSING_ERROR': async (error, videoId) => {
    // Log for manual review
    await logForManualReview(videoId, error);
  }
};
```

### Retry Logic
```javascript
export class RetryManager {
  async shouldRetry(videoId: string, attempt: number): boolean {
    const maxAttempts = 3;
    const backoffMs = Math.min(5000 * Math.pow(2, attempt), 60000);
    
    if (attempt >= maxAttempts) {
      await this.markAsFailed(videoId);
      return false;
    }
    
    await this.scheduleRetry(videoId, backoffMs);
    return true;
  }
}
```

---

## Performance Optimization

### Optimization Strategies

1. **Batch Processing**
   - Process videos in batches of 3-5
   - Reduces API overhead
   - Better rate limit management

2. **Caching**
   - Cache extracted transcripts for 24 hours
   - Cache embeddings permanently
   - Cache search results for 1 hour

3. **Parallel Processing**
   ```javascript
   const results = await Promise.allSettled([
     fetchMetadata(videoId),
     extractTranscript(videoId),
     generateThumbnail(videoId)
   ]);
   ```

4. **Database Optimization**
   - Proper indexes on frequently queried columns
   - Partitioning for large tables
   - Regular VACUUM and ANALYZE

5. **Vector Search Optimization**
   - Use IVFFlat index for large datasets
   - Adjust list parameter based on dataset size
   - Pre-filter before vector search when possible

### Performance Metrics
```sql
-- Query to analyze processing performance
SELECT 
  DATE(created_at) as date,
  COUNT(*) as videos_processed,
  AVG(processing_time_ms) as avg_time_ms,
  MIN(processing_time_ms) as min_time_ms,
  MAX(processing_time_ms) as max_time_ms,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failures
FROM video_queue
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Testing & Validation

### Unit Tests
```javascript
// tests/transcript-extraction.test.js
describe('Transcript Extraction', () => {
  test('extracts transcript from public video', async () => {
    const videoId = 'dQw4w9WgXcQ';
    const result = await extractTranscript(videoId);
    
    expect(result.success).toBe(true);
    expect(result.text).toBeDefined();
    expect(result.segments.length).toBeGreaterThan(0);
  });
  
  test('handles private video gracefully', async () => {
    const videoId = 'private_video_id';
    const result = await extractTranscript(videoId);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('private');
  });
});
```

### Integration Tests
```javascript
// tests/processing-pipeline.test.js
describe('Processing Pipeline', () => {
  test('processes video end-to-end', async () => {
    const videoId = 'test_video_id';
    const pipeline = new VideoProcessingPipeline();
    
    const result = await pipeline.process(videoId);
    
    // Verify all steps completed
    expect(result.metadata).toBeDefined();
    expect(result.transcript).toBeDefined();
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.embeddings.length).toBe(result.chunks.length);
    
    // Verify database storage
    const stored = await getVideoFromDatabase(videoId);
    expect(stored).toBeDefined();
  });
});
```

### Validation Checks
```javascript
export class TranscriptValidator {
  validate(transcript: Transcript): ValidationResult {
    const checks = [
      this.checkLength(transcript),
      this.checkLanguage(transcript),
      this.checkTimestamps(transcript),
      this.checkTextQuality(transcript)
    ];
    
    return {
      valid: checks.every(c => c.passed),
      issues: checks.filter(c => !c.passed)
    };
  }
  
  checkLength(transcript: Transcript) {
    const minLength = 100;
    const maxLength = 100000;
    const length = transcript.text.length;
    
    return {
      passed: length >= minLength && length <= maxLength,
      message: `Transcript length: ${length} characters`
    };
  }
}
```

---

## Monitoring & Alerts

### Key Metrics to Monitor
1. **Extraction Success Rate**: Target > 80%
2. **Processing Time**: Target < 30s per video
3. **Queue Depth**: Alert if > 100 videos
4. **Error Rate**: Alert if > 10% in 1 hour
5. **API Quota Usage**: Alert at 80% threshold

### Monitoring Dashboard
```sql
-- Real-time monitoring view
CREATE VIEW processing_monitor AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  AVG(processing_time_ms) FILTER (WHERE status = 'completed') as avg_processing_time,
  MAX(created_at) as last_processed
FROM video_queue
WHERE created_at > NOW() - INTERVAL '24 hours';
```

---

## Deployment & Operations

### Environment Configuration
```env
# Extraction Configuration
YOUTUBE_API_KEY=your_api_key
OPENAI_API_KEY=your_openai_key

# Processing Configuration
MAX_CONCURRENT_EXTRACTIONS=3
EXTRACTION_TIMEOUT_MS=60000
CHUNK_SIZE_SECONDS=30
EMBEDDING_BATCH_SIZE=10

# Rate Limiting
YOUTUBE_REQUESTS_PER_SECOND=5
OPENAI_REQUESTS_PER_MINUTE=60

# Error Handling
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=5000
FALLBACK_TO_MANUAL=true
```

### Operational Commands
```bash
# Process single video
npm run transcript:extract <youtube-id>

# Process playlist
npm run transcript:extract-playlist <playlist-id>

# Generate embeddings for existing transcripts
npm run embeddings:generate

# Rebuild search index
npm run search:rebuild-index

# Monitor processing queue
npm run queue:monitor

# Export transcripts for backup
npm run transcript:export
```

---

## Best Practices

1. **Always use fallback methods** - Never rely on a single extraction method
2. **Implement rate limiting** - Respect API quotas and avoid bans
3. **Log everything** - Detailed logging helps debug issues
4. **Monitor continuously** - Set up alerts for failures
5. **Test edge cases** - Private videos, age-restricted, live streams
6. **Cache aggressively** - Reduce API calls and processing time
7. **Handle errors gracefully** - Never crash the entire pipeline
8. **Document thoroughly** - Future developers will thank you

---

*Last Updated: [Current Date]*
*Version: 2.0.0*