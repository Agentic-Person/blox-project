const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize YouTube API
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
});

// Read the markdown file with video titles and creators
function readVideoList() {
  const mdPath = path.join(__dirname, '../docs/YouTube video titles-content-creator-URL-link-8-23-2025.md');
  const content = fs.readFileSync(mdPath, 'utf-8');
  
  const videos = [];
  const lines = content.split('\n');
  
  lines.forEach(line => {
    // Parse table rows: | Day | Title | Creator | Link |
    const match = line.match(/\|\s*(\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
    if (match) {
      const [, day, title, creator] = match;
      // Skip header row
      if (day !== 'Day' && !isNaN(parseInt(day))) {
        videos.push({
          day: parseInt(day),
          title: title.trim(),
          creator: creator.trim(),
          originalUrl: line.includes('watch?v=') ? 
            line.match(/watch\?v=([^)]+)/)?.[1] : null
        });
      }
    }
  });
  
  return videos;
}

// Search for a video on YouTube
async function searchYouTubeVideo(title, creator, options = {}) {
  try {
    // Build search query
    const searchQuery = `${title} ${creator}`;
    
    const searchParams = {
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      maxResults: options.maxResults || 5,
      videoDuration: options.duration || 'any', // short, medium, long
      relevanceLanguage: 'en',
      safeSearch: 'strict',
      order: options.order || 'relevance'
    };

    // Add date filters if specified
    if (options.publishedAfter) {
      searchParams.publishedAfter = options.publishedAfter;
    }

    const response = await youtube.search.list(searchParams);
    
    if (!response.data.items || response.data.items.length === 0) {
      return null;
    }

    // Get additional details for the videos
    const videoIds = response.data.items.map(item => item.id.videoId).join(',');
    const detailsResponse = await youtube.videos.list({
      part: 'contentDetails,status,statistics',
      id: videoIds
    });

    // Combine search results with details
    const results = response.data.items.map((item, index) => {
      const details = detailsResponse.data.items[index];
      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        duration: details?.contentDetails?.duration,
        embeddable: details?.status?.embeddable,
        privacyStatus: details?.status?.privacyStatus,
        viewCount: details?.statistics?.viewCount,
        likeCount: details?.statistics?.likeCount
      };
    });

    // Find best match
    const bestMatch = findBestMatch(results, title, creator);
    return bestMatch;

  } catch (error) {
    console.error(`Error searching for "${title}" by ${creator}:`, error.message);
    return null;
  }
}

// Find the best matching video from search results
function findBestMatch(results, originalTitle, originalCreator) {
  if (!results || results.length === 0) return null;

  // Score each result
  const scoredResults = results.map(result => {
    let score = 0;
    
    // Check if embeddable
    if (result.embeddable === false) {
      return { ...result, score: -1 }; // Not embeddable, skip
    }
    
    // Check privacy status
    if (result.privacyStatus !== 'public') {
      return { ...result, score: -1 }; // Not public, skip
    }

    // Title similarity (case insensitive)
    const titleLower = originalTitle.toLowerCase();
    const resultTitleLower = result.title.toLowerCase();
    
    if (resultTitleLower === titleLower) {
      score += 100; // Exact match
    } else if (resultTitleLower.includes(titleLower) || titleLower.includes(resultTitleLower)) {
      score += 50; // Partial match
    } else {
      // Check for common words
      const titleWords = titleLower.split(/\s+/);
      const resultWords = resultTitleLower.split(/\s+/);
      const commonWords = titleWords.filter(word => 
        word.length > 3 && resultWords.some(rw => rw.includes(word))
      );
      score += commonWords.length * 10;
    }

    // Creator/Channel similarity
    const creatorLower = originalCreator.toLowerCase();
    const channelLower = result.channelTitle.toLowerCase();
    
    if (channelLower === creatorLower) {
      score += 50; // Exact channel match
    } else if (channelLower.includes(creatorLower) || creatorLower.includes(channelLower)) {
      score += 25; // Partial channel match
    }

    // Prefer videos with more views (popularity indicator)
    const views = parseInt(result.viewCount) || 0;
    if (views > 100000) score += 20;
    else if (views > 10000) score += 10;
    else if (views > 1000) score += 5;

    // Prefer newer videos (2023-2024)
    const publishYear = new Date(result.publishedAt).getFullYear();
    if (publishYear === 2024) score += 15;
    else if (publishYear === 2023) score += 10;
    else if (publishYear === 2022) score += 5;

    return { ...result, score };
  });

  // Filter out non-embeddable videos and sort by score
  const validResults = scoredResults
    .filter(r => r.score >= 0)
    .sort((a, b) => b.score - a.score);

  if (validResults.length === 0) return null;

  // Return the best match with confidence level
  const bestMatch = validResults[0];
  const confidence = bestMatch.score > 80 ? 'high' : 
                     bestMatch.score > 40 ? 'medium' : 'low';

  return {
    ...bestMatch,
    confidence,
    alternativeOptions: validResults.slice(1, 3) // Include up to 2 alternatives
  };
}

// Convert ISO 8601 duration to human-readable format
function formatDuration(isoDuration) {
  if (!isoDuration) return 'Unknown';
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return isoDuration;
  
  const hours = match[1] || 0;
  const minutes = match[2] || 0;
  const seconds = match[3] || 0;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Main function to search all videos
async function searchAllVideos() {
  console.log('🚀 Starting YouTube Video Search...\n');
  
  // Check for API key
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('❌ ERROR: YouTube API key not found!');
    console.log('\nPlease add your YouTube API key to .env.local:');
    console.log('YOUTUBE_API_KEY=your_api_key_here\n');
    return;
  }
  
  console.log('✅ API Key found\n');

  const videoList = readVideoList();
  console.log(`📋 Found ${videoList.length} videos to search\n`);

  const results = {
    found: [],
    notFound: [],
    notEmbeddable: [],
    errors: []
  };

  // Process videos in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < videoList.length; i += batchSize) {
    const batch = videoList.slice(i, Math.min(i + batchSize, videoList.length));
    
    const batchPromises = batch.map(async (video) => {
      console.log(`🔍 Searching Day ${video.day}: "${video.title}" by ${video.creator}...`);
      
      try {
        // Try exact search first
        let result = await searchYouTubeVideo(video.title, video.creator, {
          maxResults: 5,
          publishedAfter: '2022-01-01T00:00:00Z'
        });
        
        // If no exact match, try broader search
        if (!result || result.confidence === 'low') {
          const broadResult = await searchYouTubeVideo(video.title, '', {
            maxResults: 10,
            order: 'viewCount'
          });
          
          if (broadResult && (!result || broadResult.score > result.score)) {
            result = broadResult;
          }
        }

        if (result) {
          if (!result.embeddable) {
            console.log(`   ❌ Found but not embeddable: ${result.title}`);
            results.notEmbeddable.push({
              ...video,
              foundVideo: result
            });
          } else {
            console.log(`   ✅ Found (${result.confidence} confidence): ${result.title}`);
            console.log(`      Video ID: ${result.videoId}`);
            console.log(`      Channel: ${result.channelTitle}`);
            console.log(`      Duration: ${formatDuration(result.duration)}`);
            console.log(`      Views: ${parseInt(result.viewCount).toLocaleString()}`);
            
            results.found.push({
              ...video,
              foundVideo: {
                videoId: result.videoId,
                title: result.title,
                channelTitle: result.channelTitle,
                duration: formatDuration(result.duration),
                viewCount: result.viewCount,
                confidence: result.confidence,
                embeddable: result.embeddable,
                url: `https://www.youtube.com/watch?v=${result.videoId}`,
                embedUrl: `https://www.youtube.com/embed/${result.videoId}`,
                thumbnail: result.thumbnail
              },
              alternatives: result.alternativeOptions
            });
          }
        } else {
          console.log(`   ❌ Not found`);
          results.notFound.push(video);
        }
      } catch (error) {
        console.log(`   ⚠️ Error: ${error.message}`);
        results.errors.push({
          ...video,
          error: error.message
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    await Promise.all(batchPromises);
    
    // Delay between batches
    if (i + batchSize < videoList.length) {
      console.log(`\n⏳ Processing batch ${Math.floor(i/batchSize) + 1}...\n`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Generate reports
  generateReports(results);
  
  console.log('\n✅ Search complete!\n');
}

// Generate detailed reports
function generateReports(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Summary statistics
  const total = results.found.length + results.notFound.length + 
                results.notEmbeddable.length + results.errors.length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEARCH SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total videos searched: ${total}`);
  console.log(`✅ Found & embeddable: ${results.found.length} (${(results.found.length/total*100).toFixed(1)}%)`);
  console.log(`🔒 Found but not embeddable: ${results.notEmbeddable.length}`);
  console.log(`❌ Not found: ${results.notFound.length}`);
  console.log(`⚠️ Errors: ${results.errors.length}`);
  
  // Save found videos JSON
  const foundVideosPath = path.join(__dirname, `../youtube-videos-found-${timestamp}.json`);
  fs.writeFileSync(foundVideosPath, JSON.stringify(results.found, null, 2));
  console.log(`\n💾 Found videos saved to: ${foundVideosPath}`);
  
  // Generate update script for curriculum
  const updateData = {};
  results.found.forEach(item => {
    const dayKey = `day-${item.day}`;
    if (!updateData[dayKey]) {
      updateData[dayKey] = [];
    }
    updateData[dayKey].push({
      videoId: item.foundVideo.videoId,
      title: item.foundVideo.title,
      channelTitle: item.foundVideo.channelTitle,
      duration: item.foundVideo.duration,
      originalTitle: item.title,
      originalCreator: item.creator
    });
  });
  
  const updatePath = path.join(__dirname, `../curriculum-update-${timestamp}.json`);
  fs.writeFileSync(updatePath, JSON.stringify(updateData, null, 2));
  console.log(`💾 Curriculum update data saved to: ${updatePath}`);
  
  // Generate human-readable report
  let report = '# YouTube Video Search Report\n\n';
  report += `Generated: ${new Date().toLocaleString()}\n\n`;
  report += '## Summary\n\n';
  report += `- Total videos searched: ${total}\n`;
  report += `- Found & embeddable: ${results.found.length}\n`;
  report += `- Found but not embeddable: ${results.notEmbeddable.length}\n`;
  report += `- Not found: ${results.notFound.length}\n`;
  report += `- Errors: ${results.errors.length}\n\n`;
  
  if (results.found.length > 0) {
    report += '## Found Videos\n\n';
    results.found.forEach(item => {
      report += `### Day ${item.day}: ${item.title}\n`;
      report += `- **Original Creator**: ${item.creator}\n`;
      report += `- **Found Video**: ${item.foundVideo.title}\n`;
      report += `- **Channel**: ${item.foundVideo.channelTitle}\n`;
      report += `- **Video ID**: ${item.foundVideo.videoId}\n`;
      report += `- **Confidence**: ${item.foundVideo.confidence}\n`;
      report += `- **URL**: ${item.foundVideo.url}\n\n`;
    });
  }
  
  if (results.notFound.length > 0) {
    report += '## Not Found\n\n';
    results.notFound.forEach(item => {
      report += `- Day ${item.day}: "${item.title}" by ${item.creator}\n`;
    });
  }
  
  const reportPath = path.join(__dirname, `../youtube-search-report-${timestamp}.md`);
  fs.writeFileSync(reportPath, report);
  console.log(`📄 Human-readable report saved to: ${reportPath}`);
}

// Run the search
if (require.main === module) {
  searchAllVideos().catch(console.error);
}

module.exports = { searchYouTubeVideo, searchAllVideos };