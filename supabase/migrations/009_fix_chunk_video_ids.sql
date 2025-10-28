-- Fix transcript_chunks.video_id NULL values
-- The chunks have transcript_id but video_id is NULL
-- This migration populates video_id from the linked transcript

-- First, let's see what we're working with
DO $$
BEGIN
  RAISE NOTICE 'Checking transcript_chunks before fix...';
END $$;

-- Update video_id by joining with video_transcripts
UPDATE transcript_chunks tc
SET video_id = vt.youtube_id
FROM video_transcripts vt
WHERE tc.transcript_id = vt.id
  AND tc.video_id IS NULL;

-- Verify the fix
DO $$
DECLARE
  total_chunks INTEGER;
  chunks_with_video_id INTEGER;
  chunks_null_video_id INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_chunks FROM transcript_chunks;
  SELECT COUNT(*) INTO chunks_with_video_id FROM transcript_chunks WHERE video_id IS NOT NULL;
  SELECT COUNT(*) INTO chunks_null_video_id FROM transcript_chunks WHERE video_id IS NULL;

  RAISE NOTICE 'Fix complete!';
  RAISE NOTICE 'Total chunks: %', total_chunks;
  RAISE NOTICE 'Chunks with video_id: %', chunks_with_video_id;
  RAISE NOTICE 'Chunks still NULL: %', chunks_null_video_id;
END $$;
