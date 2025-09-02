# YouTube Transcript Extraction System Documentation
> Complete technical documentation of our transcript extraction pipeline

## 🎯 System Overview

Our transcript extraction system is built on **yt-dlp**, a powerful YouTube downloader that can extract subtitles/captions more reliably than official APIs. The system processes YouTube videos, extracts transcripts, chunks them for semantic search, generates embeddings, and stores everything in a vector database.

## 📊 Current Performance Metrics

- **Success Rate**: 40.4% (21/52 videos)
- **Rate Limit Threshold**: ~20 videos before HTTP 429
- **Processing Time**: ~2-3 seconds per video (when not rate limited)
- **Chunk Size**: 500 tokens with 100 token overlap
- **Embedding Model**: OpenAI text-embedding-3-small (1536 dimensions)
- **Vector Search**: pgvector with cosine similarity

## 🏗️ Architecture

```
YouTube Video URL
        ↓
[yt-dlp Python Extractor]
        ↓
[Node.js Wrapper/Controller]
        ↓
[Transcript Processor]
        ├─→ [Chunking Service]
        ├─→ [OpenAI Embeddings]
        └─→ [Supabase Storage]
                ↓
        [Vector Database]
                ↓
        [Chat API Search]
```

## 🔧 Core Components

### 1. Python Transcript Extractor
**File**: `scripts/extract-transcripts.py`

```python
class YouTubeTranscriptExtractor:
    def __init__(self):
        self.subtitle_opts = {
            'skip_download': True,       # Don't download video
            'writesubtitles': True,       # Get manual subtitles
            'writeautomaticsub': True,    # Get auto-generated
            'subtitlesformat': 'json3',   # Best format for parsing
        }
```

**Key Features**:
- Extracts both manual and auto-generated captions
- Prefers English subtitles but falls back to any available
- Cleans transcript text (removes [Music], timestamps, etc.)
- Returns structured JSON with metadata

### 2. Node.js Processing Pipeline
**File**: `scripts/youtube-transcript-extractor.js`

```javascript
class YouTubeTranscriptExtractor {
    async extractMultipleTranscripts(videos, options) {
        // Batch processing with rate limiting
        batchSize: 3,        // Process 3 videos at a time
        delayMs: 2000,       // 2 second delay between batches
        retryFailures: true, // Auto-retry failed extractions
        maxRetries: 2        // Try twice before giving up
    }
}
```

**Processing Flow**:
1. Load video list from curriculum
2. Process in small batches to avoid rate limits
3. Auto-retry failures with exponential backoff
4. Save results to JSON for import

### 3. Database Import & Embedding Generation
**File**: `scripts/import-real-transcripts.js`

```javascript
class TranscriptImporter {
    constructor() {
        this.chunkSize = 500;      // Tokens per chunk
        this.chunkOverlap = 100;   // Overlap for context
    }
    
    async processTranscript(transcript) {
        // 1. Insert video record
        // 2. Create semantic chunks
        // 3. Generate embeddings
        // 4. Store in vector database
    }
}
```

## 📝 Database Schema

### Core Tables

```sql
-- Video metadata and full transcripts
video_transcripts (
    id UUID PRIMARY KEY,
    youtube_id TEXT UNIQUE,
    title TEXT,
    creator TEXT,
    duration_seconds INTEGER,
    full_transcript TEXT,
    processed_at TIMESTAMPTZ
)

-- Chunked transcripts with embeddings
transcript_chunks (
    id UUID PRIMARY KEY,
    transcript_id UUID REFERENCES video_transcripts,
    chunk_text TEXT,
    chunk_index INTEGER,
    start_timestamp TEXT,    -- "15:30" format
    end_timestamp TEXT,      -- "16:15" format
    embedding VECTOR(1536),  -- OpenAI embeddings
    created_at TIMESTAMPTZ
)

-- Processing queue for admin system
video_queue (
    id UUID PRIMARY KEY,
    youtube_id TEXT,
    status TEXT,  -- pending, processing, completed, failed
    attempts INTEGER,
    error_message TEXT,
    priority INTEGER
)
```

## 🚀 Usage Instructions

### Extract Single Video
```bash
# Python directly
python scripts/extract-transcripts.py YOUTUBE_VIDEO_ID

# Via Node.js wrapper
node scripts/youtube-transcript-extractor.js single YOUTUBE_VIDEO_ID
```

### Process Module 1 Videos
```bash
# Extract all Module 1 transcripts
node scripts/youtube-transcript-extractor.js module1

# Import to database
node scripts/import-real-transcripts.js
```

### Test Chat API
```bash
# Run test suite
node scripts/test-chat-api.js
```

## ⚠️ Rate Limiting & Solutions

### Current Issue
YouTube blocks requests after ~20 consecutive extractions with HTTP 429 (Too Many Requests).

### Mitigation Strategies

#### 1. **Delay & Batch Processing**
```javascript
// Current implementation
batchSize: 3,     // Small batches
delayMs: 2000,    // 2s between batches
```

#### 2. **Exponential Backoff**
```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn()
        } catch (error) {
            if (i === maxRetries - 1) throw error
            await sleep(Math.pow(2, i) * 1000) // 1s, 2s, 4s...
        }
    }
}
```

#### 3. **Proxy Rotation** (Future Enhancement)
```python
# Use rotating proxies
proxies = [
    'http://proxy1.com:8080',
    'http://proxy2.com:8080',
]

ydl_opts = {
    'proxy': random.choice(proxies)
}
```

#### 4. **Distributed Processing**
- Split video list across multiple servers/IPs
- Use cloud functions with different IPs
- Schedule extraction at different times

## 🔍 Vector Search Implementation

### Search Function
```sql
CREATE FUNCTION search_transcript_chunks(
    query_embedding vector(1536),
    similarity_threshold float DEFAULT 0.7,
    max_results int DEFAULT 20
)
RETURNS TABLE (...)
AS $$
    SELECT 
        tc.*,
        1 - (tc.embedding <=> query_embedding) as similarity_score
    FROM transcript_chunks tc
    WHERE 1 - (tc.embedding <=> query_embedding) > similarity_threshold
    ORDER BY tc.embedding <=> query_embedding
    LIMIT max_results;
$$;
```

### Hybrid Search Strategy
1. **Primary**: Vector similarity search using pgvector
2. **Fallback**: PostgreSQL full-text search
3. **Last Resort**: ILIKE pattern matching

## 📈 Success Metrics

### What's Working
- ✅ yt-dlp successfully extracts when captions exist
- ✅ Embedding generation with OpenAI API
- ✅ Vector search returning relevant results
- ✅ Fallback text search for reliability
- ✅ 100% API success rate with real data

### Areas for Improvement
- ⚠️ Rate limiting after 20 videos
- ⚠️ No captions on some videos
- ⚠️ Manual intervention needed for failures
- ⚠️ No real-time processing status

## 🛠️ Troubleshooting

### Common Errors & Solutions

#### 1. "No transcript available"
**Cause**: Video has no captions (manual or auto-generated)
**Solution**: 
- Check video on YouTube directly
- Consider audio transcription with Whisper
- Allow manual transcript upload

#### 2. "HTTP Error 429: Too Many Requests"
**Cause**: Rate limiting from YouTube
**Solution**:
- Wait 5-10 minutes before retrying
- Reduce batch size
- Increase delays
- Use proxy rotation

#### 3. "Failed to parse subtitles"
**Cause**: Unexpected subtitle format
**Solution**:
- Update yt-dlp: `pip install --upgrade yt-dlp`
- Check subtitle format compatibility
- Try different format options

#### 4. "Embedding generation failed"
**Cause**: OpenAI API issues
**Solution**:
- Check API key validity
- Verify rate limits
- Implement retry logic
- Cache successful embeddings

## 🔄 Maintenance & Updates

### Regular Tasks
1. **Weekly**: Update yt-dlp to latest version
2. **Daily**: Monitor extraction queue
3. **Monthly**: Analyze success rates
4. **As Needed**: Clear failed videos from queue

### Update Commands
```bash
# Update yt-dlp
pip install --upgrade yt-dlp

# Update OpenAI SDK
npm update openai

# Check yt-dlp version
yt-dlp --version
```

## 📊 Performance Optimization

### Database Indexes
```sql
-- Critical for vector search performance
CREATE INDEX transcript_chunks_embedding_idx 
ON transcript_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Text search fallback
CREATE INDEX transcript_chunks_text_idx 
ON transcript_chunks USING GIN (to_tsvector('english', chunk_text));
```

### Caching Strategy
1. Cache successful extractions permanently
2. Cache embeddings to avoid regeneration
3. Cache common search queries
4. Use Redis for hot data

## 🚨 Disaster Recovery

### Backup Strategy
1. **Database**: Daily Supabase backups
2. **Transcripts**: Store raw JSON locally
3. **Embeddings**: Can regenerate from transcripts
4. **Code**: Git version control

### Recovery Steps
1. Restore database from backup
2. Re-import transcripts from JSON
3. Regenerate embeddings if needed
4. Verify vector search functionality

## 📚 Related Documentation

- [Admin Dashboard Implementation](./ADMIN-DASHBOARD-IMPLEMENTATION.md)
- [Disaster Recovery Guide](./DISASTER-RECOVERY.md)
- [API Reference](../blox-wizard/API-REFERENCE.md)

---

**Last Updated**: September 2025
**Maintained By**: Blox Buddy Development Team