-- Chat Conversation Persistence Migration
-- Enables Blox Wizard to remember chat history across sessions and page navigation

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
  ON public.chat_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_session_id
  ON public.chat_conversations(session_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message
  ON public.chat_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id
  ON public.chat_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
  ON public.chat_messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_role
  ON public.chat_messages(role);

-- Enable Row Level Security
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations
CREATE POLICY "Users can view own conversations"
  ON public.chat_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON public.chat_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON public.chat_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON public.chat_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view own messages"
  ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.chat_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own messages"
  ON public.chat_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

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
  -- Only generate title if it's NULL and this is a user message
  IF NEW.role = 'user' THEN
    SELECT title INTO first_user_message
    FROM public.chat_conversations
    WHERE id = NEW.conversation_id;

    -- If conversation has no title, use first 50 chars of first user message
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

-- Function to get user's recent conversations (for sidebar history)
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

-- Create view for conversation summaries
CREATE OR REPLACE VIEW public.conversation_summaries AS
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
FROM public.chat_conversations c
LEFT JOIN public.chat_messages m ON m.conversation_id = c.id
GROUP BY c.id, c.user_id, c.session_id, c.title, c.last_message_at, c.created_at;

-- Add comments for documentation
COMMENT ON TABLE public.chat_conversations IS 'Stores chat conversation sessions for Blox Wizard';
COMMENT ON TABLE public.chat_messages IS 'Stores individual chat messages within conversations';
COMMENT ON COLUMN public.chat_messages.video_context IS 'JSON object containing video context when chatting about specific videos';
COMMENT ON COLUMN public.chat_messages.video_references IS 'Array of video references suggested by AI in response';
COMMENT ON COLUMN public.chat_messages.suggested_questions IS 'Array of follow-up questions suggested by AI';
COMMENT ON FUNCTION public.update_conversation_timestamp() IS 'Automatically updates conversation last_message_at when new message is added';
COMMENT ON FUNCTION public.generate_conversation_title() IS 'Automatically generates conversation title from first user message';
COMMENT ON FUNCTION public.get_conversation_with_messages(TEXT, UUID, INTEGER) IS 'Retrieves conversation and all messages for a session';
COMMENT ON FUNCTION public.get_user_conversations(UUID, INTEGER) IS 'Retrieves user''s recent conversations with message counts';
COMMENT ON VIEW public.conversation_summaries IS 'Summary view of all conversations with message statistics';
