const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Parse the correct curriculum from MD document
function parseCurriculumMD() {
  const mdPath = path.join(__dirname, '../docs/YouTube video titles-content-creator-URL-link-8-23-2025.md');
  const mdContent = fs.readFileSync(mdPath, 'utf-8');
  
  const lines = mdContent.split('\n');
  const videosByDay = {};
  let currentDay = null;
  
  lines.forEach(line => {
    // Skip header and empty lines
    if (line.includes('| Day |') || line.includes('| --- |') || !line.trim()) {
      return;
    }
    
    // Parse table rows
    if (line.startsWith('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 4) {
        const day = parts[0];
        const title = parts[1];
        const creator = parts[2];
        const linkMatch = parts[3].match(/\[Watch\]\((https:\/\/www\.youtube\.com\/watch\?v=([^)]+))\)/);
        
        if (day && !isNaN(day)) {
          currentDay = parseInt(day);
          if (!videosByDay[currentDay]) {
            videosByDay[currentDay] = [];
          }
          
          const video = {
            day: currentDay,
            title,
            creator,
            url: linkMatch ? linkMatch[1] : null,
            youtubeId: linkMatch ? linkMatch[2] : null
          };
          
          videosByDay[currentDay].push(video);
        }
      }
    }
  });
  
  return videosByDay;
}

// Extract video ID from YouTube URL
function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

// Fetch video details from YouTube API
async function fetchVideoDetails(videoId) {
  return new Promise((resolve, reject) => {
    const url = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.items && json.items.length > 0) {
            resolve(json.items[0]);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Search for video on YouTube
async function searchYouTubeVideo(title, creator) {
  return new Promise((resolve, reject) => {
    const query = encodeURIComponent(`${title} ${creator} Roblox`);
    const url = `${YOUTUBE_API_BASE}/search?part=snippet&q=${query}&type=video&maxResults=3&key=${YOUTUBE_API_KEY}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.items && json.items.length > 0) {
            // Try to find best match
            const bestMatch = json.items.find(item => 
              item.snippet.channelTitle.toLowerCase().includes(creator.toLowerCase())
            ) || json.items[0];
            
            resolve({
              videoId: bestMatch.id.videoId,
              title: bestMatch.snippet.title,
              channelTitle: bestMatch.snippet.channelTitle,
              thumbnail: bestMatch.snippet.thumbnails.high.url
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Parse ISO 8601 duration to minutes:seconds format
function parseDuration(isoDuration) {
  if (!isoDuration) return '20:00';
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '20:00';
  
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  
  const totalMinutes = hours * 60 + minutes;
  return `${totalMinutes}:${seconds.toString().padStart(2, '0')}`;
}

// Calculate XP based on duration
function calculateXP(duration) {
  const [minutes] = duration.split(':').map(Number);
  if (minutes >= 35) return 70;
  if (minutes >= 25) return 50;
  if (minutes >= 15) return 30;
  return 20;
}

// Process videos with rate limiting
async function processVideosWithRateLimit(videos, delay = 1000) {
  const results = [];
  
  for (const video of videos) {
    console.log(`Processing: ${video.title} by ${video.creator}`);
    
    try {
      let videoData = null;
      
      // First try to use existing YouTube ID
      if (video.youtubeId) {
        const details = await fetchVideoDetails(video.youtubeId);
        if (details) {
          videoData = {
            youtubeId: video.youtubeId,
            actualTitle: details.snippet.title,
            channelTitle: details.snippet.channelTitle,
            duration: parseDuration(details.contentDetails.duration),
            thumbnail: details.snippet.thumbnails.high.url,
            found: true
          };
        }
      }
      
      // If no ID or fetch failed, search for the video
      if (!videoData) {
        const searchResult = await searchYouTubeVideo(video.title, video.creator);
        if (searchResult) {
          // Fetch full details for the found video
          const details = await fetchVideoDetails(searchResult.videoId);
          videoData = {
            youtubeId: searchResult.videoId,
            actualTitle: searchResult.title,
            channelTitle: searchResult.channelTitle,
            duration: details ? parseDuration(details.contentDetails.duration) : '20:00',
            thumbnail: searchResult.thumbnail,
            found: true,
            wasSearched: true
          };
        } else {
          // Video not found, create placeholder
          videoData = {
            youtubeId: null,
            actualTitle: video.title,
            channelTitle: video.creator,
            duration: '20:00',
            thumbnail: null,
            found: false,
            needsManualSearch: true
          };
        }
      }
      
      results.push({
        ...video,
        ...videoData
      });
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      console.error(`Error processing video "${video.title}":`, error.message);
      results.push({
        ...video,
        youtubeId: null,
        actualTitle: video.title,
        channelTitle: video.creator,
        duration: '20:00',
        thumbnail: null,
        found: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// Main function to fix curriculum alignment
async function fixCurriculumAlignment() {
  console.log('Starting curriculum alignment fix...\n');
  
  // Load current curriculum
  const curriculumPath = path.join(__dirname, '../src/data/curriculum.json');
  const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));
  
  // Parse correct video order from MD
  const correctVideosByDay = parseCurriculumMD();
  console.log(`Found ${Object.keys(correctVideosByDay).length} days with videos\n`);
  
  // Statistics
  const stats = {
    totalVideos: 0,
    foundVideos: 0,
    missingVideos: 0,
    apiCalls: 0,
    modules: {}
  };
  
  // Process videos for first 3 modules (days 1-30)
  const daysToProcess = Array.from({ length: 30 }, (_, i) => i + 1);
  const missingVideos = [];
  
  // Map days to modules and weeks
  const dayToModuleWeek = {
    // Module 1: Days 1-20
    1: { module: 0, week: 0 }, 2: { module: 0, week: 0 },
    3: { module: 0, week: 0 }, 4: { module: 0, week: 0 }, 5: { module: 0, week: 0 },
    6: { module: 0, week: 1 }, 7: { module: 0, week: 1 },
    8: { module: 0, week: 1 }, 9: { module: 0, week: 1 }, 10: { module: 0, week: 1 },
    11: { module: 0, week: 2 }, 12: { module: 0, week: 2 },
    13: { module: 0, week: 2 }, 14: { module: 0, week: 2 }, 15: { module: 0, week: 2 },
    16: { module: 0, week: 3 }, 17: { module: 0, week: 3 },
    18: { module: 0, week: 3 }, 19: { module: 0, week: 3 }, 20: { module: 0, week: 3 },
    // Module 2: Days 21-30
    21: { module: 1, week: 0 }, 22: { module: 1, week: 0 },
    23: { module: 1, week: 0 }, 24: { module: 1, week: 0 }, 25: { module: 1, week: 0 },
    26: { module: 1, week: 1 }, 27: { module: 1, week: 1 },
    28: { module: 1, week: 1 }, 29: { module: 1, week: 1 }, 30: { module: 1, week: 1 }
  };
  
  // Process each day
  for (const dayNum of daysToProcess) {
    const videos = correctVideosByDay[dayNum] || [];
    if (videos.length === 0) continue;
    
    console.log(`\n=== Processing Day ${dayNum} (${videos.length} videos) ===`);
    stats.apiCalls += videos.length;
    
    // Process videos with API calls
    const processedVideos = await processVideosWithRateLimit(videos, 500); // 500ms delay between API calls
    
    // Update curriculum structure
    const { module: moduleIndex, week: weekIndex } = dayToModuleWeek[dayNum];
    const dayIndex = (dayNum - 1) % 5; // 5 days per week
    
    if (curriculum.modules[moduleIndex] && 
        curriculum.modules[moduleIndex].weeks[weekIndex] &&
        curriculum.modules[moduleIndex].weeks[weekIndex].days[dayIndex]) {
      
      const day = curriculum.modules[moduleIndex].weeks[weekIndex].days[dayIndex];
      
      // Update videos for this day
      day.videos = processedVideos.map((video, index) => ({
        id: `video-${moduleIndex + 1}-${weekIndex + 1}-${dayIndex + 1}-${index + 1}`,
        title: video.actualTitle || video.title,
        youtubeId: video.youtubeId || 'placeholder',
        creator: video.channelTitle || video.creator,
        duration: video.duration,
        xpReward: calculateXP(video.duration),
        thumbnail: video.thumbnail || `https://via.placeholder.com/320x180?text=${encodeURIComponent(video.title)}`,
        originalSearch: {
          title: video.title,
          creator: video.creator
        },
        needsUpdate: !video.found
      }));
      
      // Track statistics
      stats.totalVideos += processedVideos.length;
      stats.foundVideos += processedVideos.filter(v => v.found).length;
      stats.missingVideos += processedVideos.filter(v => !v.found).length;
      
      // Track missing videos
      processedVideos.filter(v => !v.found).forEach(v => {
        missingVideos.push({
          day: dayNum,
          module: moduleIndex + 1,
          week: weekIndex + 1,
          title: v.title,
          creator: v.creator,
          searchQuery: `${v.title} ${v.creator} Roblox`
        });
      });
    }
  }
  
  // Save updated curriculum
  fs.writeFileSync(curriculumPath, JSON.stringify(curriculum, null, 2));
  console.log('\n✅ Curriculum updated successfully!');
  
  // Save missing videos report
  const reportPath = path.join(__dirname, '../src/data/missing-videos-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    statistics: stats,
    missingVideos: missingVideos
  }, null, 2));
  
  // Print summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total videos processed: ${stats.totalVideos}`);
  console.log(`Videos found: ${stats.foundVideos}`);
  console.log(`Videos missing: ${stats.missingVideos}`);
  console.log(`API calls made: ${stats.apiCalls}`);
  console.log(`Success rate: ${((stats.foundVideos / stats.totalVideos) * 100).toFixed(1)}%`);
  console.log(`\nMissing videos report saved to: ${reportPath}`);
}

// Run the fix
fixCurriculumAlignment().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});