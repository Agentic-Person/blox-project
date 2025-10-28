-- =================================================================
-- BLOX WIZARD VIDEO SEARCH DIAGNOSTICS
-- Run this in Supabase SQL Editor to diagnose why search returns 0 results
-- https://supabase.com/dashboard/project/jpkwtpvwimhclncdswdk/sql/new
-- =================================================================

-- =================================================================
-- PART 1: CHECK WHAT TABLES EXIST
-- =================================================================

SELECT 'PART 1: TABLES' as section;

-- Check for old schema table
SELECT
    'transcript_chunks' as table_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transcript_chunks' AND table_schema = 'public')
        THEN '✅ EXISTS'
        ELSE '❌ DOES NOT EXIST'
    END as status;

-- Check for new schema table
SELECT
    'video_transcript_chunks' as table_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'video_transcript_chunks' AND table_schema = 'public')
        THEN '✅ EXISTS'
        ELSE '❌ DOES NOT EXIST'
    END as status;

-- Check for videos table
SELECT
    'videos' as table_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'videos' AND table_schema = 'public')
        THEN '✅ EXISTS'
        ELSE '❌ DOES NOT EXIST'
    END as status;

-- Check for video_transcripts table
SELECT
    'video_transcripts' as table_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'video_transcripts' AND table_schema = 'public')
        THEN '✅ EXISTS'
        ELSE '❌ DOES NOT EXIST'
    END as status;

-- =================================================================
-- PART 2: CHECK WHAT FUNCTIONS EXIST
-- =================================================================

SELECT 'PART 2: SEARCH FUNCTIONS' as section;

SELECT
    routine_name as function_name,
    '✅ EXISTS' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%search%'
ORDER BY routine_name;

-- If no search functions found
SELECT
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.routines
            WHERE routine_schema = 'public' AND routine_name LIKE '%search%'
        )
        THEN '❌ NO SEARCH FUNCTIONS FOUND - Need to deploy migrations!'
        ELSE '✅ Search functions exist'
    END as search_functions_status;

-- =================================================================
-- PART 3: CHECK DATA IN OLD SCHEMA (if exists)
-- =================================================================

SELECT 'PART 3: DATA IN OLD SCHEMA (transcript_chunks)' as section;

-- Count total chunks in old schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transcript_chunks') THEN
        RAISE NOTICE 'Checking transcript_chunks table...';
    END IF;
END $$;

-- Try to count records (will fail if table doesn't exist)
SELECT
    COUNT(*) as total_chunks,
    COUNT(embedding) as chunks_with_embeddings,
    COUNT(*) - COUNT(embedding) as chunks_without_embeddings
FROM transcript_chunks;

-- Show sample data
SELECT
    id,
    chunk_index,
    LEFT(chunk_text, 80) as text_preview,
    CASE WHEN embedding IS NOT NULL THEN 'YES' ELSE 'NO' END as has_embedding
FROM transcript_chunks
LIMIT 5;

-- =================================================================
-- PART 4: CHECK DATA IN NEW SCHEMA (if exists)
-- =================================================================

SELECT 'PART 4: DATA IN NEW SCHEMA (video_transcript_chunks)' as section;

-- Try to count records in new schema
SELECT
    COUNT(*) as total_chunks,
    COUNT(embedding) as chunks_with_embeddings,
    COUNT(*) - COUNT(embedding) as chunks_without_embeddings
FROM video_transcript_chunks;

-- Show sample data
SELECT
    id,
    chunk_index,
    LEFT(text, 80) as text_preview,
    CASE WHEN embedding IS NOT NULL THEN 'YES' ELSE 'NO' END as has_embedding
FROM video_transcript_chunks
LIMIT 5;

-- =================================================================
-- PART 5: CHECK VIDEOS TABLE
-- =================================================================

SELECT 'PART 5: VIDEOS TABLE' as section;

-- Count videos
SELECT
    COUNT(*) as total_videos,
    COUNT(CASE WHEN module_id = 'module-1' THEN 1 END) as module_1_videos
FROM videos;

-- Show Module 1 videos (especially Week 1 Day 2)
SELECT
    youtube_id,
    title,
    creator,
    module_id,
    week_id,
    day_id,
    order_index
FROM videos
WHERE module_id = 'module-1'
ORDER BY order_index
LIMIT 10;

-- Check for "Beginner Guide to Roblox Scripting"
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM videos
            WHERE title ILIKE '%Beginner Guide to Roblox Scripting%'
        )
        THEN '✅ FOUND: Beginner Guide to Roblox Scripting'
        WHEN EXISTS (
            SELECT 1 FROM videos
            WHERE title ILIKE '%Roblox%' AND title ILIKE '%Scripting%'
        )
        THEN '⚠️ FOUND similar: ' || (
            SELECT title FROM videos
            WHERE title ILIKE '%Roblox%' AND title ILIKE '%Scripting%'
            LIMIT 1
        )
        ELSE '❌ NOT FOUND: Beginner Guide to Roblox Scripting'
    END as video_check;

-- =================================================================
-- PART 6: TEST SEARCH FUNCTION (if exists)
-- =================================================================

SELECT 'PART 6: TEST SEARCH FUNCTION' as section;

-- Try calling search_transcript_chunks if it exists
-- This will generate an error if the function doesn't exist
-- Comment out this section if you get errors

DO $$
DECLARE
    test_embedding vector(1536);
BEGIN
    -- Create a dummy embedding (all zeros)
    test_embedding := ARRAY(SELECT 0 FROM generate_series(1, 1536))::vector(1536);

    -- Try to call the function
    RAISE NOTICE 'Testing search_transcript_chunks function...';

    -- This is just a test - we expect 0 results with a zero vector
    PERFORM * FROM search_transcript_chunks(
        test_embedding,
        0.3,  -- low threshold
        5     -- max 5 results
    );

    RAISE NOTICE '✅ search_transcript_chunks function exists and executes!';
EXCEPTION
    WHEN undefined_function THEN
        RAISE NOTICE '❌ search_transcript_chunks function DOES NOT EXIST';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Function exists but error: %', SQLERRM;
END $$;

-- =================================================================
-- SUMMARY AND RECOMMENDATIONS
-- =================================================================

SELECT 'SUMMARY' as section;

SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transcript_chunks')
            AND (SELECT COUNT(*) FROM transcript_chunks) > 0
        THEN '✅ OLD SCHEMA: transcript_chunks table has data'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'video_transcript_chunks')
            AND (SELECT COUNT(*) FROM video_transcript_chunks) > 0
        THEN '✅ NEW SCHEMA: video_transcript_chunks table has data'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name IN ('transcript_chunks', 'video_transcript_chunks'))
        THEN '⚠️ TABLES EXIST BUT ARE EMPTY - Need to import data'
        ELSE '❌ NO TABLES EXIST - Need to deploy migrations'
    END as overall_status;

-- Recommendation
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transcript_chunks')
            AND (SELECT COUNT(embedding) FROM transcript_chunks WHERE embedding IS NOT NULL) > 0
        THEN '💡 RECOMMENDATION: Old schema has embeddings. Debug search function.'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transcript_chunks')
            AND (SELECT COUNT(*) FROM transcript_chunks) > 0
        THEN '💡 RECOMMENDATION: Old schema has data but NO embeddings. Need to regenerate embeddings.'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'videos')
            AND (SELECT COUNT(*) FROM videos) > 0
        THEN '💡 RECOMMENDATION: Videos exist but no transcripts. Run transcript extraction.'
        ELSE '💡 RECOMMENDATION: Deploy migrations and import data.'
    END as recommendation;
