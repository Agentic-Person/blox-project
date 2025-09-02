-- Todo/Calendar System Tables
-- Migration: 005_todo_calendar_system
-- Created: 2025-09-01
-- Part of: Phase 3A Calendar/Todo Implementation

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TODOS SYSTEM TABLES
-- ==========================================

-- Main todos table
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  journey_id UUID REFERENCES ai_journeys(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'blocked')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category VARCHAR(50),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  video_references JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  estimated_minutes INT,
  actual_minutes INT,
  parent_todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  template_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_completion_time CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR 
    (status != 'completed' AND completed_at IS NULL)
  )
);

-- Todo templates for common tasks
CREATE TABLE todo_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  estimated_minutes INT,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  tags TEXT[] DEFAULT '{}',
  template_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Todo dependencies for task ordering
CREATE TABLE todo_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  depends_on_todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  dependency_type VARCHAR(20) DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'enables', 'suggests')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent self-dependencies
  CONSTRAINT no_self_dependency CHECK (todo_id != depends_on_todo_id),
  UNIQUE(todo_id, depends_on_todo_id)
);

-- ==========================================
-- CALENDAR/SCHEDULING SYSTEM TABLES
-- ==========================================

-- Schedule templates for common patterns
CREATE TABLE schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('daily', 'weekly', 'monthly', 'custom')),
  schedule_pattern JSONB NOT NULL,
  default_duration_minutes INT DEFAULT 30,
  is_system_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User scheduling preferences
CREATE TABLE user_schedule_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  timezone VARCHAR(50) DEFAULT 'UTC',
  preferred_study_times JSONB DEFAULT '[]'::jsonb, -- Array of time slots
  max_daily_study_hours DECIMAL(3,1) DEFAULT 2.0,
  break_duration_minutes INT DEFAULT 15,
  weekend_availability BOOLEAN DEFAULT true,
  preferred_session_length INT DEFAULT 45,
  avoid_times JSONB DEFAULT '[]'::jsonb,
  auto_schedule BOOLEAN DEFAULT false,
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule conflicts tracking
CREATE TABLE schedule_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  conflict_type VARCHAR(20) NOT NULL CHECK (conflict_type IN ('overlap', 'too_close', 'exceeds_limit')),
  primary_schedule_id UUID NOT NULL REFERENCES ai_journey_schedule(id),
  conflicting_schedule_id UUID REFERENCES ai_journey_schedule(id),
  conflict_details JSONB DEFAULT '{}'::jsonb,
  resolution_status VARCHAR(20) DEFAULT 'unresolved' CHECK (resolution_status IN ('unresolved', 'auto_resolved', 'user_resolved', 'ignored')),
  resolution_action TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- LEARNING PATH SYSTEM TABLES
-- ==========================================

-- Learning paths generated from goals
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  journey_id UUID REFERENCES ai_journeys(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  goal_analysis JSONB DEFAULT '{}'::jsonb,
  total_estimated_hours DECIMAL(5,2),
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  ai_generated BOOLEAN DEFAULT true,
  template_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual steps within learning paths
CREATE TABLE learning_path_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  step_type VARCHAR(20) NOT NULL CHECK (step_type IN ('video', 'practice', 'project', 'reading', 'quiz', 'milestone')),
  estimated_minutes INT,
  video_references JSONB DEFAULT '[]'::jsonb,
  resources JSONB DEFAULT '[]'::jsonb,
  completion_criteria TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  todo_id UUID REFERENCES todos(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(learning_path_id, step_order)
);

-- Learning path templates for reuse
CREATE TABLE learning_path_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_hours DECIMAL(5,2),
  template_data JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_system_template BOOLEAN DEFAULT false,
  usage_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User skill assessments for path generation
CREATE TABLE user_skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  skill_category VARCHAR(50) NOT NULL,
  assessment_type VARCHAR(20) DEFAULT 'self_reported' CHECK (assessment_type IN ('self_reported', 'ai_analyzed', 'peer_reviewed', 'test_based')),
  skill_level VARCHAR(20) CHECK (skill_level IN ('none', 'beginner', 'intermediate', 'advanced', 'expert')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  evidence_data JSONB DEFAULT '{}'::jsonb,
  assessment_date TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  
  -- Unique constraint will be added as index below
);

-- ==========================================
-- PROGRESS SYNC SYSTEM TABLES  
-- ==========================================

-- Progress events for cross-system sync
CREATE TABLE progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  event_type VARCHAR(30) NOT NULL,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('todo', 'schedule', 'learning_path', 'video', 'achievement')),
  entity_id UUID NOT NULL,
  event_data JSONB NOT NULL,
  source_system VARCHAR(20) NOT NULL CHECK (source_system IN ('todo', 'calendar', 'ai_journey', 'video', 'chat')),
  sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'processing', 'synced', 'failed', 'ignored')),
  processed_at TIMESTAMPTZ,
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress conflicts between systems
CREATE TABLE progress_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  conflict_type VARCHAR(30) NOT NULL,
  primary_event_id UUID NOT NULL REFERENCES progress_events(id),
  conflicting_event_id UUID NOT NULL REFERENCES progress_events(id),
  conflict_details JSONB DEFAULT '{}'::jsonb,
  resolution_strategy VARCHAR(30),
  resolution_status VARCHAR(20) DEFAULT 'unresolved' CHECK (resolution_status IN ('unresolved', 'auto_resolved', 'user_resolved', 'escalated')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress summary for dashboards
CREATE TABLE user_progress_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  total_todos INT DEFAULT 0,
  completed_todos INT DEFAULT 0,
  active_learning_paths INT DEFAULT 0,
  total_study_hours DECIMAL(6,2) DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  achievements_count INT DEFAULT 0,
  summary_data JSONB DEFAULT '{}'::jsonb,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievement system
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  achievement_type VARCHAR(30) NOT NULL,
  achievement_key VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  points INT DEFAULT 0,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_key)
);

-- System sync status tracking
CREATE TABLE system_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_name VARCHAR(20) NOT NULL CHECK (system_name IN ('todo', 'calendar', 'ai_journey', 'video', 'achievements')),
  last_sync_at TIMESTAMPTZ,
  sync_status VARCHAR(20) DEFAULT 'healthy' CHECK (sync_status IN ('healthy', 'degraded', 'failed')),
  error_count INT DEFAULT 0,
  last_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(system_name)
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Todos indexes
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_journey_id ON todos(journey_id);
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_category ON todos(category);
CREATE INDEX idx_todos_parent_todo_id ON todos(parent_todo_id);

-- Calendar indexes
CREATE INDEX idx_schedule_conflicts_user_id ON schedule_conflicts(user_id);
CREATE INDEX idx_schedule_conflicts_status ON schedule_conflicts(resolution_status);
CREATE INDEX idx_user_schedule_preferences_user_id ON user_schedule_preferences(user_id);

-- Learning paths indexes
CREATE INDEX idx_learning_paths_user_id ON learning_paths(user_id);
CREATE INDEX idx_learning_paths_journey_id ON learning_paths(journey_id);
CREATE INDEX idx_learning_paths_status ON learning_paths(status);
CREATE INDEX idx_learning_path_steps_path_id ON learning_path_steps(learning_path_id);
CREATE INDEX idx_learning_path_steps_order ON learning_path_steps(learning_path_id, step_order);
CREATE INDEX idx_user_skill_assessments_user_id ON user_skill_assessments(user_id);
CREATE UNIQUE INDEX idx_user_skill_assessments_current ON user_skill_assessments(user_id, skill_category) WHERE is_current = true;

-- Progress sync indexes
CREATE INDEX idx_progress_events_user_id ON progress_events(user_id);
CREATE INDEX idx_progress_events_type ON progress_events(event_type);
CREATE INDEX idx_progress_events_entity ON progress_events(entity_type, entity_id);
CREATE INDEX idx_progress_events_source ON progress_events(source_system);
CREATE INDEX idx_progress_events_sync_status ON progress_events(sync_status);
CREATE INDEX idx_progress_events_created_at ON progress_events(created_at);

-- Achievements indexes
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_type ON achievements(achievement_type);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_schedule_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_sync_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user-specific data
CREATE POLICY "Users can manage their own todos" ON todos
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view active templates" ON todo_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their todo dependencies" ON todo_dependencies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM todos WHERE id = todo_id AND user_id = auth.uid()::text)
  );

CREATE POLICY "Users can view active schedule templates" ON schedule_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their schedule preferences" ON user_schedule_preferences
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their schedule conflicts" ON schedule_conflicts
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their learning paths" ON learning_paths
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their learning path steps" ON learning_path_steps
  FOR ALL USING (
    EXISTS (SELECT 1 FROM learning_paths WHERE id = learning_path_id AND user_id = auth.uid()::text)
  );

CREATE POLICY "Users can view active learning path templates" ON learning_path_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their skill assessments" ON user_skill_assessments
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their progress events" ON progress_events
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their progress conflicts" ON progress_conflicts
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their progress summary" ON user_progress_summary
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their achievements" ON achievements
  FOR ALL USING (auth.uid()::text = user_id);

-- System administrators can manage system sync status
CREATE POLICY "Admin can manage sync status" ON system_sync_status
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ==========================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_templates_updated_at BEFORE UPDATE ON todo_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_templates_updated_at BEFORE UPDATE ON schedule_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_schedule_preferences_updated_at BEFORE UPDATE ON user_schedule_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_conflicts_updated_at BEFORE UPDATE ON schedule_conflicts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_path_steps_updated_at BEFORE UPDATE ON learning_path_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_path_templates_updated_at BEFORE UPDATE ON learning_path_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skill_assessments_updated_at BEFORE UPDATE ON user_skill_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_summary_updated_at BEFORE UPDATE ON user_progress_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_sync_status_updated_at BEFORE UPDATE ON system_sync_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- INITIAL DATA SEEDING
-- ==========================================

-- Insert default schedule templates
INSERT INTO schedule_templates (name, description, template_type, schedule_pattern, default_duration_minutes, is_system_template) VALUES
('Daily Study Session', 'Standard daily learning block', 'daily', '{"time": "19:00", "duration": 45}', 45, true),
('Morning Learning', 'Early morning focused session', 'daily', '{"time": "07:00", "duration": 60}', 60, true),
('Weekend Deep Dive', 'Extended weekend learning', 'weekly', '{"days": ["saturday", "sunday"], "time": "14:00", "duration": 120}', 120, true),
('Quick Practice', 'Short practice sessions', 'daily', '{"time": "18:00", "duration": 30}', 30, true);

-- Insert common todo templates
INSERT INTO todo_templates (name, description, category, estimated_minutes, priority, tags) VALUES
('Watch Video Tutorial', 'Complete a video tutorial from the curriculum', 'learning', 30, 'medium', ARRAY['video', 'tutorial']),
('Practice Coding Challenge', 'Work on coding exercises', 'practice', 45, 'high', ARRAY['coding', 'practice']),
('Build Mini Project', 'Create a small project to reinforce concepts', 'project', 120, 'high', ARRAY['project', 'hands-on']),
('Review Previous Week', 'Review and consolidate previous learning', 'review', 60, 'medium', ARRAY['review', 'consolidation']),
('Setup Development Environment', 'Configure tools and environment', 'setup', 90, 'high', ARRAY['setup', 'tools']);

-- Insert learning path templates
INSERT INTO learning_path_templates (name, description, category, difficulty_level, estimated_hours, template_data, tags, is_system_template) VALUES
('Beginner Game Development', 'Complete path for game development beginners', 'game-dev', 'beginner', 40.0, '{"modules": ["basics", "scripting", "ui", "publishing"]}', ARRAY['beginner', 'game-dev', 'roblox'], true),
('Advanced Scripting Mastery', 'Deep dive into Roblox scripting', 'scripting', 'advanced', 60.0, '{"modules": ["lua-advanced", "networking", "optimization", "architecture"]}', ARRAY['advanced', 'scripting', 'lua'], true),
('UI/UX Design Fundamentals', 'Learn interface design for games', 'design', 'intermediate', 25.0, '{"modules": ["design-principles", "roblox-ui", "user-experience"]}', ARRAY['design', 'ui', 'ux'], true);

-- Initialize system sync status
INSERT INTO system_sync_status (system_name, sync_status) VALUES
('todo', 'healthy'),
('calendar', 'healthy'),
('ai_journey', 'healthy'),
('video', 'healthy'),
('achievements', 'healthy');

-- ==========================================
-- COMMENTS AND DOCUMENTATION
-- ==========================================

COMMENT ON TABLE todos IS 'Main todo/task management table with support for hierarchical todos and templates';
COMMENT ON TABLE todo_templates IS 'Reusable templates for common todo types';
COMMENT ON TABLE todo_dependencies IS 'Defines relationships and dependencies between todos';
COMMENT ON TABLE schedule_templates IS 'Templates for recurring schedule patterns';
COMMENT ON TABLE user_schedule_preferences IS 'User-specific scheduling preferences and availability';
COMMENT ON TABLE schedule_conflicts IS 'Tracks and manages scheduling conflicts';
COMMENT ON TABLE learning_paths IS 'AI-generated personalized learning journeys';
COMMENT ON TABLE learning_path_steps IS 'Individual steps within learning paths';
COMMENT ON TABLE learning_path_templates IS 'Reusable templates for learning path generation';
COMMENT ON TABLE user_skill_assessments IS 'User skill levels for personalized path generation';
COMMENT ON TABLE progress_events IS 'Event stream for cross-system progress synchronization';
COMMENT ON TABLE progress_conflicts IS 'Manages conflicts in progress data across systems';
COMMENT ON TABLE user_progress_summary IS 'Aggregated progress metrics for dashboard displays';
COMMENT ON TABLE achievements IS 'User achievements and gamification rewards';
COMMENT ON TABLE system_sync_status IS 'Health monitoring for cross-system synchronization';