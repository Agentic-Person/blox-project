const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Load the found videos
const foundVideosPath = path.join(__dirname, '../youtube-videos-found-2025-08-24T16-43-09-909Z.json');
const curriculumUpdatePath = path.join(__dirname, '../curriculum-update-2025-08-24T16-43-09-909Z.json');
const curriculumPath = path.join(__dirname, '../src/data/curriculum.json');

if (!fs.existsSync(foundVideosPath)) {
  console.error('❌ Found videos file not found. Please run youtube-search-real-videos.js first.');
  process.exit(1);
}

// Load data
const foundVideos = JSON.parse(fs.readFileSync(foundVideosPath, 'utf-8'));
const curriculumUpdate = JSON.parse(fs.readFileSync(curriculumUpdatePath, 'utf-8'));
const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));

// Helper function to convert ISO duration to readable format
function formatDuration(isoDuration) {
  if (!isoDuration) return '20:00';
  
  // Parse ISO 8601 duration (e.g., "PT11M26S")
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '20:00';
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Helper function to calculate XP based on duration
function calculateXP(duration) {
  const parts = duration.split(':');
  const totalMinutes = parts.length === 3 
    ? parseInt(parts[0]) * 60 + parseInt(parts[1])
    : parseInt(parts[0]);
  
  if (totalMinutes >= 60) return 100;
  if (totalMinutes >= 35) return 70;
  if (totalMinutes >= 25) return 50;
  if (totalMinutes >= 15) return 30;
  return 20;
}

// Create a map of day to videos from the curriculum update data
const dayVideoMap = {};
Object.keys(curriculumUpdate).forEach(dayKey => {
  const dayNum = parseInt(dayKey.replace('day-', ''));
  if (!isNaN(dayNum)) {
    dayVideoMap[dayNum] = curriculumUpdate[dayKey];
  }
});

// Update the curriculum
let totalUpdated = 0;
let totalNotFound = 0;
let totalPlaceholder = 0;

console.log('🚀 Updating curriculum with found YouTube videos...\n');

curriculum.modules.forEach((module, moduleIndex) => {
  console.log(`\n📚 Module ${moduleIndex + 1}: ${module.title}`);
  
  module.weeks.forEach((week, weekIndex) => {
    console.log(`  📅 Week ${weekIndex + 1}: ${week.title}`);
    
    week.days.forEach((day, dayIndex) => {
      // Calculate the absolute day number (1-120)
      const dayNum = (moduleIndex * 20) + (weekIndex * 5) + dayIndex + 1;
      const dayVideos = dayVideoMap[dayNum];
      
      if (dayVideos && dayVideos.length > 0) {
        // We have found videos for this day
        console.log(`    ✅ Day ${dayNum}: ${day.title} - ${dayVideos.length} videos found`);
        
        // Update each video slot
        day.videos = day.videos.map((video, videoIndex) => {
          if (videoIndex < dayVideos.length) {
            const foundVideo = dayVideos[videoIndex];
            const duration = formatDuration(foundVideo.duration);
            
            totalUpdated++;
            return {
              ...video,
              title: foundVideo.title.replace(/&amp;/g, '&').replace(/&#39;/g, "'"),
              youtubeId: foundVideo.videoId,
              creator: foundVideo.channelTitle,
              duration: duration,
              xpReward: calculateXP(duration),
              originalSearch: {
                title: foundVideo.originalTitle,
                creator: foundVideo.originalCreator
              }
            };
          } else {
            // Keep as placeholder if we don't have enough videos
            totalPlaceholder++;
            return {
              ...video,
              youtubeId: `placeholder_${moduleIndex + 1}_${weekIndex + 1}_${dayIndex + 1}_${videoIndex + 1}`,
              placeholder: true
            };
          }
        });
        
        // If we have more found videos than slots, add them
        if (dayVideos.length > day.videos.length) {
          for (let i = day.videos.length; i < dayVideos.length; i++) {
            const foundVideo = dayVideos[i];
            const duration = formatDuration(foundVideo.duration);
            
            day.videos.push({
              id: `video-${moduleIndex + 1}-${weekIndex + 1}-${dayIndex + 1}-${i + 1}`,
              title: foundVideo.title.replace(/&amp;/g, '&').replace(/&#39;/g, "'"),
              youtubeId: foundVideo.videoId,
              creator: foundVideo.channelTitle,
              duration: duration,
              xpReward: calculateXP(duration),
              originalSearch: {
                title: foundVideo.originalTitle,
                creator: foundVideo.originalCreator
              }
            });
            totalUpdated++;
          }
        }
      } else {
        // No videos found for this day
        console.log(`    ❌ Day ${dayNum}: ${day.title} - No videos found`);
        
        // Mark all videos as placeholders
        day.videos = day.videos.map((video, videoIndex) => {
          totalNotFound++;
          return {
            ...video,
            youtubeId: `placeholder_${moduleIndex + 1}_${weekIndex + 1}_${dayIndex + 1}_${videoIndex + 1}`,
            placeholder: true,
            creator: 'Coming Soon'
          };
        });
      }
    });
  });
});

// Save the updated curriculum
const backupPath = path.join(__dirname, `../src/data/curriculum-backup-${Date.now()}.json`);
fs.writeFileSync(backupPath, JSON.stringify(curriculum, null, 2));
console.log(`\n💾 Backup saved to: ${backupPath}`);

fs.writeFileSync(curriculumPath, JSON.stringify(curriculum, null, 2));
console.log(`📁 Curriculum updated: ${curriculumPath}`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 UPDATE SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Videos updated with real IDs: ${totalUpdated}`);
console.log(`❌ Videos not found (placeholders): ${totalNotFound}`);
console.log(`⏳ Videos kept as placeholders: ${totalPlaceholder}`);
console.log(`📹 Total videos in curriculum: ${totalUpdated + totalNotFound + totalPlaceholder}`);

// Create a summary of what needs to be searched tomorrow
const missingSummary = {
  totalMissing: totalNotFound,
  missingByModule: {},
  nextSearchPriority: []
};

curriculum.modules.forEach((module, moduleIndex) => {
  let moduleMissing = 0;
  module.weeks.forEach(week => {
    week.days.forEach(day => {
      day.videos.forEach(video => {
        if (video.placeholder) {
          moduleMissing++;
        }
      });
    });
  });
  
  if (moduleMissing > 0) {
    missingSummary.missingByModule[`Module ${moduleIndex + 1}`] = moduleMissing;
    if (moduleIndex < 3) { // Priority on first 3 modules
      missingSummary.nextSearchPriority.push(`Module ${moduleIndex + 1}: ${module.title} (${moduleMissing} videos)`);
    }
  }
});

const missingSummaryPath = path.join(__dirname, '../missing-videos-summary.json');
fs.writeFileSync(missingSummaryPath, JSON.stringify(missingSummary, null, 2));
console.log(`\n📋 Missing videos summary saved to: ${missingSummaryPath}`);

console.log('\n✅ Curriculum update complete!');
console.log('📝 The app should now display the real YouTube videos where available.');
console.log('🔄 Run youtube-search-resume.js tomorrow when API quota resets to find remaining videos.');