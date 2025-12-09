-- Upgrade User to Premium
-- Use this script to manually upgrade users to premium status
-- This is temporary until Stripe integration is complete

-- =============================================================================
-- UPGRADE SINGLE USER BY EMAIL
-- =============================================================================

-- Replace 'user@example.com' with the actual user email
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT := 'user@example.com'; -- CHANGE THIS
BEGIN
  -- Find user ID by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', v_user_email;
  END IF;

  -- Create user_profiles record if it doesn't exist
  INSERT INTO user_profiles (user_id, data)
  VALUES (v_user_id, '{}'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;

  -- Set isPremium flag
  UPDATE user_profiles
  SET data = jsonb_set(
    COALESCE(data, '{}'::jsonb),
    '{isPremium}',
    'true'::jsonb
  ),
  updated_at = NOW()
  WHERE user_id = v_user_id;

  RAISE NOTICE 'User % (ID: %) upgraded to premium', v_user_email, v_user_id;
END $$;

-- =============================================================================
-- UPGRADE SINGLE USER BY ID
-- =============================================================================

-- Replace with actual user ID
UPDATE user_profiles
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb),
  '{isPremium}',
  'true'::jsonb
),
updated_at = NOW()
WHERE user_id = '00000000-0000-0000-0000-000000000000'; -- CHANGE THIS

-- =============================================================================
-- DOWNGRADE USER (REMOVE PREMIUM)
-- =============================================================================

-- By email
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT := 'user@example.com'; -- CHANGE THIS
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', v_user_email;
  END IF;

  UPDATE user_profiles
  SET data = jsonb_set(
    COALESCE(data, '{}'::jsonb),
    '{isPremium}',
    'false'::jsonb
  ),
  updated_at = NOW()
  WHERE user_id = v_user_id;

  RAISE NOTICE 'User % (ID: %) downgraded to free', v_user_email, v_user_id;
END $$;

-- =============================================================================
-- BULK UPGRADE USERS
-- =============================================================================

-- Upgrade multiple users by email
DO $$
DECLARE
  v_user_emails TEXT[] := ARRAY[
    'user1@example.com',
    'user2@example.com',
    'user3@example.com'
  ]; -- CHANGE THIS ARRAY
  v_email TEXT;
  v_user_id UUID;
  v_count INTEGER := 0;
BEGIN
  FOREACH v_email IN ARRAY v_user_emails
  LOOP
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;

    IF v_user_id IS NOT NULL THEN
      -- Create profile if needed
      INSERT INTO user_profiles (user_id, data)
      VALUES (v_user_id, '{}'::jsonb)
      ON CONFLICT (user_id) DO NOTHING;

      -- Upgrade to premium
      UPDATE user_profiles
      SET data = jsonb_set(
        COALESCE(data, '{}'::jsonb),
        '{isPremium}',
        'true'::jsonb
      ),
      updated_at = NOW()
      WHERE user_id = v_user_id;

      v_count := v_count + 1;
      RAISE NOTICE 'Upgraded: %', v_email;
    ELSE
      RAISE WARNING 'User not found: %', v_email;
    END IF;
  END LOOP;

  RAISE NOTICE 'Total users upgraded: %', v_count;
END $$;

-- =============================================================================
-- VERIFY PREMIUM STATUS
-- =============================================================================

-- Check premium status by email
SELECT
  u.email,
  u.id AS user_id,
  COALESCE((up.data->>'isPremium')::BOOLEAN, FALSE) AS is_premium,
  up.updated_at AS profile_updated_at
FROM auth.users u
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE u.email = 'user@example.com'; -- CHANGE THIS

-- List all premium users
SELECT
  u.email,
  u.id AS user_id,
  u.created_at AS user_created_at,
  up.updated_at AS premium_since
FROM auth.users u
JOIN user_profiles up ON up.user_id = u.id
WHERE (up.data->>'isPremium')::BOOLEAN = TRUE
ORDER BY up.updated_at DESC;

-- Count premium vs free users
SELECT
  CASE
    WHEN (up.data->>'isPremium')::BOOLEAN THEN 'Premium'
    ELSE 'Free'
  END AS tier,
  COUNT(*) AS user_count
FROM auth.users u
LEFT JOIN user_profiles up ON up.user_id = u.id
GROUP BY tier;

-- =============================================================================
-- PREMIUM USER USAGE STATS
-- =============================================================================

-- Show premium users and their AI usage
SELECT
  u.email,
  COALESCE(uau.question_count, 0) AS questions_today,
  CASE
    WHEN COALESCE(uau.question_count, 0) >= 10 THEN 'At Limit'
    WHEN COALESCE(uau.question_count, 0) >= 7 THEN 'High Usage'
    WHEN COALESCE(uau.question_count, 0) >= 4 THEN 'Medium Usage'
    WHEN COALESCE(uau.question_count, 0) >= 1 THEN 'Low Usage'
    ELSE 'No Usage'
  END AS usage_level,
  10 - COALESCE(uau.question_count, 0) AS remaining_questions,
  uau.last_question_at
FROM auth.users u
JOIN user_profiles up ON up.user_id = u.id
LEFT JOIN user_ai_usage uau ON uau.user_id = u.id AND uau.date = CURRENT_DATE
WHERE (up.data->>'isPremium')::BOOLEAN = TRUE
ORDER BY uau.question_count DESC NULLS LAST;

-- =============================================================================
-- NOTES
-- =============================================================================

/*
Usage Instructions:

1. UPGRADE BY EMAIL:
   - Edit v_user_email in the first DO block
   - Run the query
   - User will have 10 questions/day

2. UPGRADE BY ID:
   - Replace the UUID in the UPDATE statement
   - Run the query

3. BULK UPGRADE:
   - Edit the v_user_emails array
   - Run the DO block
   - All users in array will be upgraded

4. VERIFY:
   - Use the SELECT queries to check status
   - Confirm isPremium is true

5. DOWNGRADE:
   - Use the downgrade section
   - Sets isPremium to false

Important Notes:
- Premium status is stored in user_profiles.data.isPremium
- Changes take effect immediately
- User will see new limit on next page load
- Usage resets daily at midnight
- Premium users get 10 questions/day (free get 3)

Future Integration:
- Stripe webhook will automatically set isPremium=true on payment
- This manual script is temporary for testing and support cases
- Consider adding premium_expires_at field for subscription management
*/
