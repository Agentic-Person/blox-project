/**
 * Populate Videos Script
 *
 * This script reads the curriculum.json file and populates the Supabase videos table
 * with all video metadata from the curriculum.
 *
 * Usage:
 *   node scripts/populate-videos.js
 *
 * Features:
 * - Extracts all videos from curriculum modules/weeks/days
 * - Maps curriculum data to videos table schema
 * - Upserts (insert or update) based on youtube_id to handle duplicates
 * - Provides detailed logging and error handling
 * - Shows progress and summary statistics
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Parse duration string (MM:SS or HH:MM:SS) to total minutes
 */
function parseDurationToMinutes(duration) {
  const parts = duration.split(':').map(p => parseInt(p, 10));

  if (parts.length === 2) {
    // MM:SS format
    const [minutes, seconds] = parts;
    return minutes + Math.ceil(seconds / 60);
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    return (hours * 60) + minutes + Math.ceil(seconds / 60);
  }

  return 0;
}

/**
 * Extract all videos from curriculum with their context
 */
function extractVideosFromCurriculum(curriculum) {
  const videos = [];
  let globalOrderIndex = 0;

  for (const module of curriculum.modules) {
    for (const week of module.weeks) {
      for (const day of week.days) {
        let dayOrderIndex = 0;

        for (const video of day.videos) {
          // Skip assignment-type videos that don't have YouTube IDs
          if (video.type === 'assignment' || !video.youtubeId) {
            console.log(`   ⏭️  Skipping: ${video.title} (${video.type || 'no YouTube ID'})`);
            continue;
          }

          // Calculate total_minutes if not provided
          const totalMinutes = video.totalMinutes ||
            (video.duration ? parseDurationToMinutes(video.duration) : 0);

          const videoRecord = {
            youtube_id: video.youtubeId,
            title: video.title,
            creator: video.creator,
            description: video.description,
            duration: video.duration,
            total_minutes: totalMinutes,
            thumbnail_url: video.thumbnail,
            xp_reward: video.xpReward || 25,
            module_id: module.id,
            week_id: week.id,
            day_id: day.id,
            order_index: globalOrderIndex
          };

          videos.push(videoRecord);
          globalOrderIndex++;
          dayOrderIndex++;
        }
      }
    }
  }

  return videos;
}

/**
 * Insert videos into Supabase with upsert logic
 */
async function insertVideos(videos) {
  let success = 0;
  let failed = 0;
  const errors = [];

  console.log(`\n📤 Uploading ${videos.length} videos to Supabase...`);
  console.log('═'.repeat(60));

  // Insert in batches to avoid overwhelming the database
  const BATCH_SIZE = 50;

  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    const batch = videos.slice(i, i + BATCH_SIZE);

    try {
      // Use upsert to handle duplicates gracefully
      const { data, error } = await supabase
        .from('videos')
        .upsert(batch, {
          onConflict: 'youtube_id',
          ignoreDuplicates: false // Update existing records
        })
        .select();

      if (error) {
        console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
        failed += batch.length;
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        success += batch.length;
        console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} videos uploaded`);

        // Show some sample videos from this batch
        if (data && data.length > 0) {
          console.log(`   Sample: "${data[0].title}" (${data[0].youtube_id})`);
        }
      }

      // Small delay to avoid rate limiting
      if (i + BATCH_SIZE < videos.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} exception:`, errorMessage);
      failed += batch.length;
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${errorMessage}`);
    }
  }

  return { success, failed, errors };
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 Video Population Script');
  console.log('═'.repeat(60));

  // 1. Read curriculum.json
  const curriculumPath = path.join(__dirname, '../src/data/curriculum.json');

  if (!fs.existsSync(curriculumPath)) {
    console.error(`❌ Curriculum file not found: ${curriculumPath}`);
    process.exit(1);
  }

  console.log(`📖 Reading curriculum from: ${curriculumPath}`);

  let curriculum;
  try {
    const fileContent = fs.readFileSync(curriculumPath, 'utf-8');
    curriculum = JSON.parse(fileContent);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error reading curriculum.json: ${errorMessage}`);
    process.exit(1);
  }

  console.log(`✅ Curriculum loaded successfully`);
  console.log(`   Modules: ${curriculum.modules.length}`);

  // 2. Extract videos
  console.log('\n📹 Extracting videos from curriculum...');
  const allVideos = extractVideosFromCurriculum(curriculum);

  console.log(`✅ Extracted ${allVideos.length} videos`);

  // Deduplicate by youtube_id (keep first occurrence with lowest order_index)
  const videoMap = new Map();
  for (const video of allVideos) {
    if (!videoMap.has(video.youtube_id)) {
      videoMap.set(video.youtube_id, video);
    } else {
      console.log(`   🔄 Duplicate found: ${video.youtube_id} - "${video.title}"`);
    }
  }

  const videos = Array.from(videoMap.values());
  const duplicateCount = allVideos.length - videos.length;

  if (duplicateCount > 0) {
    console.log(`\n⚠️  Found ${duplicateCount} duplicate videos (same YouTube ID)`);
    console.log(`✅ Proceeding with ${videos.length} unique videos`);
  }

  // Show some statistics
  const moduleStats = videos.reduce((acc, v) => {
    acc[v.module_id] = (acc[v.module_id] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Videos per module:');
  Object.entries(moduleStats).forEach(([moduleId, count]) => {
    console.log(`   ${moduleId}: ${count} videos`);
  });

  // 3. Insert into Supabase
  const result = await insertVideos(videos);

  // 4. Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 UPLOAD SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Successfully uploaded: ${result.success}/${videos.length}`);
  console.log(`❌ Failed: ${result.failed}/${videos.length}`);

  if (result.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    result.errors.forEach(error => console.log(`   - ${error}`));
  }

  // 5. Verify insertion
  console.log('\n🔍 Verifying database state...');
  const { count, error: countError } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error(`❌ Error verifying: ${countError.message}`);
  } else {
    console.log(`✅ Total videos in database: ${count}`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Script complete!');
  console.log('═'.repeat(60) + '\n');

  process.exit(result.failed > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(2);
  });
}

module.exports = { extractVideosFromCurriculum, insertVideos };
