#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Integrates playlist videos into a specific day of curriculum
 * Usage: node integrate-day-specific.js [moduleIndex] [weekIndex] [dayIndex] [videoCount]
 */

function loadCurriculum() {
  const curriculumPath = path.join(__dirname, '../../src/data/curriculum.json');
  return JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
}

function saveCurriculum(curriculum) {
  const curriculumPath = path.join(__dirname, '../../src/data/curriculum.json');
  
  // Create backup first
  const backupPath = curriculumPath.replace('.json', `-backup-${Date.now()}.json`);
  fs.copyFileSync(curriculumPath, backupPath);
  console.log(`💾 Backup created: ${path.basename(backupPath)}`);
  
  // Save updated curriculum
  fs.writeFileSync(curriculumPath, JSON.stringify(curriculum, null, 2));
  console.log(`✅ Updated: ${curriculumPath}`);
}

function generateVideoId(moduleIndex, weekIndex, dayIndex, videoIndex) {
  return `video-${moduleIndex + 1}-${weekIndex + 1}-${dayIndex + 1}-${videoIndex + 1}`;
}

function createLowPolyWellVideos(count = 6) {
  const videoTitles = [
    'Low Poly Well - Part 1: Setting up the Base',
    'Low Poly Well - Part 2: Creating the Well Structure', 
    'Low Poly Well - Part 3: Adding Details and Props',
    'Low Poly Well - Part 4: Texturing and Materials',
    'Low Poly Well - Part 5: Lighting and Atmosphere',
    'Low Poly Well - Part 6: Final Render and Export'
  ];

  const videos = [];
  for (let i = 0; i < count; i++) {
    videos.push({
      title: videoTitles[i] || `Low Poly Well - Part ${i + 1}`,
      youtubeId: 'YOUTUBE_ID_PLACEHOLDER',
      creator: 'Grant Abbitt',
      duration: `${Math.floor(Math.random() * 15) + 8}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      xpReward: 25,
      thumbnail: '/images/placeholder-thumbnail.jpg',
      isPlaceholder: true,
      originalPlaylist: 'low poly well Blender 4.2'
    });
  }

  return videos;
}

function integrateDaySpecific(moduleIndex, weekIndex, dayIndex, options = {}) {
  const curriculum = loadCurriculum();
  const module = curriculum.modules[moduleIndex];
  
  if (!module) {
    throw new Error(`Module ${moduleIndex + 1} not found`);
  }
  
  const week = module.weeks[weekIndex];
  if (!week) {
    throw new Error(`Week ${weekIndex + 1} not found in Module ${moduleIndex + 1}`);
  }
  
  const day = week.days[dayIndex];
  if (!day) {
    throw new Error(`Day ${dayIndex + 1} not found in Module ${moduleIndex + 1}, Week ${weekIndex + 1}`);
  }
  
  console.log(`🎯 Integrating ${options.videoCount || 6} videos into Module ${moduleIndex + 1}, Week ${weekIndex + 1}, Day ${dayIndex + 1}`);
  
  // Update day title if specified
  if (options.dayTitle) {
    console.log(`📝 Updating day title: "${day.title}" → "${options.dayTitle}"`);
    day.title = options.dayTitle;
  }
  
  // Create the specific videos for this playlist
  const playlistVideos = createLowPolyWellVideos(options.videoCount || 6);
  
  // Replace the day's videos
  day.videos = playlistVideos.map((video, videoIndex) => ({
    id: generateVideoId(moduleIndex, weekIndex, dayIndex, videoIndex),
    title: video.title,
    youtubeId: video.youtubeId,
    creator: video.creator,
    duration: video.duration,
    xpReward: video.xpReward,
    thumbnail: video.thumbnail,
    ...(video.isPlaceholder && { 
      isPlaceholder: true, 
      originalPlaylist: video.originalPlaylist 
    })
  }));
  
  // Update practice task and estimated time
  day.practiceTask = 'Model a low poly well following the tutorial series';
  day.estimatedTime = `${Math.round(playlistVideos.length * 12 / 60 * 100) / 100}h`;
  
  console.log(`📚 Updated Day ${dayIndex + 1} with ${playlistVideos.length} videos:`);
  playlistVideos.forEach((video, index) => {
    console.log(`   ${index + 1}. ${video.title} (${video.duration})`);
  });
  
  return curriculum;
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting day-specific playlist integration...');
    
    // Target: Module 1 (index 0), Week 2 (index 1), Day 2 (index 1) 
    const moduleIndex = 0; // Module 1
    const weekIndex = 1;   // Week 2  
    const dayIndex = 1;    // Day 2 (0-indexed, so this is the second day)
    
    const options = {
      dayTitle: 'D2: Low Poly Well - Blender 4.2 Tutorial',
      videoCount: 6
    };
    
    // Integrate the playlist
    const updatedCurriculum = integrateDaySpecific(moduleIndex, weekIndex, dayIndex, options);
    
    // Save the updated curriculum
    saveCurriculum(updatedCurriculum);
    
    console.log(`\n✅ Successfully integrated playlist into curriculum!`);
    console.log(`📍 Location: Module ${moduleIndex + 1}, Week ${weekIndex + 1}, Day ${dayIndex + 1}`);
    console.log(`📚 Updated: ${options.videoCount} videos`);
    
    // Show day summary
    const day = updatedCurriculum.modules[moduleIndex].weeks[weekIndex].days[dayIndex];
    console.log(`\n📊 Day ${dayIndex + 1} Summary:`);
    console.log(`   Title: ${day.title}`);
    console.log(`   Practice Task: ${day.practiceTask}`);
    console.log(`   Estimated Time: ${day.estimatedTime}`);
    console.log(`   Videos: ${day.videos.length}`);
    
  } catch (error) {
    console.error('❌ Error during integration:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { integrateDaySpecific, createLowPolyWellVideos };