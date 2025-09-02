#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Integrates playlist videos into curriculum at specified location
 * Usage: node integrate-playlist.js [module] [week] [startDay]
 */

function loadCurriculum() {
  const curriculumPath = path.join(__dirname, '../../src/data/curriculum.json');
  return JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
}

function loadPlaylistData() {
  const playlistPath = path.join(__dirname, 'playlist-videos.json');
  return JSON.parse(fs.readFileSync(playlistPath, 'utf8'));
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

function organizeVideosAcrossDays(videos, daysCount = 5) {
  const videosPerDay = Math.ceil(videos.length / daysCount);
  const days = [];
  
  for (let dayIndex = 0; dayIndex < daysCount; dayIndex++) {
    const startIndex = dayIndex * videosPerDay;
    const endIndex = Math.min(startIndex + videosPerDay, videos.length);
    const dayVideos = videos.slice(startIndex, endIndex);
    
    if (dayVideos.length > 0) {
      days.push(dayVideos);
    }
  }
  
  return days;
}

function integratePlaylist(moduleIndex, weekIndex, playlistData, options = {}) {
  const curriculum = loadCurriculum();
  const module = curriculum.modules[moduleIndex];
  
  if (!module) {
    throw new Error(`Module ${moduleIndex + 1} not found`);
  }
  
  const week = module.weeks[weekIndex];
  if (!week) {
    throw new Error(`Week ${weekIndex + 1} not found in Module ${moduleIndex + 1}`);
  }
  
  console.log(`🎯 Integrating ${playlistData.videos.length} videos into Module ${moduleIndex + 1}, Week ${weekIndex + 1}`);
  
  // Update week title if specified
  if (options.weekTitle) {
    console.log(`📝 Updating week title: "${week.title}" → "${options.weekTitle}"`);
    week.title = options.weekTitle;
  }
  
  // Update week description if needed
  if (options.weekDescription) {
    week.description = options.weekDescription;
  }
  
  // Organize videos across days (5 days per week typical)
  const videosPerDay = organizeVideosAcrossDays(playlistData.videos, 5);
  
  console.log(`📚 Distributing videos across ${videosPerDay.length} days:`);
  videosPerDay.forEach((dayVideos, dayIndex) => {
    console.log(`   Day ${dayIndex + 1}: ${dayVideos.length} videos`);
  });
  
  // Update each day
  videosPerDay.forEach((dayVideos, dayIndex) => {
    if (dayIndex < week.days.length) {
      const day = week.days[dayIndex];
      
      // Update day title for Day 1 if specified
      if (dayIndex === 0 && options.dayTitle) {
        console.log(`📝 Updating day title: "${day.title}" → "${options.dayTitle}"`);
        day.title = options.dayTitle;
      }
      
      // Clear existing videos and add new ones
      day.videos = dayVideos.map((video, videoIndex) => ({
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
      
      // Update practice task to be Blender-related
      if (dayIndex === 0) {
        day.practiceTask = 'Set up Blender and familiarize yourself with the interface';
        day.estimatedTime = `${Math.round(dayVideos.length * 12 / 60 * 100) / 100}h`;
      } else {
        day.practiceTask = `Practice Blender techniques from Day ${dayIndex + 1} videos`;
        day.estimatedTime = `${Math.round(dayVideos.length * 12 / 60 * 100) / 100}h`;
      }
    }
  });
  
  return curriculum;
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting playlist integration...');
    
    // Check if playlist data exists
    const playlistPath = path.join(__dirname, 'playlist-videos.json');
    if (!fs.existsSync(playlistPath)) {
      console.error('❌ Error: playlist-videos.json not found. Run fetch-playlist.js first.');
      process.exit(1);
    }
    
    const playlistData = loadPlaylistData();
    console.log(`📋 Loaded playlist: ${playlistData.playlistTitle}`);
    console.log(`📼 Videos: ${playlistData.videos.length}`);
    
    // Integration settings - Module 1 (index 0), Week 2 (index 1)
    const moduleIndex = 0; // Module 1
    const weekIndex = 1;   // Week 2
    
    const options = {
      weekTitle: 'W2: 3D Modeling: An Introduction to Blender 3D',
      weekDescription: 'Master Blender 4.x fundamentals for 3D modeling and animation',
      dayTitle: 'D1: Blender 4.x Interface & Basic Navigation'
    };
    
    // Integrate the playlist
    const updatedCurriculum = integratePlaylist(moduleIndex, weekIndex, playlistData, options);
    
    // Save the updated curriculum
    saveCurriculum(updatedCurriculum);
    
    console.log(`\n✅ Successfully integrated playlist into curriculum!`);
    console.log(`📍 Location: Module ${moduleIndex + 1}, Week ${weekIndex + 1}`);
    console.log(`📚 Updated: ${playlistData.videos.length} videos across 5 days`);
    
    // Show summary
    const week = updatedCurriculum.modules[moduleIndex].weeks[weekIndex];
    console.log(`\n📊 Week 2 Summary:`);
    console.log(`   Title: ${week.title}`);
    console.log(`   Description: ${week.description}`);
    week.days.forEach((day, index) => {
      console.log(`   Day ${index + 1}: ${day.videos.length} videos - ${day.title}`);
    });
    
  } catch (error) {
    console.error('❌ Error during integration:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { integratePlaylist, organizeVideosAcrossDays };