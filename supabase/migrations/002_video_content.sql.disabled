-- Create video content and transcript tables
-- Based on TypeScript types from src/types/migrations.ts

-- Create videos table for storing YouTube video metadata
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  creator TEXT,
  description TEXT,
  duration TEXT, -- ISO 8601 format (PT15M33S)
  total_minutes INTEGER,
  thumbnail_url TEXT,
  xp_reward INTEGER DEFAULT 25,
  module_id TEXT,
  week_id TEXT,
  day_id TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for videos
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON public.videos (youtube_id);
CREATE INDEX IF NOT EXISTS idx_videos_module_week ON public.videos (module_id, week_id);
CREATE INDEX IF NOT EXISTS idx_videos_order ON public.videos (order_index);

-- Create video_transcripts table for storing full transcript data
CREATE TABLE IF NOT EXISTS public.video_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  full_transcript JSONB, -- Store array of transcript segments
  segment_count INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  

  -- Constraints
  UNIQUE (video_id, youtube_id)
);

-- Create indexes for video_transcripts
CREATE INDEX IF NOT EXISTS idx_video_transcripts_video_id ON public.video_transcripts (video_id);
CREATE INDEX IF NOT EXISTS idx_video_transcripts_youtube_id ON public.video_transcripts (youtube_id);

-- Create video_transcript_chunks for searchable text segments
CREATE TABLE IF NOT EXISTS public.video_transcript_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  transcript_id UUID REFERENCES public.video_transcripts(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  start_time DECIMAL(10, 3) NOT NULL, -- seconds with millisecond precision
  end_time DECIMAL(10, 3) NOT NULL,
  text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embeddings dimension
  todo_suggestions TEXT[],
  learning_objectives TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  

  -- Constraints
  UNIQUE (transcript_id, chunk_index)
);

-- Create indexes for video_transcript_chunks
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_video_id ON public.video_transcript_chunks (video_id);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_youtube_id ON public.video_transcript_chunks (youtube_id);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_time ON public.video_transcript_chunks (start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_text ON public.video_transcript_chunks (text);

-- Create video_progress for tracking user watch progress
CREATE TABLE IF NOT EXISTS public.video_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  watch_progress DECIMAL(5, 2) DEFAULT 0.0 CHECK (watch_progress >= 0 AND watch_progress <= 100), -- 0-100%
  last_position DECIMAL(10, 3) DEFAULT 0.0, -- seconds with millisecond precision
  total_duration DECIMAL(10, 3), -- seconds
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  

  -- Constraints
  UNIQUE (user_id, video_id)
);

-- Create indexes for video_progress
CREATE INDEX IF NOT EXISTS idx_video_progress_user_id ON public.video_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_video_id ON public.video_progress (video_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_completed ON public.video_progress (completed);

-- Enable Row Level Security
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_transcript_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for videos (public read)
CREATE POLICY "Videos are viewable by everyone"
  ON public.videos
  FOR SELECT
  USING (true);

-- RLS Policies for video_transcripts (public read)
CREATE POLICY "Video transcripts are viewable by everyone"
  ON public.video_transcripts
  FOR SELECT
  USING (true);

-- RLS Policies for video_transcript_chunks (public read)
CREATE POLICY "Video transcript chunks are viewable by everyone"
  ON public.video_transcript_chunks
  FOR SELECT
  USING (true);

-- RLS Policies for video_progress (user-specific)
CREATE POLICY "Users can view own video progress"
  ON public.video_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video progress"
  ON public.video_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video progress"
  ON public.video_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to automatically update video progress completion
CREATE OR REPLACE FUNCTION public.update_video_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark as completed if watch progress >= 90%
  IF NEW.watch_progress >= 90.0 AND OLD.completed = FALSE THEN
    NEW.completed = TRUE;
    NEW.completed_at = NOW();
  ELSIF NEW.watch_progress < 90.0 AND OLD.completed = TRUE THEN
    NEW.completed = FALSE;
    NEW.completed_at = NULL;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update completion status
CREATE TRIGGER on_video_progress_updated
  BEFORE UPDATE ON public.video_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_video_completion();

-- Function to search transcripts by text
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

-- Add comments for documentation
COMMENT ON TABLE public.videos IS 'YouTube video metadata and curriculum information';
COMMENT ON TABLE public.video_transcripts IS 'Full transcript data for videos';
COMMENT ON TABLE public.video_transcript_chunks IS 'Searchable transcript segments with embeddings';
COMMENT ON TABLE public.video_progress IS 'User video watch progress and completion tracking';
COMMENT ON FUNCTION public.update_video_completion() IS 'Automatically marks videos as completed when watch progress >= 90%';
COMMENT ON FUNCTION public.search_video_transcripts(TEXT, INTEGER) IS 'Full-text search across video transcript chunks';