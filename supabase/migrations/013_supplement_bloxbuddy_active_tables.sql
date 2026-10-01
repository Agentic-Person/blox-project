-- 013_supplement_bloxbuddy_active_tables.sql
-- Supplementary migration: creates the ACTIVE tables/functions the app queries
-- but which were missing from the bloxbuddy schema because their original
-- migrations (003, 005) were .disabled.
--
-- DECISIONS (recon 2026-10-01):
--   INCLUDE (live, queried by uncommented code):
--     admin_users                 (auth-provider.tsx + middleware.ts)
--     ai_journeys                 (aiJourney.ts, live)
--     ai_journey_skills           (aiJourney.ts, live)
--     ai_journey_schedule         (aiJourney.ts, live)
--     ai_journey_insights         (aiJourney.ts, live)
--     ai_journey_chat             (aiJourney.ts, live)
--     ai_journey_preferences      (aiJourney.ts, live)
--     user_journey_summary (view) (aiJourney.ts, live)
--     search_transcript_chunks    (compat wrapper -> bloxbuddy tables)
--   EXCLUDE (dead / commented-out only):
--     learning_paths, learning_path_steps, chat_todo_suggestions
--     get_admin_role, log_admin_activity, is_admin, get_video_recommendations
--       (only reachable from admin-auth.ts, which nothing imports)

BEGIN;

-- =====================================================================
-- admin_users
-- =====================================================================
CREATE TABLE IF NOT EXISTS bloxbuddy.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('super_admin', 'admin', 'moderator')) DEFAULT 'moderator',
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bloxbuddy.admin_users ENABLE ROW LEVEL SECURITY;

-- A user may read their own admin row (this is how middleware/auth-provider
-- check "am I an admin"). Inserts/updates are admin-only; there are no live
-- insert/update callers, so we expose read-only for own row only.
CREATE POLICY "Admins can read own row"
  ON bloxbuddy.admin_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================================
-- ai_journeys
-- =====================================================================
CREATE TABLE IF NOT EXISTS bloxbuddy.ai_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  game_title TEXT NOT NULL,
  custom_goal TEXT,
  current_skill_id UUID,
  current_module TEXT,
  current_week INTEGER NOT NULL DEFAULT 0,
  current_day INTEGER NOT NULL DEFAULT 0,
  total_progress NUMERIC NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bloxbuddy.ai_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own journeys"
  ON bloxbuddy.ai_journeys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journeys"
  ON bloxbuddy.ai_journeys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journeys"
  ON bloxbuddy.ai_journeys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journeys"
  ON bloxbuddy.ai_journeys FOR DELETE USING (auth.uid() = user_id);

-- =====================================================================
-- ai_journey_skills
-- =====================================================================
CREATE TABLE IF NOT EXISTS bloxbuddy.ai_journey_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES bloxbuddy.ai_journeys(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  skill_description TEXT,
  skill_icon TEXT,
  skill_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'locked',
  video_count INTEGER NOT NULL DEFAULT 0,
  estimated_hours NUMERIC NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bloxbuddy.ai_journey_skills ENABLE ROW LEVEL SECURITY;

-- Ownership is via the parent journey.
CREATE POLICY "Users can read own journey skills"
  ON bloxbuddy.ai_journey_skills FOR SELECT
  USING (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));
CREATE POLICY "Users can insert own journey skills"
  ON bloxbuddy.ai_journey_skills FOR INSERT WITH CHECK
  (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));
CREATE POLICY "Users can update own journey skills"
  ON bloxbuddy.ai_journey_skills FOR UPDATE
  USING (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));
CREATE POLICY "Users can delete own journey skills"
  ON bloxbuddy.ai_journey_skills FOR DELETE
  USING (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));

-- =====================================================================
-- ai_journey_schedule
-- =====================================================================
CREATE TABLE IF NOT EXISTS bloxbuddy.ai_journey_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES bloxbuddy.ai_journeys(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  task_type TEXT NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  priority TEXT NOT NULL DEFAULT 'medium',
  skill_id TEXT,
  module_id TEXT,
  video_id UUID,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bloxbuddy.ai_journey_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own journey schedule"
  ON bloxbuddy.ai_journey_schedule FOR SELECT
  USING (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));
CREATE POLICY "Users can insert own journey schedule"
  ON bloxbuddy.ai_journey_schedule FOR INSERT WITH CHECK
  (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));
CREATE POLICY "Users can update own journey schedule"
  ON bloxbuddy.ai_journey_schedule FOR UPDATE
  USING (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));
CREATE POLICY "Users can delete own journey schedule"
  ON bloxbuddy.ai_journey_schedule FOR DELETE
  USING (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));

-- =====================================================================
-- ai_journey_insights
-- =====================================================================
CREATE TABLE IF NOT EXISTS bloxbuddy.ai_journey_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES bloxbuddy.ai_journeys(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  is_read BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bloxbuddy.ai_journey_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own journey insights"
  ON bloxbuddy.ai_journey_insights FOR SELECT
  USING (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));
CREATE POLICY "Users can insert own journey insights"
  ON bloxbuddy.ai_journey_insights FOR INSERT WITH CHECK
  (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));
CREATE POLICY "Users can update own journey insights"
  ON bloxbuddy.ai_journey_insights FOR UPDATE
  USING (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));
CREATE POLICY "Users can delete own journey insights"
  ON bloxbuddy.ai_journey_insights FOR DELETE
  USING (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));

-- =====================================================================
-- ai_journey_chat
-- =====================================================================
CREATE TABLE IF NOT EXISTS bloxbuddy.ai_journey_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES bloxbuddy.ai_journeys(id) ON DELETE CASCADE,
  message_role TEXT NOT NULL,
  message_content TEXT NOT NULL,
  context_data JSONB,
  attachments JSONB,
  suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bloxbuddy.ai_journey_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own journey chat"
  ON bloxbuddy.ai_journey_chat FOR SELECT
  USING (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));
CREATE POLICY "Users can insert own journey chat"
  ON bloxbuddy.ai_journey_chat FOR INSERT WITH CHECK
  (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));
CREATE POLICY "Users can update own journey chat"
  ON bloxbuddy.ai_journey_chat FOR UPDATE
  USING (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));
CREATE POLICY "Users can delete own journey chat"
  ON bloxbuddy.ai_journey_chat FOR DELETE
  USING (EXISTS (SELECT 1 FROM bloxbuddy.ai_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));

-- =====================================================================
-- ai_journey_preferences
-- =====================================================================
CREATE TABLE IF NOT EXISTS bloxbuddy.ai_journey_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_pace TEXT NOT NULL DEFAULT 'medium',
  preferred_study_times JSONB,
  notification_settings JSONB,
  ui_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bloxbuddy.ai_journey_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON bloxbuddy.ai_journey_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences"
  ON bloxbuddy.ai_journey_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences"
  ON bloxbuddy.ai_journey_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences"
  ON bloxbuddy.ai_journey_preferences FOR DELETE USING (auth.uid() = user_id);

-- =====================================================================
-- user_journey_summary (view)
-- =====================================================================
CREATE OR REPLACE VIEW bloxbuddy.user_journey_summary
WITH (security_invoker = true)
AS
SELECT
  j.id AS journey_id,
  j.user_id,
  j.game_type,
  j.game_title,
  j.total_progress,
  j.streak_days,
  j.last_activity_date,
  j.created_at,
  COUNT(s.id) AS total_skills,
  COUNT(s.id) FILTER (WHERE s.status = 'completed') AS completed_skills,
  COUNT(s.id) FILTER (WHERE s.status = 'current') AS current_skills,
  COALESCE(SUM(s.estimated_hours), 0) AS total_estimated_hours,
  COALESCE(SUM(s.estimated_hours) FILTER (WHERE s.status = 'completed'), 0) AS completed_hours
FROM bloxbuddy.ai_journeys j
LEFT JOIN bloxbuddy.ai_journey_skills s ON s.journey_id = j.id
GROUP BY j.id;

-- =====================================================================
-- search_transcript_chunks (compat wrapper -> bloxbuddy tables)
-- The app (openai-service.ts -> findRelevantVideoSegments -> searchTranscriptsVector)
-- calls this RPC. bloxbuddy only has search_similar_chunks (different signature
-- and return shape). This wrapper returns the shape the app actually consumes:
--   TranscriptChunk { id, video_id, youtube_id, chunk_index, start_time,
--                     end_time, text, video { title, creator, thumbnail_url } }
-- =====================================================================
DROP FUNCTION IF EXISTS bloxbuddy.search_transcript_chunks(vector, float, int);

CREATE OR REPLACE FUNCTION bloxbuddy.search_transcript_chunks(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.3,
  max_results int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  video_id uuid,
  youtube_id text,
  chunk_index int,
  start_time numeric,
  end_time numeric,
  text text,
  video jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vtc.id,
    vtc.video_id,
    vtc.youtube_id,
    vtc.chunk_index,
    vtc.start_time,
    vtc.end_time,
    vtc.text,
    jsonb_build_object(
      'title', v.title,
      'creator', v.creator,
      'thumbnail_url', v.thumbnail_url
    ) AS video
  FROM bloxbuddy.video_transcript_chunks vtc
  JOIN bloxbuddy.videos v ON v.id = vtc.video_id
  WHERE vtc.embedding IS NOT NULL
    AND (1 - (vtc.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY vtc.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
