-- Create learning path and integration tables
-- Based on TypeScript types from src/types/migrations.ts

-- Create learning_paths for user custom learning journeys
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  total_videos INTEGER DEFAULT 0,
  completed_videos INTEGER DEFAULT 0,
  estimated_hours DECIMAL(5, 2) DEFAULT 0.0,
  created_from TEXT CHECK (created_from IN ('chat', 'manual', 'playlist')) DEFAULT 'manual',
  status TEXT CHECK (status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_learning_paths_user_id (user_id),
  INDEX idx_learning_paths_status (status),
  INDEX idx_learning_paths_created_from (created_from)
);

-- Create learning_path_videos for videos in each path
CREATE TABLE IF NOT EXISTS public.learning_path_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path_id UUID REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_learning_path_videos_path_id (path_id),
  INDEX idx_learning_path_videos_video_id (video_id),
  INDEX idx_learning_path_videos_order (path_id, order_index),
  UNIQUE (path_id, video_id),
  UNIQUE (path_id, order_index)
);

-- Create todo_video_links for connecting todos with video references
CREATE TABLE IF NOT EXISTS public.todo_video_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  todo_id TEXT NOT NULL, -- External todo system ID
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  timestamp_start TEXT, -- YouTube timestamp format (e.g., "15m30s")
  timestamp_end TEXT,
  relevance_score DECIMAL(3, 2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
  link_type TEXT CHECK (link_type IN ('reference', 'requirement', 'output')) DEFAULT 'reference',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT CHECK (created_by IN ('user', 'ai', 'system')) DEFAULT 'user',
  notes TEXT,
  
  -- Indexes
  INDEX idx_todo_video_links_todo_id (todo_id),
  INDEX idx_todo_video_links_video_id (video_id),
  INDEX idx_todo_video_links_type (link_type),
  INDEX idx_todo_video_links_relevance (relevance_score DESC)
);

-- Create chat_todo_suggestions for AI-generated todo recommendations
CREATE TABLE IF NOT EXISTS public.chat_todo_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_title TEXT NOT NULL,
  suggestion_description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  category TEXT,
  estimated_minutes INTEGER DEFAULT 30,
  confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  video_references JSONB DEFAULT '[]', -- Array of video reference objects
  auto_generated BOOLEAN DEFAULT TRUE,
  accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_chat_suggestions_session_id (session_id),
  INDEX idx_chat_suggestions_user_id (user_id),
  INDEX idx_chat_suggestions_accepted (accepted),
  INDEX idx_chat_suggestions_priority (priority),
  INDEX idx_chat_suggestions_confidence (confidence_score DESC)
);

-- Create progress_sync_log for integration events
CREATE TABLE IF NOT EXISTS public.progress_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_data JSONB NOT NULL DEFAULT '{}',
  source_system TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_progress_sync_event_type (event_type),
  INDEX idx_progress_sync_user_id (user_id),
  INDEX idx_progress_sync_processed (processed),
  INDEX idx_progress_sync_created_at (created_at DESC)
);

-- Create integration_metrics for tracking system performance
CREATE TABLE IF NOT EXISTS public.integration_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(15, 4) NOT NULL,
  metadata JSONB DEFAULT '{}',
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_integration_metrics_user_id (user_id),
  INDEX idx_integration_metrics_type (metric_type),
  INDEX idx_integration_metrics_date (date DESC),
  UNIQUE (user_id, metric_type, date)
);

-- Enable Row Level Security
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_video_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_todo_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_paths
CREATE POLICY "Users can view own learning paths"
  ON public.learning_paths
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own learning paths"
  ON public.learning_paths
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning paths"
  ON public.learning_paths
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for learning_path_videos
CREATE POLICY "Users can view videos in own learning paths"
  ON public.learning_path_videos
  FOR SELECT
  USING (
    path_id IN (
      SELECT id FROM public.learning_paths WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage videos in own learning paths"
  ON public.learning_path_videos
  FOR ALL
  USING (
    path_id IN (
      SELECT id FROM public.learning_paths WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for todo_video_links (public read for shared todos)
CREATE POLICY "Todo video links are viewable by everyone"
  ON public.todo_video_links
  FOR SELECT
  USING (true);

-- RLS Policies for chat_todo_suggestions
CREATE POLICY "Users can view own chat suggestions"
  ON public.chat_todo_suggestions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat suggestions"
  ON public.chat_todo_suggestions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat suggestions"
  ON public.chat_todo_suggestions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for progress_sync_log
CREATE POLICY "Users can view own sync events"
  ON public.progress_sync_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for integration_metrics
CREATE POLICY "Users can view own metrics"
  ON public.integration_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

-- Function to update learning path progress
CREATE OR REPLACE FUNCTION public.update_learning_path_progress()
RETURNS TRIGGER AS $$
DECLARE
  path_record RECORD;
BEGIN
  -- Get the learning path info
  SELECT * INTO path_record
  FROM public.learning_paths
  WHERE id = NEW.path_id;
  
  IF FOUND THEN
    -- Update completed videos count
    UPDATE public.learning_paths
    SET 
      completed_videos = (
        SELECT COUNT(*)
        FROM public.learning_path_videos
        WHERE path_id = NEW.path_id AND is_completed = TRUE
      ),
      updated_at = NOW(),
      -- Mark path as completed if all required videos are done
      status = CASE
        WHEN (
          SELECT COUNT(*)
          FROM public.learning_path_videos
          WHERE path_id = NEW.path_id AND is_required = TRUE AND is_completed = FALSE
        ) = 0 THEN 'completed'
        ELSE status
      END,
      completed_at = CASE
        WHEN (
          SELECT COUNT(*)
          FROM public.learning_path_videos
          WHERE path_id = NEW.path_id AND is_required = TRUE AND is_completed = FALSE
        ) = 0 THEN NOW()
        ELSE completed_at
      END
    WHERE id = NEW.path_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update learning path progress
CREATE TRIGGER on_learning_path_video_updated
  AFTER UPDATE ON public.learning_path_videos
  FOR EACH ROW
  WHEN (OLD.is_completed IS DISTINCT FROM NEW.is_completed)
  EXECUTE FUNCTION public.update_learning_path_progress();

-- Function to get video recommendations based on progress
CREATE OR REPLACE FUNCTION public.get_video_recommendations(
  p_user_id UUID,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  video_id UUID,
  youtube_id TEXT,
  title TEXT,
  creator TEXT,
  duration TEXT,
  xp_reward INTEGER,
  recommendation_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Recommend videos from incomplete learning paths first
  SELECT 
    v.id,
    v.youtube_id,
    v.title,
    v.creator,
    v.duration,
    v.xp_reward,
    'Continue your learning path: ' || lp.title as recommendation_reason
  FROM public.videos v
  JOIN public.learning_path_videos lpv ON v.id = lpv.video_id
  JOIN public.learning_paths lp ON lpv.path_id = lp.id
  LEFT JOIN public.video_progress vp ON v.id = vp.video_id AND vp.user_id = p_user_id
  WHERE lp.user_id = p_user_id 
    AND lp.status = 'active'
    AND lpv.is_completed = FALSE
    AND (vp.completed IS NULL OR vp.completed = FALSE)
  ORDER BY lpv.order_index
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.learning_paths IS 'Custom learning journeys created by users or AI';
COMMENT ON TABLE public.learning_path_videos IS 'Videos included in learning paths with completion tracking';
COMMENT ON TABLE public.todo_video_links IS 'Links between external todo items and relevant videos';
COMMENT ON TABLE public.chat_todo_suggestions IS 'AI-generated todo suggestions from chat interactions';
COMMENT ON TABLE public.progress_sync_log IS 'Event log for synchronizing progress across systems';
COMMENT ON TABLE public.integration_metrics IS 'Performance and usage metrics for the integration system';
COMMENT ON FUNCTION public.update_learning_path_progress() IS 'Updates learning path completion status based on video progress';
COMMENT ON FUNCTION public.get_video_recommendations(UUID, INTEGER) IS 'Get personalized video recommendations for a user';