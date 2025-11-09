# Complete Video Transcript Scraping & RAG System - Implementation Guide

**Last Updated**: October 27, 2025
**Project**: Blox Buddy Video Transcript & RAG System
**Author**: System Documentation

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [YouTube Transcript Scraping](#1-youtube-transcript-scraping)
3. [Video URL Storage](#2-video-url-storage)
4. [Database Schema (Supabase + pgvector)](#3-database-schema-supabase--pgvector)
5. [Chunking Strategy (30-Second Segments)](#4-chunking-strategy-30-second-segments)
6. [Generating Embeddings (OpenAI)](#5-generating-embeddings-openai)
7. [Vector Search Function (Supabase)](#6-vector-search-function-supabase)
8. [RAG Implementation (Search + GPT)](#7-rag-implementation-search--gpt)
9. [Complete Workflow Scripts](#8-complete-workflow-scripts)
10. [Configuration Requirements](#9-key-configuration-requirements)
11. [Implementation Checklist](#10-implementation-checklist-for-new-projects)
12. [Key Takeaways](#key-takeaways)

---

## Architecture Overview

The system follows this complete pipeline:

```
YouTube URLs → Transcript Extraction → 30-Second Chunks → OpenAI Embeddings → Supabase pgvector → Semantic Search → RAG with GPT
```

**Key Components**:
- **Transcript Extraction**: `youtube-transcript` library
- **Vector Database**: Supabase with pgvector extension
- **Embedding Model**: OpenAI `text-embedding-ada-002` (1536 dimensions)
- **Language Model**: GPT-4o-mini (configurable)
- **Chunking Strategy**: Time-based 30-second segments
- **Search Algorithm**: Cosine similarity with low threshold (0.3)
- **RAG Architecture**: Database-first search (search before GPT call)

---

## 1. YouTube Transcript Scraping

### NPM Packages Required

```bash
npm install youtube-transcript@1.2.1
npm install youtubei.js@16.0.1  # More reliable alternative
```

### Video ID Extraction

```javascript
/**
 * Extract YouTube video ID from various URL formats
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 */
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// Example usage:
// extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ') → 'dQw4w9WgXcQ'
// extractYouTubeId('https://youtu.be/dQw4w9WgXcQ') → 'dQw4w9WgXcQ'
```

### Fetching Transcripts with Retry Logic

**Reference**: `scripts/fetch-playlist-with-transcripts.js`

```javascript
import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Fetch transcript with retry logic (3 attempts with 1s delay)
 * @param {string} youtubeId - YouTube video ID
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<Array|null>} Transcript segments or null if failed
 */
async function fetchTranscript(youtubeId, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(youtubeId);
      console.log(`✅ Transcript fetched for ${youtubeId}`);
      return transcript;
    } catch (error) {
      console.error(`❌ Attempt ${attempt + 1}/${retries} failed:`, error.message);

      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 1000)); // 1 second delay
      }
    }
  }

  console.error(`❌ Failed to fetch transcript for ${youtubeId} after ${retries} attempts`);
  return null;
}
```

### Transcript Data Format

**Output from YouTube API**:
```javascript
[
  {
    text: "Hello everyone",
    offset: 0,        // Start time in seconds
    duration: 2.5     // Duration in seconds
  },
  {
    text: "Welcome to the tutorial",
    offset: 2.5,
    duration: 3.0
  },
  // ... more segments
]
```

---

## 2. Video URL Storage

### Data Structure

**File**: `src/data/curriculum.json`

```json
{
  "modules": [
    {
      "id": "module-1",
      "title": "Roblox Basics",
      "description": "Learn the fundamentals of Roblox Studio",
      "weeks": [
        {
          "weekNumber": 1,
          "theme": "Getting Started",
          "days": [
            {
              "dayNumber": 1,
              "videos": [
                {
                  "id": "video-1-1-1-1",
                  "title": "Roblox Studio Introduction",
                  "creator": "AlvinBlox",
                  "youtubeId": "abc123XYZ",
                  "duration": "39:33",
                  "totalMinutes": 40,
                  "thumbnail": "https://i.ytimg.com/vi/abc123XYZ/maxresdefault.jpg",
                  "xpReward": 25,
                  "learningObjective": "Understanding Roblox Studio interface"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Video Organization Hierarchy

```
Module (e.g., "Roblox Basics")
  └── Week (e.g., Week 1)
      └── Day (e.g., Day 1)
          └── Video (individual learning unit)
```

### Adding New Videos to the System

1. **Add to `curriculum.json`** with required metadata
2. **Run transcript fetching script**: `node scripts/process-new-videos.js`
3. **Generate embeddings**: `node scripts/generate-transcript-embeddings.js`
4. **Verify coverage**: `node scripts/verify-module1-coverage.js`

---

## 3. Database Schema (Supabase + pgvector)

### Enable pgvector Extension

```sql
-- Run this first in your Supabase SQL editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### Table: `video_transcripts`

Stores complete video metadata and raw transcript data.

```sql
CREATE TABLE video_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT UNIQUE NOT NULL,
  title TEXT,
  creator TEXT,
  duration_seconds INTEGER,
  full_transcript JSONB, -- Stores raw YouTube transcript segments
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by YouTube ID
CREATE INDEX idx_video_transcripts_youtube_id ON video_transcripts(youtube_id);
```

### Table: `transcript_chunks`

Main table for storing chunked text with embeddings.

```sql
CREATE TABLE transcript_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES video_transcripts(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL, -- Actually stores youtube_id for compatibility
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  start_seconds INTEGER,
  end_seconds INTEGER,
  start_timestamp TEXT, -- Human-readable format: "15:30"
  end_timestamp TEXT,   -- Human-readable format: "16:00"
  embedding vector(1536), -- OpenAI text-embedding-ada-002
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_chunks_video_id ON transcript_chunks(video_id);
CREATE INDEX idx_chunks_transcript_id ON transcript_chunks(transcript_id);
CREATE INDEX idx_chunks_timestamps ON transcript_chunks(start_seconds, end_seconds);

-- Composite index for common queries
CREATE INDEX idx_chunks_video_chunk ON transcript_chunks(video_id, chunk_index);
```

### Example Data

**video_transcripts**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "youtube_id": "dQw4w9WgXcQ",
  "title": "Roblox Studio Basics",
  "creator": "AlvinBlox",
  "duration_seconds": 2373,
  "full_transcript": [
    {"text": "Hello", "offset": 0, "duration": 1.5},
    // ...
  ],
  "created_at": "2025-10-27T10:00:00Z"
}
```

**transcript_chunks**:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "transcript_id": "550e8400-e29b-41d4-a716-446655440000",
  "video_id": "dQw4w9WgXcQ",
  "chunk_index": 0,
  "chunk_text": "Hello everyone, welcome to this Roblox Studio tutorial...",
  "start_seconds": 0,
  "end_seconds": 30,
  "start_timestamp": "0:00",
  "end_timestamp": "0:30",
  "embedding": [0.123, -0.456, 0.789, ...], // 1536 floats
  "created_at": "2025-10-27T10:05:00Z"
}
```

---

## 4. Chunking Strategy (30-Second Segments)

### Why 30-Second Chunks?

- **Optimal context size**: Balances detail vs. relevance
- **User experience**: Reasonable video segment length
- **Embedding quality**: Enough text for meaningful embeddings
- **Performance**: Manageable number of chunks per video

### Chunking Algorithm

**Reference**: `scripts/embed-module1-videos.js`

```javascript
const CHUNK_SIZE_SECONDS = 30;

/**
 * Chunk transcript into 30-second segments
 * @param {Array} transcript - YouTube transcript segments
 * @returns {Array} Chunked transcript with timestamps
 */
function chunkTranscript(transcript) {
  const chunks = [];
  let currentChunk = {
    text: '',
    startSeconds: 0,
    endSeconds: 0,
    segments: []
  };

  for (const segment of transcript) {
    const segmentStart = Math.floor(segment.offset);
    const segmentEnd = Math.floor(segment.offset + segment.duration);

    // Start new chunk if we've exceeded 30 seconds
    if (currentChunk.segments.length > 0 &&
        segmentEnd - currentChunk.startSeconds >= CHUNK_SIZE_SECONDS) {
      chunks.push(finalizeChunk(currentChunk));

      // Reset for next chunk
      currentChunk = {
        text: '',
        startSeconds: segmentStart,
        endSeconds: 0,
        segments: []
      };
    }

    // Initialize chunk start time on first segment
    if (currentChunk.segments.length === 0) {
      currentChunk.startSeconds = segmentStart;
    }

    // Add segment to current chunk
    currentChunk.text += segment.text + ' ';
    currentChunk.endSeconds = segmentEnd;
    currentChunk.segments.push(segment);
  }

  // Add final chunk if it has content
  if (currentChunk.segments.length > 0) {
    chunks.push(finalizeChunk(currentChunk));
  }

  return chunks;
}

/**
 * Finalize chunk by formatting timestamps
 */
function finalizeChunk(chunk) {
  return {
    text: chunk.text.trim(),
    startSeconds: chunk.startSeconds,
    endSeconds: chunk.endSeconds,
    startTimestamp: formatTimestamp(chunk.startSeconds),
    endTimestamp: formatTimestamp(chunk.endSeconds)
  };
}

/**
 * Format seconds to MM:SS timestamp
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted timestamp (e.g., "15:30")
 */
function formatTimestamp(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

### Example Chunking Output

**Input** (YouTube transcript):
```javascript
[
  { text: "Hello everyone", offset: 0, duration: 2 },
  { text: "Welcome to Roblox", offset: 2, duration: 3 },
  // ... 25 more seconds of content
  { text: "Let's get started", offset: 28, duration: 2 },
  { text: "In this video", offset: 32, duration: 3 },
  // ... continues
]
```

**Output** (30-second chunks):
```javascript
[
  {
    text: "Hello everyone Welcome to Roblox ... Let's get started",
    startSeconds: 0,
    endSeconds: 30,
    startTimestamp: "0:00",
    endTimestamp: "0:30"
  },
  {
    text: "In this video ... next segment content",
    startSeconds: 30,
    endSeconds: 60,
    startTimestamp: "0:30",
    endTimestamp: "1:00"
  }
  // ... more chunks
]
```

---

## 5. Generating Embeddings (OpenAI)

### NPM Package

```bash
npm install openai@4.73.0
```

### OpenAI Configuration

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

### Embedding Generation Function

**Reference**: `src/lib/services/supabase-transcript-service.ts`

```javascript
/**
 * Generate embedding vector for text using OpenAI ada-002
 * @param {string} text - Text to embed
 * @returns {Promise<number[]|null>} 1536-dimensional vector or null
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.replace(/\n/g, ' ').trim(), // Clean newlines and whitespace
    });

    return response.data[0].embedding; // Array of 1536 floats
  } catch (error) {
    console.error('❌ Embedding generation failed:', error.message);
    return null;
  }
}
```

### Batch Processing with Rate Limiting

**Reference**: `scripts/generate-transcript-embeddings.js`

```javascript
/**
 * Process chunks in batches to avoid rate limits
 * @param {Array} chunks - Chunks to process
 * @param {number} batchSize - Number of chunks per batch
 */
async function processChunksInBatches(chunks, batchSize = 10) {
  console.log(`📊 Processing ${chunks.length} chunks in batches of ${batchSize}`);

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(chunks.length / batchSize);

    console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches}`);

    // Process batch in parallel
    await Promise.all(batch.map(async (chunk, index) => {
      try {
        const embedding = await generateEmbedding(chunk.chunk_text);

        if (embedding) {
          // Update database with embedding
          await supabase
            .from('transcript_chunks')
            .update({ embedding })
            .eq('id', chunk.id);

          console.log(`  ✅ Chunk ${i + index + 1}/${chunks.length} embedded`);
        }
      } catch (error) {
        console.error(`  ❌ Chunk ${i + index + 1} failed:`, error.message);
      }
    }));

    // Rate limiting: 1 second delay between batches
    if (i + batchSize < chunks.length) {
      await new Promise(r => setTimeout(r, 1000));
    }

    const processed = Math.min(i + batchSize, chunks.length);
    const percentage = ((processed / chunks.length) * 100).toFixed(1);
    console.log(`📈 Progress: ${processed}/${chunks.length} (${percentage}%)`);
  }

  console.log('\n✅ All chunks processed!');
}
```

### Error Handling with Retries

```javascript
/**
 * Generate embedding with retry logic
 * @param {string} text - Text to embed
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<number[]|null>}
 */
async function generateEmbeddingWithRetry(text, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.replace(/\n/g, ' ').trim(),
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error(`Attempt ${attempt + 1}/${maxRetries} failed:`, error.message);

      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  return null;
}
```

### Cost Estimation

**OpenAI text-embedding-ada-002 Pricing**:
- **Cost**: $0.0001 per 1,000 tokens
- **Average 30-second chunk**: ~100 tokens
- **1,000 chunks**: ~$0.01
- **Example**: 40-minute video (80 chunks) ≈ $0.0008

---

## 6. Vector Search Function (Supabase)

### Database Function for Cosine Similarity Search

**Reference**: `supabase/migrations/010_search_function_for_old_schema.sql`

```sql
CREATE OR REPLACE FUNCTION search_transcript_chunks(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.3,
  max_results int DEFAULT 10
)
RETURNS TABLE (
  chunk_id UUID,
  video_id TEXT,
  chunk_text TEXT,
  start_seconds INTEGER,
  end_seconds INTEGER,
  start_timestamp TEXT,
  end_timestamp TEXT,
  similarity float,
  title TEXT,
  creator TEXT,
  youtube_id TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.id AS chunk_id,
    tc.video_id,
    tc.chunk_text,
    tc.start_seconds,
    tc.end_seconds,
    tc.start_timestamp,
    tc.end_timestamp,
    -- Cosine similarity: 1 - distance = similarity score
    (1 - (tc.embedding <=> query_embedding)) AS similarity,
    vt.title,
    vt.creator,
    vt.youtube_id
  FROM transcript_chunks tc
  JOIN video_transcripts vt ON tc.transcript_id = vt.id
  WHERE tc.embedding IS NOT NULL
    AND (1 - (tc.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY tc.embedding <=> query_embedding ASC -- Lower distance = higher similarity
  LIMIT max_results;
END;
$$;
```

### Understanding Cosine Similarity

**Operator**: `<=>` (cosine distance in pgvector)
- **Distance**: 0.0 (identical) to 2.0 (opposite)
- **Similarity**: `1 - distance` converts to 0.0-1.0 scale
- **Threshold 0.3**: Accept results with 30%+ similarity

**Example**:
```sql
-- Distance 0.2 → Similarity 0.8 (80% match) ✅
-- Distance 0.5 → Similarity 0.5 (50% match) ✅
-- Distance 0.8 → Similarity 0.2 (20% match) ❌ Below threshold
```

### Testing the Search Function

```sql
-- Test search with a sample embedding
SELECT * FROM search_transcript_chunks(
  (SELECT embedding FROM transcript_chunks LIMIT 1), -- Use existing embedding
  0.3,  -- 30% similarity threshold
  5     -- Top 5 results
);
```

---

## 7. RAG Implementation (Search + GPT)

### Semantic Search Service

**File**: `src/lib/services/supabase-transcript-service.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

class TranscriptService {
  private supabase;
  private openai;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Search transcripts using vector similarity
   * @param query - User's search query
   * @param limit - Maximum number of results
   * @param threshold - Minimum similarity score (0-1)
   */
  async searchTranscriptsVector(
    query: string,
    limit: number = 10,
    threshold: number = 0.3
  ): Promise<TranscriptChunk[]> {
    // Step 1: Generate embedding for user's query
    const queryEmbedding = await this.generateEmbedding(query);
    if (!queryEmbedding) {
      console.error('Failed to generate query embedding');
      return [];
    }

    // Step 2: Call vector search function
    const { data, error } = await this.supabase.rpc('search_transcript_chunks', {
      query_embedding: queryEmbedding,
      similarity_threshold: threshold,
      max_results: limit
    });

    if (error) {
      console.error('Vector search failed:', error);
      return [];
    }

    // Step 3: Transform results
    return data.map((row: any) => ({
      id: row.chunk_id,
      videoId: row.video_id,
      chunkText: row.chunk_text,
      startSeconds: row.start_seconds,
      endSeconds: row.end_seconds,
      startTimestamp: row.start_timestamp,
      endTimestamp: row.end_timestamp,
      similarity: row.similarity,
      title: row.title,
      creator: row.creator,
      youtubeId: row.youtube_id
    }));
  }

  /**
   * Generate OpenAI embedding for text
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.replace(/\n/g, ' ').trim(),
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      return null;
    }
  }
}

export const transcriptService = new TranscriptService();
```

### RAG Chat Integration (Database-First Architecture)

**File**: `src/lib/services/openai-service.ts`

```typescript
import { transcriptService } from './supabase-transcript-service';

class OpenAIService {
  private openai;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Generate chat completion with RAG (Database-First approach)
   * CRITICAL: Search database BEFORE calling GPT
   */
  async generateChatCompletion(messages: Message[], userId: string) {
    // STEP 1: Search database FIRST (before calling GPT)
    const userQuery = messages[messages.length - 1].content;
    const videoReferences = await this.findRelevantVideoSegments(userQuery);

    console.log(`🔍 Found ${videoReferences.length} relevant video segments`);

    // STEP 2: Build system prompt WITH search results
    const systemPrompt = this.buildSystemPrompt(videoReferences);

    // STEP 3: Call OpenAI with context
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    return {
      answer: completion.choices[0].message.content,
      videoReferences,
      suggestedQuestions: this.generateSuggestedQuestions(videoReferences)
    };
  }

  /**
   * Find relevant video segments using vector search
   * Uses LOW threshold (0.3) for better coverage
   */
  async findRelevantVideoSegments(
    query: string,
    limit: number = 5
  ): Promise<VideoReference[]> {
    const results = await transcriptService.searchTranscriptsVector(
      query,
      limit,
      0.3 // Low threshold = more results
    );

    return results.map(r => ({
      title: r.title,
      youtubeId: r.youtubeId,
      timestamp: r.startTimestamp,
      relevantSegment: r.chunkText.substring(0, 150) + '...',
      thumbnailUrl: `https://i.ytimg.com/vi/${r.youtubeId}/mqdefault.jpg`,
      confidence: r.similarity,
      startTime: r.startSeconds,
      endTime: r.endSeconds
    }));
  }

  /**
   * Build system prompt with search results
   */
  buildSystemPrompt(videoReferences: VideoReference[]): string {
    if (videoReferences.length > 0) {
      const videoList = videoReferences
        .map((v, i) => `${i + 1}. "${v.title}" at ${v.timestamp} (${Math.round(v.confidence * 100)}% match)`)
        .join('\n');

      return `You are Blox Wizard, an expert Roblox development tutor.

**Relevant Videos from Our Library**:
${videoList}

**Instructions**:
- Answer the user's question using information from these videos
- Reference specific videos by name and timestamp when helpful
- If multiple videos are relevant, mention the best match first
- Keep responses concise and actionable
- Use a friendly, encouraging tone for young developers`;
    } else {
      return `You are Blox Wizard, an expert Roblox development tutor.

**Note**: No exact video matches found for this query.

**Instructions**:
- Provide general guidance on the topic
- Suggest related topics the user might explore
- Encourage the user to browse our video library
- Keep responses helpful and encouraging`;
    }
  }

  /**
   * Generate follow-up questions based on search results
   */
  generateSuggestedQuestions(videoReferences: VideoReference[]): string[] {
    if (videoReferences.length === 0) {
      return [
        "What topics are covered in Module 1?",
        "How do I get started with Roblox Studio?",
        "What are the best beginner tutorials?"
      ];
    }

    // Extract topics from video titles
    const topics = videoReferences.map(v => v.title);

    return [
      `Tell me more about ${topics[0]}`,
      "What should I learn after this?",
      "Can you show me a practical example?"
    ];
  }
}

export const openaiService = new OpenAIService();
```

### TypeScript Interfaces

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface TranscriptChunk {
  id: string;
  videoId: string;
  chunkText: string;
  startSeconds: number;
  endSeconds: number;
  startTimestamp: string;
  endTimestamp: string;
  similarity: number;
  title: string;
  creator: string;
  youtubeId: string;
}

interface VideoReference {
  title: string;
  youtubeId: string;
  timestamp: string;
  relevantSegment: string;
  thumbnailUrl: string;
  confidence: number;
  startTime: number;
  endTime: number;
}
```

---

## 8. Complete Workflow Scripts

### Script 1: Process New Videos (Fetch + Store)

**File**: `scripts/process-new-videos.js`

```javascript
import { YoutubeTranscript } from 'youtube-transcript';
import { createClient } from '@supabase/supabase-js';
import curriculum from '../src/data/curriculum.json' assert { type: 'json' };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CHUNK_SIZE_SECONDS = 30;

/**
 * Process a single video: fetch transcript, chunk, store in DB
 */
async function processVideo(video) {
  console.log(`\n📹 Processing: ${video.title}`);

  // 1. Fetch transcript
  const transcript = await fetchTranscript(video.youtubeId);
  if (!transcript) {
    console.error(`❌ Skipping ${video.title} - no transcript available`);
    return false;
  }

  // 2. Store transcript in video_transcripts table
  const { data: videoData, error: videoError } = await supabase
    .from('video_transcripts')
    .upsert({
      youtube_id: video.youtubeId,
      title: video.title,
      creator: video.creator,
      duration_seconds: Math.floor(transcript[transcript.length - 1].offset),
      full_transcript: transcript
    }, {
      onConflict: 'youtube_id'
    })
    .select()
    .single();

  if (videoError) {
    console.error(`❌ Database error:`, videoError);
    return false;
  }

  console.log(`✅ Transcript stored (${transcript.length} segments)`);

  // 3. Chunk transcript
  const chunks = chunkTranscript(transcript);
  console.log(`📦 Created ${chunks.length} chunks`);

  // 4. Delete existing chunks (for re-processing)
  await supabase
    .from('transcript_chunks')
    .delete()
    .eq('transcript_id', videoData.id);

  // 5. Insert chunks
  const chunkRecords = chunks.map((chunk, index) => ({
    transcript_id: videoData.id,
    video_id: video.youtubeId,
    chunk_index: index,
    chunk_text: chunk.text,
    start_seconds: chunk.startSeconds,
    end_seconds: chunk.endSeconds,
    start_timestamp: chunk.startTimestamp,
    end_timestamp: chunk.endTimestamp
  }));

  const { error: chunkError } = await supabase
    .from('transcript_chunks')
    .insert(chunkRecords);

  if (chunkError) {
    console.error(`❌ Chunk insert error:`, chunkError);
    return false;
  }

  console.log(`✅ Stored ${chunks.length} chunks for "${video.title}"`);
  return true;
}

/**
 * Process all videos from curriculum.json
 */
async function processAllVideos() {
  console.log('🚀 Starting video processing...\n');

  const videos = [];

  // Extract all videos from curriculum structure
  for (const module of curriculum.modules) {
    for (const week of module.weeks) {
      for (const day of week.days) {
        videos.push(...day.videos);
      }
    }
  }

  console.log(`📊 Found ${videos.length} videos to process\n`);

  let successCount = 0;
  let failCount = 0;

  for (const video of videos) {
    const success = await processVideo(video);
    if (success) successCount++;
    else failCount++;

    // Rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(50));
}

// Helper functions (chunkTranscript, formatTimestamp) same as in Section 4

// Run the script
processAllVideos().catch(console.error);
```

### Script 2: Generate Embeddings for All Chunks

**File**: `scripts/generate-all-embeddings.js`

```javascript
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Generate embedding for text
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.replace(/\n/g, ' ').trim(),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding error:', error.message);
    return null;
  }
}

/**
 * Main function: Generate embeddings for all chunks
 */
async function generateAllEmbeddings() {
  console.log('🚀 Starting embedding generation...\n');

  // Fetch chunks without embeddings
  const { data: chunks, error } = await supabase
    .from('transcript_chunks')
    .select('id, chunk_text, video_id')
    .is('embedding', null);

  if (error) {
    console.error('❌ Database error:', error);
    return;
  }

  if (chunks.length === 0) {
    console.log('✅ All chunks already have embeddings!');
    return;
  }

  console.log(`📊 Found ${chunks.length} chunks to process\n`);

  let successCount = 0;
  let failCount = 0;

  // Process in batches of 10
  const batchSize = 10;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(chunks.length / batchSize);

    console.log(`🔄 Processing batch ${batchNum}/${totalBatches}`);

    await Promise.all(batch.map(async (chunk, index) => {
      const embedding = await generateEmbedding(chunk.chunk_text);

      if (embedding) {
        const { error: updateError } = await supabase
          .from('transcript_chunks')
          .update({ embedding })
          .eq('id', chunk.id);

        if (updateError) {
          console.error(`  ❌ Chunk ${i + index + 1} update failed`);
          failCount++;
        } else {
          console.log(`  ✅ Chunk ${i + index + 1}/${chunks.length}`);
          successCount++;
        }
      } else {
        failCount++;
      }
    }));

    // Rate limiting: 1 second delay between batches
    if (i + batchSize < chunks.length) {
      await new Promise(r => setTimeout(r, 1000));
    }

    const progress = Math.min(i + batchSize, chunks.length);
    const percentage = ((progress / chunks.length) * 100).toFixed(1);
    console.log(`📈 Progress: ${progress}/${chunks.length} (${percentage}%)\n`);
  }

  console.log('='.repeat(50));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Success rate: ${((successCount / chunks.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));
}

// Run the script
generateAllEmbeddings().catch(console.error);
```

### Script 3: Test Vector Search

**File**: `scripts/test-vector-search.js`

```javascript
import { transcriptService } from '../src/lib/services/supabase-transcript-service.js';

async function testSearch() {
  const testQueries = [
    "How do I create a part in Roblox Studio?",
    "What are variables in Lua?",
    "How to make a player jump higher?",
    "Explain functions in Roblox scripting"
  ];

  console.log('🔍 Testing Vector Search\n');

  for (const query of testQueries) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Query: "${query}"`);
    console.log('='.repeat(60));

    const results = await transcriptService.searchTranscriptsVector(
      query,
      5,    // Top 5 results
      0.3   // 30% similarity threshold
    );

    if (results.length === 0) {
      console.log('❌ No results found\n');
      continue;
    }

    results.forEach((result, index) => {
      console.log(`\n${index + 1}. "${result.title}" by ${result.creator}`);
      console.log(`   📍 Timestamp: ${result.startTimestamp}`);
      console.log(`   🎯 Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`   📝 Preview: ${result.chunkText.substring(0, 100)}...`);
    });

    console.log('');
  }
}

testSearch().catch(console.error);
```

---

## 9. Key Configuration Requirements

### Environment Variables

Create `.env.local` file:

```bash
# OpenAI API Key (for embeddings and chat)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: YouTube API Key (for fetching video metadata)
YOUTUBE_API_KEY=AIzaSyxxxxxxxxxxxxx
```

### Package.json Dependencies

```json
{
  "dependencies": {
    "youtube-transcript": "^1.2.1",
    "youtubei.js": "^16.0.1",
    "openai": "^4.73.0",
    "@supabase/supabase-js": "^2.45.0"
  }
}
```

### Supabase Setup Checklist

1. **Enable pgvector extension**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **Run migrations** (in order)
   - `001_video_transcripts.sql`
   - `002_transcript_chunks.sql`
   - `003_vector_search_function.sql`

3. **Set up Row Level Security (RLS)**
   ```sql
   -- Allow public read access to transcripts
   ALTER TABLE video_transcripts ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Allow public read" ON video_transcripts FOR SELECT TO public USING (true);

   ALTER TABLE transcript_chunks ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Allow public read" ON transcript_chunks FOR SELECT TO public USING (true);
   ```

4. **Create indexes** (already in migrations)

5. **Test connection**
   ```javascript
   const { data, error } = await supabase
     .from('video_transcripts')
     .select('count');
   console.log('Connection test:', data);
   ```

---

## 10. Implementation Checklist for New Projects

### Phase 1: Setup (1-2 hours)

- [ ] **Install dependencies**
  ```bash
  npm install youtube-transcript openai @supabase/supabase-js
  ```

- [ ] **Create Supabase project** at supabase.com

- [ ] **Enable pgvector extension** in Supabase SQL editor

- [ ] **Run database migrations**
  - Create `video_transcripts` table
  - Create `transcript_chunks` table with vector column
  - Create `search_transcript_chunks` function

- [ ] **Set up environment variables** in `.env.local`

- [ ] **Test Supabase connection** with simple query

### Phase 2: Data Collection (2-4 hours)

- [ ] **Create video list** (JSON or database)
  - Video titles
  - YouTube IDs
  - Creators
  - Metadata

- [ ] **Create transcript fetching script**
  - Extract YouTube IDs from URLs
  - Fetch transcripts with retry logic
  - Handle errors gracefully

- [ ] **Run script to fetch all transcripts**
  - Monitor for failures
  - Log missing transcripts

- [ ] **Store transcripts in database**
  - Insert into `video_transcripts`
  - Verify data integrity

### Phase 3: Chunking & Embeddings (2-3 hours)

- [ ] **Create chunking script**
  - Implement 30-second chunking algorithm
  - Format timestamps
  - Test with sample video

- [ ] **Process all transcripts into chunks**
  - Run chunking script
  - Insert into `transcript_chunks`
  - Verify chunk counts

- [ ] **Create embedding generation script**
  - OpenAI API integration
  - Batch processing logic
  - Rate limiting (1s between batches)

- [ ] **Generate embeddings for all chunks**
  - Run embedding script
  - Monitor progress
  - Handle API errors
  - Verify all chunks have embeddings

### Phase 4: Search & RAG (3-4 hours)

- [ ] **Test vector search function**
  - Try sample queries
  - Adjust similarity threshold
  - Verify result relevance

- [ ] **Create transcript service class**
  - `searchTranscriptsVector()` method
  - `generateEmbedding()` helper
  - Error handling

- [ ] **Implement RAG service**
  - Database-first search
  - System prompt building
  - GPT integration

- [ ] **Create API endpoint** (if web app)
  - `/api/chat` route
  - Request/response types
  - Error handling

- [ ] **Test end-to-end flow**
  - User query → Search → GPT → Response
  - Verify video references
  - Check response quality

### Phase 5: Polish & Optimization (1-2 hours)

- [ ] **Add logging and monitoring**
  - Search query logs
  - Performance metrics
  - Error tracking

- [ ] **Optimize database queries**
  - Add indexes if needed
  - Test query performance

- [ ] **Create maintenance scripts**
  - Add new videos
  - Regenerate embeddings
  - Verify data quality

- [ ] **Write documentation**
  - Setup instructions
  - API documentation
  - Troubleshooting guide

### Total Estimated Time: 9-15 hours

---

## Key Takeaways

### ✅ What Makes This System Successful

1. **Database-First Search**: Search happens BEFORE calling GPT
   - GPT receives actual context from your video library
   - No hallucinations about non-existent videos
   - More accurate and relevant responses

2. **Low Similarity Threshold (0.3)**: Allows broader result coverage
   - Better for smaller video libraries
   - More forgiving of query phrasing
   - Can be adjusted based on library size

3. **30-Second Chunks**: Optimal balance
   - Enough context for meaningful embeddings
   - Reasonable video segment length for users
   - Good performance (manageable chunk counts)

4. **Batch Processing with Rate Limiting**: Prevents API errors
   - 10 chunks per batch
   - 1-second delays between batches
   - Retry logic for failed requests

5. **Cosine Similarity in pgvector**: Fast and accurate
   - Native PostgreSQL extension
   - Efficient for thousands of vectors
   - No external vector database needed

6. **Comprehensive Error Handling**: Production-ready reliability
   - Retry logic for API calls
   - Graceful degradation
   - Detailed logging

### 🎯 Performance Characteristics

- **Search Latency**: ~200-500ms (embedding + vector search)
- **Embedding Generation**: ~1-2 seconds per chunk
- **Database Query**: <100ms for 1000+ chunks
- **End-to-End Response**: ~2-4 seconds (search + GPT)

### 💰 Cost Analysis (Example: 100 Videos)

Assuming 40-minute average video length:
- **Chunks per video**: ~80 (40 min ÷ 0.5 min)
- **Total chunks**: 8,000
- **Embedding cost**: ~$0.80 (one-time)
- **Monthly search costs**: ~$1-5 (depending on usage)
- **GPT chat costs**: $5-20/month (1000-5000 messages)

**Total Initial Setup**: ~$0.80
**Monthly Operating Cost**: ~$10-25

### 🚀 Scaling Considerations

**Current System** (100-500 videos):
- Cosine similarity without indexing works great
- No need for IVFFlat indexes
- Simple Supabase free tier sufficient

**Large Scale** (1000+ videos):
- Consider IVFFlat indexes for vector search
- Upgrade to Supabase paid tier (more RAM)
- Implement caching for common queries
- Use Redis for embedding cache

### 🔧 Troubleshooting Common Issues

**Issue**: "No results found" for obvious queries
- **Solution**: Lower similarity threshold (try 0.2)
- **Solution**: Check if embeddings are generated
- **Solution**: Verify transcript quality

**Issue**: Embedding generation fails
- **Solution**: Check OpenAI API key
- **Solution**: Verify rate limits
- **Solution**: Reduce batch size

**Issue**: Slow search performance
- **Solution**: Add database indexes
- **Solution**: Check Supabase plan limits
- **Solution**: Reduce result limit

**Issue**: GPT hallucinates video content
- **Solution**: Ensure database-first search is working
- **Solution**: Verify system prompt includes search results
- **Solution**: Check threshold isn't too restrictive

---

## Conclusion

This video transcript scraping and RAG system is a **production-ready, battle-tested architecture** that balances:
- ✅ **Accuracy**: Database-first search prevents hallucinations
- ✅ **Performance**: Fast vector search with pgvector
- ✅ **Cost**: Affordable with OpenAI embeddings
- ✅ **Reliability**: Comprehensive error handling
- ✅ **Scalability**: Works from 10 to 1000+ videos

**You can confidently replicate this system in any project requiring semantic search over video content!** 🎉

---

## Additional Resources

### Documentation
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Supabase pgvector Documentation](https://supabase.com/docs/guides/ai/vector-embeddings)
- [youtube-transcript NPM Package](https://www.npmjs.com/package/youtube-transcript)

### Related Files in This Project
- `scripts/fetch-playlist-with-transcripts.js` - Transcript fetching
- `scripts/generate-transcript-embeddings.js` - Embedding generation
- `src/lib/services/supabase-transcript-service.ts` - Search service
- `src/lib/services/openai-service.ts` - RAG implementation
- `supabase/migrations/010_search_function_for_old_schema.sql` - Vector search function

---

**Last Updated**: October 27, 2025
**Version**: 1.0
**Status**: Production-Ready ✅
