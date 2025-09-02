const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize YouTube API
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY
});

// Console colors for better output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  highlight: (msg) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

// Configuration
const CONFIG = {
  MIN_RELEVANCE_SCORE: 60,  // Only auto-select videos with 60%+ relevance
  MAX_RESULTS_PER_SEARCH: 10,
  DELAY_BETWEEN_SEARCHES: 200, // ms
  MAX_SEARCH_STRATEGIES: 3, // Limit strategies to avoid quota issues
  MIN_DURATION_SECONDS: 120, // Skip videos under 2 minutes
  MAX_DURATION_SECONDS: 3600 // Skip videos over 1 hour
};

/**
 * Convert YouTube ISO 8601 duration to MM:SS format
 * PT4M13S -> 4:13
 * PT1H2M30S -> 1:02:30
 */
function convertYouTubeDuration(isoDuration) {
  if (!isoDuration || isoDuration === 'PT0S') return '0:00';
  
  // Parse ISO 8601 duration (PT1H2M30S)
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  // Format as MM:SS or H:MM:SS
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Get detailed video information from YouTube including duration
 */
async function getVideoDetails(videoIds) {
  if (!Array.isArray(videoIds)) {
    videoIds = [videoIds];
  }
  
  if (videoIds.length === 0) return [];
  
  try {
    const response = await youtube.videos.list({
      part: 'snippet,contentDetails,statistics',
      id: videoIds.join(','),
      maxResults: 50
    });
    
    return response.data.items || [];
  } catch (error) {
    log.error(`Failed to get video details: ${error.message}`);
    return [];
  }
}

/**
 * Parse curriculum.json to extract Week 1 videos that need YouTube IDs
 */
function parseWeek1Videos() {
  const curriculumPath = path.join(__dirname, '../src/data/curriculum.json');
  
  if (!fs.existsSync(curriculumPath)) {
    throw new Error('Curriculum file not found: ' + curriculumPath);
  }
  
  const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));
  const module1 = curriculum.modules.find(m => m.id === 'module-1');
  
  if (!module1) {
    throw new Error('Module 1 not found in curriculum');
  }
  
  const week1 = module1.weeks.find(w => w.id === 'week-1');
  
  if (!week1) {
    throw new Error('Week 1 not found in Module 1');
  }
  
  const videosToProcess = [];
  
  // Skip Day 1 (has real YouTube IDs), process Days 2-7
  week1.days.forEach((day, dayIndex) => {
    if (dayIndex === 0) return; // Skip Day 1
    
    day.videos.forEach(video => {
      if (video.youtubeId === 'YOUTUBE_ID_PLACEHOLDER' || video.youtubeId) {
        videosToProcess.push({
          moduleId: 'module-1',
          weekId: 'week-1',
          dayId: day.id,
          dayTitle: day.title,
          videoId: video.id,
          title: video.title,
          creator: video.creator,
          duration: video.duration,
          xpReward: video.xpReward,
          youtubeId: video.youtubeId !== 'YOUTUBE_ID_PLACEHOLDER' ? video.youtubeId : null
        });
      }
    });
  });
  
  return videosToProcess;
}

/**
 * Extract key terms from video title for better searching
 */
function extractKeyTerms(title) {
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an'];
  const terms = title.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !stopWords.includes(term))
    .slice(0, 4);
  
  return terms.join(' ');
}

/**
 * Enhanced search for YouTube videos using multiple strategies (limited)
 */
async function searchYouTubeVideo(videoInfo) {
  // If video already has YouTube ID, skip search
  if (videoInfo.youtubeId) {
    log.info(`Video already has YouTube ID: ${videoInfo.youtubeId}`);
    return { id: { videoId: videoInfo.youtubeId }, skipSearch: true };
  }
  
  const searchStrategies = [
    // Primary: Exact title + creator
    `"${videoInfo.title}" "${videoInfo.creator}"`,
    // Fallback 1: Title + creator without quotes + Roblox
    `${videoInfo.title} ${videoInfo.creator} Roblox`,
    // Fallback 2: Key terms + creator + 2024
    `${extractKeyTerms(videoInfo.title)} ${videoInfo.creator} 2024`
  ];
  
  for (let i = 0; i < Math.min(searchStrategies.length, CONFIG.MAX_SEARCH_STRATEGIES); i++) {
    const query = searchStrategies[i];
    
    try {
      const response = await youtube.search.list({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: CONFIG.MAX_RESULTS_PER_SEARCH,
        order: 'relevance',
        publishedAfter: '2020-01-01T00:00:00Z',
        videoDefinition: 'any',
        videoEmbeddable: 'true'
      });
      
      if (response.data.items && response.data.items.length > 0) {
        const rankedResults = rankSearchResults(response.data.items, videoInfo);
        const bestMatch = rankedResults[0];
        
        if (bestMatch && bestMatch.relevanceScore >= CONFIG.MIN_RELEVANCE_SCORE) {
          return bestMatch;
        }
      }
      
      // Wait to respect API limits
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_SEARCHES));
      
    } catch (error) {
      log.error(`Search failed for strategy ${i + 1}: ${error.message}`);
    }
  }
  
  return null;
}

/**
 * Rank search results based on relevance to curriculum video
 */
function rankSearchResults(items, videoInfo) {
  return items.map(item => {
    let score = 0;
    const snippet = item.snippet;
    const title = snippet.title.toLowerCase();
    const description = snippet.description.toLowerCase();
    const channelTitle = snippet.channelTitle.toLowerCase();
    
    // Score based on title similarity (40%)
    const videoTitle = videoInfo.title.toLowerCase();
    const titleWords = videoTitle.split(/\s+/).filter(word => word.length > 2);
    const matchedWords = titleWords.filter(word => title.includes(word));
    score += (matchedWords.length / titleWords.length) * 40;
    
    // Score based on creator match (35%)
    const creator = videoInfo.creator.toLowerCase();
    const creatorWords = creator.split(/\s+/);
    const creatorMatch = creatorWords.some(word => channelTitle.includes(word)) || 
                        channelTitle.split(/\s+/).some(word => creator.includes(word));
    if (creatorMatch) {
      score += 35;
    }
    
    // Score based on Roblox relevance (15%)
    if (title.includes('roblox') || description.includes('roblox')) {
      score += 15;
    }
    
    // Score based on recency (5%)
    const publishYear = new Date(snippet.publishedAt).getFullYear();
    if (publishYear >= 2024) score += 5;
    else if (publishYear >= 2023) score += 3;
    else if (publishYear >= 2022) score += 1;
    
    // Score based on tutorial keywords (5%)
    const tutorialKeywords = ['tutorial', 'guide', 'beginner', 'complete', 'basics', 'studio'];
    if (tutorialKeywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
      score += 5;
    }
    
    return {
      ...item,
      relevanceScore: Math.round(score),
      matchDetails: {
        titleMatch: Math.round((matchedWords.length / titleWords.length) * 100),
        creatorMatch: creatorMatch,
        publishYear: publishYear,
        hasRoblox: title.includes('roblox') || description.includes('roblox'),
        hasTutorial: tutorialKeywords.some(keyword => title.includes(keyword) || description.includes(keyword))
      }
    };
  })
  .filter(item => item.relevanceScore > 30)
  .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Create backup of curriculum.json
 */
function createBackup() {
  const curriculumPath = path.join(__dirname, '../src/data/curriculum.json');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(__dirname, '../src/data', `curriculum-backup-enhanced-${timestamp}.json`);
  
  fs.copyFileSync(curriculumPath, backupPath);
  log.success(`Backup created: ${backupPath}`);
  return backupPath;
}

/**
 * Update curriculum.json with found videos and real durations
 */
function updateCurriculum(updates) {
  const curriculumPath = path.join(__dirname, '../src/data/curriculum.json');
  const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));
  
  let updatedCount = 0;
  
  updates.forEach(update => {
    if (!update.selectedVideo) return;
    
    // Navigate to the specific video in the curriculum
    const module = curriculum.modules.find(m => m.id === update.videoInfo.moduleId);
    if (!module) return;
    
    const week = module.weeks.find(w => w.id === update.videoInfo.weekId);
    if (!week) return;
    
    const day = week.days.find(d => d.id === update.videoInfo.dayId);
    if (!day) return;
    
    const video = day.videos.find(v => v.id === update.videoInfo.videoId);
    if (!video) return;
    
    // Update the video with real YouTube data including duration
    video.youtubeId = update.selectedVideo.youtubeId;
    video.thumbnail = update.selectedVideo.thumbnail || `https://i.ytimg.com/vi/${update.selectedVideo.youtubeId}/hqdefault.jpg`;
    
    // Update duration with real video length
    if (update.selectedVideo.duration) {
      video.duration = update.selectedVideo.duration;
      log.info(`  Duration updated: ${video.duration} (was placeholder)`);
    }
    
    updatedCount++;
  });
  
  // Write updated curriculum back to file
  fs.writeFileSync(curriculumPath, JSON.stringify(curriculum, null, 2), 'utf-8');
  
  return updatedCount;
}

/**
 * Generate detailed report of results including duration info
 */
function generateReport(results, videosProcessed) {
  const found = results.filter(r => r.selectedVideo);
  const skipped = results.filter(r => !r.selectedVideo);
  const durationUpdates = results.filter(r => r.selectedVideo && r.selectedVideo.duration);
  
  console.log('\n' + '='.repeat(70));
  log.highlight('📊 ENHANCED VIDEO DISCOVERY & DURATION REPORT');
  console.log('='.repeat(70));
  
  log.info(`📹 Total videos processed: ${videosProcessed}`);
  log.success(`✅ High-confidence matches found: ${found.length}`);
  log.success(`🕐 Durations updated: ${durationUpdates.length}`);
  log.warning(`⏭️  Low-confidence videos skipped: ${skipped.length}`);
  
  if (found.length > 0) {
    console.log('\n' + colors.green + '✅ SUCCESSFULLY MATCHED VIDEOS WITH DURATIONS:' + colors.reset);
    found.forEach((result, index) => {
      const video = result.selectedVideo;
      const info = result.videoInfo;
      console.log(`${index + 1}. ${colors.bright}${info.title}${colors.reset}`);
      console.log(`   👤 Expected: ${info.creator} | Found: ${video.channelTitle}`);
      console.log(`   📺 YouTube ID: ${video.youtubeId}`);
      console.log(`   🎯 Confidence: ${video.relevanceScore || 'N/A'}%`);
      if (video.duration) {
        const wasPlaceholder = info.duration === '10:00';
        console.log(`   🕐 Duration: ${video.duration} ${wasPlaceholder ? '(updated from placeholder)' : '(verified)'}`);
      }
      console.log(`   🔗 URL: https://youtube.com/watch?v=${video.youtubeId}\n`);
    });
  }
  
  if (skipped.length > 0) {
    console.log(colors.yellow + '⏭️  SKIPPED VIDEOS (Low Confidence):' + colors.reset);
    skipped.forEach((result, index) => {
      const info = result.videoInfo;
      console.log(`${index + 1}. ${info.title} by ${info.creator}`);
      console.log(`   📍 ${info.dayTitle}`);
      console.log(`   💭 Reason: No matches above ${CONFIG.MIN_RELEVANCE_SCORE}% confidence\n`);
    });
    
    console.log(colors.yellow + '💡 TIP: These videos may need manual searching or different search terms' + colors.reset);
  }
  
  // Duration summary
  if (durationUpdates.length > 0) {
    const totalOriginalMinutes = results.length * 10; // All were 10:00 placeholder
    const totalActualMinutes = durationUpdates.reduce((sum, result) => {
      const duration = result.selectedVideo.duration;
      const [minutes, seconds] = duration.split(':').map(Number);
      return sum + minutes + (seconds / 60);
    }, 0);
    
    console.log('\n' + colors.cyan + '🕐 DURATION ANALYSIS:' + colors.reset);
    console.log(`Placeholder total: ${totalOriginalMinutes} minutes (${durationUpdates.length} × 10:00)`);
    console.log(`Actual total: ${Math.round(totalActualMinutes)} minutes`);
    console.log(`Difference: ${Math.round(totalActualMinutes - (durationUpdates.length * 10))} minutes`);
  }
  
  console.log('='.repeat(70));
}

/**
 * Main execution function
 */
async function main() {
  try {
    log.highlight('🚀 Enhanced YouTube Video Finder with Duration Integration');
    log.info(`Finding videos and updating with real durations...\n`);
    
    // Check API key
    if (!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY && !process.env.YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not found in environment variables');
    }
    
    // Parse Week 1 videos (including those already found)
    const videosToProcess = parseWeek1Videos();
    const placeholderVideos = videosToProcess.filter(v => !v.youtubeId);
    const existingVideos = videosToProcess.filter(v => v.youtubeId);
    
    log.info(`Found ${videosToProcess.length} total videos in Week 1`);
    log.info(`- ${existingVideos.length} already have YouTube IDs (will update durations)`);
    log.info(`- ${placeholderVideos.length} need YouTube IDs (will search + get durations)\n`);
    
    // Create backup
    const backupPath = createBackup();
    
    const results = [];
    let processedCount = 0;
    
    // Process videos that need searching
    for (let i = 0; i < placeholderVideos.length; i++) {
      const videoInfo = placeholderVideos[i];
      processedCount++;
      
      log.highlight(`\n📹 Searching ${i + 1}/${placeholderVideos.length}: "${videoInfo.title}"`);
      log.info(`Creator: ${videoInfo.creator} | Day: ${videoInfo.dayTitle}`);
      
      // Search for video
      const bestMatch = await searchYouTubeVideo(videoInfo);
      
      if (bestMatch) {
        // Get detailed video information including duration
        const videoDetails = await getVideoDetails(bestMatch.id.videoId);
        const videoDetail = videoDetails[0];
        
        if (videoDetail) {
          const duration = convertYouTubeDuration(videoDetail.contentDetails.duration);
          const durationSeconds = parseDuration(duration);
          
          // Filter out videos that are too short or too long
          if (durationSeconds < CONFIG.MIN_DURATION_SECONDS || durationSeconds > CONFIG.MAX_DURATION_SECONDS) {
            log.warning(`⏭️  Skipped: Duration ${duration} outside acceptable range`);
            results.push({ videoInfo, selectedVideo: null });
            continue;
          }
          
          const selectedVideo = {
            youtubeId: bestMatch.id.videoId,
            title: bestMatch.snippet ? bestMatch.snippet.title : videoDetail.snippet.title,
            channelTitle: bestMatch.snippet ? bestMatch.snippet.channelTitle : videoDetail.snippet.channelTitle,
            publishedAt: bestMatch.snippet ? bestMatch.snippet.publishedAt : videoDetail.snippet.publishedAt,
            thumbnail: videoDetail.snippet.thumbnails.hqdefault?.url || videoDetail.snippet.thumbnails.default?.url,
            relevanceScore: bestMatch.relevanceScore,
            duration: duration,
            viewCount: videoDetail.statistics?.viewCount
          };
          
          results.push({ videoInfo, selectedVideo });
          log.success(`✅ Found match: "${selectedVideo.title}" (${bestMatch.relevanceScore}% confidence)`);
          log.info(`   Channel: ${selectedVideo.channelTitle} | Duration: ${duration}`);
        } else {
          log.error(`❌ Could not get video details for ${bestMatch.id.videoId}`);
          results.push({ videoInfo, selectedVideo: null });
        }
      } else {
        results.push({ videoInfo, selectedVideo: null });
        log.warning(`⏭️  Skipped: No high-confidence matches found`);
      }
      
      // Small delay between videos
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_SEARCHES));
    }
    
    // Process existing videos to get their durations
    if (existingVideos.length > 0) {
      log.highlight(`\n🕐 Getting durations for ${existingVideos.length} existing videos...`);
      
      const existingIds = existingVideos.map(v => v.youtubeId);
      const videoDetails = await getVideoDetails(existingIds);
      
      existingVideos.forEach((videoInfo, index) => {
        const videoDetail = videoDetails.find(d => d.id === videoInfo.youtubeId);
        
        if (videoDetail) {
          const duration = convertYouTubeDuration(videoDetail.contentDetails.duration);
          
          const selectedVideo = {
            youtubeId: videoInfo.youtubeId,
            title: videoDetail.snippet.title,
            channelTitle: videoDetail.snippet.channelTitle,
            publishedAt: videoDetail.snippet.publishedAt,
            thumbnail: videoDetail.snippet.thumbnails.hqdefault?.url || videoDetail.snippet.thumbnails.default?.url,
            duration: duration,
            viewCount: videoDetail.statistics?.viewCount
          };
          
          results.push({ videoInfo, selectedVideo });
          log.success(`✅ Updated duration for: "${videoInfo.title}" → ${duration}`);
          processedCount++;
        } else {
          log.error(`❌ Could not get details for existing video: ${videoInfo.youtubeId}`);
          results.push({ videoInfo, selectedVideo: null });
        }
      });
    }
    
    // Update curriculum with results
    log.highlight('\n💾 Updating curriculum with videos and durations...');
    const updatedCount = updateCurriculum(results);
    
    // Generate comprehensive report
    generateReport(results, processedCount);
    
    if (updatedCount > 0) {
      log.highlight(`\n🎉 Successfully updated ${updatedCount} videos in Week 1 with real durations!`);
      log.info(`📁 Backup saved: ${path.basename(backupPath)}`);
    } else {
      log.warning('No videos were updated.');
    }
    
  } catch (error) {
    log.error(`❌ Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Helper function to parse MM:SS duration into seconds
 */
function parseDuration(duration) {
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]; // MM:SS
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]; // H:MM:SS
  }
  return 0;
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  parseWeek1Videos,
  searchYouTubeVideo,
  getVideoDetails,
  convertYouTubeDuration,
  CONFIG,
  main
};