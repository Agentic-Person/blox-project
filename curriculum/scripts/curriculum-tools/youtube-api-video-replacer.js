#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

/**
 * YouTube API-powered video replacement with accurate duration fetching
 * Usage: node youtube-api-video-replacer.js [youtube-url] [module] [week] [day] [video]
 */

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

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

function formatDuration(duration) {
  // Convert ISO 8601 duration (PT39M33S) to MM:SS format
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

async function fetchVideoDetails(videoId) {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not found. Please set NEXT_PUBLIC_YOUTUBE_API_KEY in your .env.local file.');
  }

  return new Promise((resolve, reject) => {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    
    console.log(`📡 Fetching video details from YouTube API: ${videoId}`);
    
    https.get(apiUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.error) {
            reject(new Error(`YouTube API Error: ${response.error.message}`));
            return;
          }
          
          if (response.items && response.items.length > 0) {
            const item = response.items[0];
            const videoDetails = {
              id: item.id,
              title: item.snippet.title,
              description: item.snippet.description,
              thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high.url,
              duration: formatDuration(item.contentDetails.duration),
              rawDuration: item.contentDetails.duration,
              channelTitle: item.snippet.channelTitle,
              publishedAt: item.snippet.publishedAt
            };
            
            console.log(`📺 Video found: "${videoDetails.title}"`);
            console.log(`   👤 Creator: ${videoDetails.channelTitle}`);
            console.log(`   ⏱️ Duration: ${videoDetails.duration} (${videoDetails.rawDuration})`);
            console.log(`   📅 Published: ${new Date(videoDetails.publishedAt).toDateString()}`);
            
            resolve(videoDetails);
          } else {
            reject(new Error('Video not found or is private'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse YouTube API response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`YouTube API request failed: ${error.message}`));
    });
  });
}

async function replaceVideoWithYouTubeAPI(youtubeUrl, moduleIndex, weekIndex, dayIndex, videoIndex) {
  try {
    console.log('🚀 Starting YouTube API-powered video replacement...');
    
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL. Please provide a valid YouTube video URL.');
    }
    
    console.log(`🎯 Target: Module ${moduleIndex + 1}, Week ${weekIndex + 1}, Day ${dayIndex + 1}, Video ${videoIndex + 1}`);
    console.log(`🔗 Video ID: ${videoId}`);
    
    // Fetch video details from YouTube API
    const videoDetails = await fetchVideoDetails(videoId);
    
    // Load curriculum
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
    
    const video = day.videos[videoIndex];
    if (!video) {
      throw new Error(`Video ${videoIndex + 1} not found in Module ${moduleIndex + 1}, Week ${weekIndex + 1}, Day ${dayIndex + 1}`);
    }
    
    // Store old values for comparison
    const oldTitle = video.title;
    const oldCreator = video.creator;
    const oldDuration = video.duration;
    
    // Update video with YouTube API data
    video.title = videoDetails.title;
    video.youtubeId = videoId;
    video.creator = videoDetails.channelTitle;
    video.duration = videoDetails.duration;
    video.thumbnail = videoDetails.thumbnail;
    
    // Add video description if it doesn't exist
    if (!video.description && videoDetails.description) {
      // Use first 200 characters of description
      video.description = videoDetails.description.substring(0, 200) + (videoDetails.description.length > 200 ? '...' : '');
    }
    
    // Remove placeholder flag if it exists
    if (video.isPlaceholder) {
      delete video.isPlaceholder;
    }
    
    console.log(`\n📝 Video Updated Successfully:`);
    console.log(`   📊 Old Title: "${oldTitle}"`);
    console.log(`   📊 New Title: "${videoDetails.title}"`);
    console.log(`   👤 Old Creator: ${oldCreator || 'Unknown'}`);
    console.log(`   👤 New Creator: ${videoDetails.channelTitle}`);
    console.log(`   ⏱️ Old Duration: ${oldDuration}`);
    console.log(`   ⏱️ New Duration: ${videoDetails.duration} ✅`);
    console.log(`   🖼️ Thumbnail: ${videoDetails.thumbnail}`);
    
    // Save curriculum
    saveCurriculum(curriculum);
    
    return {
      success: true,
      videoDetails,
      oldData: { title: oldTitle, creator: oldCreator, duration: oldDuration },
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

// Helper function for quick replacement of Module 1, Week 1, Day 1, Video 1
async function quickReplace(youtubeUrl) {
  return replaceVideoWithYouTubeAPI(youtubeUrl, 0, 0, 0, 0);
}

// Main execution
async function main() {
  try {
    const youtubeUrl = process.argv[2];
    
    if (!youtubeUrl) {
      console.error('❌ Error: Please provide a YouTube URL');
      console.log('\n📋 Usage:');
      console.log('  node youtube-api-video-replacer.js [youtube-url]');
      console.log('  node youtube-api-video-replacer.js [youtube-url] [module] [week] [day] [video]');
      console.log('\n📝 Examples:');
      console.log('  node youtube-api-video-replacer.js "https://www.youtube.com/watch?v=abc123"');
      console.log('  node youtube-api-video-replacer.js "https://www.youtube.com/watch?v=abc123" 1 2 3 1');
      console.log('\n⚡ Quick replace (Module 1, Week 1, Day 1, Video 1):');
      console.log('  node youtube-api-video-replacer.js "https://www.youtube.com/watch?v=abc123"');
      console.log('\n📚 Requirements:');
      console.log('  - YouTube API key must be set in .env.local as NEXT_PUBLIC_YOUTUBE_API_KEY');
      console.log('  - Video must be public and embeddable');
      process.exit(1);
    }
    
    // Parse optional position arguments
    const moduleIndex = parseInt(process.argv[3]) - 1 || 0;
    const weekIndex = parseInt(process.argv[4]) - 1 || 0;
    const dayIndex = parseInt(process.argv[5]) - 1 || 0;
    const videoIndex = parseInt(process.argv[6]) - 1 || 0;
    
    const result = await replaceVideoWithYouTubeAPI(youtubeUrl, moduleIndex, weekIndex, dayIndex, videoIndex);
    
    console.log('\n✅ Video replacement completed successfully!');
    console.log(`📍 Location: Module ${result.location.module}, Week ${result.location.week}, Day ${result.location.day}, Video ${result.location.video}`);
    console.log(`⏱️ Accurate Duration: ${result.videoDetails.duration}`);
    console.log(`🎬 Title: ${result.videoDetails.title}`);
    console.log(`👤 Creator: ${result.videoDetails.channelTitle}`);
    
    console.log('\n🔄 Next Steps:');
    console.log('  1. Regenerate curriculum markdown: node json-to-markdown.js');
    console.log('  2. Validate curriculum: node validate-curriculum.js');
    console.log(`  3. Test video in app: http://localhost:3000/learning/1/1/1/${result.videoDetails.id}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n🔑 YouTube API Setup Required:');
      console.log('  1. Go to https://console.cloud.google.com/');
      console.log('  2. Enable YouTube Data API v3');
      console.log('  3. Create credentials (API Key)');
      console.log('  4. Add NEXT_PUBLIC_YOUTUBE_API_KEY=your_key to .env.local');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { replaceVideoWithYouTubeAPI, quickReplace, fetchVideoDetails };