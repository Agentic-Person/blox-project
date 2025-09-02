#!/usr/bin/env node

/**
 * Update Week 2 with Blender 4.x YouTube Content
 * Fetches all playlists and videos using YouTube Data API
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

if (!API_KEY) {
  console.error('❌ No YouTube API key found in environment variables');
  console.error('Please set YOUTUBE_API_KEY in your .env.local file');
  process.exit(1);
}

// Content structure for Week 2
const WEEK2_CONTENT = {
  day1: {
    playlistId: 'PL3GeP3YLZn5gZhJhyIQPKoz9Yrs9oKU9R',
    title: 'Complete Blender Beginner Course',
    practiceTask: 'Complete the donut tutorial following along with the videos, save your .blend file'
  },
  day2: {
    videoIds: ['lLqep5Q4MiI', 'QdMrWxOnqnE'],
    title: 'Advanced Modeling Techniques',
    practiceTask: 'Apply the modeling techniques to create your own simple object'
  },
  day3_4: {
    playlistId: 'PLEGfj4vwz2bgDtmkK7W3EFSw-Z5rV8AY5',
    title: 'Character & Animation',
    practiceTaskDay3: 'Create a basic character model following the tutorials',
    practiceTaskDay4: 'Add rigging and basic animation to your character'
  },
  day5: {
    playlistId: 'PLn3ukorJv4vvMwZPLzlajVII2zJd-_BM-',
    title: 'Advanced Blender Techniques',
    practiceTask: 'Create a complete scene using all techniques learned this week'
  }
};

// YouTube API helper functions
function makeYouTubeAPIRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `https://www.googleapis.com/youtube/v3/${endpoint}&key=${API_KEY}`;
    
    console.log(`📡 API Request: ${endpoint}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.error) {
            reject(new Error(`YouTube API Error: ${result.error.message}`));
          } else {
            resolve(result);
          }
        } catch (error) {
          reject(new Error(`Failed to parse API response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function fetchPlaylistItems(playlistId, maxResults = 50) {
  const endpoint = `playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${maxResults}`;
  const response = await makeYouTubeAPIRequest(endpoint);
  return response.items || [];
}

async function fetchVideoDetails(videoIds) {
  if (!videoIds || videoIds.length === 0) return [];
  
  const videoIdString = Array.isArray(videoIds) ? videoIds.join(',') : videoIds;
  const endpoint = `videos?part=snippet,contentDetails,statistics&id=${videoIdString}`;
  const response = await makeYouTubeAPIRequest(endpoint);
  return response.items || [];
}

function parseISO8601Duration(duration) {
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

function calculateXPReward(durationString) {
  const [minutes, seconds] = durationString.split(':').map(Number);
  const totalMinutes = minutes + (seconds || 0) / 60;
  
  // Base XP: 2 XP per minute, minimum 10 XP, maximum 100 XP
  return Math.min(Math.max(Math.round(totalMinutes * 2), 10), 100);
}

async function processPlaylist(playlistId, titlePrefix = '') {
  console.log(`\n🎬 Processing playlist: ${playlistId}`);
  
  try {
    const playlistItems = await fetchPlaylistItems(playlistId);
    console.log(`   Found ${playlistItems.length} videos in playlist`);
    
    if (playlistItems.length === 0) {
      console.log('⚠️  No videos found in playlist');
      return [];
    }
    
    // Extract video IDs
    const videoIds = playlistItems.map(item => item.snippet.resourceId.videoId);
    
    // Fetch detailed video information
    const videoDetails = await fetchVideoDetails(videoIds);
    
    // Process videos
    const processedVideos = videoDetails.map((video, index) => {
      const duration = parseISO8601Duration(video.contentDetails.duration);
      const xpReward = calculateXPReward(duration);
      
      return {
        id: `video-1-2-${Math.floor(index / 10) + 1}-${(index % 10) + 1}`,
        title: video.snippet.title,
        youtubeId: video.id,
        creator: video.snippet.channelTitle,
        duration: duration,
        xpReward: xpReward,
        description: video.snippet.description.substring(0, 200) + '...'
      };
    });
    
    console.log(`✅ Processed ${processedVideos.length} videos from playlist`);
    return processedVideos;
    
  } catch (error) {
    console.error(`❌ Error processing playlist ${playlistId}: ${error.message}`);
    return [];
  }
}

async function processIndividualVideos(videoIds, titlePrefix = '') {
  console.log(`\n🎯 Processing individual videos: ${videoIds.join(', ')}`);
  
  try {
    const videoDetails = await fetchVideoDetails(videoIds);
    
    const processedVideos = videoDetails.map((video, index) => {
      const duration = parseISO8601Duration(video.contentDetails.duration);
      const xpReward = calculateXPReward(duration);
      
      return {
        id: `video-1-2-2-${index + 1}`,
        title: video.snippet.title,
        youtubeId: video.id,
        creator: video.snippet.channelTitle,
        duration: duration,
        xpReward: xpReward,
        description: video.snippet.description.substring(0, 200) + '...'
      };
    });
    
    console.log(`✅ Processed ${processedVideos.length} individual videos`);
    return processedVideos;
    
  } catch (error) {
    console.error(`❌ Error processing individual videos: ${error.message}`);
    return [];
  }
}

function splitVideosIntoDays(videos, numDays) {
  const videosPerDay = Math.ceil(videos.length / numDays);
  const days = [];
  
  for (let i = 0; i < numDays; i++) {
    const startIndex = i * videosPerDay;
    const endIndex = Math.min(startIndex + videosPerDay, videos.length);
    days.push(videos.slice(startIndex, endIndex));
  }
  
  return days;
}

async function fetchAllContent() {
  console.log('🚀 Starting Week 2 Blender Content Update');
  console.log('=====================================\n');
  
  const results = {};
  
  // Day 1: Complete Blender Beginner Course (All 22 videos)
  console.log('📅 Day 1: Complete Blender Beginner Course');
  results.day1 = await processPlaylist(WEEK2_CONTENT.day1.playlistId);
  
  // Day 2: Advanced Modeling Techniques (2 specific videos)
  console.log('\n📅 Day 2: Advanced Modeling Techniques');
  results.day2 = await processIndividualVideos(WEEK2_CONTENT.day2.videoIds);
  
  // Days 3-4: Character & Animation (Split playlist)
  console.log('\n📅 Days 3-4: Character & Animation');
  const characterVideos = await processPlaylist(WEEK2_CONTENT.day3_4.playlistId);
  const [day3Videos, day4Videos] = splitVideosIntoDays(characterVideos, 2);
  results.day3 = day3Videos;
  results.day4 = day4Videos;
  
  // Day 5: Advanced Blender Techniques
  console.log('\n📅 Day 5: Advanced Blender Techniques');
  results.day5 = await processPlaylist(WEEK2_CONTENT.day5.playlistId);
  
  return results;
}

function loadCurriculum() {
  const curriculumPath = path.join(__dirname, '../src/data/curriculum.json');
  return JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
}

function saveCurriculum(curriculum) {
  const curriculumPath = path.join(__dirname, '../src/data/curriculum.json');
  
  // Create backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(__dirname, `../src/data/curriculum-backup-week2-${timestamp}.json`);
  fs.copyFileSync(curriculumPath, backupPath);
  console.log(`💾 Backup created: ${path.basename(backupPath)}`);
  
  // Save updated curriculum
  fs.writeFileSync(curriculumPath, JSON.stringify(curriculum, null, 2));
  console.log(`✅ Updated curriculum: ${curriculumPath}`);
}

function updateCurriculumWithWeek2(curriculum, weekContent) {
  // Find Module 1
  const module1 = curriculum.modules.find(m => m.id === 'module-1');
  if (!module1) {
    throw new Error('Module 1 not found in curriculum');
  }
  
  // Find Week 2
  const week2 = module1.weeks.find(w => w.id === 'week-2');
  if (!week2) {
    throw new Error('Week 2 not found in Module 1');
  }
  
  // Update Week 2 with new content
  week2.title = 'W2: Blender 4.X Beginner Basic Complete Crash Course';
  week2.description = 'Master Blender 4.x from basics to advanced techniques including modeling, animation, and scene creation';
  
  // Update each day
  const dayConfigs = [
    { id: 'day-6', title: 'D6: Complete Blender Beginner Course', videos: weekContent.day1, practice: WEEK2_CONTENT.day1.practiceTask },
    { id: 'day-7', title: 'D7: Advanced Modeling Techniques', videos: weekContent.day2, practice: WEEK2_CONTENT.day2.practiceTask },
    { id: 'day-8', title: 'D8: Character & Animation Part 1', videos: weekContent.day3, practice: WEEK2_CONTENT.day3_4.practiceTaskDay3 },
    { id: 'day-9', title: 'D9: Character & Animation Part 2', videos: weekContent.day4, practice: WEEK2_CONTENT.day3_4.practiceTaskDay4 },
    { id: 'day-10', title: 'D10: Advanced Blender Techniques', videos: weekContent.day5, practice: WEEK2_CONTENT.day5.practiceTask }
  ];
  
  dayConfigs.forEach((config, index) => {
    const day = week2.days[index];
    if (day && day.id === config.id) {
      day.title = config.title;
      day.videos = config.videos || [];
      day.practiceTask = config.practice;
      
      // Calculate estimated time (assuming 1.5x video time + practice)
      const totalVideoMinutes = day.videos.reduce((sum, video) => {
        const [minutes, seconds] = video.duration.split(':').map(Number);
        return sum + minutes + (seconds || 0) / 60;
      }, 0);
      
      const estimatedHours = Math.ceil((totalVideoMinutes * 1.5 + 60) / 60); // Add 1 hour practice time
      day.estimatedTime = `${estimatedHours}h`;
      
      console.log(`✅ Updated ${config.id}: ${day.videos.length} videos, ~${estimatedHours}h`);
    }
  });
  
  return curriculum;
}

async function main() {
  try {
    // Fetch all YouTube content
    const weekContent = await fetchAllContent();
    
    // Load current curriculum
    console.log('\n📚 Loading curriculum...');
    const curriculum = loadCurriculum();
    
    // Update curriculum with new Week 2 content
    console.log('\n📝 Updating curriculum with Week 2 content...');
    const updatedCurriculum = updateCurriculumWithWeek2(curriculum, weekContent);
    
    // Save updated curriculum
    console.log('\n💾 Saving updated curriculum...');
    saveCurriculum(updatedCurriculum);
    
    // Print summary
    console.log('\n🎉 Week 2 Update Complete!');
    console.log('============================');
    console.log(`Day 1: ${weekContent.day1.length} videos - Complete Blender Course`);
    console.log(`Day 2: ${weekContent.day2.length} videos - Advanced Modeling`);
    console.log(`Day 3: ${weekContent.day3.length} videos - Character & Animation Part 1`);
    console.log(`Day 4: ${weekContent.day4.length} videos - Character & Animation Part 2`);
    console.log(`Day 5: ${weekContent.day5.length} videos - Advanced Techniques`);
    
    const totalVideos = Object.values(weekContent).reduce((sum, videos) => sum + videos.length, 0);
    console.log(`\nTotal Videos Added: ${totalVideos}`);
    console.log('Week 2 is now ready for Blender 4.x learning! 🚀');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };