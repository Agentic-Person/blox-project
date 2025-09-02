#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Interactive video replacement with manual duration input
 * Usage: node replace-video-interactive.js [youtube-url] [duration] [module] [week] [day] [video]
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

function extractYouTubeId(url) {
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

function fetchVideoMetadata(videoId) {
  return new Promise((resolve, reject) => {
    // Use YouTube's oEmbed API to get basic video info
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    console.log(`📡 Fetching metadata for video: ${videoId}`);
    
    https.get(oembedUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const videoInfo = JSON.parse(data);
          resolve({
            title: videoInfo.title,
            creator: videoInfo.author_name,
            thumbnail: videoInfo.thumbnail_url
          });
        } catch (error) {
          reject(new Error(`Failed to parse video metadata: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function replaceVideoInteractive(youtubeUrl, duration, moduleIndex, weekIndex, dayIndex, videoIndex) {
  try {
    console.log('🚀 Starting interactive video replacement...');
    
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }
    
    console.log(`🎯 Target: Module ${moduleIndex + 1}, Week ${weekIndex + 1}, Day ${dayIndex + 1}, Video ${videoIndex + 1}`);
    
    // Fetch video metadata
    const metadata = await fetchVideoMetadata(videoId);
    console.log(`📺 Found video: "${metadata.title}" by ${metadata.creator}`);
    console.log(`⏱️ Using provided duration: ${duration}`);
    
    // Load curriculum
    const curriculum = loadCurriculum();
    const module = curriculum.modules[moduleIndex];
    
    if (!module) {
      throw new Error(`Module ${moduleIndex + 1} not found`);
    }
    
    const week = module.weeks[weekIndex];
    if (!week) {
      throw new Error(`Week ${weekIndex + 1} not found`);
    }
    
    const day = week.days[dayIndex];
    if (!day) {
      throw new Error(`Day ${dayIndex + 1} not found`);
    }
    
    const video = day.videos[videoIndex];
    if (!video) {
      throw new Error(`Video ${videoIndex + 1} not found`);
    }
    
    // Update video with fetched metadata and provided duration
    const oldTitle = video.title;
    const oldDuration = video.duration;
    video.title = metadata.title;
    video.youtubeId = videoId;
    video.creator = metadata.creator;
    video.duration = duration;
    video.thumbnail = metadata.thumbnail;
    
    // Remove placeholder flag if it exists
    if (video.isPlaceholder) {
      delete video.isPlaceholder;
    }
    
    console.log(`📝 Updated video:`);
    console.log(`   Old Title: "${oldTitle}"`);
    console.log(`   New Title: "${metadata.title}"`);
    console.log(`   Old Duration: ${oldDuration}`);
    console.log(`   New Duration: ${duration}`);
    console.log(`   Creator: ${metadata.creator}`);
    console.log(`   YouTube ID: ${videoId}`);
    
    // Save curriculum
    saveCurriculum(curriculum);
    
    return {
      success: true,
      metadata: {...metadata, duration},
      location: {
        module: moduleIndex + 1,
        week: weekIndex + 1,
        day: dayIndex + 1,
        video: videoIndex + 1
      }
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    const youtubeUrl = process.argv[2];
    const duration = process.argv[3];
    
    if (!youtubeUrl || !duration) {
      console.error('❌ Error: Please provide a YouTube URL and duration');
      console.log('Usage: node replace-video-interactive.js [youtube-url] [duration] [module] [week] [day] [video]');
      console.log('Example: node replace-video-interactive.js "https://www.youtube.com/watch?v=abc123" "39:33"');
      console.log('Quick usage: node replace-video-interactive.js [youtube-url] [duration] (updates Module 1, Week 1, Day 1, Video 1)');
      process.exit(1);
    }
    
    // Validate duration format
    if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(duration)) {
      console.error('❌ Error: Duration must be in format MM:SS or HH:MM:SS');
      console.log('Examples: "5:30", "39:33", "1:23:45"');
      process.exit(1);
    }
    
    // Parse optional position arguments
    const moduleIndex = parseInt(process.argv[4]) - 1 || 0;
    const weekIndex = parseInt(process.argv[5]) - 1 || 0;
    const dayIndex = parseInt(process.argv[6]) - 1 || 0;
    const videoIndex = parseInt(process.argv[7]) - 1 || 0;
    
    const result = await replaceVideoInteractive(youtubeUrl, duration, moduleIndex, weekIndex, dayIndex, videoIndex);
    
    console.log('\n✅ Successfully updated video with accurate metadata!');
    console.log(`📍 Location: Module ${result.location.module}, Week ${result.location.week}, Day ${result.location.day}, Video ${result.location.video}`);
    console.log(`⏱️ Duration: ${result.metadata.duration} (manually provided)`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { replaceVideoInteractive };