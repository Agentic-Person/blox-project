#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Enhanced YouTube metadata fetcher with accurate duration
 * Usage: node enhanced-youtube-fetcher.js [youtube-url] [module] [week] [day] [video]
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

function fetchVideoPage(videoId) {
  return new Promise((resolve, reject) => {
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    console.log(`📡 Fetching video page for detailed metadata: ${videoId}`);
    
    https.get(pageUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function parseVideoMetadata(pageHtml, videoId) {
  try {
    // Extract title from various possible locations
    let title = '';
    
    // Try meta property="og:title"
    const ogTitleMatch = pageHtml.match(/<meta property="og:title" content="([^"]+)"/);
    if (ogTitleMatch) {
      title = ogTitleMatch[1];
    } else {
      // Fallback to page title
      const titleMatch = pageHtml.match(/<title>([^<]+)<\/title>/);
      if (titleMatch) {
        title = titleMatch[1].replace(' - YouTube', '');
      }
    }
    
    // Extract duration from JSON-LD structured data
    let duration = null;
    const jsonLdMatch = pageHtml.match(/<script type="application\/ld\+json"[^>]*>([^<]+)<\/script>/);
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        if (jsonData.duration) {
          // Convert ISO 8601 duration (PT39M33S) to MM:SS format
          const durationMatch = jsonData.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          if (durationMatch) {
            const hours = parseInt(durationMatch[1]) || 0;
            const minutes = parseInt(durationMatch[2]) || 0;
            const seconds = parseInt(durationMatch[3]) || 0;
            
            if (hours > 0) {
              duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
              duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
          }
        }
      } catch (e) {
        // Continue with other methods
      }
    }
    
    // Extract uploader/channel name
    let uploader = '';
    const uploaderMatch = pageHtml.match(/<link itemprop="name" content="([^"]+)">/);
    if (uploaderMatch) {
      uploader = uploaderMatch[1];
    } else {
      // Fallback method
      const channelMatch = pageHtml.match(/"ownerChannelName":"([^"]+)"/);
      if (channelMatch) {
        uploader = channelMatch[1];
      }
    }
    
    // Generate thumbnail URL
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    
    return {
      title: title || 'Unknown Title',
      creator: uploader || 'Unknown Creator',
      duration: duration || 'Unknown Duration',
      thumbnail: thumbnail
    };
    
  } catch (error) {
    throw new Error(`Failed to parse video metadata: ${error.message}`);
  }
}

async function fetchEnhancedVideoMetadata(videoId) {
  try {
    const pageHtml = await fetchVideoPage(videoId);
    const metadata = parseVideoMetadata(pageHtml, videoId);
    
    console.log(`📺 Enhanced metadata extracted:`);
    console.log(`   Title: ${metadata.title}`);
    console.log(`   Creator: ${metadata.creator}`);
    console.log(`   Duration: ${metadata.duration}`);
    
    return metadata;
    
  } catch (error) {
    console.log(`⚠️ Enhanced fetch failed, falling back to oEmbed API`);
    
    // Fallback to oEmbed API
    return new Promise((resolve, reject) => {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      
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
              duration: 'DURATION_NEEDS_MANUAL_UPDATE',
              thumbnail: videoInfo.thumbnail_url
            });
          } catch (error) {
            reject(new Error(`Failed to parse fallback metadata: ${error.message}`));
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }
}

async function replaceVideoWithEnhancedMetadata(youtubeUrl, moduleIndex, weekIndex, dayIndex, videoIndex) {
  try {
    console.log('🚀 Starting enhanced video replacement...');
    
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }
    
    console.log(`🎯 Target: Module ${moduleIndex + 1}, Week ${weekIndex + 1}, Day ${dayIndex + 1}, Video ${videoIndex + 1}`);
    
    // Fetch enhanced video metadata
    const metadata = await fetchEnhancedVideoMetadata(videoId);
    
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
    
    // Update video with fetched metadata
    const oldTitle = video.title;
    const oldDuration = video.duration;
    video.title = metadata.title;
    video.youtubeId = videoId;
    video.creator = metadata.creator;
    video.duration = metadata.duration;
    video.thumbnail = metadata.thumbnail;
    
    // Remove placeholder flag if it exists
    if (video.isPlaceholder) {
      delete video.isPlaceholder;
    }
    
    console.log(`📝 Updated video:`);
    console.log(`   Old Title: "${oldTitle}"`);
    console.log(`   New Title: "${metadata.title}"`);
    console.log(`   Old Duration: ${oldDuration}`);
    console.log(`   New Duration: ${metadata.duration}`);
    console.log(`   Creator: ${metadata.creator}`);
    console.log(`   YouTube ID: ${videoId}`);
    
    // Check if duration needs manual update
    if (metadata.duration === 'DURATION_NEEDS_MANUAL_UPDATE') {
      console.log(`⚠️  WARNING: Duration could not be automatically detected.`);
      console.log(`   Please manually update the duration in the curriculum file.`);
    }
    
    // Save curriculum
    saveCurriculum(curriculum);
    
    return {
      success: true,
      metadata,
      needsManualDuration: metadata.duration === 'DURATION_NEEDS_MANUAL_UPDATE',
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
    
    if (!youtubeUrl) {
      console.error('❌ Error: Please provide a YouTube URL');
      console.log('Usage: node enhanced-youtube-fetcher.js [youtube-url] [module] [week] [day] [video]');
      console.log('Quick usage: node enhanced-youtube-fetcher.js [youtube-url] (updates Module 1, Week 1, Day 1, Video 1)');
      process.exit(1);
    }
    
    // Parse optional position arguments
    const moduleIndex = parseInt(process.argv[3]) - 1 || 0;
    const weekIndex = parseInt(process.argv[4]) - 1 || 0;
    const dayIndex = parseInt(process.argv[5]) - 1 || 0;
    const videoIndex = parseInt(process.argv[6]) - 1 || 0;
    
    const result = await replaceVideoWithEnhancedMetadata(youtubeUrl, moduleIndex, weekIndex, dayIndex, videoIndex);
    
    console.log('\n✅ Successfully updated video with enhanced metadata!');
    console.log(`📍 Location: Module ${result.location.module}, Week ${result.location.week}, Day ${result.location.day}, Video ${result.location.video}`);
    
    if (result.needsManualDuration) {
      console.log('\n⚠️ Action Required: Please verify and update the video duration manually.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { replaceVideoWithEnhancedMetadata, fetchEnhancedVideoMetadata };