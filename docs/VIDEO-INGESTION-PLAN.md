# Video Ingestion Action Plan

**Status:** Ready to Execute
**Goal:** Get 10-15 videos scraped, vectorized, and into Supabase for AI chatbot demo
**Time Estimate:** 2-3 hours

---

## ✅ What's Fixed

1. **Root Cause Identified:** The `youtube-transcript` npm package is broken/outdated
2. **Solution Implemented:** Switched to `youtubei.js` (more reliable, reverse-engineered YouTube API)
3. **Verified Working:** Successfully extracted 387 transcript segments from video `p005iduooyw`

---

## 🚀 Step-by-Step Execution Plan

### Step 1: Find Video IDs (30-45 minutes)

You need to find 10-15 high-quality Roblox/Blender tutorial videos that have captions enabled.

**How to find videos:**

1. Go to YouTube and search for:
   - "Roblox Studio tutorial for beginners"
   - "Learn Roblox scripting"
   - "Blender tutorial complete beginner"

2. **IMPORTANT:** Click "Filters" → Enable "Subtitles/CC"

3. Look for videos from these channels (they usually have good captions):
   - **Roblox:** SmartyRBX, TheDevKing, AlvinBlox, Roblox official
   - **Blender:** Blender Guru, Grant Abbitt, CG Cookie, Ducky 3D

4. For each good video, copy the **video ID**:
   - Example URL: `https://youtube.com/watch?v=p005iduooyw`
   - Video ID: `p005iduooyw` (the part after `?v=`)

5. Add video IDs to `scripts/starter-video-ids.txt`:
   ```
   p005iduooyw
   ABC123xyz45
   DEF456uvw78
   # ... add 10-15 total
   ```

---

### Step 2: Verify Transcripts (5-10 minutes)

Test that all your videos actually have transcripts available:

```bash
node scripts/find-videos-with-transcripts.js --file scripts/starter-video-ids.txt
```

**What this does:**
- Tests each video ID
- Shows which ones have transcripts (✅) and which don't (❌)
- Creates `valid-video-ids.txt` with only the working ones
- Shows video titles, duration, and segment counts

**Expected output:**
```
Testing p005iduooyw... ✅ (387 segments)
Testing ABC123xyz45... ✅ (245 segments)
Testing DEF456uvw78... ❌ No transcript

✅ With transcripts: 12/15
❌ Without transcripts: 3/15

✅ Valid video IDs saved to: valid-video-ids.txt
```

---

### Step 3: Process Videos (30-60 minutes)

Run the complete pipeline to extract, chunk, embed, and upload all videos:

```bash
node scripts/process-videos-to-supabase.js --file valid-video-ids.txt
```

**What this does:**
1. ✅ Extracts transcripts from YouTube using `youtubei.js`
2. ✅ Chunks each transcript into 30-second segments
3. ✅ Generates OpenAI embeddings for each chunk (`text-embedding-ada-002`)
4. ✅ Uploads to Supabase:
   - `video_transcripts` table (video metadata)
   - `transcript_chunks` table (chunks with embeddings)

**Progress output:**
```
🚀 Starting Video Processing Pipeline
════════════════════════════════════════════════════════════
📊 Videos to process: 12
⚙️  Chunk duration: 30s
════════════════════════════════════════════════════════════

📹 Processing: p005iduooyw
   Title: The ULTIMATE Beginner Guide to Roblox Studio
   Creator: SmartyRBX
   Duration: 39:32
   ✅ Extracted 387 transcript segments
   ✅ Created 80 chunks (30s each)
   🤖 Generating embeddings for 80 chunks...
      Progress: 80/80 chunks
   ✅ Generated 80 embeddings
   💾 Uploading to Supabase...
      ✅ Video record created
      ✅ Inserted 80 chunks
   ✅ Upload complete!

   ⏳ Waiting 2 seconds before next video...

📹 Processing: ABC123xyz45
...
```

**Time estimate:**
- ~3-5 minutes per video
- 12 videos = ~40-60 minutes total

---

### Step 4: Verify Data in Supabase (2 minutes)

Check that data was uploaded correctly:

```bash
node scripts/check-stored-transcripts.js
```

Or check manually in Supabase dashboard:
- Table `video_transcripts` should have 10-15 records
- Table `transcript_chunks` should have 500-1000+ records (depending on video lengths)

---

### Step 5: Test Search Function (2 minutes)

Test that the AI search is working:

```bash
node scripts/test-actual-search.js
```

Try queries like:
- "How to use Roblox Studio"
- "Lua scripting basics"
- "Blender modeling tutorial"

**Expected output:**
```
🔍 Query: "How to use Roblox Studio"

📊 Results: 10 chunks found

1. Video: The ULTIMATE Beginner Guide to Roblox Studio
   Chunk: 0 | Time: 0:00 - 0:30
   Score: 0.87
   Text: "so Timmy wants to be a Roblox developer and instead of opening..."

2. Video: [Another video]
   Chunk: 3 | Time: 1:30 - 2:00
   Score: 0.82
   Text: "...Roblox Studio interface basics..."
```

---

### Step 6: Test AI Chatbot Demo (5 minutes)

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Navigate to Blox Wizard chat interface

3. Ask questions like:
   - "Show me Roblox Studio tutorials"
   - "How do I script in Roblox?"
   - "Teach me Blender basics"

4. Verify that:
   - ✅ AI responds with relevant video recommendations
   - ✅ Video titles and timestamps are shown
   - ✅ Links to YouTube are correct

---

## 🛠️ Tools Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `test-youtubei-transcript.js` | Test single video | `node scripts/test-youtubei-transcript.js VIDEO_ID` |
| `find-videos-with-transcripts.js` | Batch verify videos | `node scripts/find-videos-with-transcripts.js --file starter-video-ids.txt` |
| `process-videos-to-supabase.js` | Full pipeline | `node scripts/process-videos-to-supabase.js --file valid-video-ids.txt` |
| `test-actual-search.js` | Test search function | `node scripts/test-actual-search.js` |
| `check-stored-transcripts.js` | Verify data | `node scripts/check-stored-transcripts.js` |

---

## ⚙️ Requirements Checklist

Make sure you have these set up in `.env`:

```bash
# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # For batch uploads

# YouTube (for metadata - optional)
YOUTUBE_API_KEY=...  # Only needed for playlist scraping
```

---

## 📊 Success Criteria

Your demo is ready when:

- ✅ 10-15 videos in `video_transcripts` table
- ✅ 500+ chunks in `transcript_chunks` table
- ✅ All chunks have embeddings (vector data)
- ✅ Search function returns relevant results
- ✅ AI chatbot recommends videos with timestamps
- ✅ Video links work when clicked

---

## 🚨 Troubleshooting

### Problem: "No transcript available" for a video

**Solution:**
- Verify manually on YouTube that CC/subtitles button works
- Try a different video from the same creator
- Some videos have auto-generated captions disabled

### Problem: OpenAI rate limit errors

**Solution:**
- The script has built-in delays (200ms between batches)
- If you hit limits, wait 60 seconds and re-run
- Script will skip already-processed videos

### Problem: Supabase "duplicate key" error

**Solution:**
- Video already exists in database
- Either delete the old record or skip this video

### Problem: "ParsingError" warnings from youtubei.js

**Solution:**
- These are non-fatal warnings about YouTube's description format
- Ignore them - transcript extraction still works

---

## 🎯 Quick Start (TL;DR)

```bash
# 1. Add 10-15 video IDs to starter-video-ids.txt

# 2. Verify they have transcripts
node scripts/find-videos-with-transcripts.js --file scripts/starter-video-ids.txt

# 3. Process them (this does everything)
node scripts/process-videos-to-supabase.js --file valid-video-ids.txt

# 4. Test search
node scripts/test-actual-search.js

# 5. Test chatbot demo
npm run dev
# → Navigate to Blox Wizard and ask questions
```

---

## 📝 What Changed from Before

| Before (Broken) | Now (Fixed) |
|-----------------|-------------|
| `youtube-transcript` package | `youtubei.js` package |
| Failed on all videos | Works reliably |
| "No transcript available" | Successfully extracts transcripts |
| 0 videos processed | Ready to process 10-15+ videos |

---

## 🎬 Next Steps After Demo Works

1. **Expand video library** to 50-100 videos
2. **Organize by curriculum** (Week 1, Week 2, modules)
3. **Add video metadata** (difficulty, topics, prerequisites)
4. **Implement video recommendations** based on user progress
5. **Set up automated monitoring** to check if videos are still available

---

**Estimated Total Time: 2-3 hours** (mostly waiting for API processing)

**Ready to start? Begin with Step 1!** 🚀
