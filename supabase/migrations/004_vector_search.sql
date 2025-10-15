-- Enable pgvector extension for similarity search
-- This migration adds vector search capabilities to the transcript system

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create index for fast vector similarity searches
-- This significantly speeds up embedding similarity queries
CREATE INDEX IF NOT EXISTS idx_video_transcript_chunks_embedding 
ON public.video_transcript_chunks 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Function to search for similar transcript chunks using vector similarity
CREATE OR REPLACE FUNCTION public.search_similar_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  chunk_id uuid,
  video_id uuid,
  youtube_id text,
  video_title text,
  video_creator text,
  chunk_index int,
  start_time decimal,
  end_time decimal,
  chunk_text text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vtc.id as chunk_id,
    vtc.video_id,
    vtc.youtube_id,
    v.title as video_title,
    v.creator as video_creator,
    vtc.chunk_index,
    vtc.start_time,
    vtc.end_time,
    vtc.text as chunk_text,
    (1 - (vtc.embedding <=> query_embedding)) as similarity
  FROM public.video_transcript_chunks vtc
  JOIN public.videos v ON v.id = vtc.video_id
  WHERE vtc.embedding IS NOT NULL
    AND (1 - (vtc.embedding <=> query_embedding)) > match_threshold
  ORDER BY vtc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for hybrid search (combines text search + vector similarity)
CREATE OR REPLACE FUNCTION public.search_transcripts_hybrid(
  search_query text,
  query_embedding vector(1536) DEFAULT NULL,
  match_threshold float DEFAULT 0.6,
  match_count int DEFAULT 10,
  text_weight float DEFAULT 0.3,
  vector_weight float DEFAULT 0.7
)
RETURNS TABLE (
  chunk_id uuid,
  video_id uuid,
  youtube_id text,
  video_title text,
  video_creator text,
  chunk_index int,
  start_time decimal,
  end_time decimal,
  chunk_text text,
  combined_score float,
  text_relevance float,
  vector_similarity float
) AS $$
BEGIN
  -- If no embedding provided, return text-only search
  IF query_embedding IS NULL THEN
    RETURN QUERY
    SELECT
      vtc.id as chunk_id,
      vtc.video_id,
      vtc.youtube_id,
      v.title as video_title,
      v.creator as video_creator,
      vtc.chunk_index,
      vtc.start_time,
      vtc.end_time,
      vtc.text as chunk_text,
      ts_rank(to_tsvector('english', vtc.text), plainto_tsquery('english', search_query)) as combined_score,
      ts_rank(to_tsvector('english', vtc.text), plainto_tsquery('english', search_query)) as text_relevance,
      0.0 as vector_similarity
    FROM public.video_transcript_chunks vtc
    JOIN public.videos v ON v.id = vtc.video_id
    WHERE to_tsvector('english', vtc.text) @@ plainto_tsquery('english', search_query)
    ORDER BY combined_score DESC
    LIMIT match_count;
  ELSE
    -- Hybrid search combining text and vector similarity
    RETURN QUERY
    SELECT
      vtc.id as chunk_id,
      vtc.video_id,
      vtc.youtube_id,
      v.title as video_title,
      v.creator as video_creator,
      vtc.chunk_index,
      vtc.start_time,
      vtc.end_time,
      vtc.text as chunk_text,
      (
        (text_weight * ts_rank(to_tsvector('english', vtc.text), plainto_tsquery('english', search_query))) +
        (vector_weight * (1 - (vtc.embedding <=> query_embedding)))
      ) as combined_score,
      ts_rank(to_tsvector('english', vtc.text), plainto_tsquery('english', search_query)) as text_relevance,
      (1 - (vtc.embedding <=> query_embedding)) as vector_similarity
    FROM public.video_transcript_chunks vtc
    JOIN public.videos v ON v.id = vtc.video_id
    WHERE 
      vtc.embedding IS NOT NULL
      AND (
        to_tsvector('english', vtc.text) @@ plainto_tsquery('english', search_query)
        OR (1 - (vtc.embedding <=> query_embedding)) > match_threshold
      )
    ORDER BY combined_score DESC
    LIMIT match_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find chunks by video and time range (useful for context)
CREATE OR REPLACE FUNCTION public.get_video_chunks_by_timerange(
  p_youtube_id text,
  start_seconds decimal DEFAULT 0,
  end_seconds decimal DEFAULT NULL,
  context_seconds decimal DEFAULT 30
)
RETURNS TABLE (
  chunk_id uuid,
  video_id uuid,
  youtube_id text,
  video_title text,
  chunk_index int,
  start_time decimal,
  end_time decimal,
  chunk_text text,
  is_in_range boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vtc.id as chunk_id,
    vtc.video_id,
    vtc.youtube_id,
    v.title as video_title,
    vtc.chunk_index,
    vtc.start_time,
    vtc.end_time,
    vtc.text as chunk_text,
    CASE 
      WHEN end_seconds IS NULL THEN 
        (vtc.start_time >= (start_seconds - context_seconds) AND vtc.end_time <= (start_seconds + context_seconds))
      ELSE 
        (vtc.start_time >= (start_seconds - context_seconds) AND vtc.end_time <= (end_seconds + context_seconds))
    END as is_in_range
  FROM public.video_transcript_chunks vtc
  JOIN public.videos v ON v.id = vtc.video_id
  WHERE vtc.youtube_id = p_youtube_id
    AND (
      (end_seconds IS NULL AND vtc.start_time >= (start_seconds - context_seconds) AND vtc.end_time <= (start_seconds + context_seconds))
      OR (end_seconds IS NOT NULL AND vtc.start_time >= (start_seconds - context_seconds) AND vtc.end_time <= (end_seconds + context_seconds))
    )
  ORDER BY vtc.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get embedding statistics
CREATE OR REPLACE FUNCTION public.get_embedding_stats()
RETURNS TABLE (
  total_chunks bigint,
  chunks_with_embeddings bigint,
  chunks_without_embeddings bigint,
  completion_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_chunks,
    COUNT(embedding) as chunks_with_embeddings,
    COUNT(*) - COUNT(embedding) as chunks_without_embeddings,
    ROUND(
      (COUNT(embedding)::numeric / COUNT(*)::numeric) * 100, 
      2
    ) as completion_percentage
  FROM public.video_transcript_chunks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find videos with the most embedded content
CREATE OR REPLACE FUNCTION public.get_most_embedded_videos(
  limit_count int DEFAULT 10
)
RETURNS TABLE (
  video_id uuid,
  youtube_id text,
  video_title text,
  video_creator text,
  total_chunks bigint,
  embedded_chunks bigint,
  embedding_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id as video_id,
    v.youtube_id,
    v.title as video_title,
    v.creator as video_creator,
    COUNT(vtc.id) as total_chunks,
    COUNT(vtc.embedding) as embedded_chunks,
    ROUND(
      (COUNT(vtc.embedding)::numeric / COUNT(vtc.id)::numeric) * 100, 
      2
    ) as embedding_percentage
  FROM public.videos v
  JOIN public.video_transcript_chunks vtc ON v.id = vtc.video_id
  GROUP BY v.id, v.youtube_id, v.title, v.creator
  HAVING COUNT(vtc.embedding) > 0
  ORDER BY embedded_chunks DESC, embedding_percentage DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing search function to be more efficient
DROP FUNCTION IF EXISTS public.search_video_transcripts(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION public.search_video_transcripts(
  search_query TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  video_id UUID,
  youtube_id TEXT,
  video_title TEXT,
  chunk_text TEXT,
  start_time DECIMAL,
  end_time DECIMAL,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vtc.video_id,
    vtc.youtube_id,
    v.title as video_title,
    vtc.text as chunk_text,
    vtc.start_time,
    vtc.end_time,
    ts_rank(to_tsvector('english', vtc.text), plainto_tsquery('english', search_query)) as relevance
  FROM public.video_transcript_chunks vtc
  JOIN public.videos v ON v.id = vtc.video_id
  WHERE to_tsvector('english', vtc.text) @@ plainto_tsquery('english', search_query)
  ORDER BY relevance DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a composite index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_video_transcript_chunks_youtube_time 
ON public.video_transcript_chunks (youtube_id, start_time);

-- Create index on text for faster full-text searches
CREATE INDEX IF NOT EXISTS idx_video_transcript_chunks_text_search 
ON public.video_transcript_chunks 
USING gin (to_tsvector('english', text));

-- Add comments for documentation
COMMENT ON FUNCTION public.search_similar_chunks(vector, float, int) IS 'Search transcript chunks using vector similarity';
COMMENT ON FUNCTION public.search_transcripts_hybrid(text, vector, float, int, float, float) IS 'Hybrid search combining text and vector similarity';
COMMENT ON FUNCTION public.get_video_chunks_by_timerange(text, decimal, decimal, decimal) IS 'Get transcript chunks within a time range for a video';
COMMENT ON FUNCTION public.get_embedding_stats() IS 'Get statistics about embedding completion';
COMMENT ON FUNCTION public.get_most_embedded_videos(int) IS 'Get videos with the most embedded transcript chunks';
COMMENT ON INDEX idx_video_transcript_chunks_embedding IS 'Vector similarity search index for fast embedding queries';
COMMENT ON INDEX idx_video_transcript_chunks_text_search IS 'Full-text search index for transcript content';