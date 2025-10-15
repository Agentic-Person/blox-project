# ⚡ Quick Start Checklist - Blox Wizard Chat Persistence

## 🎯 Overview
This checklist will get your Blox Wizard chat system fully functional with:
- ✅ Persistent conversation history
- ✅ Video transcript search with Module 1 content
- ✅ Memory across page navigation
- ✅ Secure user data isolation

**Estimated time:** 2-3 hours

---

## Phase 1: Database Setup (30 minutes)

### Step 1: Resume Supabase Project ⏱️ 5 min

- [ ] Go to https://supabase.com/dashboard/project/jpkwtpvwimhclncdswdk
- [ ] Click "Resume Project" button
- [ ] Wait for green "Active" status indicator
- [ ] Verify you can access the SQL Editor

### Step 2: Deploy Migrations ⏱️ 15 min

**Option A: CLI (Recommended)**
```bash
cd D:\BloxProject
supabase link --project-ref jpkwtpvwimhclncdswdk
supabase db push
```

**Option B: Manual SQL Editor**
- [ ] Copy contents of `supabase/migrations/002_video_content.sql`
- [ ] Paste into SQL Editor and run
- [ ] Copy contents of `supabase/migrations/004_vector_search.sql`
- [ ] Paste into SQL Editor and run
- [ ] Copy contents of `supabase/migrations/007_chat_persistence.sql`
- [ ] Paste into SQL Editor and run

### Step 3: Verify Deployment ⏱️ 10 min

Run in SQL Editor:
```sql
-- Check tables exist (should return 5 rows)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('videos', 'video_transcript_chunks', 'chat_conversations', 'chat_messages', 'video_transcripts');

-- Check vector extension (should return 1 row)
SELECT extname FROM pg_extension WHERE extname = 'vector';

-- Check search functions (should return 3+ rows)
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name LIKE 'search%';
```

**All checks passed?**
- ✅ Yes → Continue to Phase 2
- ❌ No → See `SUPABASE_DEPLOYMENT_GUIDE.md` troubleshooting section

---

## Phase 2: Check Transcript Data (10 minutes)

### Step 4: Verify Transcript Data Exists ⏱️ 10 min

Run in SQL Editor:
```sql
-- Check if transcript data exists
SELECT
  (SELECT COUNT(*) FROM videos) as video_count,
  (SELECT COUNT(*) FROM video_transcript_chunks) as chunk_count,
  (SELECT COUNT(*) FROM video_transcript_chunks WHERE embedding IS NOT NULL) as embedded_count;
```

**Results:**
- **All counts > 0** → ✅ Data exists! Skip to Phase 3
- **All counts = 0** → ⚠️ Need to upload transcripts (see Phase 2b)

### Phase 2b: Upload Transcripts (if needed) ⏱️ 2 hours

If transcript data is missing:

```bash
# Use existing extraction script
cd D:\BloxProject\scripts
python extract-transcripts.py

# Or contact me - you mentioned having transcripts already vectorized
# They may be in a different project/backup
```

---

## Phase 3: Integrate Chat Persistence (1 hour)

### Step 5: Update AIChat Component ⏱️ 30 min

**File:** `src/components/blox-wizard/AIChat.tsx`

- [ ] Add import: `import { useChatSession } from '@/hooks/useChatSession'`
- [ ] Replace `useState` for messages with `useChatSession()` hook
- [ ] Update `handleSend()` to use `saveMessage()`
- [ ] Use `sessionId` from hook in API calls
- [ ] Add loading state while history loads

**Quick reference:** See `docs/blox-wizard/CHAT-PERSISTENCE-INTEGRATION.md` lines 15-100

### Step 6: Update Dashboard Component ⏱️ 30 min

**File:** `src/components/dashboard/BloxWizardDashboard.tsx`

- [ ] Add import: `import { useChatSession } from '@/hooks/useChatSession'`
- [ ] Replace `useState` for messages with `useChatSession()` hook
- [ ] Update `handleSend()` to use `saveMessage()`
- [ ] Use `sessionId` from hook in API calls

**Quick reference:** See `docs/blox-wizard/CHAT-PERSISTENCE-INTEGRATION.md` lines 105-150

---

## Phase 4: Testing (30 minutes)

### Step 7: Test Basic Functionality ⏱️ 15 min

```bash
# Start dev server
npm run dev
```

**Dashboard Test:**
- [ ] Open http://localhost:3000/dashboard
- [ ] Scroll to Blox Chat Wizard section
- [ ] Send message: "How do I create a teleport script?"
- [ ] Verify AI responds
- [ ] Check browser console for errors

**Full Page Test:**
- [ ] Open http://localhost:3000/blox-wizard
- [ ] Verify previous message appears
- [ ] Send another message
- [ ] Verify AI responds
- [ ] Check video references appear (if transcript data exists)

### Step 8: Test Persistence ⏱️ 10 min

**Navigation Test:**
- [ ] Send message on dashboard
- [ ] Navigate to `/blox-wizard`
- [ ] Verify message appears
- [ ] Navigate back to dashboard
- [ ] Verify both messages visible

**Refresh Test:**
- [ ] Send 2-3 messages
- [ ] Press F5 to refresh browser
- [ ] Verify all messages still visible
- [ ] Check localStorage has `blox_wizard_session_id`

**New Conversation Test (Optional):**
- [ ] Add "New Chat" button (optional)
- [ ] Click button
- [ ] Verify chat clears
- [ ] Send new message
- [ ] Navigate/refresh
- [ ] Verify only new messages show

### Step 9: Test Transcript Search ⏱️ 5 min

**If transcript data exists:**
- [ ] Ask: "How do I create a script?"
- [ ] Verify response includes video references
- [ ] Check video titles, timestamps, thumbnails
- [ ] Click video reference to verify YouTube link

**If no video references:**
- Check console for search function calls
- Verify data in database (see Step 4)
- May need to upload transcripts

---

## Phase 5: Production Checklist

### Before Deploying to Production:

**Security:**
- [ ] Environment variables set in Vercel/production
- [ ] Supabase RLS policies enabled
- [ ] API keys not exposed to client

**Performance:**
- [ ] Test with 50+ messages
- [ ] Verify pagination works
- [ ] Check Supabase query performance

**User Experience:**
- [ ] Loading states work
- [ ] Error messages are clear
- [ ] Mobile layout responsive

**Monitoring:**
- [ ] Supabase logs accessible
- [ ] Error tracking configured
- [ ] API response times acceptable

---

## 🎉 Success!

If all checks pass:
- ✅ Chat persists across navigation
- ✅ Messages survive refresh
- ✅ Same conversation on all pages
- ✅ Video suggestions work
- ✅ System is production-ready

---

## 🆘 Troubleshooting

### Issue: Messages not persisting
**Solution:** Check browser console → Verify Supabase connection → Check RLS policies

### Issue: No video suggestions
**Solution:** Verify transcript data exists → Check search functions → Verify OpenAI key

### Issue: Session ID keeps changing
**Solution:** Check localStorage settings → Verify domain is consistent

### Issue: "Function does not exist" errors
**Solution:** Re-run migrations → Check Supabase logs → Verify deployment

**Detailed troubleshooting:** See `SUPABASE_DEPLOYMENT_GUIDE.md` and `CHAT-PERSISTENCE-INTEGRATION.md`

---

## 📚 Reference Documents

| Document | Purpose |
|----------|---------|
| `SUPABASE_DEPLOYMENT_GUIDE.md` | Database setup and deployment |
| `docs/blox-wizard/CHAT-PERSISTENCE-INTEGRATION.md` | Component integration code |
| `BLOX-WIZARD-IMPLEMENTATION-SUMMARY.md` | Complete overview and architecture |
| `docs/blox-wizard/BLOX-WIZARD-TECHNICAL-IMPLEMENTATION.md` | Original technical docs |

---

## 🎯 Quick Status Check

Run this to see current system status:

```sql
-- Supabase health check
SELECT
  'Chat Conversations' as table_name,
  COUNT(*) as count
FROM chat_conversations
UNION ALL
SELECT 'Chat Messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'Videos', COUNT(*) FROM videos
UNION ALL
SELECT 'Transcript Chunks', COUNT(*) FROM video_transcript_chunks
UNION ALL
SELECT 'Embedded Chunks', COUNT(*) FROM video_transcript_chunks WHERE embedding IS NOT NULL;
```

**Expected results:**
- Chat tables may start at 0 (new feature)
- Video tables should have data
- Embedded chunks should match chunk count (if transcripts processed)

---

## 🚀 You're Ready!

Follow this checklist step-by-step and you'll have a fully functional Blox Wizard chat system with:
- Persistent memory
- Smart video suggestions
- Secure user data
- Production-ready architecture

**Estimated completion:** 2-3 hours
**Need help?** Check the reference documents above

**Good luck! 🎉**
