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