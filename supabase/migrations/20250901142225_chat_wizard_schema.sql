-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Video transcripts table - stores YouTube video metadata and full transcripts
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

-- Transcript chunks table - stores text chunks with embeddings for vector search
CREATE TABLE transcript_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcript_id UUID REFERENCES video_transcripts(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    start_timestamp TEXT NOT NULL, -- "15:30" format
    end_timestamp TEXT NOT NULL,   -- "16:15" format  
    start_seconds INTEGER NOT NULL, -- For sorting/filtering
    end_seconds INTEGER NOT NULL,
    embedding VECTOR(1536), -- OpenAI ada-002 dimensions
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Common questions table - caches frequently asked questions for cost optimization
CREATE TABLE common_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_pattern TEXT NOT NULL,
    question_embedding VECTOR(1536),
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(question_pattern)
);

-- Question answers table - stores cached AI responses to common questions
CREATE TABLE question_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES common_questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    video_references JSONB NOT NULL, -- Array of video refs with timestamps
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- For cache expiration
);

-- Indexes for performance optimization

-- Vector similarity search (MOST IMPORTANT for performance)
CREATE INDEX CONCURRENTLY transcript_chunks_embedding_idx 
ON transcript_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Text search fallback
CREATE INDEX transcript_chunks_text_idx ON transcript_chunks 
USING GIN (to_tsvector('english', chunk_text));

-- Transcript lookup for UI
CREATE INDEX transcript_chunks_transcript_id_idx ON transcript_chunks(transcript_id, chunk_index);

-- Question caching optimization
CREATE INDEX common_questions_usage_idx ON common_questions(usage_count DESC, last_used DESC);
CREATE INDEX common_questions_embedding_idx ON common_questions 
USING ivfflat (question_embedding vector_cosine_ops)
WITH (lists = 10);

-- YouTube video lookup
CREATE INDEX video_transcripts_youtube_id_idx ON video_transcripts(youtube_id);

-- Composite index for filtering + sorting
CREATE INDEX transcript_chunks_composite_idx 
ON transcript_chunks (transcript_id, chunk_index) 
INCLUDE (start_timestamp, end_timestamp);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE video_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;

-- Public read access for educational content (anyone can search and learn)
CREATE POLICY "Public read access" ON video_transcripts FOR SELECT USING (true);
CREATE POLICY "Public read access" ON transcript_chunks FOR SELECT USING (true);
CREATE POLICY "Public read access" ON common_questions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON question_answers FOR SELECT USING (true);

-- Service role full access for API operations
CREATE POLICY "Service role full access" ON video_transcripts FOR ALL 
USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON transcript_chunks FOR ALL 
USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON common_questions FOR ALL 
USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON question_answers FOR ALL 
USING (auth.role() = 'service_role');

-- Database functions for optimized vector search

-- Core search function for transcript chunks
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

-- Multi-video ranking function for diverse results
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