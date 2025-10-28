-- Cleanup Mock User Data from Chat System
-- Run this script in Supabase SQL Editor to remove all mock/test chat data
-- IMPORTANT: This will permanently delete data. Make sure you want to proceed.

-- Step 1: Find all conversations with hardcoded 'user' as user_id
-- (This is from when components were passing 'user' instead of real user IDs)
-- Note: This finds conversations where user_id is NOT a valid UUID from auth.users
SELECT
  c.id,
  c.user_id,
  c.session_id,
  c.title,
  c.created_at,
  c.last_message_at,
  COUNT(m.id) as message_count
FROM chat_conversations c
LEFT JOIN chat_messages m ON m.conversation_id = c.id
WHERE c.user_id NOT IN (
  SELECT id FROM auth.users
)
GROUP BY c.id, c.user_id, c.session_id, c.title, c.created_at, c.last_message_at
ORDER BY c.created_at DESC;

-- Step 2: Delete all messages associated with mock conversations
-- (CASCADE should handle this, but being explicit)
DELETE FROM chat_messages
WHERE conversation_id IN (
  SELECT id FROM chat_conversations
  WHERE user_id NOT IN (
    SELECT id FROM auth.users
  )
);

-- Step 3: Delete all mock conversations
-- These are conversations where user_id is not a real auth.users ID
DELETE FROM chat_conversations
WHERE user_id NOT IN (
  SELECT id FROM auth.users
);

-- Step 4: Verify cleanup - should return 0 rows
SELECT
  c.id,
  c.user_id,
  c.session_id,
  COUNT(m.id) as message_count
FROM chat_conversations c
LEFT JOIN chat_messages m ON m.conversation_id = c.id
WHERE c.user_id NOT IN (
  SELECT id FROM auth.users
)
GROUP BY c.id, c.user_id, c.session_id;

-- Step 5: Show stats after cleanup
SELECT
  'Total Conversations' as metric,
  COUNT(*) as count
FROM chat_conversations
UNION ALL
SELECT
  'Total Messages',
  COUNT(*)
FROM chat_messages
UNION ALL
SELECT
  'Unique Users',
  COUNT(DISTINCT user_id)
FROM chat_conversations;

-- Optional: If you want to completely reset and start fresh
-- UNCOMMENT the lines below to delete ALL chat data (use with caution!)

-- TRUNCATE TABLE chat_messages CASCADE;
-- TRUNCATE TABLE chat_conversations CASCADE;

-- Notes:
-- 1. This script safely removes only conversations tied to non-existent users
-- 2. Real authenticated user data is preserved
-- 3. RLS policies ensure only users can see their own data
-- 4. After cleanup, the chat system will work with real users only
