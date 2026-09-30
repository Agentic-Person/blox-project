-- ====================================================================
-- BLOX-BUDDY SCHEMA REBUILD (self-hosted Supabase, schema-per-project)
-- Generated 2026-09-30 by Spock. Schema: bloxbuddy
-- Source: Agentic-Person/blox-project supabase/migrations (public remapped)
-- SKIPPED (stale/redundant — do NOT run on fresh rebuild):
--   003_learning_paths.sql.disabled, 005_admin_system.sql.disabled
--   009_fix_chunk_video_ids.sql        (data backfill; wrong table name)
--   010_search_function_for_old_schema.sql (superseded by 004)
--   CONSOLIDATED_MISSING_TABLES.sql    (fully redundant w/ numbered migrations)
--   cleanup-mock-chat-data.sql         (data cleanup; no data)
-- ====================================================================
BEGIN;
CREATE SCHEMA IF NOT EXISTS bloxbuddy;
GRANT USAGE ON SCHEMA bloxbuddy TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA bloxbuddy GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA bloxbuddy GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA bloxbuddy GRANT ALL ON FUNCTIONS TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA bloxbuddy GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;
SET search_path = bloxbuddy, public, extensions;

-- ============================================================
-- MIGRATION: 001_custodial_wallets.sql
-- ============================================================
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_wallets table for managing custodial and external wallets
CREATE TABLE IF NOT EXISTS bloxbuddy.user_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL UNIQUE,
  encrypted_private_key TEXT, -- Only for custodial wallets, NULL for external
  wallet_type TEXT CHECK (wallet_type IN ('custodial', 'external')) DEFAULT 'custodial',
  is_primary BOOLEAN DEFAULT true,
  balance DECIMAL(20, 9) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  migrated_at TIMESTAMPTZ, -- When user exported to self-custody

  -- Constraints
  CONSTRAINT unique_primary_wallet_per_user UNIQUE (user_id, is_primary)
);

-- Create indexes for user_wallets
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON bloxbuddy.user_wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_public_key ON bloxbuddy.user_wallets (public_key);

-- Create wallet_transactions table for tracking all token movements
CREATE TABLE IF NOT EXISTS bloxbuddy.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES bloxbuddy.user_wallets(id) ON DELETE CASCADE,
  from_wallet TEXT NOT NULL,
  to_wallet TEXT NOT NULL,
  amount DECIMAL(20, 9) NOT NULL CHECK (amount > 0),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'claimed', 'transferred', 'welcome_bonus')),
  signature TEXT, -- Solana transaction signature
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for wallet_transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON bloxbuddy.wallet_transactions (wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON bloxbuddy.wallet_transactions (status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON bloxbuddy.wallet_transactions (created_at DESC);

-- Create rewards_queue table for pending rewards
CREATE TABLE IF NOT EXISTS bloxbuddy.rewards_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(20, 9) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for rewards_queue
CREATE INDEX IF NOT EXISTS idx_rewards_queue_user_id ON bloxbuddy.rewards_queue (user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_queue_claimed ON bloxbuddy.rewards_queue (claimed);
CREATE INDEX IF NOT EXISTS idx_rewards_queue_expires_at ON bloxbuddy.rewards_queue (expires_at);

-- Create token_tiers table for tracking user progression
CREATE TABLE IF NOT EXISTS bloxbuddy.token_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_tier TEXT DEFAULT 'Bronze' CHECK (current_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master')),
  total_earned DECIMAL(20, 9) DEFAULT 0,
  total_spent DECIMAL(20, 9) DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE,
  bonus_multiplier DECIMAL(3, 2) DEFAULT 1.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for token_tiers
CREATE INDEX IF NOT EXISTS idx_token_tiers_user_id ON bloxbuddy.token_tiers (user_id);
CREATE INDEX IF NOT EXISTS idx_token_tiers_current_tier ON bloxbuddy.token_tiers (current_tier);

-- Enable Row Level Security
ALTER TABLE bloxbuddy.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloxbuddy.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloxbuddy.rewards_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloxbuddy.token_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_wallets
CREATE POLICY "Users can view own wallets"
  ON bloxbuddy.user_wallets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets"
  ON bloxbuddy.user_wallets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view own transactions"
  ON bloxbuddy.wallet_transactions
  FOR SELECT
  USING (
    wallet_id IN (
      SELECT id FROM bloxbuddy.user_wallets WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for rewards_queue
CREATE POLICY "Users can view own rewards"
  ON bloxbuddy.rewards_queue
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can claim own rewards"
  ON bloxbuddy.rewards_queue
  FOR UPDATE
  USING (auth.uid() = user_id AND claimed = false);

-- RLS Policies for token_tiers
CREATE POLICY "Users can view own tier"
  ON bloxbuddy.token_tiers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Function to automatically create custodial wallet on user signup
CREATE OR REPLACE FUNCTION bloxbuddy.create_custodial_wallet()
RETURNS TRIGGER AS $$
DECLARE
  v_public_key TEXT;
BEGIN
  -- Generate a placeholder public key for custodial wallet
  -- In production, this would be generated by an edge function
  v_public_key := 'CUSTODIAL_' || NEW.id::TEXT || '_' || substr(md5(random()::text), 0, 25);
  
  -- Create wallet entry
  INSERT INTO bloxbuddy.user_wallets (
    user_id,
    public_key,
    wallet_type,
    is_primary,
    balance
  ) VALUES (
    NEW.id,
    v_public_key,
    'custodial',
    true,
    10.0 -- Welcome bonus
  );
  
  -- Create welcome bonus transaction
  INSERT INTO bloxbuddy.wallet_transactions (
    wallet_id,
    from_wallet,
    to_wallet,
    amount,
    transaction_type,
    status,
    metadata
  ) VALUES (
    (SELECT id FROM bloxbuddy.user_wallets WHERE user_id = NEW.id LIMIT 1),
    'SYSTEM',
    v_public_key,
    10.0,
    'welcome_bonus',
    'confirmed',
    jsonb_build_object('reason', 'Welcome to Blox Buddy!')
  );
  
  -- Initialize token tier
  INSERT INTO bloxbuddy.token_tiers (
    user_id,
    current_tier,
    total_earned,
    last_active_date
  ) VALUES (
    NEW.id,
    'Bronze',
    10.0,
    CURRENT_DATE
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet on user signup
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION bloxbuddy.create_custodial_wallet();

-- Function to update wallet balance after transaction
CREATE OR REPLACE FUNCTION bloxbuddy.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- Update wallet balance based on transaction type
    IF NEW.transaction_type IN ('earned', 'claimed', 'welcome_bonus') THEN
      UPDATE bloxbuddy.user_wallets
      SET 
        balance = balance + NEW.amount,
        updated_at = NOW()
      WHERE id = NEW.wallet_id;
      
      -- Update token tier total earned
      UPDATE bloxbuddy.token_tiers
      SET 
        total_earned = total_earned + NEW.amount,
        updated_at = NOW()
      WHERE user_id = (SELECT user_id FROM bloxbuddy.user_wallets WHERE id = NEW.wallet_id);
      
    ELSIF NEW.transaction_type IN ('spent', 'transferred') THEN
      UPDATE bloxbuddy.user_wallets
      SET 
        balance = balance - NEW.amount,
        updated_at = NOW()
      WHERE id = NEW.wallet_id;
      
      -- Update token tier total spent
      UPDATE bloxbuddy.token_tiers
      SET 
        total_spent = total_spent + NEW.amount,
        updated_at = NOW()
      WHERE user_id = (SELECT user_id FROM bloxbuddy.user_wallets WHERE id = NEW.wallet_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update balance on transaction status change
CREATE TRIGGER on_transaction_confirmed
  AFTER UPDATE ON bloxbuddy.wallet_transactions
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status != 'confirmed')
  EXECUTE FUNCTION bloxbuddy.update_wallet_balance();

-- Function to claim rewards from queue
CREATE OR REPLACE FUNCTION bloxbuddy.claim_rewards(p_user_id UUID)
RETURNS TABLE (
  claimed_amount DECIMAL(20, 9),
  transaction_id UUID
) AS $$
DECLARE
  v_total_amount DECIMAL(20, 9);
  v_wallet_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Get user's primary wallet
  SELECT id INTO v_wallet_id
  FROM bloxbuddy.user_wallets
  WHERE user_id = p_user_id AND is_primary = true
  LIMIT 1;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'No primary wallet found for user';
  END IF;
  
  -- Calculate total claimable amount
  SELECT COALESCE(SUM(amount), 0) INTO v_total_amount
  FROM bloxbuddy.rewards_queue
  WHERE user_id = p_user_id 
    AND claimed = false 
    AND expires_at > NOW();
  
  IF v_total_amount = 0 THEN
    RETURN QUERY SELECT 0::DECIMAL(20, 9), NULL::UUID;
    RETURN;
  END IF;
  
  -- Create transaction
  INSERT INTO bloxbuddy.wallet_transactions (
    wallet_id,
    from_wallet,
    to_wallet,
    amount,
    transaction_type,
    status,
    metadata
  ) VALUES (
    v_wallet_id,
    'REWARDS_POOL',
    (SELECT public_key FROM bloxbuddy.user_wallets WHERE id = v_wallet_id),
    v_total_amount,
    'claimed',
    'confirmed',
    jsonb_build_object('claimed_at', NOW())
  ) RETURNING id INTO v_transaction_id;
  
  -- Mark rewards as claimed
  UPDATE bloxbuddy.rewards_queue
  SET 
    claimed = true,
    claimed_at = NOW()
  WHERE user_id = p_user_id 
    AND claimed = false 
    AND expires_at > NOW();
  
  RETURN QUERY SELECT v_total_amount, v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add reward to queue
CREATE OR REPLACE FUNCTION bloxbuddy.add_reward(
  p_user_id UUID,
  p_amount DECIMAL(20, 9),
  p_reason TEXT,
  p_activity_type TEXT,
  p_xp_earned INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_reward_id UUID;
BEGIN
  INSERT INTO bloxbuddy.rewards_queue (
    user_id,
    amount,
    reason,
    activity_type,
    xp_earned
  ) VALUES (
    p_user_id,
    p_amount,
    p_reason,
    p_activity_type,
    p_xp_earned
  ) RETURNING id INTO v_reward_id;
  
  RETURN v_reward_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tier based on total earned
CREATE OR REPLACE FUNCTION bloxbuddy.update_user_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_total_earned DECIMAL(20, 9);
  v_new_tier TEXT;
BEGIN
  SELECT total_earned INTO v_total_earned
  FROM bloxbuddy.token_tiers
  WHERE user_id = p_user_id;
  
  -- Determine tier based on total earned
  v_new_tier := CASE
    WHEN v_total_earned >= 50000 THEN 'Master'
    WHEN v_total_earned >= 10000 THEN 'Diamond'
    WHEN v_total_earned >= 2000 THEN 'Platinum'
    WHEN v_total_earned >= 500 THEN 'Gold'
    WHEN v_total_earned >= 100 THEN 'Silver'
    ELSE 'Bronze'
  END;
  
  -- Update tier if changed
  UPDATE bloxbuddy.token_tiers
  SET 
    current_tier = v_new_tier,
    updated_at = NOW()
  WHERE user_id = p_user_id AND current_tier != v_new_tier;
  
  RETURN v_new_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE bloxbuddy.user_wallets IS 'Stores user wallet information for both custodial and external wallets';
COMMENT ON TABLE bloxbuddy.wallet_transactions IS 'Transaction history for all wallet operations';
COMMENT ON TABLE bloxbuddy.rewards_queue IS 'Queue for pending rewards that users can claim';
COMMENT ON TABLE bloxbuddy.token_tiers IS 'User progression and tier tracking';
COMMENT ON FUNCTION bloxbuddy.create_custodial_wallet() IS 'Automatically creates a custodial wallet when a new user signs up';
COMMENT ON FUNCTION bloxbuddy.claim_rewards(UUID) IS 'Claims all pending rewards for a user';
COMMENT ON FUNCTION bloxbuddy.add_reward(UUID, DECIMAL, TEXT, TEXT, INTEGER) IS 'Adds a reward to the queue for a user';
COMMENT ON FUNCTION bloxbuddy.update_user_tier(UUID) IS 'Updates user tier based on total earned BLOX';
-- ============================================================
-- MIGRATION: 002_video_content.sql
-- ============================================================
-- Create video content and transcript tables
-- Based on TypeScript types from src/types/migrations.ts

-- Create videos table for storing YouTube video metadata
CREATE TABLE IF NOT EXISTS bloxbuddy.videos (
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
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON bloxbuddy.videos (youtube_id);
CREATE INDEX IF NOT EXISTS idx_videos_module_week ON bloxbuddy.videos (module_id, week_id);
CREATE INDEX IF NOT EXISTS idx_videos_order ON bloxbuddy.videos (order_index);

-- Create video_transcripts table for storing full transcript data
CREATE TABLE IF NOT EXISTS bloxbuddy.video_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES bloxbuddy.videos(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  full_transcript JSONB, -- Store array of transcript segments
  segment_count INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  

  -- Constraints
  UNIQUE (video_id, youtube_id)
);

-- Create indexes for video_transcripts
CREATE INDEX IF NOT EXISTS idx_video_transcripts_video_id ON bloxbuddy.video_transcripts (video_id);
CREATE INDEX IF NOT EXISTS idx_video_transcripts_youtube_id ON bloxbuddy.video_transcripts (youtube_id);

-- Create video_transcript_chunks for searchable text segments
CREATE TABLE IF NOT EXISTS bloxbuddy.video_transcript_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES bloxbuddy.videos(id) ON DELETE CASCADE,
  transcript_id UUID REFERENCES bloxbuddy.video_transcripts(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_video_id ON bloxbuddy.video_transcript_chunks (video_id);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_youtube_id ON bloxbuddy.video_transcript_chunks (youtube_id);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_time ON bloxbuddy.video_transcript_chunks (start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_text ON bloxbuddy.video_transcript_chunks (text);

-- Create video_progress for tracking user watch progress
CREATE TABLE IF NOT EXISTS bloxbuddy.video_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES bloxbuddy.videos(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_video_progress_user_id ON bloxbuddy.video_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_video_id ON bloxbuddy.video_progress (video_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_completed ON bloxbuddy.video_progress (completed);

-- Enable Row Level Security
ALTER TABLE bloxbuddy.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloxbuddy.video_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloxbuddy.video_transcript_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloxbuddy.video_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for videos (public read)
CREATE POLICY "Videos are viewable by everyone"
  ON bloxbuddy.videos
  FOR SELECT
  USING (true);

-- RLS Policies for video_transcripts (public read)
CREATE POLICY "Video transcripts are viewable by everyone"
  ON bloxbuddy.video_transcripts
  FOR SELECT
  USING (true);

-- RLS Policies for video_transcript_chunks (public read)
CREATE POLICY "Video transcript chunks are viewable by everyone"
  ON bloxbuddy.video_transcript_chunks
  FOR SELECT
  USING (true);

-- RLS Policies for video_progress (user-specific)
CREATE POLICY "Users can view own video progress"
  ON bloxbuddy.video_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video progress"
  ON bloxbuddy.video_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video progress"
  ON bloxbuddy.video_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to automatically update video progress completion
CREATE OR REPLACE FUNCTION bloxbuddy.update_video_completion()
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
  BEFORE UPDATE ON bloxbuddy.video_progress
  FOR EACH ROW
  EXECUTE FUNCTION bloxbuddy.update_video_completion();

-- Function to search transcripts by text
CREATE OR REPLACE FUNCTION bloxbuddy.search_video_transcripts(
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
  FROM bloxbuddy.video_transcript_chunks vtc
  JOIN bloxbuddy.videos v ON v.id = vtc.video_id
  WHERE to_tsvector('english', vtc.text) @@ plainto_tsquery('english', search_query)
  ORDER BY relevance DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE bloxbuddy.videos IS 'YouTube video metadata and curriculum information';
COMMENT ON TABLE bloxbuddy.video_transcripts IS 'Full transcript data for videos';
COMMENT ON TABLE bloxbuddy.video_transcript_chunks IS 'Searchable transcript segments with embeddings';
COMMENT ON TABLE bloxbuddy.video_progress IS 'User video watch progress and completion tracking';
COMMENT ON FUNCTION bloxbuddy.update_video_completion() IS 'Automatically marks videos as completed when watch progress >= 90%';
COMMENT ON FUNCTION bloxbuddy.search_video_transcripts(TEXT, INTEGER) IS 'Full-text search across video transcript chunks';
-- ============================================================
-- MIGRATION: 004_vector_search.sql
-- ============================================================
-- Enable pgvector extension for similarity search
-- This migration adds vector search capabilities to the transcript system

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create index for fast vector similarity searches
-- This significantly speeds up embedding similarity queries
CREATE INDEX IF NOT EXISTS idx_video_transcript_chunks_embedding 
ON bloxbuddy.video_transcript_chunks 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Function to search for similar transcript chunks using vector similarity
CREATE OR REPLACE FUNCTION bloxbuddy.search_similar_chunks(
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
  FROM bloxbuddy.video_transcript_chunks vtc
  JOIN bloxbuddy.videos v ON v.id = vtc.video_id
  WHERE vtc.embedding IS NOT NULL
    AND (1 - (vtc.embedding <=> query_embedding)) > match_threshold
  ORDER BY vtc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for hybrid search (combines text search + vector similarity)
CREATE OR REPLACE FUNCTION bloxbuddy.search_transcripts_hybrid(
  search_query text,
  query_embedding vector(1536) DEFAULT NULL,
  match_threshold float DEFAULT 0.6,
  match_count int DEFAULT 10,
  text_weight float DEFAULT 0.3,
  vector_weight float DEFAULT 0.7
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
  combined_score float,
  text_relevance float,
  vector_similarity float
) AS $$
BEGIN
  -- If no embedding provided, return text-only search
  IF query_embedding IS NULL THEN
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
      ts_rank(to_tsvector('english', vtc.text), plainto_tsquery('english', search_query)) as combined_score,
      ts_rank(to_tsvector('english', vtc.text), plainto_tsquery('english', search_query)) as text_relevance,
      0.0 as vector_similarity
    FROM bloxbuddy.video_transcript_chunks vtc
    JOIN bloxbuddy.videos v ON v.id = vtc.video_id
    WHERE to_tsvector('english', vtc.text) @@ plainto_tsquery('english', search_query)
    ORDER BY combined_score DESC
    LIMIT match_count;
  ELSE
    -- Hybrid search combining text and vector similarity
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
      (
        (text_weight * ts_rank(to_tsvector('english', vtc.text), plainto_tsquery('english', search_query))) +
        (vector_weight * (1 - (vtc.embedding <=> query_embedding)))
      ) as combined_score,
      ts_rank(to_tsvector('english', vtc.text), plainto_tsquery('english', search_query)) as text_relevance,
      (1 - (vtc.embedding <=> query_embedding)) as vector_similarity
    FROM bloxbuddy.video_transcript_chunks vtc
    JOIN bloxbuddy.videos v ON v.id = vtc.video_id
    WHERE 
      vtc.embedding IS NOT NULL
      AND (
        to_tsvector('english', vtc.text) @@ plainto_tsquery('english', search_query)
        OR (1 - (vtc.embedding <=> query_embedding)) > match_threshold
      )
    ORDER BY combined_score DESC
    LIMIT match_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find chunks by video and time range (useful for context)
CREATE OR REPLACE FUNCTION bloxbuddy.get_video_chunks_by_timerange(
  p_youtube_id text,
  start_seconds decimal DEFAULT 0,
  end_seconds decimal DEFAULT NULL,
  context_seconds decimal DEFAULT 30
)
RETURNS TABLE (
  chunk_id uuid,
  video_id uuid,
  youtube_id text,
  video_title text,
  chunk_index int,
  start_time decimal,
  end_time decimal,
  chunk_text text,
  is_in_range boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vtc.id as chunk_id,
    vtc.video_id,
    vtc.youtube_id,
    v.title as video_title,
    vtc.chunk_index,
    vtc.start_time,
    vtc.end_time,
    vtc.text as chunk_text,
    CASE 
      WHEN end_seconds IS NULL THEN 
        (vtc.start_time >= (start_seconds - context_seconds) AND vtc.end_time <= (start_seconds + context_seconds))
      ELSE 
        (vtc.start_time >= (start_seconds - context_seconds) AND vtc.end_time <= (end_seconds + context_seconds))
    END as is_in_range
  FROM bloxbuddy.video_transcript_chunks vtc
  JOIN bloxbuddy.videos v ON v.id = vtc.video_id
  WHERE vtc.youtube_id = p_youtube_id
    AND (
      (end_seconds IS NULL AND vtc.start_time >= (start_seconds - context_seconds) AND vtc.end_time <= (start_seconds + context_seconds))
      OR (end_seconds IS NOT NULL AND vtc.start_time >= (start_seconds - context_seconds) AND vtc.end_time <= (end_seconds + context_seconds))
    )
  ORDER BY vtc.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get embedding statistics
CREATE OR REPLACE FUNCTION bloxbuddy.get_embedding_stats()
RETURNS TABLE (
  total_chunks bigint,
  chunks_with_embeddings bigint,
  chunks_without_embeddings bigint,
  completion_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_chunks,
    COUNT(embedding) as chunks_with_embeddings,
    COUNT(*) - COUNT(embedding) as chunks_without_embeddings,
    ROUND(
      (COUNT(embedding)::numeric / COUNT(*)::numeric) * 100, 
      2
    ) as completion_percentage
  FROM bloxbuddy.video_transcript_chunks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find videos with the most embedded content
CREATE OR REPLACE FUNCTION bloxbuddy.get_most_embedded_videos(
  limit_count int DEFAULT 10
)
RETURNS TABLE (
  video_id uuid,
  youtube_id text,
  video_title text,
  video_creator text,
  total_chunks bigint,
  embedded_chunks bigint,
  embedding_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id as video_id,
    v.youtube_id,
    v.title as video_title,
    v.creator as video_creator,
    COUNT(vtc.id) as total_chunks,
    COUNT(vtc.embedding) as embedded_chunks,
    ROUND(
      (COUNT(vtc.embedding)::numeric / COUNT(vtc.id)::numeric) * 100, 
      2
    ) as embedding_percentage
  FROM bloxbuddy.videos v
  JOIN bloxbuddy.video_transcript_chunks vtc ON v.id = vtc.video_id
  GROUP BY v.id, v.youtube_id, v.title, v.creator
  HAVING COUNT(vtc.embedding) > 0
  ORDER BY embedded_chunks DESC, embedding_percentage DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing search function to be more efficient
DROP FUNCTION IF EXISTS bloxbuddy.search_video_transcripts(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION bloxbuddy.search_video_transcripts(
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
  FROM bloxbuddy.video_transcript_chunks vtc
  JOIN bloxbuddy.videos v ON v.id = vtc.video_id
  WHERE to_tsvector('english', vtc.text) @@ plainto_tsquery('english', search_query)
  ORDER BY relevance DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a composite index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_video_transcript_chunks_youtube_time 
ON bloxbuddy.video_transcript_chunks (youtube_id, start_time);

-- Create index on text for faster full-text searches
CREATE INDEX IF NOT EXISTS idx_video_transcript_chunks_text_search 
ON bloxbuddy.video_transcript_chunks 
USING gin (to_tsvector('english', text));

-- Add comments for documentation
COMMENT ON FUNCTION bloxbuddy.search_similar_chunks(vector, float, int) IS 'Search transcript chunks using vector similarity';
COMMENT ON FUNCTION bloxbuddy.search_transcripts_hybrid(text, vector, float, int, float, float) IS 'Hybrid search combining text and vector similarity';
COMMENT ON FUNCTION bloxbuddy.get_video_chunks_by_timerange(text, decimal, decimal, decimal) IS 'Get transcript chunks within a time range for a video';
COMMENT ON FUNCTION bloxbuddy.get_embedding_stats() IS 'Get statistics about embedding completion';
COMMENT ON FUNCTION bloxbuddy.get_most_embedded_videos(int) IS 'Get videos with the most embedded transcript chunks';
COMMENT ON INDEX idx_video_transcript_chunks_embedding IS 'Vector similarity search index for fast embedding queries';
COMMENT ON INDEX idx_video_transcript_chunks_text_search IS 'Full-text search index for transcript content';
-- ============================================================
-- MIGRATION: 006_calendar_todo_system.sql
-- ============================================================
-- Calendar and Todo System Migration
-- This migration creates the database structure for the integrated calendar and todo system

-- Create enums for todo and calendar systems
CREATE TYPE todo_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE todo_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'blocked', 'cancelled', 'archived');
CREATE TYPE calendar_event_type_enum AS ENUM ('video', 'practice', 'project', 'review', 'meeting', 'break', 'custom');

-- Enhanced todos table with scheduling and auto-bump features
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core todo fields
  title TEXT NOT NULL,
  description TEXT,
  priority todo_priority_enum DEFAULT 'medium',
  status todo_status_enum DEFAULT 'pending',

  -- Time management
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  due_date TIMESTAMPTZ,
  scheduled_date DATE,
  scheduled_time TIME,

  -- Organization
  category TEXT,
  tags TEXT[],
  order_index INTEGER DEFAULT 0,
  parent_todo_id UUID REFERENCES todos(id) ON DELETE SET NULL,

  -- Auto-bump system
  auto_bumped BOOLEAN DEFAULT false,
  bump_count INTEGER DEFAULT 0,
  last_bumped_at TIMESTAMPTZ,
  original_due_date TIMESTAMPTZ,

  -- AI integration
  generated_from TEXT, -- 'ai_chat', 'manual', 'video_suggestion', etc.
  confidence DECIMAL(3,2),
  auto_generated BOOLEAN DEFAULT false,
  learning_objectives TEXT[],
  prerequisites TEXT[],

  -- Video references (JSON array of UnifiedVideoReference)
  video_references JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id)
);

-- Calendar events table with full scheduling features
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core event fields
  title TEXT NOT NULL,
  description TEXT,
  type calendar_event_type_enum DEFAULT 'custom',

  -- Time fields
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'UTC',

  -- Appearance
  color TEXT DEFAULT '#3b82f6',

  -- Location and details
  location TEXT,
  url TEXT,

  -- Recurring events
  recurring_config JSONB, -- {frequency, interval, daysOfWeek, endDate, maxOccurrences}
  parent_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  recurrence_exception BOOLEAN DEFAULT false,

  -- Reminders
  reminder_minutes INTEGER[] DEFAULT '{15}'::integer[],

  -- Integration with todos and videos
  related_todo_ids UUID[],
  video_reference JSONB, -- UnifiedVideoReference object

  -- Status and metadata
  status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, tentative
  visibility TEXT DEFAULT 'private', -- private, public, shared
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Junction table for many-to-many todo-calendar relationships
CREATE TABLE todo_calendar_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  link_type TEXT DEFAULT 'scheduled', -- 'scheduled', 'related', 'blocked_by'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(todo_id, event_id, link_type)
);

-- Auto-bump logs for tracking task rescheduling
CREATE TABLE auto_bump_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Bump details
  bump_reason TEXT NOT NULL, -- 'incomplete', 'overdue', 'manual', 'ai_suggestion'
  old_scheduled_date DATE,
  new_scheduled_date DATE,
  old_due_date TIMESTAMPTZ,
  new_due_date TIMESTAMPTZ,

  -- Context
  bump_context JSONB, -- Additional data like workload, user availability
  ai_suggested BOOLEAN DEFAULT false,
  user_confirmed BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- User calendar preferences
CREATE TABLE calendar_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- View preferences
  default_view TEXT DEFAULT 'week', -- 'month', 'week', 'day', 'agenda'
  start_of_week INTEGER DEFAULT 0, -- 0=Sunday, 1=Monday
  time_format TEXT DEFAULT '12h', -- '12h' or '24h'

  -- Working hours
  work_start_time TIME DEFAULT '09:00',
  work_end_time TIME DEFAULT '17:00',
  work_days INTEGER[] DEFAULT '{1,2,3,4,5}'::integer[], -- Mon-Fri

  -- Auto-bump settings
  enable_auto_bump BOOLEAN DEFAULT true,
  auto_bump_time TIME DEFAULT '21:00', -- When to process auto-bumps
  max_bumps_per_task INTEGER DEFAULT 3,
  auto_reschedule BOOLEAN DEFAULT true,

  -- AI integration preferences
  ai_scheduling_enabled BOOLEAN DEFAULT true,
  ai_suggestion_frequency TEXT DEFAULT 'daily', -- 'realtime', 'daily', 'weekly'
  preferred_study_times TIME[] DEFAULT '{14:00,15:00,16:00}'::time[],

  -- Notification preferences
  email_reminders BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  daily_summary BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_scheduled_date ON todos(scheduled_date);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_parent_id ON todos(parent_todo_id);
CREATE INDEX idx_todos_auto_bumped ON todos(auto_bumped);

CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX idx_calendar_events_type ON calendar_events(type);
CREATE INDEX idx_calendar_events_parent ON calendar_events(parent_event_id);

CREATE INDEX idx_todo_calendar_links_todo ON todo_calendar_links(todo_id);
CREATE INDEX idx_todo_calendar_links_event ON todo_calendar_links(event_id);

CREATE INDEX idx_auto_bump_logs_todo ON auto_bump_logs(todo_id);
CREATE INDEX idx_auto_bump_logs_user ON auto_bump_logs(user_id);
CREATE INDEX idx_auto_bump_logs_date ON auto_bump_logs(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_preferences_updated_at
    BEFORE UPDATE ON calendar_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_calendar_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_bump_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_preferences ENABLE ROW LEVEL SECURITY;

-- Todos policies
CREATE POLICY "Users can view their own todos" ON todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos" ON todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos" ON todos
  FOR DELETE USING (auth.uid() = user_id);

-- Calendar events policies
CREATE POLICY "Users can view their own calendar events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events" ON calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- Todo-calendar links policies
CREATE POLICY "Users can view their todo-calendar links" ON todo_calendar_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM todos t WHERE t.id = todo_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their todo-calendar links" ON todo_calendar_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM todos t WHERE t.id = todo_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their todo-calendar links" ON todo_calendar_links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM todos t WHERE t.id = todo_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their todo-calendar links" ON todo_calendar_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM todos t WHERE t.id = todo_id AND t.user_id = auth.uid()
    )
  );

-- Auto bump logs policies
CREATE POLICY "Users can view their own auto bump logs" ON auto_bump_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own auto bump logs" ON auto_bump_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Calendar preferences policies
CREATE POLICY "Users can view their own calendar preferences" ON calendar_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar preferences" ON calendar_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar preferences" ON calendar_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Create default calendar preferences for new users
CREATE OR REPLACE FUNCTION create_default_calendar_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO calendar_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: This trigger would be created on auth.users, but we can't access that table
-- Instead, we'll handle this in the application code when users first access calendar features

-- Add helpful views for common queries
CREATE VIEW user_todo_summary AS
SELECT
  user_id,
  COUNT(*) as total_todos,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_todos,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_todos,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_todos,
  COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue_todos,
  COUNT(*) FILTER (WHERE auto_bumped = true) as auto_bumped_todos,
  AVG(actual_minutes) FILTER (WHERE actual_minutes IS NOT NULL) as avg_completion_time
FROM todos
GROUP BY user_id;

CREATE VIEW upcoming_events AS
SELECT
  e.*,
  array_agg(t.title) FILTER (WHERE t.title IS NOT NULL) as related_todo_titles
FROM calendar_events e
LEFT JOIN todo_calendar_links tcl ON e.id = tcl.event_id
LEFT JOIN todos t ON tcl.todo_id = t.id
WHERE e.start_time >= NOW()
AND e.start_time <= NOW() + INTERVAL '7 days'
GROUP BY e.id, e.user_id, e.title, e.description, e.type, e.start_time, e.end_time,
         e.all_day, e.timezone, e.color, e.location, e.url, e.recurring_config,
         e.parent_event_id, e.recurrence_exception, e.reminder_minutes,
         e.related_todo_ids, e.video_reference, e.status, e.visibility,
         e.created_at, e.updated_at, e.created_by;

-- Add comments for documentation
COMMENT ON TABLE todos IS 'Enhanced todo system with scheduling, auto-bump, and AI integration';
COMMENT ON TABLE calendar_events IS 'Full-featured calendar events with recurring support and todo integration';
COMMENT ON TABLE todo_calendar_links IS 'Junction table linking todos and calendar events';
COMMENT ON TABLE auto_bump_logs IS 'Audit log for automatic task rescheduling';
COMMENT ON TABLE calendar_preferences IS 'User preferences for calendar behavior and AI features';

COMMENT ON COLUMN todos.auto_bumped IS 'Whether this todo was automatically rescheduled';
COMMENT ON COLUMN todos.bump_count IS 'Number of times this todo has been auto-bumped';
COMMENT ON COLUMN todos.video_references IS 'JSON array of UnifiedVideoReference objects';
COMMENT ON COLUMN calendar_events.recurring_config IS 'JSON configuration for recurring events';
COMMENT ON COLUMN calendar_events.video_reference IS 'Single UnifiedVideoReference object for video-based events';
-- ============================================================
-- MIGRATION: 007_chat_persistence.sql
-- ============================================================
-- Chat Conversation Persistence Migration
-- Enables Blox Wizard to remember chat history across sessions and page navigation

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS bloxbuddy.chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  title TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_session_id CHECK (length(session_id) > 0)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS bloxbuddy.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES bloxbuddy.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  video_context JSONB, -- Store VideoContext when chatting about specific videos
  video_references JSONB, -- Store video suggestions returned by AI
  suggested_questions JSONB, -- Store follow-up questions
  metadata JSONB, -- Additional data (response time, token usage, etc.)
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_role CHECK (role IN ('user', 'assistant', 'system')),
  CONSTRAINT valid_content CHECK (length(content) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id
  ON bloxbuddy.chat_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_session_id
  ON bloxbuddy.chat_conversations(session_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message
  ON bloxbuddy.chat_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id
  ON bloxbuddy.chat_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
  ON bloxbuddy.chat_messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_role
  ON bloxbuddy.chat_messages(role);

-- Enable Row Level Security
ALTER TABLE bloxbuddy.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloxbuddy.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations
CREATE POLICY "Users can view own conversations"
  ON bloxbuddy.chat_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON bloxbuddy.chat_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON bloxbuddy.chat_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON bloxbuddy.chat_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view own messages"
  ON bloxbuddy.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bloxbuddy.chat_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messages"
  ON bloxbuddy.chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bloxbuddy.chat_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages"
  ON bloxbuddy.chat_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bloxbuddy.chat_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own messages"
  ON bloxbuddy.chat_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bloxbuddy.chat_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- Function to update last_message_at timestamp
CREATE OR REPLACE FUNCTION bloxbuddy.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bloxbuddy.chat_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update last_message_at
CREATE TRIGGER on_message_created
  AFTER INSERT ON bloxbuddy.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION bloxbuddy.update_conversation_timestamp();

-- Function to auto-generate conversation title from first message
CREATE OR REPLACE FUNCTION bloxbuddy.generate_conversation_title()
RETURNS TRIGGER AS $$
DECLARE
  first_user_message TEXT;
BEGIN
  -- Only generate title if it's NULL and this is a user message
  IF NEW.role = 'user' THEN
    SELECT title INTO first_user_message
    FROM bloxbuddy.chat_conversations
    WHERE id = NEW.conversation_id;

    -- If conversation has no title, use first 50 chars of first user message
    IF first_user_message IS NULL THEN
      UPDATE bloxbuddy.chat_conversations
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
CREATE TRIGGER on_first_user_message
  AFTER INSERT ON bloxbuddy.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION bloxbuddy.generate_conversation_title();

-- Function to get conversation with recent messages
CREATE OR REPLACE FUNCTION bloxbuddy.get_conversation_with_messages(
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
  FROM bloxbuddy.chat_conversations c
  LEFT JOIN bloxbuddy.chat_messages m ON m.conversation_id = c.id
  WHERE c.session_id = p_session_id
    AND c.user_id = p_user_id
  ORDER BY m.created_at ASC
  LIMIT message_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's recent conversations (for sidebar history)
CREATE OR REPLACE FUNCTION bloxbuddy.get_user_conversations(
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
  FROM bloxbuddy.chat_conversations c
  LEFT JOIN bloxbuddy.chat_messages m ON m.conversation_id = c.id
  WHERE c.user_id = p_user_id
  GROUP BY c.id, c.session_id, c.title, c.last_message_at
  ORDER BY c.last_message_at DESC
  LIMIT conversation_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for conversation summaries
CREATE OR REPLACE VIEW bloxbuddy.conversation_summaries AS
SELECT
  c.id,
  c.user_id,
  c.session_id,
  c.title,
  c.last_message_at,
  c.created_at,
  COUNT(m.id) as total_messages,
  COUNT(m.id) FILTER (WHERE m.role = 'user') as user_messages,
  COUNT(m.id) FILTER (WHERE m.role = 'assistant') as assistant_messages,
  MAX(m.created_at) as last_message_created_at
FROM bloxbuddy.chat_conversations c
LEFT JOIN bloxbuddy.chat_messages m ON m.conversation_id = c.id
GROUP BY c.id, c.user_id, c.session_id, c.title, c.last_message_at, c.created_at;

-- Add comments for documentation
COMMENT ON TABLE bloxbuddy.chat_conversations IS 'Stores chat conversation sessions for Blox Wizard';
COMMENT ON TABLE bloxbuddy.chat_messages IS 'Stores individual chat messages within conversations';
COMMENT ON COLUMN bloxbuddy.chat_messages.video_context IS 'JSON object containing video context when chatting about specific videos';
COMMENT ON COLUMN bloxbuddy.chat_messages.video_references IS 'Array of video references suggested by AI in response';
COMMENT ON COLUMN bloxbuddy.chat_messages.suggested_questions IS 'Array of follow-up questions suggested by AI';
COMMENT ON FUNCTION bloxbuddy.update_conversation_timestamp() IS 'Automatically updates conversation last_message_at when new message is added';
COMMENT ON FUNCTION bloxbuddy.generate_conversation_title() IS 'Automatically generates conversation title from first user message';
COMMENT ON FUNCTION bloxbuddy.get_conversation_with_messages(TEXT, UUID, INTEGER) IS 'Retrieves conversation and all messages for a session';
COMMENT ON FUNCTION bloxbuddy.get_user_conversations(UUID, INTEGER) IS 'Retrieves user''s recent conversations with message counts';
COMMENT ON VIEW bloxbuddy.conversation_summaries IS 'Summary view of all conversations with message statistics';

-- ============================================================
-- MIGRATION: 008_user_profiles.sql
-- ============================================================
-- User Profiles (simple JSON model for fast iteration)
-- Stores the entire profile in a single JSONB column `data` keyed by user_id

-- Enable extension for UUID if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS bloxbuddy.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful GIN index for querying inside JSON in the future
CREATE INDEX IF NOT EXISTS idx_user_profiles_data ON bloxbuddy.user_profiles USING GIN (data);

-- Row Level Security
ALTER TABLE bloxbuddy.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage only their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'bloxbuddy' AND tablename = 'user_profiles' AND policyname = 'Select own profile'
  ) THEN
    CREATE POLICY "Select own profile" ON bloxbuddy.user_profiles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'bloxbuddy' AND tablename = 'user_profiles' AND policyname = 'Insert own profile'
  ) THEN
    CREATE POLICY "Insert own profile" ON bloxbuddy.user_profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'bloxbuddy' AND tablename = 'user_profiles' AND policyname = 'Update own profile'
  ) THEN
    CREATE POLICY "Update own profile" ON bloxbuddy.user_profiles
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION bloxbuddy.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON bloxbuddy.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON bloxbuddy.user_profiles
FOR EACH ROW EXECUTE FUNCTION bloxbuddy.set_updated_at();



-- ============================================================
-- MIGRATION: 009_storage_buckets.sql
-- ============================================================
-- Create public storage buckets used by profile features
-- Note: In Supabase, buckets are usually created via the dashboard or REST API.
-- This script ensures policies exist and documents required buckets.

-- Required buckets (create if missing via API or dashboard):
--  - avatars (public)
--  - portfolio (public)
--  - recent-work (public)

-- Policies for storage.objects to allow public read and user write
-- These policies apply across buckets; we scope writes to the user's folder path

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read access to images'
  ) THEN
    CREATE POLICY "Public read access to images"
      ON storage.objects FOR SELECT
      USING (
        bucket_id IN ('avatars','portfolio','recent-work')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload to own folder'
  ) THEN
    CREATE POLICY "Users can upload to own folder"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id IN ('avatars','portfolio','recent-work')
        AND (auth.uid() IS NOT NULL)
        AND (position(auth.uid()::text || '/' in name) = 1)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update/delete own files'
  ) THEN
    CREATE POLICY "Users can update/delete own files"
      ON storage.objects FOR UPDATE USING (
        bucket_id IN ('avatars','portfolio','recent-work')
        AND (auth.uid() IS NOT NULL)
        AND (position(auth.uid()::text || '/' in name) = 1)
      )
      WITH CHECK (
        bucket_id IN ('avatars','portfolio','recent-work')
        AND (auth.uid() IS NOT NULL)
        AND (position(auth.uid()::text || '/' in name) = 1)
      );
  END IF;
END $$;



-- ============================================================
-- MIGRATION: 011_add_video_metadata_columns.sql
-- ============================================================
-- Add missing metadata columns to video_transcripts table
-- These columns are needed for video search results

-- Add title column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_transcripts' AND column_name = 'title'
  ) THEN
    ALTER TABLE bloxbuddy.video_transcripts ADD COLUMN title TEXT;
  END IF;
END $$;

-- Add creator column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_transcripts' AND column_name = 'creator'
  ) THEN
    ALTER TABLE bloxbuddy.video_transcripts ADD COLUMN creator TEXT;
  END IF;
END $$;

-- Add duration column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_transcripts' AND column_name = 'duration'
  ) THEN
    ALTER TABLE bloxbuddy.video_transcripts ADD COLUMN duration TEXT;
  END IF;
END $$;

-- Make video_id nullable since we're using youtube_id as primary identifier
DO $$
BEGIN
  ALTER TABLE bloxbuddy.video_transcripts ALTER COLUMN video_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;  -- Ignore if already nullable or doesn't exist
END $$;

-- Create index on youtube_id for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_video_transcripts_youtube_id_only
ON bloxbuddy.video_transcripts (youtube_id);

COMMENT ON COLUMN bloxbuddy.video_transcripts.title
IS 'Video title from YouTube';

COMMENT ON COLUMN bloxbuddy.video_transcripts.creator
IS 'Video creator/channel name';

COMMENT ON COLUMN bloxbuddy.video_transcripts.duration
IS 'Video duration in MM:SS or HH:MM:SS format';

-- ============================================================
-- MIGRATION: 012_ai_usage_tracking.sql
-- ============================================================
-- AI Usage Tracking System
-- Tracks daily AI question usage per user for rate limiting
-- Free users: 3 questions/day | Premium users: 10 questions/day

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table to track daily AI usage per user
CREATE TABLE IF NOT EXISTS bloxbuddy.user_ai_usage (
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
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_user_date ON bloxbuddy.user_ai_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_date ON bloxbuddy.user_ai_usage(date);

-- Enable Row Level Security
ALTER TABLE bloxbuddy.user_ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view and manage their own usage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'bloxbuddy'
    AND tablename = 'user_ai_usage'
    AND policyname = 'Users can view own usage'
  ) THEN
    CREATE POLICY "Users can view own usage"
    ON bloxbuddy.user_ai_usage
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'bloxbuddy'
    AND tablename = 'user_ai_usage'
    AND policyname = 'Users can insert own usage'
  ) THEN
    CREATE POLICY "Users can insert own usage"
    ON bloxbuddy.user_ai_usage
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'bloxbuddy'
    AND tablename = 'user_ai_usage'
    AND policyname = 'Users can update own usage'
  ) THEN
    CREATE POLICY "Users can update own usage"
    ON bloxbuddy.user_ai_usage
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Function to get user's daily usage and check limits
CREATE OR REPLACE FUNCTION bloxbuddy.get_user_ai_usage(p_user_id UUID)
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
  FROM bloxbuddy.user_profiles
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
  FROM bloxbuddy.user_ai_usage uau
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
CREATE OR REPLACE FUNCTION bloxbuddy.increment_ai_usage(p_user_id UUID)
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
  FROM bloxbuddy.get_user_ai_usage(p_user_id);

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
  INSERT INTO bloxbuddy.user_ai_usage (user_id, date, question_count, last_question_at)
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
CREATE OR REPLACE FUNCTION bloxbuddy.update_ai_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_ai_usage_updated_at ON bloxbuddy.user_ai_usage;
CREATE TRIGGER trg_user_ai_usage_updated_at
BEFORE UPDATE ON bloxbuddy.user_ai_usage
FOR EACH ROW EXECUTE FUNCTION bloxbuddy.update_ai_usage_timestamp();

-- Add helpful comments
COMMENT ON TABLE bloxbuddy.user_ai_usage IS 'Tracks daily AI question usage per user for rate limiting';
COMMENT ON COLUMN bloxbuddy.user_ai_usage.question_count IS 'Number of AI questions asked today';
COMMENT ON COLUMN bloxbuddy.user_ai_usage.date IS 'Date of usage (resets daily)';
COMMENT ON FUNCTION bloxbuddy.get_user_ai_usage(UUID) IS 'Returns user daily usage, limits, and premium status';
COMMENT ON FUNCTION bloxbuddy.increment_ai_usage(UUID) IS 'Increments usage count and enforces rate limits';

-- Create cleanup function to remove old usage records (optional, run weekly)
CREATE OR REPLACE FUNCTION bloxbuddy.cleanup_old_ai_usage()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete records older than 90 days
  DELETE FROM bloxbuddy.user_ai_usage
  WHERE date < CURRENT_DATE - INTERVAL '90 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION bloxbuddy.cleanup_old_ai_usage() IS 'Removes AI usage records older than 90 days';
COMMIT;
