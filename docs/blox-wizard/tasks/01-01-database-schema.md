# Task 01-01: Database Schema Setup
**Phase 1: Foundation | Week 1**

---

## Task Overview

**Goal**: Create the complete database schema for Chat Wizard with proper indexes and RLS policies.

**Estimated Time**: 4-6 hours  
**Priority**: Critical (blocks all other tasks)  
**Dependencies**: None (foundation task)

---

## Senior Developer Notes

This is the foundation of everything. Get this right or the entire system will have performance issues. The user specifically mentioned they had a previous solution that "cached the 50 most common questions" - our schema needs to support this efficiently.

**Key Requirements from User**:
- Must search across ALL video transcripts simultaneously
- Need to cache common questions for cost optimization
- Must store precise timestamps for video citations
- Handle 10K+ concurrent users (plan for scale)

---

## Technical Requirements

### 1. Core Tables to Create

#### `video_transcripts`
```sql
CREATE TABLE video_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id TEXT NOT NULL, -- From curriculum.json
    youtube_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    creator TEXT,
    duration_seconds INTEGER,
    full_transcript TEXT,
    transcript_json JSONB, -- Raw transcript with timestamps
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `transcript_chunks`
```sql
CREATE TABLE transcript_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcript_id UUID REFERENCES video_transcripts(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    start_timestamp TEXT NOT NULL, -- "15:30"
    end_timestamp TEXT NOT NULL,   -- "16:15"
    start_seconds INTEGER NOT NULL, -- For sorting/filtering
    end_seconds INTEGER NOT NULL,
    embedding VECTOR(1536), -- OpenAI ada-002 dimensions
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `common_questions` (Critical for cost optimization)
```sql
CREATE TABLE common_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_pattern TEXT NOT NULL,
    question_embedding VECTOR(1536),
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Index will automatically rank by usage_count
    UNIQUE(question_pattern)
);
```

#### `question_answers`
```sql
CREATE TABLE question_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES common_questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    video_references JSONB NOT NULL, -- Array of video refs with timestamps
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- For cache expiration
);
```

### 2. Critical Indexes (Performance Requirements)

```sql
-- Vector similarity search (MOST IMPORTANT)
CREATE INDEX CONCURRENTLY transcript_chunks_embedding_idx 
ON transcript_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Text search fallback
CREATE INDEX transcript_chunks_text_idx ON transcript_chunks 
USING GIN (to_tsvector('english', chunk_text));

-- Transcript lookup (for UI)
CREATE INDEX transcript_chunks_transcript_id_idx ON transcript_chunks(transcript_id, chunk_index);

-- Question caching (for cost optimization)
CREATE INDEX common_questions_usage_idx ON common_questions(usage_count DESC, last_used DESC);
CREATE INDEX common_questions_embedding_idx ON common_questions 
USING ivfflat (question_embedding vector_cosine_ops)
WITH (lists = 10);

-- YouTube video lookup
CREATE INDEX video_transcripts_youtube_id_idx ON video_transcripts(youtube_id);
```

### 3. Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE video_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_questions ENABLE ROW LEVEL SECURITY;  
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;

-- Public read access (educational content)
CREATE POLICY "Public read access" ON video_transcripts FOR SELECT USING (true);
CREATE POLICY "Public read access" ON transcript_chunks FOR SELECT USING (true);
CREATE POLICY "Public read access" ON common_questions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON question_answers FOR SELECT USING (true);

-- Service role full access (for API operations)
CREATE POLICY "Service role full access" ON video_transcripts FOR ALL 
USING (auth.role() = 'service_role');
```

---

## Implementation Steps

### Step 1: Create Migration File
```bash
# Run this in terminal
npx supabase migration new chat_wizard_schema
```

### Step 2: Write Migration SQL
Copy the schema above into the new migration file. Test locally first:
```bash
npx supabase db reset
npx supabase db start
```

### Step 3: Enable pgvector Extension
```sql
-- Add this to the top of your migration
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 4: Validate Schema
- Check all foreign key relationships
- Verify index creation doesn't timeout
- Test vector operations work

### Step 5: Run Migration
```bash
npx supabase db push
```

---

## Testing Requirements

### 1. Schema Validation
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%transcript%';

-- Check indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('video_transcripts', 'transcript_chunks');

-- Verify vector extension
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 2. Performance Testing
```sql
-- Test vector similarity (should be < 100ms)
EXPLAIN ANALYZE 
SELECT * FROM transcript_chunks 
ORDER BY embedding <=> '[random_vector_here]' 
LIMIT 5;
```

### 3. RLS Testing
Test that policies work correctly with different user roles.

---

## Success Criteria

- [ ] All 4 tables created successfully
- [ ] All indexes created without timeout
- [ ] Vector similarity queries return results < 500ms
- [ ] RLS policies allow public read access
- [ ] Schema passes all validation tests
- [ ] Local migration runs without errors

---

## Common Issues & Solutions

**Issue**: "function vector_cosine_ops does not exist"  
**Solution**: Ensure pgvector extension is enabled in migration

**Issue**: Index creation timeout  
**Solution**: Use CONCURRENTLY and consider smaller lists parameter

**Issue**: Vector dimension mismatch  
**Solution**: OpenAI ada-002 uses 1536 dimensions, not 1024

---

## Next Task Dependencies

This task blocks:
- `01-02-transcript-processor` (needs schema)
- `01-03-vector-search` (needs indexes)
- `02-01-caching-system` (needs question tables)

**Estimated completion**: End of Day 1
**Critical path**: Yes - nothing can proceed without this

---

*Task created by: Senior Developer*  
*Date: Current*  
*Review required: Yes (critical foundation)*