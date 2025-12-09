-- AI Usage Tracking System
-- Tracks daily AI question usage per user for rate limiting
-- Free users: 3 questions/day | Premium users: 10 questions/day

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table to track daily AI usage per user
CREATE TABLE IF NOT EXISTS public.user_ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  question_count INTEGER NOT NULL DEFAULT 0,
  last_question_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one record per user per day
  UNIQUE(user_id, date)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_user_date ON public.user_ai_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_date ON public.user_ai_usage(date);

-- Enable Row Level Security
ALTER TABLE public.user_ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view and manage their own usage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_ai_usage'
    AND policyname = 'Users can view own usage'
  ) THEN
    CREATE POLICY "Users can view own usage"
    ON public.user_ai_usage
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_ai_usage'
    AND policyname = 'Users can insert own usage'
  ) THEN
    CREATE POLICY "Users can insert own usage"
    ON public.user_ai_usage
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_ai_usage'
    AND policyname = 'Users can update own usage'
  ) THEN
    CREATE POLICY "Users can update own usage"
    ON public.user_ai_usage
    FOR UPDATE
    USING (auth.uid() = user_id);
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
  v_daily_limit INTEGER := 3; -- Default for free users
BEGIN
  -- Check if user is premium (has data.isPremium flag in user_profiles)
  SELECT COALESCE((data->>'isPremium')::BOOLEAN, FALSE)
  INTO v_is_premium
  FROM public.user_profiles
  WHERE user_id = p_user_id;

  -- Set limit based on premium status
  IF v_is_premium THEN
    v_daily_limit := 10; -- Premium users get 10 questions
  ELSE
    v_daily_limit := 3;  -- Free users get 3 questions
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

-- Add helpful comments
COMMENT ON TABLE public.user_ai_usage IS 'Tracks daily AI question usage per user for rate limiting';
COMMENT ON COLUMN public.user_ai_usage.question_count IS 'Number of AI questions asked today';
COMMENT ON COLUMN public.user_ai_usage.date IS 'Date of usage (resets daily)';
COMMENT ON FUNCTION public.get_user_ai_usage(UUID) IS 'Returns user daily usage, limits, and premium status';
COMMENT ON FUNCTION public.increment_ai_usage(UUID) IS 'Increments usage count and enforces rate limits';

-- Create cleanup function to remove old usage records (optional, run weekly)
CREATE OR REPLACE FUNCTION public.cleanup_old_ai_usage()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete records older than 90 days
  DELETE FROM public.user_ai_usage
  WHERE date < CURRENT_DATE - INTERVAL '90 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_ai_usage() IS 'Removes AI usage records older than 90 days';
