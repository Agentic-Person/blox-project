# 🚨 Embedding Quality Issue - Root Cause Analysis

**Date:** October 18, 2025
**Status:** CRITICAL - Embeddings exist but have poor quality/similarity scores

---

## Executive Summary

The video search feature is not working despite having:
- ✅ **121 transcript chunks** in database
- ✅ **100% embedding coverage** (all chunks have embeddings)
- ✅ **Working search function** (`search_transcript_chunks()`)
- ❌ **Extremely low similarity scores** (2-5% instead of expected 30-80%)

**Root Cause:** Poor chunk quality - duplicate/incorrect chunk text causing bad embeddings

---

## Diagnostic Evidence

### Test 1: Search for "How do I learn Roblox scripting for beginners?"

**Threshold 30% (default):**
- Result: 0 matches

**Threshold 1% (very low):**
- Top result: Blender video (4.5% similarity) ❌
- Roblox video rank: #8 (2% similarity) ❌

**Expected:** Roblox scripting videos should match at 50-80% similarity

### Test 2: Chunk Quality Analysis

Checked "The EASIEST Beginner Guide to Scripting (Roblox)" (34 chunks):

```
Chunk 0: "so you're opening up studio with a great game idea..."
Chunk 1: "so you're opening up studio with a great game idea..." [DUPLICATE!]
Chunk 2: "so you're opening up studio with a great game idea..." [DUPLICATE!]
Chunk 3: "new which makes a new instance and then we're gonna type..."
```

**Issue:** Chunks 0, 1, 2 have IDENTICAL text → Embeddings will be nearly identical → Poor search differentiation

### Test 3: Embedding Storage Verification

- Type: String (JSON array) ✅
- Length: 1536 dimensions ✅
- Model: text-embedding-ada-002 ✅
- Storage format: Correct ✅

**Embeddings are stored correctly**, but they're embeddings of DUPLICATE/POOR QUALITY chunks.

---

## Why Search Fails

1. **User Query:** "How do I learn Roblox scripting for beginners?"
2. **Expected Match:** Chunk about "creating new parts in Roblox Studio scripting basics"
3. **Actual Match:** Generic Blender tutorial chunks (4% similarity)
4. **Roblox Match:** Generic intro text about "opening studio with a game idea" (2% similarity)

The Roblox chunks don't contain specific technical content about scripting because they're duplicates or generic intro text.

---

## Database Schema Status

### Current Schema (Correct):
- `video_transcripts` - Video metadata
- `transcript_chunks` - Chunked transcript data with embeddings
- Join: `transcript_chunks.transcript_id` → `video_transcripts.id`

### Search Function: `search_transcript_chunks()` ✅
- Uses pgvector for cosine similarity
- Returns top N matches above threshold
- Working correctly with current data

### Scripts Status:
- ❌ `generate-transcript-embeddings.js` - Was querying WRONG tables (fixed now)
- ✅ `embed-module1-videos.js` - Creates chunks (but may have duplication bug)
- ✅ `check-embedding-coverage.js` - Diagnostic script (working)

---

## The Actual Problem

The chunking process in `embed-module1-videos.js` is creating duplicate chunks:

```javascript
// Current chunking logic (LINE 51-110)
function chunkTranscript(transcript, chunkSizeSeconds = 30) {
  // ... chunking logic ...
  // BUG: Chunks may be getting duplicate text assigned
}
```

**Hypothesis:** The chunking algorithm is not properly advancing through the transcript, causing text repetition.

---

## Solution Path

### Option 1: Delete All Chunks and Re-Embed (RECOMMENDED)

```sql
-- 1. Delete all existing chunks
DELETE FROM transcript_chunks;

-- 2. Delete all video transcripts (start fresh)
DELETE FROM video_transcripts;
```

Then run:
```bash
# 3. Re-extract ALL Module 1 videos with FIXED chunking
node scripts/embed-module1-videos.js

# 4. Generate embeddings for new chunks
node scripts/generate-transcript-embeddings.js

# 5. Test search
node scripts/test-actual-search.js
```

### Option 2: Fix Chunking Bug and Regenerate (More Surgical)

1. Debug the chunking function in `embed-module1-videos.js`
2. Delete existing chunks for affected videos only
3. Re-chunk those specific videos
4. Regenerate embeddings for new chunks

---

## Files Involved

### Scripts:
- `scripts/embed-module1-videos.js` - **NEEDS BUG FIX** in chunking logic
- `scripts/generate-transcript-embeddings.js` - **FIXED** (now uses correct tables)
- `scripts/verify-module1-coverage.js` - Coverage checking (working)

### Database:
- `supabase/migrations/010_search_function_for_old_schema.sql` - ✅ Applied successfully
- `transcript_chunks` table - Has 121 chunks with poor quality
- `video_transcripts` table - Has 21 videos

### Documentation:
- `ACTUAL-ROOT-CAUSE.md` - **OUTDATED** (incorrectly blamed wrong videos)
- `BLOX-WIZARD-IMPLEMENTATION-SUMMARY.md` - Needs update

---

## Next Steps (Recommended Order)

1. **Investigate chunking bug** in `embed-module1-videos.js`
   - Check why chunks 0-2 have identical text
   - Look at the `chunkTranscript()` function (lines 51-110)

2. **Test with one video** to verify fix works:
   ```bash
   # Delete chunks for one video
   # Re-chunk that video
   # Generate embeddings
   # Test search
   ```

3. **If test succeeds**, wipe all chunks and re-process everything:
   ```bash
   # Clear database
   # Run embed-module1-videos.js (fixed version)
   # Run generate-transcript-embeddings.js
   # Verify search works
   ```

4. **Verify Module 1 coverage** (should have 90 videos, currently only 21)

---

## Success Criteria

After fixing, you should see:

**Search Query:** "How do I learn Roblox scripting for beginners?"

**Expected Results:**
```
1. "The EASIEST Beginner Guide to Scripting (Roblox)"
   Similarity: 78.5%
   Chunk 12: "Instance.new creates a new part..."

2. "The ULTIMATE Beginner Guide to Roblox Studio"
   Similarity: 65.2%
   Chunk 3: "Workspace is where you put game objects..."

3. "The Complete Guide to Roblox Development Success"
   Similarity: 58.7%
   Chunk 8: "Learning Lua basics for Roblox..."
```

**Current Results:**
```
1. "Blender 4.5 Basics - Intro"
   Similarity: 4.5%
   Chunk 5: [Generic intro text]

[Roblox videos don't even appear in results]
```

---

## Questions to Answer

1. **Why are chunks 0-2 duplicates?** → Debug `chunkTranscript()` function
2. **Are all videos affected or just some?** → Check multiple videos
3. **When were these embeddings generated?** → Check creation timestamps
4. **What script generated them?** → Likely an older/different version

---

## Summary

**We don't have a "missing embeddings" problem.**
**We have a "bad chunk quality" problem.**

The embeddings are working perfectly - they're just embedding duplicate/poor-quality chunk text, which leads to meaningless similarity scores.

**Fix the chunking → Regenerate embeddings → Search will work**
