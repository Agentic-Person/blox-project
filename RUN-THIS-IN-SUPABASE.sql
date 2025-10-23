-- ==================================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor
-- Paste this entire script and click "RUN"
-- ==================================================================

-- Add title column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_transcripts' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.video_transcripts ADD COLUMN title TEXT;
    RAISE NOTICE 'Added title column';
  ELSE
    RAISE NOTICE 'Title column already exists';
  END IF;
END $$;

-- Add creator column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_transcripts' AND column_name = 'creator'
  ) THEN
    ALTER TABLE public.video_transcripts ADD COLUMN creator TEXT;
    RAISE NOTICE 'Added creator column';
  ELSE
    RAISE NOTICE 'Creator column already exists';
  END IF;
END $$;

-- Make video_id nullable since we're using youtube_id as primary identifier
DO $$
BEGIN
  ALTER TABLE public.video_transcripts ALTER COLUMN video_id DROP NOT NULL;
  RAISE NOTICE 'Made video_id nullable';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'video_id is already nullable or column does not exist';
END $$;

-- Create index on youtube_id for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_video_transcripts_youtube_id_only
ON public.video_transcripts (youtube_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Schema update complete! You can now run the video processing script.';
END $$;
