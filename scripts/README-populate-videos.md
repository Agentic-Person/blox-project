# Video Population Script

## Overview

The `populate-videos.js` script reads the curriculum.json file and populates the Supabase `videos` table with all video metadata from the curriculum.

## Features

- ✅ Extracts all videos from curriculum modules/weeks/days
- ✅ Maps curriculum data to videos table schema
- ✅ Handles duplicates by deduplicating videos with the same YouTube ID
- ✅ Upserts (insert or update) to Supabase based on `youtube_id`
- ✅ Provides detailed logging and progress tracking
- ✅ Shows summary statistics
- ✅ Skips assignment-type videos without YouTube IDs

## Prerequisites

- Node.js installed
- `.env.local` file with Supabase credentials:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Usage

### JavaScript Version (Recommended)
```bash
node scripts/populate-videos.js
```

### TypeScript Version (Requires tsx)
```bash
npx tsx scripts/populate-videos.ts
```

## What It Does

1. **Reads Curriculum Data**: Loads `src/data/curriculum.json`
2. **Extracts Videos**: Traverses all modules → weeks → days → videos
3. **Deduplicates**: Removes duplicate videos (same `youtube_id`)
4. **Maps Data**: Transforms curriculum structure to database schema
5. **Uploads**: Batch uploads to Supabase (50 videos per batch)
6. **Verifies**: Confirms total count in database

## Data Mapping

The script maps curriculum video data to the database schema:

| Curriculum Field | Database Field  | Notes                          |
|-----------------|-----------------|--------------------------------|
| `youtubeId`     | `youtube_id`    | Primary key (unique)           |
| `title`         | `title`         | Video title                    |
| `creator`       | `creator`       | Channel/creator name           |
| `description`   | `description`   | Video description              |
| `duration`      | `duration`      | Format: "MM:SS" or "HH:MM:SS"  |
| `totalMinutes`  | `total_minutes` | Calculated if not provided     |
| `thumbnail`     | `thumbnail_url` | YouTube thumbnail URL          |
| `xpReward`      | `xp_reward`     | Default: 25                    |
| (context)       | `module_id`     | From parent module             |
| (context)       | `week_id`       | From parent week               |
| (context)       | `day_id`        | From parent day                |
| (calculated)    | `order_index`   | Sequential ordering            |

## Output Example

```
🚀 Video Population Script
════════════════════════════════════════════════════════════
📖 Reading curriculum from: D:\BloxProject\src\data\curriculum.json
✅ Curriculum loaded successfully
   Modules: 6

📹 Extracting videos from curriculum...
   ⏭️  Skipping: Roblox Studio Learning Course (assignment)
✅ Extracted 244 videos
   🔄 Duplicate found: p005iduooyw - "The ULTIMATE Beginner Guide..."

⚠️  Found 170 duplicate videos (same YouTube ID)
✅ Proceeding with 74 unique videos

📊 Videos per module:
   module-1: 74 videos

📤 Uploading 74 videos to Supabase...
════════════════════════════════════════════════════════════
✅ Batch 1: 50 videos uploaded
   Sample: "The ULTIMATE Beginner Guide..." (p005iduooyw)
✅ Batch 2: 24 videos uploaded

════════════════════════════════════════════════════════════
📊 UPLOAD SUMMARY
════════════════════════════════════════════════════════════
✅ Successfully uploaded: 74/74
❌ Failed: 0/74

🔍 Verifying database state...
✅ Total videos in database: 74
```

## Error Handling

The script handles:
- ✅ Missing environment variables
- ✅ File not found errors
- ✅ JSON parsing errors
- ✅ Supabase connection errors
- ✅ Batch upload failures
- ✅ Duplicate YouTube IDs

## Notes

### Duplicates
The script found 170 duplicates in the curriculum, primarily because:
- Many videos have placeholder IDs: `YOUTUBE_ID_PLACEHOLDER`
- Some videos are referenced in multiple places in the curriculum
- The deduplication keeps the **first occurrence** (lowest order_index)

### Videos Without YouTube IDs
Videos marked as `type: "assignment"` or without a `youtubeId` field are automatically skipped.

### Upsert Behavior
- The script uses `upsert` with `onConflict: 'youtube_id'`
- If a video already exists, it will be **updated** with new data
- Safe to run multiple times

## Troubleshooting

### Error: "Missing Supabase credentials"
- Ensure `.env.local` exists in the project root
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### Error: "Curriculum file not found"
- Verify `src/data/curriculum.json` exists
- Check file path is correct

### Error: "ON CONFLICT DO UPDATE command cannot affect row a second time"
- This was fixed by adding deduplication logic
- If you see this, ensure you're using the latest version of the script

## Related Scripts

- `process-videos-to-supabase.js` - Processes video transcripts and embeddings
- See other scripts in `scripts/` directory for related functionality

## Last Run Results

- **Date**: 2025-12-09
- **Total Videos Extracted**: 244
- **Duplicates Found**: 170
- **Unique Videos Uploaded**: 74
- **Status**: ✅ Success
