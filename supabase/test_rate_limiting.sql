-- Test Script for AI Rate Limiting System
-- Run these queries in Supabase SQL Editor to test the system

-- =============================================================================
-- 1. VERIFY INSTALLATION
-- =============================================================================

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'user_ai_usage'
) AS table_exists;

-- Check if functions exist
SELECT EXISTS (
  SELECT FROM pg_proc
  WHERE proname = 'get_user_ai_usage'
) AS get_usage_exists,
EXISTS (
  SELECT FROM pg_proc
  WHERE proname = 'increment_ai_usage'
) AS increment_exists;

-- =============================================================================
-- 2. TEST FREE USER
-- =============================================================================

-- Replace with your test user ID
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- REPLACE THIS
BEGIN
  RAISE NOTICE 'Testing with user ID: %', test_user_id;
END $$;

-- Check initial usage (should be 0/3 for new user)
SELECT * FROM get_user_ai_usage('00000000-0000-0000-0000-000000000000');

-- Simulate asking 1st question
SELECT * FROM increment_ai_usage('00000000-0000-0000-0000-000000000000');

-- Check usage (should be 1/3, 2 remaining)
SELECT * FROM get_user_ai_usage('00000000-0000-0000-0000-000000000000');

-- Simulate asking 2nd question
SELECT * FROM increment_ai_usage('00000000-0000-0000-0000-000000000000');

-- Check usage (should be 2/3, 1 remaining)
SELECT * FROM get_user_ai_usage('00000000-0000-0000-0000-000000000000');

-- Simulate asking 3rd question
SELECT * FROM increment_ai_usage('00000000-0000-0000-0000-000000000000');

-- Check usage (should be 3/3, 0 remaining)
SELECT * FROM get_user_ai_usage('00000000-0000-0000-0000-000000000000');

-- Try to ask 4th question (should fail)
SELECT * FROM increment_ai_usage('00000000-0000-0000-0000-000000000000');
-- Should return success=false with message about limit reached

-- =============================================================================
-- 3. TEST PREMIUM USER
-- =============================================================================

-- First, upgrade user to premium
UPDATE user_profiles
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb),
  '{isPremium}',
  'true'::jsonb
)
WHERE user_id = '00000000-0000-0000-0000-000000000000'; -- REPLACE THIS

-- Reset usage for testing
DELETE FROM user_ai_usage
WHERE user_id = '00000000-0000-0000-0000-000000000000' -- REPLACE THIS
AND date = CURRENT_DATE;

-- Check usage (should be 0/10 now)
SELECT * FROM get_user_ai_usage('00000000-0000-0000-0000-000000000000');

-- Simulate asking 9 questions
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- REPLACE THIS
  i INTEGER;
  result RECORD;
BEGIN
  FOR i IN 1..9 LOOP
    SELECT * INTO result FROM increment_ai_usage(test_user_id);
    RAISE NOTICE 'Question %: success=%, remaining=%', i, result.success, result.remaining;
  END LOOP;
END $$;

-- Check usage (should be 9/10, 1 remaining)
SELECT * FROM get_user_ai_usage('00000000-0000-0000-0000-000000000000');

-- Ask 10th question
SELECT * FROM increment_ai_usage('00000000-0000-0000-0000-000000000000');

-- Check usage (should be 10/10, 0 remaining)
SELECT * FROM get_user_ai_usage('00000000-0000-0000-0000-000000000000');

-- Try to ask 11th question (should fail even for premium)
SELECT * FROM increment_ai_usage('00000000-0000-0000-0000-000000000000');
-- Should return success=false

-- =============================================================================
-- 4. VIEW ALL USAGE DATA
-- =============================================================================

-- See all usage records
SELECT
  u.email,
  uau.date,
  uau.question_count,
  uau.last_question_at,
  (up.data->>'isPremium')::BOOLEAN AS is_premium
FROM user_ai_usage uau
JOIN auth.users u ON u.id = uau.user_id
LEFT JOIN user_profiles up ON up.user_id = uau.user_id
ORDER BY uau.date DESC, uau.last_question_at DESC
LIMIT 20;

-- =============================================================================
-- 5. DAILY STATS
-- =============================================================================

-- Get today's usage statistics
SELECT
  COUNT(DISTINCT user_id) AS active_users,
  SUM(question_count) AS total_questions,
  AVG(question_count)::DECIMAL(10,2) AS avg_per_user,
  MAX(question_count) AS max_questions
FROM user_ai_usage
WHERE date = CURRENT_DATE;

-- Usage by tier
SELECT
  CASE
    WHEN (up.data->>'isPremium')::BOOLEAN THEN 'Premium'
    ELSE 'Free'
  END AS tier,
  COUNT(DISTINCT uau.user_id) AS users,
  SUM(uau.question_count) AS total_questions,
  AVG(uau.question_count)::DECIMAL(10,2) AS avg_per_user
FROM user_ai_usage uau
LEFT JOIN user_profiles up ON up.user_id = uau.user_id
WHERE uau.date = CURRENT_DATE
GROUP BY tier;

-- =============================================================================
-- 6. CLEANUP TEST DATA
-- =============================================================================

-- Remove test data for your user
DELETE FROM user_ai_usage
WHERE user_id = '00000000-0000-0000-0000-000000000000' -- REPLACE THIS
AND date = CURRENT_DATE;

-- Reset premium status
UPDATE user_profiles
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb),
  '{isPremium}',
  'false'::jsonb
)
WHERE user_id = '00000000-0000-0000-0000-000000000000'; -- REPLACE THIS

-- =============================================================================
-- 7. ADMIN FUNCTIONS
-- =============================================================================

-- Reset usage for a specific user (admin only)
-- Useful if user reports a problem
DELETE FROM user_ai_usage
WHERE user_id = '00000000-0000-0000-0000-000000000000' -- REPLACE THIS
AND date = CURRENT_DATE;

-- Clean up old records (runs automatically, but can be manual)
SELECT cleanup_old_ai_usage();

-- Find users hitting limits frequently
SELECT
  u.email,
  COUNT(*) AS days_at_limit,
  MAX(uau.date) AS last_limit_date,
  (up.data->>'isPremium')::BOOLEAN AS is_premium
FROM user_ai_usage uau
JOIN auth.users u ON u.id = uau.user_id
LEFT JOIN user_profiles up ON up.user_id = uau.user_id
WHERE uau.question_count >= 3  -- Free tier limit
GROUP BY u.email, is_premium
HAVING COUNT(*) >= 3  -- Hit limit 3+ days
ORDER BY days_at_limit DESC;

-- =============================================================================
-- NOTES
-- =============================================================================

/*
IMPORTANT: Before running these tests:
1. Replace all instances of '00000000-0000-0000-0000-000000000000' with your test user ID
2. Run queries one section at a time
3. Check results after each query
4. Clean up test data when done

Expected Results:
- Free users: 3 questions max per day
- Premium users: 10 questions max per day
- Usage resets at midnight (UTC or server timezone)
- Increment fails gracefully when limit reached
- RLS ensures users only see their own data
*/
