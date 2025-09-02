-- AI Journey System Tables
-- Migration: 004_ai_journey
-- Created: 2025-08-28

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AI Journey main table
CREATE TABLE ai_journeys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  game_type VARCHAR(50) NOT NULL CHECK (game_type IN ('horror', 'rpg', 'racing', 'battle-royale', 'custom')),
  game_title VARCHAR(255) NOT NULL,
  custom_goal TEXT,
  current_skill_id TEXT,
  current_module TEXT,
  current_week INT DEFAULT 1 CHECK (current_week > 0),
  current_day INT DEFAULT 1 CHECK (current_day > 0),
  total_progress DECIMAL(5,2) DEFAULT 0 CHECK (total_progress >= 0 AND total_progress <= 100),
  streak_days INT DEFAULT 0 CHECK (streak_days >= 0),
  last_activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Journey skills
CREATE TABLE ai_journey_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID REFERENCES ai_journeys(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  skill_name VARCHAR(255) NOT NULL,
  skill_description TEXT,
  skill_icon VARCHAR(10),
  skill_order INT NOT NULL CHECK (skill_order > 0),
  status VARCHAR(20) DEFAULT 'locked' CHECK (status IN ('locked', 'current', 'completed')),
  video_count INT DEFAULT 0 CHECK (video_count >= 0),
  estimated_hours DECIMAL(4,2) DEFAULT 0 CHECK (estimated_hours >= 0),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(journey_id, skill_id)
);

-- AI Journey schedule
CREATE TABLE ai_journey_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID REFERENCES ai_journeys(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  task_type VARCHAR(20) NOT NULL CHECK (task_type IN ('video', 'practice', 'project', 'review')),
  task_title VARCHAR(255) NOT NULL,
  task_description TEXT,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  skill_id TEXT,
  module_id TEXT,
  video_id TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI insights and recommendations
CREATE TABLE ai_journey_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID REFERENCES ai_journeys(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('pace', 'suggestion', 'milestone', 'recommendation', 'tip')),
  title VARCHAR(255),
  message TEXT NOT NULL,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Journey chat history
CREATE TABLE ai_journey_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID REFERENCES ai_journeys(id) ON DELETE CASCADE,
  message_role VARCHAR(20) NOT NULL CHECK (message_role IN ('user', 'assistant')),
  message_content TEXT NOT NULL,
  context_data JSONB,
  attachments JSONB,
  suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences for AI Journey
CREATE TABLE ai_journey_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  learning_pace VARCHAR(20) DEFAULT 'medium' CHECK (learning_pace IN ('slow', 'medium', 'fast')),
  preferred_study_times JSONB DEFAULT '[]'::jsonb,
  notification_settings JSONB DEFAULT '{}'::jsonb,
  ui_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ai_journeys_user ON ai_journeys(user_id);
CREATE INDEX idx_ai_journeys_updated ON ai_journeys(updated_at DESC);

CREATE INDEX idx_journey_skills_journey ON ai_journey_skills(journey_id);
CREATE INDEX idx_journey_skills_status ON ai_journey_skills(status);
CREATE INDEX idx_journey_skills_order ON ai_journey_skills(journey_id, skill_order);

CREATE INDEX idx_journey_schedule_journey ON ai_journey_schedule(journey_id);
CREATE INDEX idx_journey_schedule_date ON ai_journey_schedule(scheduled_date);
CREATE INDEX idx_journey_schedule_completed ON ai_journey_schedule(completed, scheduled_date);

CREATE INDEX idx_journey_insights_journey ON ai_journey_insights(journey_id);
CREATE INDEX idx_journey_insights_type ON ai_journey_insights(insight_type);
CREATE INDEX idx_journey_insights_unread ON ai_journey_insights(journey_id, is_read) WHERE is_read = false;

CREATE INDEX idx_journey_chat_journey ON ai_journey_chat(journey_id);
CREATE INDEX idx_journey_chat_created ON ai_journey_chat(created_at DESC);

CREATE INDEX idx_journey_preferences_user ON ai_journey_preferences(user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_journeys_updated_at
    BEFORE UPDATE ON ai_journeys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_journey_skills_updated_at
    BEFORE UPDATE ON ai_journey_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_journey_schedule_updated_at
    BEFORE UPDATE ON ai_journey_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_journey_preferences_updated_at
    BEFORE UPDATE ON ai_journey_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE ai_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_journey_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_journey_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_journey_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_journey_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_journey_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_journeys
CREATE POLICY "Users can view their own journeys" ON ai_journeys
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own journeys" ON ai_journeys
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own journeys" ON ai_journeys
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own journeys" ON ai_journeys
    FOR DELETE USING (auth.uid()::text = user_id);

-- RLS Policies for ai_journey_skills
CREATE POLICY "Users can view their journey skills" ON ai_journey_skills
    FOR SELECT USING (
        journey_id IN (
            SELECT id FROM ai_journeys WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can modify their journey skills" ON ai_journey_skills
    FOR ALL USING (
        journey_id IN (
            SELECT id FROM ai_journeys WHERE user_id = auth.uid()::text
        )
    );

-- RLS Policies for ai_journey_schedule
CREATE POLICY "Users can view their journey schedule" ON ai_journey_schedule
    FOR SELECT USING (
        journey_id IN (
            SELECT id FROM ai_journeys WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can modify their journey schedule" ON ai_journey_schedule
    FOR ALL USING (
        journey_id IN (
            SELECT id FROM ai_journeys WHERE user_id = auth.uid()::text
        )
    );

-- RLS Policies for ai_journey_insights
CREATE POLICY "Users can view their journey insights" ON ai_journey_insights
    FOR SELECT USING (
        journey_id IN (
            SELECT id FROM ai_journeys WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can modify their journey insights" ON ai_journey_insights
    FOR ALL USING (
        journey_id IN (
            SELECT id FROM ai_journeys WHERE user_id = auth.uid()::text
        )
    );

-- RLS Policies for ai_journey_chat
CREATE POLICY "Users can view their journey chat" ON ai_journey_chat
    FOR SELECT USING (
        journey_id IN (
            SELECT id FROM ai_journeys WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can modify their journey chat" ON ai_journey_chat
    FOR ALL USING (
        journey_id IN (
            SELECT id FROM ai_journeys WHERE user_id = auth.uid()::text
        )
    );

-- RLS Policies for ai_journey_preferences
CREATE POLICY "Users can view their own preferences" ON ai_journey_preferences
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own preferences" ON ai_journey_preferences
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own preferences" ON ai_journey_preferences
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own preferences" ON ai_journey_preferences
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create helpful views
CREATE VIEW user_journey_summary AS
SELECT 
    j.id as journey_id,
    j.user_id,
    j.game_type,
    j.game_title,
    j.total_progress,
    j.streak_days,
    j.last_activity_date,
    j.created_at,
    COUNT(s.id) as total_skills,
    COUNT(s.id) FILTER (WHERE s.status = 'completed') as completed_skills,
    COUNT(s.id) FILTER (WHERE s.status = 'current') as current_skills,
    SUM(s.estimated_hours) as total_estimated_hours,
    SUM(s.estimated_hours) FILTER (WHERE s.status = 'completed') as completed_hours
FROM ai_journeys j
LEFT JOIN ai_journey_skills s ON j.id = s.journey_id
GROUP BY j.id, j.user_id, j.game_type, j.game_title, j.total_progress, 
         j.streak_days, j.last_activity_date, j.created_at;

-- Grant access to the view
GRANT SELECT ON user_journey_summary TO authenticated;

-- Comments for documentation
COMMENT ON TABLE ai_journeys IS 'Main AI learning journey data for each user';
COMMENT ON TABLE ai_journey_skills IS 'Individual skills within a learning journey';
COMMENT ON TABLE ai_journey_schedule IS 'Scheduled tasks and learning activities';
COMMENT ON TABLE ai_journey_insights IS 'AI-generated insights and recommendations';
COMMENT ON TABLE ai_journey_chat IS 'Chat history with AI assistant';
COMMENT ON TABLE ai_journey_preferences IS 'User preferences for AI journey experience';

COMMENT ON COLUMN ai_journeys.streak_days IS 'Current consecutive days of activity';
COMMENT ON COLUMN ai_journeys.last_activity_date IS 'Last date user was active in journey';
COMMENT ON COLUMN ai_journey_schedule.priority IS 'Task priority level for scheduling';
COMMENT ON COLUMN ai_journey_insights.expires_at IS 'When insight becomes irrelevant (optional)';
COMMENT ON COLUMN ai_journey_insights.metadata IS 'Additional structured data for insights';