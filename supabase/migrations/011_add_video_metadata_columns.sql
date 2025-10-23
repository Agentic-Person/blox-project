-- Add missing metadata columns to video_transcripts table
-- These columns are needed for video search results

-- Add title column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_transcripts' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.video_transcripts ADD COLUMN title TEXT;
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
  END IF;
END $$;

-- Add duration column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_transcripts' AND column_name = 'duration'
  ) THEN
    ALTER TABLE public.video_transcripts ADD COLUMN duration TEXT;
  END IF;
END $$;

-- Make video_id nullable since we're using youtube_id as primary identifier
DO $$
BEGIN
  ALTER TABLE public.video_transcripts ALTER COLUMN video_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;  -- Ignore if already nullable or doesn't exist
END $$;

-- Create index on youtube_id for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_video_transcripts_youtube_id_only
ON public.video_transcripts (youtube_id);

COMMENT ON COLUMN public.video_transcripts.title
IS 'Video title from YouTube';

COMMENT ON COLUMN public.video_transcripts.creator
IS 'Video creator/channel name';

COMMENT ON COLUMN public.video_transcripts.duration
IS 'Video duration in MM:SS or HH:MM:SS format';
