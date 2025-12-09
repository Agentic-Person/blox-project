-- ============================================================
-- CONSOLIDATED MIGRATION: Missing Tables for Blox Buddy MVP
-- ============================================================
-- Run this ONCE in Supabase SQL Editor
-- This creates ONLY the tables that are missing from your database
--
-- Tables created:
--   - videos (video metadata)
--   - video_transcripts (full transcripts)
--   - video_transcript_chunks (searchable segments with embeddings)
--   - video_progress (user watch progress)
--   - chat_conversations (Blox Wizard chat sessions)
--   - chat_messages (chat message history)
--   - user_profiles (simple JSON profile storage)
--   - user_ai_usage (AI rate limiting)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- PART 1: VIDEO CONTENT SYSTEM (from 002_video_content.sql)
-- ============================================================

-- Create videos table for storing YouTube video metadata
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  creator TEXT,
  description TEXT,
  duration TEXT,
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
  full_transcript JSONB,
  segment_count INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
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
  start_time DECIMAL(10, 3) NOT NULL,
  end_time DECIMAL(10, 3) NOT NULL,
  text TEXT NOT NULL,
  embedding vector(1536),
  todo_suggestions TEXT[],
  learning_objectives TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
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
  watch_progress DECIMAL(5, 2) DEFAULT 0.0 CHECK (watch_progress >= 0 AND watch_progress <= 100),
  last_position DECIMAL(10, 3) DEFAULT 0.0,
  total_duration DECIMAL(10, 3),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, video_id)
);

-- Create indexes for video_progress
CREATE INDEX IF NOT EXISTS idx_video_progress_user_id ON public.video_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_video_id ON public.video_progress (video_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_completed ON public.video_progress (completed);

-- Enable Row Level Security for video tables
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_transcript_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for videos (public read)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'videos' AND policyname = 'Videos are viewable by everyone') THEN
    CREATE POLICY "Videos are viewable by everyone" ON public.videos FOR SELECT USING (true);
  END IF;
END $$;

-- RLS Policies for video_transcripts (public read)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'video_transcripts' AND policyname = 'Video transcripts are viewable by everyone') THEN
    CREATE POLICY "Video transcripts are viewable by everyone" ON public.video_transcripts FOR SELECT USING (true);
  END IF;
END $$;

-- RLS Policies for video_transcript_chunks (public read)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'video_transcript_chunks' AND policyname = 'Video transcript chunks are viewable by everyone') THEN
    CREATE POLICY "Video transcript chunks are viewable by everyone" ON public.video_transcript_chunks FOR SELECT USING (true);
  END IF;
END $$;

-- RLS Policies for video_progress (user-specific)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'video_progress' AND policyname = 'Users can view own video progress') THEN
    CREATE POLICY "Users can view own video progress" ON public.video_progress FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'video_progress' AND policyname = 'Users can insert own video progress') THEN
    CREATE POLICY "Users can insert own video progress" ON public.video_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'video_progress' AND policyname = 'Users can update own video progress') THEN
    CREATE POLICY "Users can update own video progress" ON public.video_progress FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Function to automatically update video progress completion
CREATE OR REPLACE FUNCTION public.update_video_completion()
RETURNS TRIGGER AS $$
BEGIN
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
DROP TRIGGER IF EXISTS on_video_progress_updated ON public.video_progress;
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

-- ============================================================
-- PART 2: VECTOR SEARCH (from 004_vector_search.sql)
-- ============================================================

-- Create index for fast vector similarity searches
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

-- Create composite index for better performance
CREATE INDEX IF NOT EXISTS idx_video_transcript_chunks_youtube_time
ON public.video_transcript_chunks (youtube_id, start_time);

-- Create index on text for faster full-text searches
CREATE INDEX IF NOT EXISTS idx_video_transcript_chunks_text_search
ON public.video_transcript_chunks
USING gin (to_tsvector('english', text));

-- ============================================================
-- PART 3: CHAT PERSISTENCE (from 007_chat_persistence.sql)
-- ============================================================

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  title TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_session_id CHECK (length(session_id) > 0)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  video_context JSONB,
  video_references JSONB,
  suggested_questions JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('user', 'assistant', 'system')),
  CONSTRAINT valid_content CHECK (length(content) > 0)
);

-- Create indexes for chat tables
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_session_id ON public.chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message ON public.chat_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON public.chat_messages(role);

-- Enable Row Level Security for chat tables
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_conversations' AND policyname = 'Users can view own conversations') THEN
    CREATE POLICY "Users can view own conversations" ON public.chat_conversations FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_conversations' AND policyname = 'Users can insert own conversations') THEN
    CREATE POLICY "Users can insert own conversations" ON public.chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_conversations' AND policyname = 'Users can update own conversations') THEN
    CREATE POLICY "Users can update own conversations" ON public.chat_conversations FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_conversations' AND policyname = 'Users can delete own conversations') THEN
    CREATE POLICY "Users can delete own conversations" ON public.chat_conversations FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS Policies for chat_messages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'Users can view own messages') THEN
    CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = conversation_id AND user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'Users can insert own messages') THEN
    CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = conversation_id AND user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'Users can update own messages') THEN
    CREATE POLICY "Users can update own messages" ON public.chat_messages FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = conversation_id AND user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'Users can delete own messages') THEN
    CREATE POLICY "Users can delete own messages" ON public.chat_messages FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = conversation_id AND user_id = auth.uid())
    );
  END IF;
END $$;

-- Function to update last_message_at timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update last_message_at
DROP TRIGGER IF EXISTS on_message_created ON public.chat_messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();

-- Function to auto-generate conversation title from first message
CREATE OR REPLACE FUNCTION public.generate_conversation_title()
RETURNS TRIGGER AS $$
DECLARE
  first_user_message TEXT;
BEGIN
  IF NEW.role = 'user' THEN
    SELECT title INTO first_user_message
    FROM public.chat_conversations
    WHERE id = NEW.conversation_id;

    IF first_user_message IS NULL THEN
      UPDATE public.chat_conversations
      SET title = SUBSTRING(NEW.content, 1, 50) || CASE
        WHEN LENGTH(NEW.content) > 50 THEN '...'
        ELSE ''
      END
      WHERE id = NEW.conversation_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate title
DROP TRIGGER IF EXISTS on_first_user_message ON public.chat_messages;
CREATE TRIGGER on_first_user_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_conversation_title();

-- Function to get conversation with recent messages
CREATE OR REPLACE FUNCTION public.get_conversation_with_messages(
  p_session_id TEXT,
  p_user_id UUID,
  message_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  conversation_id UUID,
  session_id TEXT,
  conversation_title TEXT,
  last_message_at TIMESTAMPTZ,
  message_id UUID,
  message_role TEXT,
  message_content TEXT,
  message_video_context JSONB,
  message_video_references JSONB,
  message_suggested_questions JSONB,
  message_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as conversation_id,
    c.session_id,
    c.title as conversation_title,
    c.last_message_at,
    m.id as message_id,
    m.role as message_role,
    m.content as message_content,
    m.video_context as message_video_context,
    m.video_references as message_video_references,
    m.suggested_questions as message_suggested_questions,
    m.created_at as message_created_at
  FROM public.chat_conversations c
  LEFT JOIN public.chat_messages m ON m.conversation_id = c.id
  WHERE c.session_id = p_session_id
    AND c.user_id = p_user_id
  ORDER BY m.created_at ASC
  LIMIT message_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's recent conversations
CREATE OR REPLACE FUNCTION public.get_user_conversations(
  p_user_id UUID,
  conversation_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  conversation_id UUID,
  session_id TEXT,
  title TEXT,
  last_message_at TIMESTAMPTZ,
  message_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as conversation_id,
    c.session_id,
    c.title,
    c.last_message_at,
    COUNT(m.id) as message_count
  FROM public.chat_conversations c
  LEFT JOIN public.chat_messages m ON m.conversation_id = c.id
  WHERE c.user_id = p_user_id
  GROUP BY c.id, c.session_id, c.title, c.last_message_at
  ORDER BY c.last_message_at DESC
  LIMIT conversation_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PART 4: USER PROFILES (from 008_user_profiles.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GIN index for querying inside JSON
CREATE INDEX IF NOT EXISTS idx_user_profiles_data ON public.user_profiles USING GIN (data);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Select own profile') THEN
    CREATE POLICY "Select own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Insert own profile') THEN
    CREATE POLICY "Insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Update own profile') THEN
    CREATE POLICY "Update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- PART 5: AI USAGE TRACKING (from 012_ai_usage_tracking.sql)
-- ============================================================

-- Create table to track daily AI usage per user
CREATE TABLE IF NOT EXISTS public.user_ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  question_count INTEGER NOT NULL DEFAULT 0,
  last_question_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_user_date ON public.user_ai_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_date ON public.user_ai_usage(date);

-- Enable Row Level Security
ALTER TABLE public.user_ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_ai_usage
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_ai_usage' AND policyname = 'Users can view own usage') THEN
    CREATE POLICY "Users can view own usage" ON public.user_ai_usage FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_ai_usage' AND policyname = 'Users can insert own usage') THEN
    CREATE POLICY "Users can insert own usage" ON public.user_ai_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_ai_usage' AND policyname = 'Users can update own usage') THEN
    CREATE POLICY "Users can update own usage" ON public.user_ai_usage FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Function to get user's daily usage and check limits
CREATE OR REPLACE FUNCTION public.get_user_ai_usage(p_user_id UUID)
RETURNS TABLE (
  question_count INTEGER,
  daily_limit INTEGER,
  remaining_questions INTEGER,
  is_premium BOOLEAN,
  date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_premium BOOLEAN := FALSE;
  v_question_count INTEGER := 0;
  v_daily_limit INTEGER := 3;
BEGIN
  -- Check if user is premium
  SELECT COALESCE((data->>'isPremium')::BOOLEAN, FALSE)
  INTO v_is_premium
  FROM public.user_profiles
  WHERE user_id = p_user_id;

  -- Set limit based on premium status
  IF v_is_premium THEN
    v_daily_limit := 10;
  ELSE
    v_daily_limit := 3;
  END IF;

  -- Get today's usage
  SELECT COALESCE(uau.question_count, 0)
  INTO v_question_count
  FROM public.user_ai_usage uau
  WHERE uau.user_id = p_user_id
  AND uau.date = CURRENT_DATE;

  -- Return usage info
  RETURN QUERY SELECT
    v_question_count,
    v_daily_limit,
    GREATEST(v_daily_limit - v_question_count, 0),
    v_is_premium,
    CURRENT_DATE;
END;
$$;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  new_count INTEGER,
  remaining INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage_info RECORD;
  v_new_count INTEGER;
BEGIN
  -- Get current usage and limits
  SELECT * INTO v_usage_info
  FROM public.get_user_ai_usage(p_user_id);

  -- Check if user has exceeded limit
  IF v_usage_info.remaining_questions <= 0 THEN
    RETURN QUERY SELECT
      FALSE,
      v_usage_info.question_count,
      0,
      CASE
        WHEN v_usage_info.is_premium THEN 'Daily limit reached (10/10). Try again tomorrow!'
        ELSE 'Daily limit reached (3/3). Upgrade to Premium for more questions!'
      END;
    RETURN;
  END IF;

  -- Insert or update usage record
  INSERT INTO public.user_ai_usage (user_id, date, question_count, last_question_at)
  VALUES (p_user_id, CURRENT_DATE, 1, NOW())
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    question_count = user_ai_usage.question_count + 1,
    last_question_at = NOW(),
    updated_at = NOW()
  RETURNING user_ai_usage.question_count INTO v_new_count;

  -- Return success with updated counts
  RETURN QUERY SELECT
    TRUE,
    v_new_count,
    GREATEST(v_usage_info.daily_limit - v_new_count, 0),
    'Question recorded successfully'::TEXT;
END;
$$;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_ai_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_ai_usage_updated_at ON public.user_ai_usage;
CREATE TRIGGER trg_user_ai_usage_updated_at
BEFORE UPDATE ON public.user_ai_usage
FOR EACH ROW EXECUTE FUNCTION public.update_ai_usage_timestamp();

-- Cleanup function for old usage records
CREATE OR REPLACE FUNCTION public.cleanup_old_ai_usage()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_ai_usage
  WHERE date < CURRENT_DATE - INTERVAL '90 days';
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- ============================================================
-- TABLE COMMENTS
-- ============================================================
COMMENT ON TABLE public.videos IS 'YouTube video metadata and curriculum information';
COMMENT ON TABLE public.video_transcripts IS 'Full transcript data for videos';
COMMENT ON TABLE public.video_transcript_chunks IS 'Searchable transcript segments with embeddings';
COMMENT ON TABLE public.video_progress IS 'User video watch progress and completion tracking';
COMMENT ON TABLE public.chat_conversations IS 'Stores chat conversation sessions for Blox Wizard';
COMMENT ON TABLE public.chat_messages IS 'Stores individual chat messages within conversations';
COMMENT ON TABLE public.user_profiles IS 'Simple JSON profile storage keyed by user_id';
COMMENT ON TABLE public.user_ai_usage IS 'Tracks daily AI question usage per user for rate limiting';

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ All missing tables created successfully!';
  RAISE NOTICE 'Tables: videos, video_transcripts, video_transcript_chunks, video_progress';
  RAISE NOTICE 'Tables: chat_conversations, chat_messages';
  RAISE NOTICE 'Tables: user_profiles, user_ai_usage';
  RAISE NOTICE 'All RLS policies and functions have been set up.';
END $$;
