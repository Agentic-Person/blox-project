const fs = require('fs');
const path = require('path');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

console.log(`
=== YouTube Video Integration Script (8-27-2025) ===
Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE UPDATE'}
Verbose: ${VERBOSE ? 'ON' : 'OFF'}
================================================
`);

// File paths
const curriculumPath = path.join(__dirname, '../src/data/curriculum.json');
const youtubeListPath = path.join(__dirname, '../docs/PP-updated-youtube-list.md');
const backupPath = path.join(__dirname, '../src/data/curriculum-backup-8-27-2025-youtube-integration.json');

// Read current curriculum
let curriculum;
try {
  curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
  console.log('✅ Loaded curriculum.json');
} catch (error) {
  console.error('❌ Failed to load curriculum.json:', error.message);
  process.exit(1);
}

// Read YouTube list
let youtubeListContent;
try {
  youtubeListContent = fs.readFileSync(youtubeListPath, 'utf8');
  console.log('✅ Loaded PP-updated-youtube-list.md');
} catch (error) {
  console.error('❌ Failed to load YouTube list:', error.message);
  process.exit(1);
}

// Parse YouTube list to extract videos by day
function parseYouTubeList(content) {
  const lines = content.split('\n');
  const videosByDay = {};
  const dayPattern = /^\| (\d+) \|/;
  
  console.log('\n📋 Parsing YouTube video list...');
  
  for (const line of lines) {
    const match = line.match(dayPattern);
    if (match) {
      const dayNum = parseInt(match[1]);
      const parts = line.split('|').map(p => p.trim());
      
      if (parts.length >= 5) {
        const title = parts[2];
        const creator = parts[3];
        const url = parts[4];
        
        // Extract YouTube video ID from URL
        const youtubeIdMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
        if (youtubeIdMatch) {
          const youtubeId = youtubeIdMatch[1];
          
          if (!videosByDay[dayNum]) {
            videosByDay[dayNum] = [];
          }
          
          videosByDay[dayNum].push({
            title,
            creator,
            youtubeId,
            url,
            thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
          });
          
          if (VERBOSE) {
            console.log(`  Day ${dayNum}: ${title} (${youtubeId})`);
          }
        }
      }
    }
  }
  
  const totalDays = Object.keys(videosByDay).length;
  const totalVideos = Object.values(videosByDay).reduce((sum, videos) => sum + videos.length, 0);
  console.log(`📊 Parsed ${totalVideos} videos across ${totalDays} days`);
  
  return videosByDay;
}

// Find curriculum position for a given day number
function findCurriculumDay(curriculum, targetDayNum) {
  let currentDay = 0;
  
  for (let moduleIdx = 0; moduleIdx < curriculum.modules.length; moduleIdx++) {
    const module = curriculum.modules[moduleIdx];
    
    for (let weekIdx = 0; weekIdx < module.weeks.length; weekIdx++) {
      const week = module.weeks[weekIdx];
      
      for (let dayIdx = 0; dayIdx < week.days.length; dayIdx++) {
        currentDay++;
        
        if (currentDay === targetDayNum) {
          return {
            moduleIdx,
            weekIdx,
            dayIdx,
            dayObject: week.days[dayIdx]
          };
        }
      }
    }
  }
  
  return null;
}

// Update curriculum with YouTube videos
function updateCurriculumVideos(curriculum, videosByDay) {
  console.log('\n🔄 Starting curriculum update...');
  
  const updates = {
    videosUpdated: 0,
    daysUpdated: 0,
    skippedExisting: 0,
    errors: []
  };
  
  for (const [dayNum, youtubeVideos] of Object.entries(videosByDay)) {
    const dayNumber = parseInt(dayNum);
    const curriculumDay = findCurriculumDay(curriculum, dayNumber);
    
    if (!curriculumDay) {
      updates.errors.push(`Day ${dayNumber}: Not found in curriculum structure`);
      continue;
    }
    
    console.log(`\n📅 Processing Day ${dayNumber}...`);
    
    // Find placeholder videos to replace
    let updatedInThisDay = 0;
    let videoIdx = 0; // Track which YouTube video to use
    
    for (let i = 0; i < curriculumDay.dayObject.videos.length && videoIdx < youtubeVideos.length; i++) {
      const curriculumVideo = curriculumDay.dayObject.videos[i];
      
      // Only replace placeholder videos
      if (curriculumVideo.youtubeId === 'YOUTUBE_ID_PLACEHOLDER') {
        const youtubeVideo = youtubeVideos[videoIdx];
        
        // Update the video with YouTube data
        curriculumVideo.title = youtubeVideo.title;
        curriculumVideo.creator = youtubeVideo.creator;
        curriculumVideo.youtubeId = youtubeVideo.youtubeId;
        curriculumVideo.thumbnail = youtubeVideo.thumbnail;
        
        if (VERBOSE) {
          console.log(`  ✅ Updated video ${i + 1}: ${youtubeVideo.title}`);
        }
        
        updatedInThisDay++;
        videoIdx++;
      } else {
        updates.skippedExisting++;
        if (VERBOSE) {
          console.log(`  ⏭️ Skipped existing video: ${curriculumVideo.title}`);
        }
      }
    }
    
    if (updatedInThisDay > 0) {
      updates.videosUpdated += updatedInThisDay;
      updates.daysUpdated++;
      console.log(`  📊 Updated ${updatedInThisDay} videos on Day ${dayNumber}`);
    }
    
    // Report if there are leftover YouTube videos that couldn't be placed
    if (videoIdx < youtubeVideos.length) {
      const leftover = youtubeVideos.length - videoIdx;
      updates.errors.push(`Day ${dayNumber}: ${leftover} YouTube videos couldn't be placed (no more placeholders)`);
    }
  }
  
  return updates;
}

// Generate summary report
function generateReport(updates, videosByDay) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 INTEGRATION SUMMARY REPORT');
  console.log('='.repeat(60));
  console.log(`📊 Videos Updated: ${updates.videosUpdated}`);
  console.log(`📅 Days Updated: ${updates.daysUpdated}`);
  console.log(`⏭️ Existing Videos Skipped: ${updates.skippedExisting}`);
  console.log(`❌ Errors: ${updates.errors.length}`);
  
  if (updates.errors.length > 0) {
    console.log('\n⚠️ ERRORS:');
    updates.errors.forEach(error => console.log(`  • ${error}`));
  }
  
  console.log('\n📈 UPDATED DAYS:');
  for (const dayNum of Object.keys(videosByDay).sort((a, b) => parseInt(a) - parseInt(b))) {
    const videos = videosByDay[dayNum];
    console.log(`  Day ${dayNum}: ${videos.length} video${videos.length === 1 ? '' : 's'}`);
  }
  
  console.log('='.repeat(60));
}

// Main execution
function main() {
  try {
    // Create backup
    if (!DRY_RUN) {
      fs.writeFileSync(backupPath, JSON.stringify(curriculum, null, 2));
      console.log(`💾 Backup created: ${backupPath}`);
    }
    
    // Parse YouTube list
    const videosByDay = parseYouTubeList(youtubeListContent);
    
    // Update curriculum
    const updates = updateCurriculumVideos(curriculum, videosByDay);
    
    // Save updated curriculum
    if (!DRY_RUN) {
      fs.writeFileSync(curriculumPath, JSON.stringify(curriculum, null, 2));
      console.log('\n💾 Updated curriculum.json saved');
    } else {
      console.log('\n🔍 DRY RUN: No changes made to curriculum.json');
    }
    
    // Generate report
    generateReport(updates, videosByDay);
    
    console.log(`\n✅ Integration complete! ${DRY_RUN ? '(Dry run)' : ''}`);
    
  } catch (error) {
    console.error('❌ Integration failed:', error.message);
    if (VERBOSE) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the script
main();