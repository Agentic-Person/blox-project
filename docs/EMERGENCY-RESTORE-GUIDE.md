# Emergency Database Restore Guide

**Date:** October 20, 2025
**Restore Target:** October 19, 2025 (before data deletion)
**Recovery Time:** ~30 minutes

---

## Step 1: Access Supabase Point-in-Time Recovery

### Navigate to Backups
1. Go to: https://supabase.com/dashboard
2. Select your Blox Buddy project
3. Click **Database** in the left sidebar
4. Click **Backups** tab

### Locate Recovery Point
- **Target Date/Time:** October 19, 2025, ~11:59 PM
- **Before Event:** Deletion of 21 videos and 121 chunks
- **Expected Data:**
  - 21 videos in `video_transcripts` table
  - 121 chunks in `transcript_chunks` table
  - All embeddings intact

---

## Step 2: Initiate Point-in-Time Recovery

### Important Notes
- ⚠️ **This will restore the ENTIRE database** to the selected point
- ⚠️ **Any changes made after October 19 will be lost**
- ✅ **All other tables (users, learning_progress, etc.) will also revert**

### Recovery Options

#### Option A: Full Database Restore
1. Click **Point-in-Time Recovery** button
2. Select date: **October 19, 2025**
3. Select time: **23:59** (just before deletion)
4. Review what will be restored
5. Click **Restore Database**
6. Wait 10-15 minutes for completion

#### Option B: Table-Specific Restore (If Available)
1. If Supabase offers table-level restore:
   - Restore only `video_transcripts`
   - Restore only `transcript_chunks`
2. This preserves changes to other tables

---

## Step 3: Verify Restoration

After restore completes, run the verification script:

```bash
node scripts/verify-restore-success.js
```

Expected output:
```
✅ RESTORE SUCCESSFUL!

📊 Database Status:
   Video transcripts: 21
   Transcript chunks: 121
   Chunks with embeddings: 121

🎯 Search Function Status:
   ✅ Function exists
   ✅ Returns results
   ✅ Similarity scores: 2-5% (low but functional)
```

---

## Step 4: Test Search Functionality

Run the actual search test:

```bash
node scripts/test-actual-search.js
```

You should see results like:
```
🔍 Test Query: "Roblox scripting basics"

📊 RESULTS (10 chunks):
   1. "The EASIEST Beginner Guide to Scripting (Roblox)"
      Chunk 5: [00:02:30 - 00:03:00]
      Similarity: 4.2%
```

**Note:** Low similarity (2-5%) is expected. Feature is working but not optimal.

---

## What If Restore Fails?

### Plan B: Metadata-Only Search (2-hour implementation)

If point-in-time recovery doesn't work, we'll implement basic search using:
- Video titles only
- Keyword matching
- No embeddings required
- No transcripts needed

**Implementation:**
```javascript
// Search videos by title/description keywords
function searchByMetadata(query) {
  return videos.filter(v =>
    v.title.toLowerCase().includes(query.toLowerCase()) ||
    v.description?.toLowerCase().includes(query.toLowerCase())
  )
}
```

**Limitations:**
- No timestamp-specific search
- Less intelligent than semantic search
- Misses content not in title/description

**Advantages:**
- Works with current curriculum (no transcripts needed)
- Fast to implement
- No API dependencies
- No embedding costs

---

## Prevention Measures

To avoid this happening again:

### 1. Before ANY Data Deletion
```bash
# Create backup first
pg_dump > backup_$(date +%Y%m%d).sql

# OR create a Supabase snapshot
# Dashboard → Database → Backups → Create Snapshot
```

### 2. Verification Before Deletion
```javascript
// Always show counts BEFORE confirming delete
console.log(`⚠️  About to delete:`)
console.log(`   ${transcriptCount} videos`)
console.log(`   ${chunkCount} chunks`)
console.log(`   ${embeddingCount} embeddings`)

const answer = await promptUser('Type "DELETE" to confirm: ')
if (answer !== 'DELETE') {
  console.log('❌ Cancelled')
  return
}
```

### 3. Never Assume "Corruption"
- Low quality results ≠ corrupted data
- 85-second chunks ≠ corrupted data
- Identical text in first chunks = investigate first, don't delete

---

## Timeline

**Total Time:** ~45 minutes

1. Navigate to Supabase dashboard (5 min)
2. Find correct restore point (5 min)
3. Initiate restore (2 min)
4. Wait for restore completion (15-20 min)
5. Run verification scripts (5 min)
6. Test search functionality (5 min)
7. Document what was restored (5 min)

---

## Next Steps After Restore

Once data is restored:

1. **STOP investigating chunk quality** - feature works, move on
2. **Document current state** as "functional but low similarity"
3. **Focus on other Blox Wizard features**
4. **Return to this later** when we have more time to investigate properly

---

## Support

If you encounter issues:

1. **Restore not available:** Supabase free tier may have limited backup retention
2. **Restore fails:** Check Supabase status page
3. **Can't find backup:** Contact Supabase support with project ID

**Emergency Contact:**
- Supabase Support: https://supabase.com/dashboard/support
- Include: Project ID, approximate deletion time, tables affected

---

## Summary

**We're recovering from:**
- Misdiagnosed "corruption" (data was actually working)
- Unnecessary deletion of 21 videos and 121 chunks
- Failed re-scrape attempt (0/85 videos have transcripts)

**We're restoring to:**
- October 19, 2025 state
- 21 working videos with transcripts
- 121 chunks with embeddings
- Functional (if imperfect) search

**Lesson learned:**
- Working imperfectly > Not working at all
- Always backup before deletion
- Investigate before assuming corruption
