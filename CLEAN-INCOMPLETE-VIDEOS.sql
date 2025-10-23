-- ==================================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- This removes incomplete video records (videos without chunks)
-- ==================================================================

-- Delete video_transcripts that have no associated chunks
DELETE FROM public.video_transcripts
WHERE id NOT IN (
  SELECT DISTINCT transcript_id
  FROM public.transcript_chunks
  WHERE transcript_id IS NOT NULL
);

-- Success message
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Cleaned up % incomplete video records', deleted_count;
END $$;
