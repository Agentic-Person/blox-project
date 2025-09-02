#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const PLAYLIST_ID = 'PLEGfj4vwz2bgDtmkK7W3EFSw-Z5rV8AY5';

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

function formatDuration(duration) {
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

async function fetchPlaylistVideos() {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not found. Please set NEXT_PUBLIC_YOUTUBE_API_KEY in your .env.local file.');
  }

  return new Promise((resolve, reject) => {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${YOUTUBE_API_KEY}`;
    
    console.log(`📡 Fetching playlist from YouTube API...`);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.error) {
            reject(new Error(`YouTube API Error: ${response.error.message}`));
            return;
          }
          
          console.log(`✅ Found ${response.items.length} videos in playlist`);
          
          // Get video IDs for duration fetch
          const videoIds = response.items.map(item => item.snippet.resourceId.videoId).join(',');
          
          // Fetch video details including duration
          const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
          
          https.get(detailsUrl, (res2) => {
            let detailsData = '';
            res2.on('data', chunk => detailsData += chunk);
            res2.on('end', () => {
              const details = JSON.parse(detailsData);
              
              // Combine playlist order with video details
              const videos = response.items.map((item, index) => {
                const videoDetail = details.items.find(v => v.id === item.snippet.resourceId.videoId);
                
                const duration = videoDetail?.contentDetails?.duration || 'PT0S';
                const formattedDuration = formatDuration(duration);
                
                // Calculate total minutes for distribution
                const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                const hours = parseInt(match?.[1]) || 0;
                const minutes = parseInt(match?.[2]) || 0;
                const seconds = parseInt(match?.[3]) || 0;
                const totalMinutes = hours * 60 + minutes + Math.round(seconds / 60);
                
                return {
                  id: item.snippet.resourceId.videoId,
                  title: item.snippet.title,
                  creator: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle,
                  description: item.snippet.description.substring(0, 200) + (item.snippet.description.length > 200 ? '...' : ''),
                  duration: formattedDuration,
                  totalMinutes: totalMinutes,
                  thumbnail: videoDetail?.snippet?.thumbnails?.maxres?.url || videoDetail?.snippet?.thumbnails?.high?.url || '/images/placeholder-thumbnail.jpg',
                  youtubeId: item.snippet.resourceId.videoId,
                  xpReward: 25
                };
              });
              
              resolve(videos);
            });
          }).on('error', reject);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function distributeVideosIntoDays(videos) {
  const totalMinutes = videos.reduce((sum, v) => sum + v.totalMinutes, 0);
  const targetMinutesPerDay = totalMinutes / 5;
  
  console.log(`\n📊 Distribution Strategy:`);
  console.log(`   Total time: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`);
  console.log(`   Target per day: ~${Math.round(targetMinutesPerDay)} minutes`);
  
  const days = [
    { videos: [], totalMinutes: 0, title: "D1: Getting Started with Roblox Studio" },
    { videos: [], totalMinutes: 0, title: "D2: Beginner Guide to Roblox Scripting" },
    { videos: [], totalMinutes: 0, title: "D3: Roblox Building, Low Polys, and Lighting" },
    { videos: [], totalMinutes: 0, title: "D4: Roblox Terrain" },
    { videos: [], totalMinutes: 0, title: "D5: Blender Modeling Guide and Roblox Development" }
  ];
  
  let currentDayIndex = 0;
  
  videos.forEach(video => {
    // Find the day with the least content that won't exceed ~2 hours
    let bestDayIndex = currentDayIndex;
    let minTime = days[currentDayIndex].totalMinutes;
    
    for (let i = 0; i < days.length; i++) {
      if (days[i].totalMinutes < minTime && days[i].totalMinutes + video.totalMinutes <= 120) {
        bestDayIndex = i;
        minTime = days[i].totalMinutes;
      }
    }
    
    // Add video to the best day
    days[bestDayIndex].videos.push(video);
    days[bestDayIndex].totalMinutes += video.totalMinutes;
    
    // Move to next day if current is getting full
    if (days[currentDayIndex].totalMinutes >= targetMinutesPerDay) {
      currentDayIndex = Math.min(currentDayIndex + 1, 4);
    }
  });
  
  // Print distribution
  days.forEach((day, index) => {
    console.log(`\n   Day ${index + 1}: ${day.videos.length} videos, ${day.totalMinutes} minutes`);
    day.videos.forEach(v => {
      console.log(`      - ${v.title.substring(0, 50)}... (${v.duration})`);
    });
  });
  
  return days;
}

async function updateWeek1Curriculum() {
  try {
    console.log('🚀 Starting Week 1 curriculum import from YouTube playlist...\n');
    
    // Fetch playlist videos
    const videos = await fetchPlaylistVideos();
    
    // Distribute videos into days
    const days = distributeVideosIntoDays(videos);
    
    // Load curriculum
    const curriculum = loadCurriculum();
    const module1 = curriculum.modules[0];
    const week1 = module1.weeks[0];
    
    // Update Week 1
    week1.title = "Introduction to Roblox Studio";
    week1.description = "Complete introduction to Roblox Studio 2025 - from interface basics to creating your first game";
    
    // Create new days structure
    week1.days = days.map((day, dayIndex) => ({
      id: `day-${dayIndex + 1}`,
      title: day.title,
      videos: day.videos.map((video, videoIndex) => ({
        ...video,
        id: `video-1-1-${dayIndex + 1}-${videoIndex + 1}`
      })),
      practiceTask: getPracticeTask(dayIndex),
      estimatedTime: `${(day.totalMinutes / 60).toFixed(1)}h`
    }));
    
    console.log('\n✅ Week 1 Updated Successfully!');
    
    // Now fix day numbering for subsequent weeks
    console.log('\n🔧 Fixing day numbering for subsequent weeks...');
    
    // Week 2 (days 6-10)
    if (module1.weeks[1]) {
      module1.weeks[1].days.forEach((day, index) => {
        day.id = `day-${6 + index}`;
        day.title = day.title.replace(/D\d+:/, `D${6 + index}:`);
      });
    }
    
    // Week 3 (days 11-15)
    if (module1.weeks[2]) {
      module1.weeks[2].days.forEach((day, index) => {
        day.id = `day-${11 + index}`;
        day.title = day.title.replace(/D\d+:/, `D${11 + index}:`);
      });
    }
    
    // Week 4 (days 16-20)
    if (module1.weeks[3]) {
      module1.weeks[3].days.forEach((day, index) => {
        day.id = `day-${16 + index}`;
        day.title = day.title.replace(/D\d+:/, `D${16 + index}:`);
      });
    }
    
    console.log('✅ Day numbering fixed across all weeks!');
    
    // Save curriculum
    saveCurriculum(curriculum);
    
    // Print summary
    console.log('\n📊 Final Summary:');
    console.log(`   Week 1: Days 1-5 (${week1.days.reduce((sum, d) => sum + d.videos.length, 0)} videos)`);
    if (module1.weeks[1]) console.log(`   Week 2: Days 6-10`);
    if (module1.weeks[2]) console.log(`   Week 3: Days 11-15`);
    if (module1.weeks[3]) console.log(`   Week 4: Days 16-20`);
    
    console.log('\n✅ Curriculum import and restructuring complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
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

function getPracticeTask(dayIndex) {
  const tasks = [
    "Set up Roblox Studio, explore the interface, and create your first project",
    "Write your first scripts and understand the basics of Lua programming",
    "Build structures with parts, apply materials, and add lighting effects",
    "Create realistic terrain and landscapes for your game world",
    "Model 3D assets in Blender and import them into Roblox Studio"
  ];
  return tasks[dayIndex] || "Complete the exercises from today's videos";
}

// Run if called directly
if (require.main === module) {
  updateWeek1Curriculum();
}

module.exports = { updateWeek1Curriculum };