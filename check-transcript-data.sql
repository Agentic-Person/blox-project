-- Run these queries in Supabase SQL Editor to check transcript data status
-- https://supabase.com/dashboard/project/jpkwtpvwimhclncdswdk/sql/new

-- 1. Check total transcript chunks
SELECT COUNT(*) as total_chunks FROM transcript_chunks;

-- 2. Check how many chunks have embeddings (vectorized)
SELECT COUNT(*) as chunks_with_embeddings
FROM transcript_chunks
WHERE embedding IS NOT NULL;

-- 3. Check what search functions actually exist in the database
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%search%'
ORDER BY routine_name;

-- 4. Sample some transcript data to verify structure
SELECT id, video_id, chunk_index, start_time, end_time,
       LEFT(text, 100) as text_preview,
       CASE WHEN embedding IS NOT NULL THEN 'YES' ELSE 'NO' END as has_embedding
FROM transcript_chunks
LIMIT 5;
