-- Search Function for Old Schema (transcript_chunks + video_transcripts)
-- This migration creates a search function that works with the existing data structure

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.search_transcript_chunks(vector, float, int);

-- Create search function for the OLD schema
-- Links: transcript_chunks.transcript_id → video_transcripts.id
CREATE OR REPLACE FUNCTION public.search_transcript_chunks(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.3,
  max_results int DEFAULT 10
)
RETURNS TABLE (
  chunk_id uuid,
  video_id text,
  youtube_id text,
  title text,
  creator text,
  chunk_index int,
  start_seconds int,
  end_seconds int,
  start_timestamp text,
  end_timestamp text,
  chunk_text text,
  similarity_score float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.id as chunk_id,
    vt.youtube_id as video_id,  -- Use youtube_id as video_id for compatibility
    vt.youtube_id,
    vt.title,
    vt.creator,
    tc.chunk_index,
    tc.start_seconds,
    tc.end_seconds,
    tc.start_timestamp,
    tc.end_timestamp,
    tc.chunk_text,
    (1 - (tc.embedding <=> query_embedding)) as similarity_score
  FROM public.transcript_chunks tc
  JOIN public.video_transcripts vt ON vt.id = tc.transcript_id
  WHERE tc.embedding IS NOT NULL
    AND (1 - (tc.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY tc.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Skipping ivfflat index due to Supabase memory limits (32 MB)
-- The search function will still work, just without the specialized vector index
-- For 121 chunks, performance will be fine without it
-- If you upgrade to paid tier with more memory, you can run:
-- CREATE INDEX idx_transcript_chunks_embedding ON transcript_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- Add index on transcript_chunks.transcript_id for faster joins
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_transcript_id
ON public.transcript_chunks (transcript_id);

-- Add comments
COMMENT ON FUNCTION public.search_transcript_chunks(vector, float, int)
IS 'Search transcript chunks using vector similarity (works with old schema: transcript_chunks + video_transcripts)';

-- Create helper function to get embedding statistics
CREATE OR REPLACE FUNCTION public.get_transcript_chunk_stats()
RETURNS TABLE (
  total_chunks bigint,
  chunks_with_embeddings bigint,
  chunks_without_embeddings bigint,
  completion_percentage numeric,
  unique_videos bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_chunks,
    COUNT(embedding) as chunks_with_embeddings,
    COUNT(*) - COUNT(embedding) as chunks_without_embeddings,
    ROUND(
      (COUNT(embedding)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100,
      2
    ) as completion_percentage,
    COUNT(DISTINCT transcript_id) as unique_videos
  FROM public.transcript_chunks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_transcript_chunk_stats()
IS 'Get statistics about transcript chunk embeddings';

-- Test the function (optional - remove if causing issues)
DO $$
DECLARE
  test_result RECORD;
BEGIN
  -- Create a zero vector for testing
  SELECT * FROM get_transcript_chunk_stats() INTO test_result;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Search Function Migration Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total chunks: %', test_result.total_chunks;
  RAISE NOTICE 'Chunks with embeddings: %', test_result.chunks_with_embeddings;
  RAISE NOTICE 'Completion: % percent', test_result.completion_percentage;
  RAISE NOTICE 'Unique videos: %', test_result.unique_videos;
  RAISE NOTICE '========================================';
END $$;
