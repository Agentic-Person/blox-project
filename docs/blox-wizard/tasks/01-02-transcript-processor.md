# Task 01-02: Transcript Processing Service
**Phase 1: Foundation | Week 1**

---

## Task Overview

**Goal**: Build a robust service to fetch, process, and chunk YouTube transcripts from our curriculum.

**Estimated Time**: 6-8 hours  
**Priority**: High (core functionality)  
**Dependencies**: `01-01-database-schema` (must be completed first)

---

## Senior Developer Notes

The user emphasized that the system must "search across ALL video transcripts simultaneously." This means we need to process every video in curriculum.json and store it optimally for vector search.

**Critical Requirements**:
- Process all videos from existing curriculum.json 
- 500-token chunks with 100-token overlap (optimal for search precision)
- Generate embeddings using OpenAI ada-002
- Handle missing/private videos gracefully
- Store precise timestamps for citations

**Performance Target**: Process ~200 videos in under 30 minutes

---

## Technical Implementation

### 1. Service Architecture

Create: `src/lib/services/blox-wizard/transcript-processor.ts`

```typescript
interface TranscriptProcessorConfig {
  chunkSize: number; // 500 tokens
  chunkOverlap: number; // 100 tokens  
  batchSize: number; // Process N videos at once
  maxRetries: number; // For API failures
}

interface ProcessingResult {
  success: boolean;
  videoId: string;
  youtubeId: string;
  chunksCreated: number;
  errors?: string[];
}
```

### 2. Core Components

#### A. YouTube Transcript Fetcher
```typescript
class YouTubeTranscriptFetcher {
  // Use YouTube Data API v3 to get captions
  async fetchTranscript(youtubeId: string): Promise<TranscriptData | null>
  
  // Handle different caption formats
  async parseTranscriptXML(xmlData: string): Promise<TranscriptSegment[]}
  
  // Fallback for manual transcripts  
  async handleMissingTranscript(videoId: string): Promise<void>
}
```

#### B. Text Chunking Engine
```typescript
class TranscriptChunker {
  // Split transcript into overlapping chunks
  chunkTranscript(
    transcript: string, 
    timestamps: TranscriptSegment[]
  ): ChunkedSegment[]
  
  // Maintain timestamp precision across chunks
  preserveTimestamps(chunk: string, originalSegments: TranscriptSegment[]): TimestampRange
  
  // Token counting for OpenAI compatibility
  countTokens(text: string): number
}
```

#### C. Embedding Generator
```typescript
class EmbeddingGenerator {
  // Generate embeddings via OpenAI
  async generateEmbeddings(chunks: string[]): Promise<number[][]>
  
  // Batch processing for efficiency
  async processBatch(chunks: string[], batchSize: number = 20): Promise<EmbeddingResult[]>
  
  // Handle rate limiting
  async withRetry<T>(operation: () => Promise<T>): Promise<T>
}
```

---

## Implementation Steps

### Step 1: Create Base Service Structure
```bash
mkdir -p src/lib/services/blox-wizard
touch src/lib/services/blox-wizard/transcript-processor.ts
```

### Step 2: Install Dependencies
```bash
npm install @google-cloud/translate youtube-transcript openai tiktoken
npm install --save-dev @types/node
```

### Step 3: Environment Setup
Add to `.env.local`:
```bash
YOUTUBE_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

### Step 4: Build Core Processing Logic

#### Main Processor Class:
```typescript
export class TranscriptProcessor {
  private supabase: SupabaseClient;
  private openai: OpenAI;
  private config: TranscriptProcessorConfig;
  
  async processAllVideos(): Promise<ProcessingResult[]> {
    // Load curriculum.json
    const curriculum = await this.loadCurriculum();
    
    // Extract all video references
    const videos = this.extractVideoReferences(curriculum);
    
    // Process in batches to avoid rate limits
    const results: ProcessingResult[] = [];
    for (const batch of this.batchVideos(videos)) {
      const batchResults = await this.processBatch(batch);
      results.push(...batchResults);
      
      // Respect API rate limits
      await this.delay(1000);
    }
    
    return results;
  }
  
  private async processSingleVideo(video: VideoReference): Promise<ProcessingResult> {
    try {
      // Step 1: Fetch transcript
      const transcript = await this.fetchTranscript(video.youtubeId);
      if (!transcript) {
        return { success: false, videoId: video.id, youtubeId: video.youtubeId, chunksCreated: 0, errors: ['No transcript available'] };
      }
      
      // Step 2: Store video metadata  
      const videoRecord = await this.storeVideoMetadata(video, transcript);
      
      // Step 3: Chunk transcript
      const chunks = this.chunkTranscript(transcript.segments);
      
      // Step 4: Generate embeddings
      const embeddings = await this.generateEmbeddings(chunks.map(c => c.text));
      
      // Step 5: Store chunks with embeddings
      const chunksCreated = await this.storeTranscriptChunks(videoRecord.id, chunks, embeddings);
      
      return { 
        success: true, 
        videoId: video.id, 
        youtubeId: video.youtubeId, 
        chunksCreated 
      };
      
    } catch (error) {
      console.error(`Error processing video ${video.youtubeId}:`, error);
      return { 
        success: false, 
        videoId: video.id, 
        youtubeId: video.youtubeId, 
        chunksCreated: 0, 
        errors: [error.message] 
      };
    }
  }
}
```

### Step 5: Create Processing Scripts

#### Batch Processing Script:
Create: `scripts/process-transcripts.js`
```javascript
const { TranscriptProcessor } = require('../src/lib/services/blox-wizard/transcript-processor');

async function main() {
  console.log('🚀 Starting transcript processing...');
  
  const processor = new TranscriptProcessor();
  const results = await processor.processAllVideos();
  
  // Report results
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalChunks = results.reduce((sum, r) => sum + r.chunksCreated, 0);
  
  console.log(`✅ Successfully processed: ${successful} videos`);
  console.log(`❌ Failed to process: ${failed} videos`);  
  console.log(`📝 Total chunks created: ${totalChunks}`);
  
  if (failed > 0) {
    console.log('\nFailed videos:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`- ${r.youtubeId}: ${r.errors?.join(', ')}`);
    });
  }
}

main().catch(console.error);
```

---

## Data Processing Pipeline

### 1. Curriculum Extraction
```typescript
// Extract all video references from curriculum.json
interface VideoReference {
  id: string; // From curriculum structure
  youtubeId: string; // Extract from URLs
  title: string;
  creator?: string;
  moduleId: string;
  weekId: string;
}

private extractVideoReferences(curriculum: any): VideoReference[] {
  const videos: VideoReference[] = [];
  
  for (const module of curriculum.modules) {
    for (const week of module.weeks) {
      for (const day of week.days) {
        for (const video of day.videos) {
          if (video.youtubeUrl) {
            videos.push({
              id: `${module.id}-${week.id}-${day.id}-${video.id}`,
              youtubeId: this.extractYouTubeId(video.youtubeUrl),
              title: video.title,
              creator: video.creator,
              moduleId: module.id,
              weekId: week.id
            });
          }
        }
      }
    }
  }
  
  return videos;
}
```

### 2. Chunking Strategy
```typescript
private chunkTranscript(segments: TranscriptSegment[]): ChunkedSegment[] {
  const chunks: ChunkedSegment[] = [];
  const targetTokens = 500;
  const overlapTokens = 100;
  
  let currentChunk = '';
  let currentTokens = 0;
  let startTime = segments[0]?.startTime || 0;
  let chunkIndex = 0;
  
  for (const segment of segments) {
    const segmentTokens = this.countTokens(segment.text);
    
    // If adding this segment would exceed target, finalize current chunk
    if (currentTokens + segmentTokens > targetTokens && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        chunkIndex,
        startTime,
        endTime: segment.startTime,
        startTimestamp: this.formatTimestamp(startTime),
        endTimestamp: this.formatTimestamp(segment.startTime)
      });
      
      // Start new chunk with overlap
      const overlapText = this.getLastNTokens(currentChunk, overlapTokens);
      currentChunk = overlapText + ' ' + segment.text;
      currentTokens = this.countTokens(currentChunk);
      startTime = segment.startTime;
      chunkIndex++;
    } else {
      currentChunk += ' ' + segment.text;
      currentTokens += segmentTokens;
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      chunkIndex,
      startTime,
      endTime: segments[segments.length - 1].startTime,
      startTimestamp: this.formatTimestamp(startTime),
      endTimestamp: this.formatTimestamp(segments[segments.length - 1].startTime)
    });
  }
  
  return chunks;
}
```

---

## Error Handling & Recovery

### 1. Common Issues
- **Private/Deleted Videos**: Log and continue processing
- **No Captions Available**: Mark as unavailable, continue
- **Rate Limiting**: Implement exponential backoff
- **API Failures**: Retry with jitter

### 2. Recovery Mechanisms
```typescript
private async withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await this.delay(delay);
    }
  }
}
```

---

## Testing Requirements

### 1. Unit Tests
- Test chunking algorithm with known inputs
- Verify timestamp preservation across chunks
- Test token counting accuracy

### 2. Integration Tests  
- Process a few test videos end-to-end
- Verify database storage works correctly
- Test error handling for missing videos

### 3. Performance Tests
- Process 10 videos, measure time/memory
- Verify embeddings are generated correctly
- Test batch processing efficiency

---

## Success Criteria

- [ ] Can process all videos from curriculum.json
- [ ] Chunks are 500±50 tokens with 100-token overlap
- [ ] Embeddings stored correctly in database
- [ ] Timestamps preserved accurately
- [ ] Failed videos logged but don't stop processing
- [ ] Process 200 videos in under 30 minutes
- [ ] Memory usage stays under 2GB during processing

---

## Next Task Dependencies

This task enables:
- `01-03-vector-search` (needs transcript chunks)
- `01-04-chat-api` (needs searchable content)

**Estimated completion**: End of Day 2
**Critical path**: Yes - search cannot work without processed content

---

*Task created by: Senior Developer*  
*Date: Current*  
*Note: This is a complex task - break it into smaller pieces if needed*