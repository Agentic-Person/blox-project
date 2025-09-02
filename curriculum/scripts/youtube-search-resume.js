const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize YouTube API
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// File paths
const curriculumPath = path.join(__dirname, '../src/data/curriculum.json');
const checkpointPath = path.join(__dirname, '../youtube-search-checkpoint.json');
const foundVideosPath = path.join(__dirname, `../youtube-videos-found-${new Date().toISOString().split('T')[0]}.json`);

// Load or create checkpoint
function loadCheckpoint() {
  if (fs.existsSync(checkpointPath)) {
    return JSON.parse(fs.readFileSync(checkpointPath, 'utf-8'));
  }
  
  return {
    lastSearchedDay: 0,
    totalSearched: 0,
    totalFound: 0,
    searchHistory: {},
    foundVideos: {},
    lastRunDate: null,
    quotaExceededAt: null
  };
}

// Save checkpoint
function saveCheckpoint(checkpoint) {
  fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
}

// Load curriculum
function loadCurriculum() {
  return JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));
}

// Extract all videos from curriculum that need searching
function extractVideosToSearch(curriculum, checkpoint) {
  const videosToSearch = [];
  
  curriculum.modules.forEach((module, moduleIndex) => {
    module.weeks.forEach((week, weekIndex) => {
      week.days.forEach((day, dayIndex) => {
        const dayNum = (moduleIndex * 20) + (weekIndex * 5) + dayIndex + 1;
        
        // Skip if already searched
        if (checkpoint.searchHistory[`day-${dayNum}`]) {
          console.log(`⏭️  Skipping Day ${dayNum} (already searched)`);
          return;
        }
        
        // Skip if we haven't reached the resume point yet
        if (dayNum <= checkpoint.lastSearchedDay) {
          return;
        }
        
        day.videos.forEach(video => {
          // Only search for placeholders or videos without real IDs
          if (video.placeholder || video.youtubeId?.startsWith('placeholder')) {
            videosToSearch.push({
              dayNum,
              dayTitle: day.title,
              videoTitle: video.title,
              creator: video.creator,
              originalVideo: video
            });
          }
        });
      });
    });
  });
  
  return videosToSearch;
}

// Search for a video on YouTube
async function searchVideo(videoTitle, creator) {
  try {
    // Clean up the search query
    const searchQuery = `${videoTitle} ${creator}`.replace(/Coming Soon/g, '').trim();
    
    console.log(`🔍 Searching: "${searchQuery}"`);
    
    const response = await youtube.search.list({
      part: 'snippet',
      q: searchQuery,
      maxResults: 5,
      type: 'video',
      videoCategoryId: '20', // Gaming category
      relevanceLanguage: 'en'
    });
    
    if (response.data.items && response.data.items.length > 0) {
      // Try to find the best match
      const videos = response.data.items;
      
      // Score each video based on title/creator match
      const scoredVideos = videos.map(video => {
        let score = 0;
        const title = video.snippet.title.toLowerCase();
        const channel = video.snippet.channelTitle.toLowerCase();
        const searchTerms = searchQuery.toLowerCase().split(' ');
        
        // Check title matches
        searchTerms.forEach(term => {
          if (title.includes(term)) score += 2;
        });
        
        // Check creator match
        if (creator && creator !== 'Coming Soon') {
          if (channel.includes(creator.toLowerCase())) score += 5;
        }
        
        // Check for relevant keywords
        const relevantKeywords = ['roblox', 'studio', 'blender', 'tutorial', 'guide', 'basics'];
        relevantKeywords.forEach(keyword => {
          if (title.includes(keyword)) score += 1;
        });
        
        return { video, score };
      });
      
      // Sort by score and get the best match
      scoredVideos.sort((a, b) => b.score - a.score);
      const bestMatch = scoredVideos[0];
      
      if (bestMatch.score > 3) { // Minimum threshold for relevance
        const videoDetails = await youtube.videos.list({
          part: 'contentDetails,statistics',
          id: bestMatch.video.id.videoId
        });
        
        const details = videoDetails.data.items[0];
        
        console.log(`   ✅ Found: ${bestMatch.video.snippet.title}`);
        console.log(`      Channel: ${bestMatch.video.snippet.channelTitle}`);
        console.log(`      Score: ${bestMatch.score}`);
        
        return {
          videoId: bestMatch.video.id.videoId,
          title: bestMatch.video.snippet.title,
          channelTitle: bestMatch.video.snippet.channelTitle,
          duration: details.contentDetails.duration,
          viewCount: details.statistics.viewCount,
          confidence: bestMatch.score > 10 ? 'high' : bestMatch.score > 5 ? 'medium' : 'low',
          searchScore: bestMatch.score
        };
      }
    }
    
    console.log(`   ❌ No relevant video found`);
    return null;
    
  } catch (error) {
    if (error.message?.includes('quota')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    console.error(`   ⚠️ Error: ${error.message}`);
    return null;
  }
}

// Main search function
async function resumeSearch() {
  console.log('🚀 YouTube Video Search Resume Tool\n');
  console.log('='.repeat(60));
  
  const checkpoint = loadCheckpoint();
  const curriculum = loadCurriculum();
  
  // Check if we're resuming from a previous run
  if (checkpoint.lastRunDate) {
    console.log(`📅 Last run: ${checkpoint.lastRunDate}`);
    console.log(`📊 Previous progress: ${checkpoint.totalFound} videos found out of ${checkpoint.totalSearched} searched`);
    
    if (checkpoint.quotaExceededAt) {
      console.log(`⚠️  Quota was exceeded at: ${checkpoint.quotaExceededAt}`);
      
      // Check if it's been less than 24 hours
      const lastQuotaExceeded = new Date(checkpoint.quotaExceededAt);
      const hoursSince = (Date.now() - lastQuotaExceeded) / (1000 * 60 * 60);
      
      if (hoursSince < 24) {
        console.log(`⏰ Only ${hoursSince.toFixed(1)} hours since quota exceeded.`);
        console.log(`   Please wait ${(24 - hoursSince).toFixed(1)} more hours for quota to reset.`);
        console.log('\n💡 Tip: YouTube API quota resets at midnight Pacific Time (PT).');
        return;
      }
    }
    
    console.log(`\n▶️  Resuming from Day ${checkpoint.lastSearchedDay + 1}...\n`);
  } else {
    console.log('🆕 Starting fresh search...\n');
  }
  
  // Get videos to search
  const videosToSearch = extractVideosToSearch(curriculum, checkpoint);
  
  if (videosToSearch.length === 0) {
    console.log('✅ All videos have been searched!');
    console.log(`📊 Total found: ${checkpoint.totalFound} videos`);
    return;
  }
  
  console.log(`📋 ${videosToSearch.length} videos remaining to search\n`);
  
  // Start searching
  let searchCount = 0;
  let foundCount = 0;
  let currentDay = -1;
  let dayVideos = [];
  
  for (const video of videosToSearch) {
    // Check if we're on a new day
    if (video.dayNum !== currentDay) {
      // Save previous day's results
      if (currentDay > 0 && dayVideos.length > 0) {
        checkpoint.foundVideos[`day-${currentDay}`] = dayVideos;
        checkpoint.searchHistory[`day-${currentDay}`] = true;
        saveCheckpoint(checkpoint);
      }
      
      currentDay = video.dayNum;
      dayVideos = [];
      console.log(`\n📅 Day ${currentDay}: ${video.dayTitle}`);
    }
    
    try {
      const result = await searchVideo(video.videoTitle, video.creator);
      searchCount++;
      
      if (result) {
        foundCount++;
        dayVideos.push({
          ...result,
          originalTitle: video.videoTitle,
          originalCreator: video.creator
        });
      }
      
      // Update checkpoint
      checkpoint.totalSearched++;
      if (result) checkpoint.totalFound++;
      checkpoint.lastSearchedDay = video.dayNum;
      checkpoint.lastRunDate = new Date().toISOString();
      
      // Save checkpoint every 10 searches
      if (searchCount % 10 === 0) {
        saveCheckpoint(checkpoint);
        console.log(`\n💾 Checkpoint saved (${searchCount} searches completed)`);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      if (error.message === 'QUOTA_EXCEEDED') {
        console.log('\n⚠️  YouTube API quota exceeded!');
        checkpoint.quotaExceededAt = new Date().toISOString();
        
        // Save current day's results
        if (dayVideos.length > 0) {
          checkpoint.foundVideos[`day-${currentDay}`] = dayVideos;
          checkpoint.searchHistory[`day-${currentDay}`] = true;
        }
        
        saveCheckpoint(checkpoint);
        
        console.log('💾 Progress saved to checkpoint.');
        console.log(`📊 Found ${foundCount} videos in this session.`);
        console.log('\n📝 To continue searching:');
        console.log('   1. Wait 24 hours for quota to reset (midnight PT)');
        console.log('   2. Run: node scripts/youtube-search-resume.js');
        console.log('\n✅ Your progress has been saved and will resume automatically.');
        return;
      }
      
      console.error(`Error searching: ${error.message}`);
    }
  }
  
  // Save final results
  if (dayVideos.length > 0) {
    checkpoint.foundVideos[`day-${currentDay}`] = dayVideos;
    checkpoint.searchHistory[`day-${currentDay}`] = true;
  }
  
  saveCheckpoint(checkpoint);
  
  // Generate final report
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEARCH COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Videos found in this session: ${foundCount}`);
  console.log(`🔍 Total searches in this session: ${searchCount}`);
  console.log(`📹 Total videos found overall: ${checkpoint.totalFound}`);
  console.log(`🔎 Total searches overall: ${checkpoint.totalSearched}`);
  
  // Save all found videos to a file
  const allFoundVideos = checkpoint.foundVideos;
  fs.writeFileSync(foundVideosPath, JSON.stringify(allFoundVideos, null, 2));
  console.log(`\n💾 All found videos saved to: ${foundVideosPath}`);
  
  // Create update file for curriculum
  const updatePath = path.join(__dirname, `../curriculum-update-${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(updatePath, JSON.stringify(allFoundVideos, null, 2));
  console.log(`📁 Curriculum update file saved to: ${updatePath}`);
  
  console.log('\n✅ Search complete! Run update-curriculum-with-found-videos.js to apply changes.');
}

// Check if API key is available
if (!process.env.YOUTUBE_API_KEY) {
  console.error('❌ YOUTUBE_API_KEY not found in .env.local');
  console.error('Please add your YouTube Data API v3 key to .env.local');
  process.exit(1);
}

// Run the search
resumeSearch().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});