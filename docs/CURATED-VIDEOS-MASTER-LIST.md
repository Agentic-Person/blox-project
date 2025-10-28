# Curated YouTube Videos - Master List

**Purpose:** Track high-quality educational videos with verified transcript availability for Blox Wizard AI integration

**Status:** Planning Phase
**Last Updated:** October 20, 2025
**Total Videos:** 0 (Target: 10-15 for Week 1-2 Demo)

---

## ✅ Verification Criteria

Before adding a video to this list, verify:
- [ ] Video has captions/transcripts enabled (test with `youtube-transcript` package)
- [ ] Content is relevant to Roblox Studio, scripting, or Blender basics
- [ ] Creator is reputable (professional educator or established channel)
- [ ] Video quality is suitable for beginners
- [ ] Duration is appropriate (10-60 minutes preferred)

---

## 📋 Video Categories

### Category 1: Roblox Studio Basics
**Topic:** Getting started with Roblox Studio interface, building, and basic concepts
**Target:** 3-4 videos

| # | Title | Creator | URL | Duration | Transcript? | Status |
|---|-------|---------|-----|----------|-------------|--------|
| 1 | [Title] | [Creator] | https://youtube.com/watch?v=[ID] | [MM:SS] | ⏳ Pending | Not Added |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |

### Category 2: Roblox Scripting (Lua)
**Topic:** Introduction to Lua programming and scripting in Roblox Studio
**Target:** 3-4 videos

| # | Title | Creator | URL | Duration | Transcript? | Status |
|---|-------|---------|-----|----------|-------------|--------|
| 1 | [Title] | [Creator] | https://youtube.com/watch?v=[ID] | [MM:SS] | ⏳ Pending | Not Added |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |

### Category 3: Blender Basics
**Topic:** 3D modeling fundamentals in Blender for game asset creation
**Target:** 3-4 videos

| # | Title | Creator | URL | Duration | Transcript? | Status |
|---|-------|---------|-----|----------|-------------|--------|
| 1 | [Title] | [Creator] | https://youtube.com/watch?v=[ID] | [MM:SS] | ⏳ Pending | Not Added |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |

### Category 4: Roblox + Blender Integration
**Topic:** Creating and importing Blender assets into Roblox
**Target:** 2-3 videos (Optional)

| # | Title | Creator | URL | Duration | Transcript? | Status |
|---|-------|---------|-----|----------|-------------|--------|
| 1 | [Title] | [Creator] | https://youtube.com/watch?v=[ID] | [MM:SS] | ⏳ Pending | Not Added |
| 2 | | | | | | |

---

## 🎯 Recommended Channels (Known for Captions)

Channels that typically have transcripts enabled:
- **freeCodeCamp** - Comprehensive programming tutorials
- **Traversy Media** - Web and game development
- **Fireship** - Tech tutorials with captions
- **The Net Ninja** - Programming courses
- **CG Cookie** - Professional Blender tutorials (verified)
- **Grant Abbitt** - Blender for beginners (verified)
- **Blender Guru** - Industry-standard Blender content

---

## 🔍 Search Queries to Use

```
"Roblox Studio tutorial for beginners"
"Learn Roblox scripting Lua"
"Blender tutorial complete beginner"
"Roblox game development course"
"Blender 3D modeling for games"
```

**Filter:** Videos → CC (Closed Captions) → Upload date: Last year

---

## 📝 Template for Adding Videos

Copy this template when adding a new video:

```markdown
| # | [Video Title] | [Creator Name] | https://youtube.com/watch?v=[VIDEO_ID] | [MM:SS] | ✅ Verified / ❌ None | Added / Pending |
```

**Example:**
```markdown
| 1 | Complete Roblox Studio Guide | TechEdu | https://youtube.com/watch?v=abc123xyz | 35:42 | ✅ Verified | Added |
```

---

## ⚙️ Testing Transcript Availability

Use this command to test if a video has transcripts:

```bash
node -e "const { YoutubeTranscript } = require('youtube-transcript'); YoutubeTranscript.fetchTranscript('VIDEO_ID').then(t => console.log('✅ Has transcript:', t.length, 'segments')).catch(e => console.log('❌ No transcript:', e.message))"
```

Replace `VIDEO_ID` with the actual YouTube video ID.

---

## 📊 Progress Tracking

**Phase 1: Research & Verification** ⏳ In Progress
- [ ] Search for Roblox Studio videos (3-4)
- [ ] Search for Roblox Scripting videos (3-4)
- [ ] Search for Blender videos (3-4)
- [ ] Verify ALL videos have transcripts
- [ ] Document all videos in this file

**Phase 2: Data Extraction** 🔜 Pending
- [ ] Run `fetch-playlist-with-transcripts.js` for each video
- [ ] Generate 30-second chunks
- [ ] Review transcript quality

**Phase 3: Database Upload** 🔜 Pending
- [ ] Upload to Supabase `video_transcripts` table
- [ ] Upload to Supabase `transcript_chunks` table
- [ ] Generate embeddings with OpenAI

**Phase 4: Testing** 🔜 Pending
- [ ] Test search function
- [ ] Test Blox Wizard integration
- [ ] Verify demo queries work

---

## 📄 Supabase Database Schema Reference

### Table: `video_transcripts`
```sql
- id (uuid, primary key)
- youtube_id (text, unique)
- title (text)
- creator (text)
- description (text)
- duration (text)
- full_transcript (jsonb) -- Array of transcript segments
- created_at (timestamp)
```

### Table: `transcript_chunks`
```sql
- id (uuid, primary key)
- transcript_id (uuid, foreign key → video_transcripts.id)
- youtube_id (text) -- Denormalized for easier querying
- chunk_index (int)
- chunk_text (text)
- start_seconds (int)
- end_seconds (int)
- start_timestamp (text) -- Format: "MM:SS"
- end_timestamp (text)
- embedding (vector(1536)) -- OpenAI embedding
- created_at (timestamp)
```

---

## 🚀 Quick Start Guide

1. **Find Videos:** Use search queries above, filter for CC (captions)
2. **Test Transcripts:** Run test command for each video ID
3. **Document:** Add verified videos to appropriate category table
4. **Mark Status:** Update "Transcript?" and "Status" columns
5. **Review:** Once 10-15 videos are verified, proceed to Phase 2

---

## 📌 Notes

- **Minimum viable demo:** 10 videos (3 Roblox Studio, 4 Scripting, 3 Blender)
- **Optimal demo:** 15 videos (4 Roblox Studio, 5 Scripting, 4 Blender, 2 Integration)
- **Quality over quantity:** Better to have 10 great videos with transcripts than 50 without
- **Update this document** as we find and verify videos
- **Keep URLs consistent:** Always use `youtube.com/watch?v=` format (not youtu.be)

---

## ❓ FAQ

**Q: What if a video doesn't have transcripts?**
A: Skip it and find an alternative. We need transcripts for semantic search.

**Q: Can we use videos from the current curriculum?**
A: Only if they have transcripts enabled. Test each one first.

**Q: How do we know if a channel has good captions?**
A: Professional education channels (freeCodeCamp, etc.) almost always have them.

**Q: What if transcript quality is poor?**
A: Auto-generated captions are usually 90%+ accurate. If worse, skip the video.

---

**Next Step:** Start researching and adding videos to the tables above!
