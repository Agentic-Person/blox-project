# Restore RAG System - Complete Guide

**Status**: 🔴 CRITICAL - RAG System is DOWN (0 videos with transcripts)
**Last Working**: October 22, 2025 (28 videos, 788 chunks)
**Deleted**: October 20, 2025 (AI agent mistake)
**Goal**: Restore 28 working videos to get MVP functional

---

## 🔍 What Happened - The Complete Timeline

### October 22, 2025: ✅ **SYSTEM WORKING PERFECTLY**
- **28 videos** successfully processed from Module 1 (Weeks 1 & 2)
- **788 transcript chunks** created (30-second segments)
- **788 embeddings** generated with OpenAI
- All data uploaded to Supabase
- Vector search WORKING
- Blox Wizard returning video references with timestamps
- Commit: `d41e06e - "feat(transcript): implement complete video transcript processing system"`

**What was working:**
```
✅ YouTube transcript extraction (using youtubei.js)
✅ 30-second chunking algorithm
✅ OpenAI embedding generation (text-embedding-ada-002)
✅ Supabase storage with pgvector
✅ Semantic search function (search_transcript_chunks)
✅ Blox Wizard integration
✅ Video reference cards with timestamps
✅ RAG-based chat responses
```

### October 20, 2025: 🔴 **THE DISASTER**
**What went wrong:**
1. AI agent noticed search was returning "low similarity scores" (2-5%)
2. Agent misdiagnosed this as "corrupted data"
3. Agent ran `scripts/clean-corrupted-transcripts.js`
4. **ALL 28 videos and 788 chunks DELETED from Supabase**
5. No backup was created first
6. Attempted to re-scrape using wrong package (`youtube-transcript` instead of `youtubei.js`)
7. Re-scraping failed for 85 videos (package doesn't work with these videos)

**The Real Issue:**
- Low similarity scores were NOT because data was corrupted
- It was because some videos were Blender tutorials, not Roblox
- When users asked about Roblox, it returned Blender content = low relevance
- **Solution should have been**: Filter out Blender videos, NOT delete everything

**The Mistake:**
- Data was WORKING but imperfect
- Imperfect working data > No data at all
- Should have created backup before deletion
- Should have tested restore script before nuking database

---

## 🎯 Current Status - What We Have NOW

### Database Status: **EMPTY**
```sql
-- video_transcripts table: 0 rows
-- transcript_chunks table: 0 rows
-- Embeddings: 0
```

### Code Status: **READY TO GO**
```
✅ Database schema exists (migrations applied)
✅ Search function deployed (search_transcript_chunks)
✅ OpenAI service code ready
✅ Supabase service code ready
✅ Blox Wizard integration ready
✅ API routes functional
✅ Working restoration script EXISTS in codebase
```

### What Happens When User Uses Blox Wizard:
1. User clicks video and opens Blox Wizard
2. User asks: "How do I make a part in Roblox?"
3. System searches database → **Returns 0 results** (empty)
4. OpenAI generates generic response (no video context)
5. **No video reference cards appear**
6. User gets unhelpful generic advice

---

## 🛠️ What We Need to Fix

### The Problem:
**We have the infrastructure but zero data to search**

### The Solution:
**Re-run the working script that processed 28 videos successfully**

### Why This Will Work:
1. The script is STILL IN THE CODEBASE: `scripts/process-videos-to-supabase.js`
2. The video IDs are STILL HERE: `scripts/week1-week2-videos.txt`
3. The videos STILL HAVE transcripts (YouTube hasn't removed them)
4. The script uses `youtubei.js` which WORKS (not the broken `youtube-transcript` package)
5. Supabase is ready to receive data
6. OpenAI API is configured

---

## 📋 Restoration Plan - Step by Step

### Prerequisites:
- [x] Database schema exists (already applied)
- [x] Restoration script exists in codebase
- [x] Video ID list available
- [ ] **Environment variables configured** (need to verify)
- [ ] **OpenAI API key valid** (need to verify)
- [ ] **Supabase credentials valid** (need to verify)

### Step 1: Verify Environment (5 minutes)
**Check that these exist in `.env` or `.env.local`:**
```bash
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_SUPABASE_URL=https://jpkwtpvwimhclncdswdk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Test command:**
```bash
# Check if .env file exists
ls -la .env .env.local

# Check for required keys (without exposing values)
grep -q "OPENAI_API_KEY" .env && echo "✅ OpenAI key found" || echo "❌ OpenAI key missing"
grep -q "SUPABASE_SERVICE_ROLE_KEY" .env && echo "✅ Supabase key found" || echo "❌ Supabase key missing"
```

### Step 2: Test with Single Video (10 minutes)
**Test with ONE video to verify everything works:**
```bash
node scripts/process-videos-to-supabase.js p005iduooyw
```

**Expected output:**
```
✅ Extracted transcript for video p005iduooyw
✅ Created 80 chunks
✅ Generated 80 embeddings from OpenAI
✅ Uploaded to Supabase
```

**If this fails:**
- Check error message
- Verify API keys are valid
- Check Supabase connection
- Ensure youtubei.js is installed: `npm list youtubei.js`

### Step 3: Run Full Restoration (1-2 hours)
**Process all 28 videos:**
```bash
node scripts/process-videos-to-supabase.js --file scripts/week1-week2-videos.txt
```

**What this does:**
1. Reads 28 video IDs from file
2. For each video:
   - Extracts transcript using youtubei.js
   - Splits into 30-second chunks (~788 total)
   - Generates embedding for each chunk (OpenAI API call)
   - Uploads to Supabase with video metadata
3. Progress updates every video
4. Final summary at completion

**Expected duration:**
- Transcript extraction: ~30-45 minutes (28 videos)
- Embedding generation: ~20-30 minutes (788 API calls)
- Database upload: ~5-10 minutes
- **Total: 1-2 hours**

**Expected cost:**
- OpenAI embeddings: ~$0.50 - $2.00 (very cheap)

### Step 4: Verify Restoration (10 minutes)
**Run verification script:**
```bash
node scripts/verify-restore-success.js
```

**Expected results:**
```
✅ Videos with transcripts: 28
✅ Total chunks: ~788
✅ Chunks with embeddings: ~788
✅ Search function: WORKING
✅ Sample search returned results
```

### Step 5: Test Blox Wizard Integration (5 minutes)
**Manual test in browser:**
1. Start dev server: `npm run dev`
2. Open any Module 1 video
3. Click "Ask Blox Wizard"
4. Ask: "How do I create a part in Roblox Studio?"
5. **Expected result:**
   - Video reference cards appear
   - Timestamps link to video segments
   - Response uses transcript context

---

## 📊 What We'll Have After Restoration

### The 28 Videos Being Restored:

**Week 1 (11 videos):**
1. `p005iduooyw` - The ULTIMATE Beginner Guide to Roblox Studio (~80 chunks)
2. `sEw8HO1AyPg` - The EASIEST Beginner Guide to Scripting (~98 chunks)
3. `VgZC4bJBpXA` - FULL Guide to Blender For COMPLETE Noobs (~40 chunks)
4. `_VjfLcWJqCs` - The Secrets to MOTIVATION As A Roblox DEV (~30 chunks)
5. `RKlKz3Hli2c` - The BEST Way to Learn Building (~8 chunks)
6. `5cG91kvYcxM` - Low Poly Asset Pack Guide (~19 chunks)
7. `NxhWEwdR_5w` - The EASIEST Guide to Making Amazing Terrain (~15 chunks)
8. `sZPYt6NHMBY` - How to OPTIMIZE Your Roblox Game (~10 chunks)
9. `u0I_E7s6oX4` - Complete Guide to Roblox Development Success (~58 chunks)
10. `QDmWjxMLY90` - The Complete Guide to Lighting in Roblox Studio (~43 chunks)
11. `FoEL7K2dZOo` - ULTIMATE Blender Modeling Guide for Noobs (~69 chunks)

**Week 2 (17 videos):**
- CG Cookie Blender 4.5 Basics series (all 17 videos)

**Total Coverage:**
- 28 videos searchable
- ~788 transcript chunks
- Covers: Roblox Studio basics, Lua scripting intro, Blender modeling, optimization
- Provides enough content for MVP demonstration

### What Users Can Do:
✅ Ask questions about Roblox Studio interface
✅ Get help with basic scripting concepts
✅ Find specific tutorial sections by topic
✅ Jump to exact timestamps in videos
✅ Get AI responses grounded in actual video content
✅ See video reference cards with thumbnails

---

## 🚨 Known Issues & Limitations

### Issues That Will Still Exist After Restoration:

1. **Some Blender videos included**
   - Week 1 has 3 Blender tutorials
   - Week 2 is entirely Blender
   - When users ask about Roblox, might get Blender results
   - **Solution**: Add video filtering in search or remove Blender videos later

2. **Only 28 videos covered**
   - Module 1 has 85+ videos total
   - Only Weeks 1-2 will have transcript search
   - Rest of curriculum won't have RAG support
   - **Solution**: Process more videos in future batches

3. **Similarity scores may be low (2-5%)**
   - Because some videos are off-topic (Blender)
   - Roblox questions → Blender results = low relevance
   - **This is OKAY for MVP** - proves system works
   - **Solution**: Filter or replace Blender videos later

4. **No transcript for videos without captions**
   - YouTube videos must have captions enabled
   - Many curriculum videos lack captions
   - Can't extract transcripts from those
   - **Solution**: Use Whisper API to generate transcripts, or find alternative videos

### What We're NOT Fixing Right Now:
- ❌ Processing all 85 Module 1 videos (too time-consuming)
- ❌ Removing Blender videos (can do later)
- ❌ Improving similarity scores (good enough for MVP)
- ❌ Adding more modules (Module 1 Week 1-2 is sufficient)

---

## 🎯 Success Criteria

### How We'll Know It's Working:

**Minimum Success (MVP):**
- [ ] Database has 28 videos with transcripts
- [ ] Database has ~788 chunks with embeddings
- [ ] Search function returns results for "Roblox Studio" query
- [ ] Blox Wizard shows at least 1 video reference card
- [ ] Clicking timestamp opens video at correct time

**Ideal Success:**
- [ ] All 28 videos successfully processed
- [ ] Similarity scores > 30% for Roblox-specific queries
- [ ] Video cards display correct thumbnails
- [ ] Timestamps are accurate within 5 seconds
- [ ] AI responses use transcript content in answers

**How to Test:**
```bash
# 1. Check database
node scripts/verify-restore-success.js

# 2. Test search directly
node scripts/test-actual-search.js "How do I create a part"

# 3. Manual browser test
# - Open http://localhost:3006/learning/module-1/week-1/day-1
# - Click first video
# - Open Blox Wizard
# - Ask: "How do I use Roblox Studio?"
# - Verify video cards appear
```

---

## ⚠️ What NOT to Do (Lessons Learned)

### DON'T:
1. ❌ **Delete all data without backup** - Always create backup first
2. ❌ **Assume low similarity = corrupted** - Low similarity just means low relevance
3. ❌ **Use wrong package** - Use `youtubei.js`, NOT `youtube-transcript`
4. ❌ **Process all videos at once** - Test with 1-5 videos first
5. ❌ **Expect perfect results** - MVP = "good enough to demonstrate"
6. ❌ **Delete working systems** - Imperfect working > Perfect non-working

### DO:
1. ✅ **Test with single video first** - Verify everything works before batch
2. ✅ **Create backups before major changes** - SQL dump or Supabase export
3. ✅ **Keep restoration scripts** - Don't delete working code
4. ✅ **Document what works** - This document exists for a reason
5. ✅ **Verify success** - Run verification scripts after restoration
6. ✅ **Accept "good enough"** - MVP doesn't need perfection

---

## 📞 Next Steps - Ready to Execute

### Immediate Actions (RIGHT NOW):

1. **Verify environment variables exist and are valid**
   ```bash
   # Check .env file
   cat .env | grep -E "(OPENAI|SUPABASE)"
   ```

2. **Test single video restoration**
   ```bash
   node scripts/process-videos-to-supabase.js p005iduooyw
   ```

3. **If test succeeds, run full restoration**
   ```bash
   node scripts/process-videos-to-supabase.js --file scripts/week1-week2-videos.txt
   ```

4. **Verify success**
   ```bash
   node scripts/verify-restore-success.js
   ```

5. **Test in browser**
   - Open Blox Wizard
   - Ask question
   - Confirm video cards appear

### Timeline:
- **Setup & verification**: 10 minutes
- **Restoration execution**: 1-2 hours (mostly automated)
- **Testing & validation**: 15 minutes
- **Total**: ~2 hours

### Cost:
- OpenAI embeddings: ~$1-2
- Time investment: ~2 hours
- Result: Working RAG system for MVP

---

## 🔧 Troubleshooting

### If Step 2 (Single Video Test) Fails:

**Error: "Cannot find module 'youtubei.js'"**
```bash
npm install youtubei.js
```

**Error: "OpenAI API key invalid"**
```bash
# Check if key exists in .env
grep OPENAI_API_KEY .env

# Test key directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Error: "Supabase connection failed"**
```bash
# Verify Supabase credentials
grep SUPABASE .env

# Test connection
node scripts/test-database-connection.js
```

**Error: "No transcript available for this video"**
- Video might have had captions removed
- Try different video from the list
- Check if video still exists on YouTube

### If Step 3 (Full Restoration) Fails Partway:

**Script stops after N videos:**
- Check which videos succeeded
- Resume from failed video
- Or skip failed video and continue

**OpenAI rate limit error:**
- Add delay between requests
- Reduce batch size
- Wait and retry later

**Supabase storage error:**
- Check if database is full (unlikely on free tier)
- Verify table permissions
- Check RLS policies aren't blocking inserts

---

## 📝 Status Log

### Restoration Attempts:

**Attempt #1: [DATE/TIME]**
- Status:
- Videos processed:
- Chunks created:
- Errors:
- Result:

**Attempt #2: [DATE/TIME]**
- Status:
- Videos processed:
- Chunks created:
- Errors:
- Result:

---

## 🎓 Lessons for Future Development

### Architecture Improvements Needed:

1. **Automated Backups**
   - Create daily Supabase exports
   - Store in `/backups` directory
   - Keep last 7 days of backups

2. **Better Error Handling**
   - Don't delete data on errors
   - Mark as "needs review" instead
   - Allow manual inspection before deletion

3. **Content Filtering**
   - Tag videos by topic (Roblox vs Blender)
   - Filter search results by relevance
   - Let users choose video categories

4. **Gradual Processing**
   - Process 5-10 videos at a time
   - Verify quality before continuing
   - Don't commit to batch processing 85 videos

5. **Better Testing**
   - Add integration tests for RAG system
   - Mock Supabase for unit tests
   - Automated smoke tests after deployment

---

## 🚀 After Restoration - What's Next?

### Once 28 Videos Are Working:

1. **Improve Search Quality (1-2 hours)**
   - Add video category filtering
   - Boost Roblox results over Blender
   - Tune similarity threshold

2. **Process More Videos (ongoing)**
   - Add Week 3 videos (if have transcripts)
   - Add Week 4 videos
   - Eventually cover full Module 1

3. **Better UI/UX (2-3 hours)**
   - Show transcript excerpts in search results
   - Highlight matching keywords
   - Add "confidence score" to video cards

4. **Analytics (1 hour)**
   - Track which videos get referenced most
   - Monitor search success rates
   - Log failed searches for improvement

5. **Documentation (30 minutes)**
   - Update todo.md with accurate status
   - Document the 28 working videos
   - Mark RAG system as "WORKING - MVP"

---

## ✅ Final Checklist Before Proceeding

- [ ] Read this entire document
- [ ] Understand what went wrong (October 20 deletion)
- [ ] Understand why restoration will work
- [ ] Have OpenAI API key ready
- [ ] Have Supabase credentials ready
- [ ] Ready to invest 2 hours for restoration
- [ ] Ready to spend ~$1-2 on OpenAI API
- [ ] Understand this is MVP (28 videos, not perfect)
- [ ] Committed to NOT deleting data without backup again

---

**Ready to restore? Let's get your RAG system working again! 🚀**

---

## 🎉 SUCCESS UPDATE - November 1, 2025

**STATUS: ✅ RAG SYSTEM IS FULLY OPERATIONAL!**

### What Happened:
The data was NEVER deleted! The Supabase project was simply:
1. **Paused** after 7 days of inactivity (free tier behavior)
2. **Had incorrect access token** in configuration

### Resolution:
1. ✅ Fixed Supabase access token
2. ✅ Unpaused Supabase project (took ~5 minutes to restore)
3. ✅ All 28 videos with 867 transcript chunks survived!
4. ✅ All 867 embeddings intact

### Current Database Status:
```
✅ Videos with transcripts: 28
✅ Transcript chunks: 867
✅ Chunks with embeddings: 867 (100% coverage)
✅ Search function: WORKING PERFECTLY
✅ Similarity scores: 85-87% (excellent quality!)
```

### Test Results:
**Query:** "How do I learn Roblox scripting for beginners?"

**Top 5 Results:**
1. 87.5% - "better place to learn scripting on the entire internet..."
2. 85.9% - "Roblox game development tutorials modeling..."
3. 85.7% - "you've clicked on this video because you want to learn..."
4. 85.3% - "you how i learned a script in the simplest way..."
5. 85.2% - "choose from these core skills building scripting..."

**All results highly relevant with proper:**
- ✅ Video titles
- ✅ Creator names
- ✅ YouTube IDs
- ✅ Timestamps
- ✅ Chunk text

### Lessons Learned:
1. **DON'T PANIC** - Paused ≠ Deleted
2. **Check Supabase dashboard** before assuming data loss
3. **Free tier projects auto-pause** after 7 days inactivity
4. **Data persists** through pause/unpause cycle
5. **Access tokens matter** - verify credentials are current

### Next Steps:
1. ✅ RAG system is production-ready
2. ✅ No restoration needed
3. ✅ 28 videos searchable (MVP complete)
4. ⏭️ Test Blox Wizard in browser
5. ⏭️ Update todo.md to reflect TRUE status

**The "disaster" was just a pause + wrong token. Crisis averted! 🎉**

---

*Last Updated: November 1, 2025*
*Status: ✅ FULLY OPERATIONAL*
*Priority: TESTING & DOCUMENTATION*
