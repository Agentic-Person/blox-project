# AI Wizard Rate Limiting Implementation

## Overview

This document describes the complete implementation of rate limiting for the Blox Wizard AI chat system to prevent abuse and control OpenAI API costs.

## Rate Limits

- **Free Users**: 3 questions per day
- **Premium Users**: 10 questions per day (hard cap for all users)

## Files Created/Modified

### 1. Database Migration: `supabase/migrations/012_ai_usage_tracking.sql`

Creates the complete rate limiting infrastructure:

- **Table**: `user_ai_usage` - Tracks daily AI question usage per user
- **Function**: `get_user_ai_usage(user_id)` - Returns usage info, limits, and premium status
- **Function**: `increment_ai_usage(user_id)` - Increments usage count and enforces limits
- **Function**: `cleanup_old_ai_usage()` - Removes records older than 90 days
- **RLS Policies**: Users can only view/manage their own usage
- **Indexes**: Fast lookups by user_id and date

### 2. Client-Side Service: `src/lib/services/ai-usage-service.ts`

Client-side service for components to interact with usage tracking:

**Functions:**
- `getUserDailyUsage(userId)` - Get current usage stats
- `incrementUsage(userId)` - Increment question count (not used client-side)
- `isUserPremium(userId)` - Check premium status
- `canUserAskQuestion(userId)` - Check if user can ask another question
- `getUsageStatusMessage(userId)` - Get formatted status message
- `resetUserUsage(userId)` - Admin function to reset usage

### 3. API Route: `src/app/api/chat/blox-wizard/route.ts`

**Changes:**
- Added server-side rate limit helper functions (inline, not imported)
- Added authentication check (rejects anonymous users)
- **CRITICAL**: Checks rate limits BEFORE calling OpenAI API
- Returns 429 status code when limit exceeded
- Increments usage count AFTER successful OpenAI response
- Returns remaining questions in response

**Response Format:**
```typescript
{
  answer: string
  videoReferences: VideoReference[]
  suggestedQuestions: string[]
  usageRemaining: number      // NEW
  dailyLimit: number          // NEW
  isPremium: boolean          // NEW
  responseTime: string
}
```

**Error Response (429):**
```typescript
{
  error: 'Rate limit exceeded'
  message: string             // User-friendly message
  usageRemaining: 0
  dailyLimit: number
  isPremium: boolean
  upgradeRequired: boolean    // True for free users
}
```

### 4. AI Chat UI: `src/components/blox-wizard/AIChat.tsx`

**Changes:**
- Added `usage` state to track remaining questions
- Loads usage on component mount
- Displays usage badge in header (color-coded by remaining count)
- Handles 429 rate limit errors gracefully
- Updates usage state after each response
- Disables send button when limit reached
- Shows upgrade prompts when limit reached or low
- Color-coded warnings:
  - **Red**: 0 questions remaining
  - **Yellow**: 1-2 questions remaining (free users)
  - **Teal**: 3+ questions remaining

**UI Features:**
- Usage badge shows: "X/Y questions (Premium)" or "X/Y questions"
- Warning banner when 0 questions left
- Low questions warning (1-2 remaining for free users)
- Upgrade prompt with "Learn More" link
- Send button disabled when limit reached

## Database Schema

### Table: `user_ai_usage`

```sql
CREATE TABLE user_ai_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  question_count INTEGER NOT NULL DEFAULT 0,
  last_question_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, date)
);
```

### Function: `get_user_ai_usage(p_user_id UUID)`

Returns:
- `question_count`: Questions asked today
- `daily_limit`: 3 or 10 based on premium status
- `remaining_questions`: Calculated remaining
- `is_premium`: Boolean from user_profiles.data.isPremium
- `date`: Current date

### Function: `increment_ai_usage(p_user_id UUID)`

Returns:
- `success`: Boolean (false if limit exceeded)
- `new_count`: Updated question count
- `remaining`: Remaining questions
- `message`: User-friendly message

## Premium Status Detection

Premium status is determined by checking `user_profiles.data.isPremium` flag:

```sql
SELECT (data->>'isPremium')::BOOLEAN
FROM public.user_profiles
WHERE user_id = p_user_id
```

To upgrade a user to premium, update their profile:

```sql
UPDATE user_profiles
SET data = jsonb_set(data, '{isPremium}', 'true'::jsonb)
WHERE user_id = '<user_id>';
```

## Security Features

1. **Row Level Security (RLS)**: Users can only access their own usage data
2. **Authentication Required**: API rejects anonymous users
3. **Server-Side Validation**: All rate limiting logic runs server-side
4. **No Client-Side Bypass**: Client cannot increment usage directly
5. **Atomic Operations**: Database functions ensure race condition safety

## Cost Protection

The rate limiting system protects against:

1. **Unlimited API calls**: Hard cap of 10 questions/day for everyone
2. **Abuse by free users**: Limited to 3 questions/day
3. **Forgotten test accounts**: Auto-cleanup after 90 days
4. **Rapid-fire requests**: Usage tracked per question
5. **Premium abuse**: Even premium users have a 10/day hard cap

## Testing Checklist

### Free User Testing
- [ ] Load AI Chat and see usage badge showing "3/3 questions"
- [ ] Ask a question, badge updates to "2/3 questions"
- [ ] Ask 3 questions total, send button disables
- [ ] See red warning banner "Free limit reached (3/3)"
- [ ] See upgrade prompt with "Learn More" link
- [ ] Try to ask 4th question, get 429 error
- [ ] Wait until next day, limit resets to 3/3

### Premium User Testing
- [ ] Set user as premium in database
- [ ] See badge showing "10/10 questions (Premium)"
- [ ] Ask questions, badge counts down correctly
- [ ] At 10 questions, send button disables
- [ ] See warning "Daily limit reached (10/10)"
- [ ] No upgrade prompt shown (already premium)
- [ ] Limit resets next day to 10/10

### Low Questions Warning
- [ ] Free user at 2 remaining sees yellow warning
- [ ] Premium user at 2 remaining sees no warning (not low for them)
- [ ] Warning message appropriate for user tier

### Error Handling
- [ ] API returns 429 when limit exceeded
- [ ] Error message saved to chat history
- [ ] Toast notification shows appropriate message
- [ ] UI gracefully handles network errors

## Deployment Steps

1. **Apply Migration** (REQUIRED FIRST):
   ```bash
   # Option 1: Via Supabase CLI (if linked)
   npx supabase db push

   # Option 2: Via Supabase Dashboard
   # Go to: https://supabase.com/dashboard/project/jpkwtpvwimhclncdswdk/sql
   # Copy contents of supabase/migrations/012_ai_usage_tracking.sql
   # Paste and run in SQL Editor
   ```

2. **Verify Database Objects**:
   ```sql
   -- Check table exists
   SELECT * FROM user_ai_usage LIMIT 1;

   -- Check functions exist
   SELECT * FROM get_user_ai_usage('00000000-0000-0000-0000-000000000000');
   ```

3. **Test with Dev Account**:
   - Log in to app
   - Open AI Chat
   - Verify usage badge appears
   - Ask a question
   - Verify count decrements

4. **Set Premium Test User**:
   ```sql
   UPDATE user_profiles
   SET data = jsonb_set(
     COALESCE(data, '{}'::jsonb),
     '{isPremium}',
     'true'::jsonb
   )
   WHERE user_id = '<your-test-user-id>';
   ```

5. **Monitor in Production**:
   - Check Supabase logs for rate limit errors
   - Monitor OpenAI API usage dashboard
   - Track user_ai_usage table growth

## Future Enhancements

1. **Stripe Integration**: Auto-set isPremium flag on successful payment
2. **Admin Dashboard**: View usage statistics per user
3. **Dynamic Limits**: Adjust limits based on abuse patterns
4. **Usage Analytics**: Track question trends and popular topics
5. **Soft Limits**: Warning at 80% usage before hard limit
6. **Premium Tiers**: Different limits for different subscription levels

## Troubleshooting

### Issue: "Unable to fetch usage data"
- Check Supabase connection
- Verify migration applied successfully
- Check RLS policies allow user access

### Issue: Usage not incrementing
- Check function `increment_ai_usage` exists
- Verify API route calls increment after OpenAI success
- Check for errors in browser console

### Issue: Premium status not detected
- Verify `user_profiles.data.isPremium` is set to `true`
- Check data type is boolean, not string
- Ensure user_profiles record exists for user

### Issue: Limit not resetting daily
- Function uses `CURRENT_DATE`, should auto-reset
- Check server timezone matches expectations
- Verify unique constraint on (user_id, date)

## Environment Variables

No new environment variables required. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for API route)

## Summary

The rate limiting system is now fully implemented with:
- ✅ Database tables and functions
- ✅ Server-side enforcement in API route
- ✅ Client-side usage display and warnings
- ✅ Premium user support
- ✅ Security via RLS
- ✅ Cost protection with hard caps
- ✅ Graceful error handling
- ✅ User-friendly upgrade prompts

**Next step**: Apply the migration to your Supabase database using the SQL editor.
