# 🚀 Supabase Deployment Guide - Blox Wizard Chat System

## Step 1: Resume Supabase Project

1. **Navigate to your Supabase project:**
   - URL: https://supabase.com/dashboard/project/jpkwtpvwimhclncdswdk

2. **Unpause the project:**
   - Click "Resume Project" or "Restore Project" button
   - Wait for project to become active (usually 1-2 minutes)
   - Verify project status shows "Active" with green indicator

---

## Step 2: Deploy Database Migrations

### Option A: Using Supabase CLI (Recommended)

```bash
# Make sure you're in the project root
cd D:\BloxProject

# Link to your Supabase project (if not already linked)
supabase link --project-ref jpkwtpvwimhclncdswdk

# Push all migrations to Supabase
supabase db push

# This will deploy:
# - 002_video_content.sql (videos, transcripts, chunks tables)
# - 004_vector_search.sql (pgvector, search functions)
# - 007_chat_persistence.sql (chat conversations, messages)
```

### Option B: Manual Deployment via SQL Editor

If you don't have Supabase CLI or prefer manual deployment:

1. **Go to SQL Editor:**
   - https://supabase.com/dashboard/project/jpkwtpvwimhclncdswdk/sql/new

2. **Deploy in this order:**

   **First - Video Content Tables:**
   ```sql
   -- Copy entire contents of: supabase/migrations/002_video_content.sql
   -- Paste into SQL Editor
   -- Click "Run" or press Ctrl+Enter
   ```

   **Second - Vector Search Functions:**
   ```sql
   -- Copy entire contents of: supabase/migrations/004_vector_search.sql
   -- Paste into SQL Editor
   -- Click "Run" or press Ctrl+Enter
   ```

   **Third - Chat Persistence:**
   ```sql
   -- Copy entire contents of: supabase/migrations/007_chat_persistence.sql
   -- Paste into SQL Editor
   -- Click "Run" or press Ctrl+Enter
   ```

---

## Step 3: Verify Deployment

### Run these verification queries in SQL Editor:

```sql
-- 1. Check if all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'videos',
  'video_transcripts',
  'video_transcript_chunks',
  'chat_conversations',
  'chat_messages'
)
ORDER BY table_name;

-- Expected result: Should show all 5 tables


-- 2. Check if vector extension is enabled
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'vector';

-- Expected result: Should show 'vector' with version number


-- 3. Check if search functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'search_similar_chunks',
  'search_transcripts_hybrid',
  'search_video_transcripts',
  'get_conversation_with_messages',
  'get_user_conversations'
)
ORDER BY routine_name;

-- Expected result: Should show all 5 functions


-- 4. Check existing transcript data (if any)
SELECT
  (SELECT COUNT(*) FROM videos) as video_count,
  (SELECT COUNT(*) FROM video_transcript_chunks) as chunk_count,
  (SELECT COUNT(*) FROM video_transcript_chunks WHERE embedding IS NOT NULL) as embedded_count;

-- This will show if you have existing transcript data
```

---

## Step 4: Check Transcript Data Status

### If counts above are 0 (no data):

You mentioned having transcripts vectorized. Check if they exist:

1. **Check if data might be in a different schema or project**
2. **If data was lost when project paused:**
   - We'll need to re-run the transcript extraction
   - The script is ready: `scripts/extract-transcripts.py`
   - Module 1 videos need to be processed

### If counts show data exists:

Great! Your transcript data is intact. Proceed to testing.

---

## Step 5: Test Transcript Search

In SQL Editor, run:

```sql
-- Test vector search (if embeddings exist)
SELECT * FROM search_similar_chunks(
  (SELECT embedding FROM video_transcript_chunks LIMIT 1)::vector(1536),
  0.7,
  5
);

-- Test text search
SELECT * FROM search_video_transcripts('roblox scripting', 5);

-- Check Module 1 videos
SELECT youtube_id, title, module_id, week_id
FROM videos
WHERE module_id LIKE '%module%1%' OR module_id LIKE '%1%'
ORDER BY order_index
LIMIT 10;
```

---

## Step 6: Update Environment Variables (If Needed)

Verify these are set in `.env` and `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jpkwtpvwimhclncdswdk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here (for server-side operations)
OPENAI_API_KEY=your_openai_key_here
```

Get keys from: https://supabase.com/dashboard/project/jpkwtpvwimhclncdswdk/settings/api

---

## Step 7: Test from Application

### In your Next.js app:

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Open Blox Wizard:**
   - Dashboard: http://localhost:3000/dashboard (scroll to Blox Chat Wizard)
   - Full Page: http://localhost:3000/blox-wizard

3. **Send a test message:**
   ```
   "How do I create a teleport script in Roblox?"
   ```

4. **Check browser console for:**
   ```
   ✅ No Supabase errors
   ✅ Video references returned (if transcript data exists)
   ✅ AI response generated
   ```

5. **Check Network tab:**
   - Look for POST to `/api/chat/blox-wizard`
   - Response should include `videoReferences` array
   - If empty, transcript search is working but no data matched

---

## Common Issues & Solutions

### Issue: "pgvector extension not found"
**Solution:**
```sql
-- Run in SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### Issue: "Function search_similar_chunks does not exist"
**Solution:** Re-run migration 004_vector_search.sql

### Issue: "No video references returned"
**Possible causes:**
1. No transcript data in database
2. Embeddings not generated for transcripts
3. Search query doesn't match any content

**Check with:**
```sql
SELECT COUNT(*) FROM video_transcript_chunks WHERE embedding IS NOT NULL;
-- If 0, embeddings need to be generated
```

### Issue: "Chat messages not persisting"
**Solution:** Verify migration 007 was deployed and tables exist:
```sql
SELECT * FROM chat_conversations LIMIT 1;
SELECT * FROM chat_messages LIMIT 1;
```

---

## Next Steps After Deployment

1. ✅ **Test chat on dashboard** - Send a message
2. ✅ **Navigate away and back** - Verify message persists
3. ✅ **Test on full page** - Same conversation should appear
4. ✅ **Check video suggestions** - AI should suggest relevant Module 1 videos
5. ✅ **Verify conversation history** - Past chats should be saved

---

## Need Help?

**If you encounter errors:**
1. Check Supabase Logs: https://supabase.com/dashboard/project/jpkwtpvwimhclncdswdk/logs/explorer
2. Review migration files for any syntax errors
3. Ensure project is fully resumed and active
4. Verify API keys are correct in `.env`

**Status Check Commands:**
```sql
-- Quick health check
SELECT
  'Tables' as check_type,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
UNION ALL
SELECT
  'Functions',
  COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public'
UNION ALL
SELECT
  'Extensions',
  COUNT(*)
FROM pg_extension
WHERE extname = 'vector';
```

Expected results:
- Tables: 10+ (including videos, transcripts, chat, todos, calendar, etc.)
- Functions: 10+ (search, hybrid, etc.)
- Extensions: 1 (vector)
