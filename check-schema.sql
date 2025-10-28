-- Check the actual schema of transcript_chunks table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'transcript_chunks'
ORDER BY ordinal_position;

-- Check what parameters search_transcript_chunks expects
SELECT
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS parameters,
    pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'search_transcript_chunks';
