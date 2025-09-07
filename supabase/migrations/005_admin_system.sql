-- Admin System Database Schema
-- Creates tables and functions for the complete admin dashboard

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Admin users table with role-based access control
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('super_admin', 'admin', 'moderator')) DEFAULT 'moderator',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video processing queue with comprehensive status tracking
CREATE TABLE IF NOT EXISTS public.video_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL UNIQUE,
  playlist_id TEXT,
  title TEXT,
  creator TEXT,
  description TEXT,
  duration TEXT,
  thumbnail_url TEXT,
  module_id TEXT,
  week_id TEXT,
  day_id TEXT,
  status TEXT CHECK (status IN ('pending', 'fetching', 'extracting', 'chunking', 'embedding', 'storing', 'completed', 'failed', 'retry', 'cancelled')) DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt TIMESTAMPTZ,
  error_message TEXT,
  error_details JSONB,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,
  added_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detailed extraction logs for debugging and monitoring
CREATE TABLE IF NOT EXISTS public.extraction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_queue_id UUID REFERENCES public.video_queue(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'fetch_metadata', 'extract_transcript', 'chunk_transcript', 'generate_embedding', 'store_data'
  status TEXT NOT NULL, -- 'started', 'success', 'failed', 'skipped', 'retry'
  method TEXT, -- 'youtube-api', 'youtube-transcript', 'yt-dlp', 'manual', 'openai-api'
  duration_ms INTEGER,
  input_size INTEGER, -- bytes or character count
  output_size INTEGER, -- bytes or character count
  metadata JSONB,
  error_message TEXT,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin activity audit log for compliance and monitoring
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admin_users(id),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT, -- 'video', 'playlist', 'user', 'system'
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processing statistics for analytics dashboard
CREATE TABLE IF NOT EXISTS public.processing_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE DEFAULT CURRENT_DATE,
  videos_added INTEGER DEFAULT 0,
  videos_processed INTEGER DEFAULT 0,
  videos_failed INTEGER DEFAULT 0,
  videos_retried INTEGER DEFAULT 0,
  total_processing_time_ms INTEGER DEFAULT 0,
  transcripts_extracted INTEGER DEFAULT 0,
  embeddings_generated INTEGER DEFAULT 0,
  chunks_created INTEGER DEFAULT 0,
  average_processing_time_ms INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  error_rate DECIMAL(5,2) DEFAULT 0.00,
  api_calls_youtube INTEGER DEFAULT 0,
  api_calls_openai INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

-- Queue management functions and utilities
CREATE TABLE IF NOT EXISTS public.queue_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_name TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive', 'error')) DEFAULT 'inactive',
  last_heartbeat TIMESTAMPTZ,
  current_task TEXT,
  tasks_processed INTEGER DEFAULT 0,
  errors_encountered INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(is_active);

CREATE INDEX IF NOT EXISTS idx_video_queue_status ON public.video_queue(status);
CREATE INDEX IF NOT EXISTS idx_video_queue_priority ON public.video_queue(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_video_queue_youtube_id ON public.video_queue(youtube_id);
CREATE INDEX IF NOT EXISTS idx_video_queue_added_by ON public.video_queue(added_by);
CREATE INDEX IF NOT EXISTS idx_video_queue_created_at ON public.video_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_queue_status_created ON public.video_queue(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_extraction_logs_video ON public.extraction_logs(youtube_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extraction_logs_queue_id ON public.extraction_logs(video_queue_id);
CREATE INDEX IF NOT EXISTS idx_extraction_logs_action_status ON public.extraction_logs(action, status);

CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON public.admin_activity_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_action ON public.admin_activity_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_resource ON public.admin_activity_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_processing_stats_date ON public.processing_stats(date DESC);

CREATE INDEX IF NOT EXISTS idx_queue_workers_status ON public.queue_workers(status);
CREATE INDEX IF NOT EXISTS idx_queue_workers_heartbeat ON public.queue_workers(last_heartbeat DESC);

-- Row Level Security (RLS) policies for admin tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_workers ENABLE ROW LEVEL SECURITY;

-- Policies for admin_users table
CREATE POLICY "Admin users can view their own record" ON public.admin_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all admin users" ON public.admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true
    )
  );

CREATE POLICY "Super admins can manage all admin users" ON public.admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true
    )
  );

-- Policies for video_queue table (admins and above can access)
CREATE POLICY "Admins can access video queue" ON public.video_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin', 'moderator') 
        AND au.is_active = true
    )
  );

-- Policies for extraction_logs table (admins can view, super_admins can modify)
CREATE POLICY "Admins can view extraction logs" ON public.extraction_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin', 'moderator') 
        AND au.is_active = true
    )
  );

CREATE POLICY "System can insert extraction logs" ON public.extraction_logs
  FOR INSERT WITH CHECK (true);

-- Policies for admin_activity_logs (view own, super_admins see all)
CREATE POLICY "Admins can view their own activity" ON public.admin_activity_logs
  FOR SELECT USING (
    admin_id IN (
      SELECT id FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can view all activity" ON public.admin_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true
    )
  );

CREATE POLICY "System can log admin activity" ON public.admin_activity_logs
  FOR INSERT WITH CHECK (true);

-- Policies for processing_stats (admins can view)
CREATE POLICY "Admins can view processing stats" ON public.processing_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin', 'moderator') 
        AND au.is_active = true
    )
  );

CREATE POLICY "System can update processing stats" ON public.processing_stats
  FOR ALL WITH CHECK (true);

-- Policies for queue_workers (admins can view)
CREATE POLICY "Admins can view queue workers" ON public.queue_workers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin', 'moderator') 
        AND au.is_active = true
    )
  );

CREATE POLICY "System can manage queue workers" ON public.queue_workers
  FOR ALL WITH CHECK (true);

-- Utility functions for admin operations

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = user_uuid 
      AND role IN ('super_admin', 'admin', 'moderator') 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin role
CREATE OR REPLACE FUNCTION public.get_admin_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  admin_role TEXT;
BEGIN
  SELECT role INTO admin_role
  FROM public.admin_users 
  WHERE user_id = user_uuid AND is_active = true;
  
  RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  admin_user_id UUID,
  action_name TEXT,
  resource_type_param TEXT DEFAULT NULL,
  resource_id_param TEXT DEFAULT NULL,
  old_values_param JSONB DEFAULT NULL,
  new_values_param JSONB DEFAULT NULL,
  details_param JSONB DEFAULT NULL,
  ip_address_param TEXT DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL,
  session_id_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
  admin_email_val TEXT;
BEGIN
  -- Get admin email
  SELECT email INTO admin_email_val
  FROM public.admin_users 
  WHERE id = admin_user_id;
  
  -- Insert activity log
  INSERT INTO public.admin_activity_logs (
    admin_id, admin_email, action, resource_type, resource_id,
    old_values, new_values, details, ip_address, user_agent, session_id
  ) VALUES (
    admin_user_id, admin_email_val, action_name, resource_type_param, resource_id_param,
    old_values_param, new_values_param, details_param, ip_address_param, user_agent_param, session_id_param
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update processing statistics
CREATE OR REPLACE FUNCTION public.update_processing_stats(
  stat_date DATE DEFAULT CURRENT_DATE,
  videos_added_delta INTEGER DEFAULT 0,
  videos_processed_delta INTEGER DEFAULT 0,
  videos_failed_delta INTEGER DEFAULT 0,
  videos_retried_delta INTEGER DEFAULT 0,
  processing_time_delta INTEGER DEFAULT 0,
  transcripts_extracted_delta INTEGER DEFAULT 0,
  embeddings_generated_delta INTEGER DEFAULT 0,
  chunks_created_delta INTEGER DEFAULT 0,
  youtube_api_calls_delta INTEGER DEFAULT 0,
  openai_api_calls_delta INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  stats_id UUID;
BEGIN
  INSERT INTO public.processing_stats (
    date, videos_added, videos_processed, videos_failed, videos_retried,
    total_processing_time_ms, transcripts_extracted, embeddings_generated, chunks_created,
    api_calls_youtube, api_calls_openai, updated_at
  ) VALUES (
    stat_date, videos_added_delta, videos_processed_delta, videos_failed_delta, videos_retried_delta,
    processing_time_delta, transcripts_extracted_delta, embeddings_generated_delta, chunks_created_delta,
    youtube_api_calls_delta, openai_api_calls_delta, NOW()
  )
  ON CONFLICT (date) DO UPDATE SET
    videos_added = processing_stats.videos_added + videos_added_delta,
    videos_processed = processing_stats.videos_processed + videos_processed_delta,
    videos_failed = processing_stats.videos_failed + videos_failed_delta,
    videos_retried = processing_stats.videos_retried + videos_retried_delta,
    total_processing_time_ms = processing_stats.total_processing_time_ms + processing_time_delta,
    transcripts_extracted = processing_stats.transcripts_extracted + transcripts_extracted_delta,
    embeddings_generated = processing_stats.embeddings_generated + embeddings_generated_delta,
    chunks_created = processing_stats.chunks_created + chunks_created_delta,
    api_calls_youtube = processing_stats.api_calls_youtube + youtube_api_calls_delta,
    api_calls_openai = processing_stats.api_calls_openai + openai_api_calls_delta,
    average_processing_time_ms = CASE 
      WHEN (processing_stats.videos_processed + videos_processed_delta) > 0 
      THEN (processing_stats.total_processing_time_ms + processing_time_delta) / (processing_stats.videos_processed + videos_processed_delta)
      ELSE 0 
    END,
    success_rate = CASE 
      WHEN (processing_stats.videos_processed + videos_processed_delta + processing_stats.videos_failed + videos_failed_delta) > 0
      THEN ROUND(
        ((processing_stats.videos_processed + videos_processed_delta)::DECIMAL / 
         (processing_stats.videos_processed + videos_processed_delta + processing_stats.videos_failed + videos_failed_delta)) * 100, 2
      )
      ELSE 0 
    END,
    error_rate = CASE 
      WHEN (processing_stats.videos_processed + videos_processed_delta + processing_stats.videos_failed + videos_failed_delta) > 0
      THEN ROUND(
        ((processing_stats.videos_failed + videos_failed_delta)::DECIMAL / 
         (processing_stats.videos_processed + videos_processed_delta + processing_stats.videos_failed + videos_failed_delta)) * 100, 2
      )
      ELSE 0 
    END,
    updated_at = NOW()
  RETURNING id INTO stats_id;
  
  RETURN stats_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get queue statistics
CREATE OR REPLACE FUNCTION public.get_queue_stats()
RETURNS TABLE (
  total_queued INTEGER,
  pending INTEGER,
  processing INTEGER,
  completed INTEGER,
  failed INTEGER,
  avg_processing_time_ms INTEGER,
  oldest_pending_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_queued,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending,
    COUNT(*) FILTER (WHERE status IN ('fetching', 'extracting', 'chunking', 'embedding', 'storing'))::INTEGER as processing,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed,
    COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed,
    COALESCE(AVG(processing_time_ms) FILTER (WHERE processing_time_ms IS NOT NULL), 0)::INTEGER as avg_processing_time_ms,
    COALESCE(
      EXTRACT(EPOCH FROM (NOW() - MIN(created_at) FILTER (WHERE status = 'pending'))) / 60, 
      0
    )::INTEGER as oldest_pending_minutes
  FROM public.video_queue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to automatically update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to tables with updated_at columns
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_queue_updated_at BEFORE UPDATE ON public.video_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processing_stats_updated_at BEFORE UPDATE ON public.processing_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_queue_workers_updated_at BEFORE UPDATE ON public.queue_workers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions to service role
GRANT ALL ON public.admin_users TO service_role;
GRANT ALL ON public.video_queue TO service_role;
GRANT ALL ON public.extraction_logs TO service_role;
GRANT ALL ON public.admin_activity_logs TO service_role;
GRANT ALL ON public.processing_stats TO service_role;
GRANT ALL ON public.queue_workers TO service_role;

-- Comments for documentation
COMMENT ON TABLE public.admin_users IS 'Admin users with role-based access control';
COMMENT ON TABLE public.video_queue IS 'YouTube videos queued for processing with status tracking';
COMMENT ON TABLE public.extraction_logs IS 'Detailed logs of all processing steps for debugging';
COMMENT ON TABLE public.admin_activity_logs IS 'Audit trail of all admin actions';
COMMENT ON TABLE public.processing_stats IS 'Daily statistics for analytics dashboard';
COMMENT ON TABLE public.queue_workers IS 'Worker process status and health monitoring';

COMMENT ON FUNCTION public.is_admin IS 'Check if a user has admin privileges';
COMMENT ON FUNCTION public.get_admin_role IS 'Get the admin role of a user';
COMMENT ON FUNCTION public.log_admin_activity IS 'Log admin actions for audit trail';
COMMENT ON FUNCTION public.update_processing_stats IS 'Update daily processing statistics';
COMMENT ON FUNCTION public.get_queue_stats IS 'Get current queue processing statistics';