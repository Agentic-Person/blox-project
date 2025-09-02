const fs = require('fs');
const path = require('path');
const { YoutubeTranscript } = require('youtube-transcript');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const PLAYLIST_ID = 'PLZ1b66Z1KFKhO7R6Q588cdWxdnVxpPmA8';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  console.error('Error: YouTube API key is required');
  console.log('Please set either YOUTUBE_API_KEY or NEXT_PUBLIC_YOUTUBE_API_KEY environment variable');
  console.log('You can add it to your .env file or set it temporarily:');
  console.log('  YOUTUBE_API_KEY=your_key node scripts/fetch-playlist-with-transcripts.js');
  process.exit(1);
}

// Utility function to convert ISO 8601 duration to readable format
function formatDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';
  
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');
  
  const parts = [];
  if (hours) parts.push(hours);
  parts.push((minutes || '0').padStart(2, '0'));
  parts.push((seconds || '0').padStart(2, '0'));
  
  return parts.join(':');
}

// Utility function to convert duration to total minutes
function durationToMinutes(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  
  const hours = parseInt((match[1] || '').replace('H', '') || '0');
  const minutes = parseInt((match[2] || '').replace('M', '') || '0');
  const seconds = parseInt((match[3] || '').replace('S', '') || '0');
  
  return Math.ceil(hours * 60 + minutes + seconds / 60);
}

// Fetch playlist videos from YouTube API
async function getPlaylistVideos(playlistId) {
  let videos = [];
  let nextPageToken = '';
  
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    
    console.log('Fetching playlist videos...');
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('YouTube API Error:', data);
      throw new Error(`YouTube API error: ${data.error?.message || response.statusText}`);
    }
    
    if (data.items) {
      videos.push(...data.items.map(item => ({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        channelTitle: item.snippet.channelTitle,
        position: item.snippet.position
      })));
    }
    
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);
  
  return videos;
}

// Fetch detailed video information including duration
async function getVideoDetails(videoIds) {
  const chunks = [];
  const chunkSize = 50; // YouTube API allows max 50 videos per request
  
  for (let i = 0; i < videoIds.length; i += chunkSize) {
    chunks.push(videoIds.slice(i, i + chunkSize));
  }
  
  const allVideoDetails = [];
  
  for (const chunk of chunks) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${chunk.join(',')}&key=${YOUTUBE_API_KEY}`;
    
    console.log(`Fetching details for ${chunk.length} videos...`);
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('YouTube API Error:', data);
      throw new Error(`YouTube API error: ${data.error?.message || response.statusText}`);
    }
    
    if (data.items) {
      allVideoDetails.push(...data.items);
    }
  }
  
  return allVideoDetails;
}

// Fetch transcript for a video
async function getVideoTranscript(videoId, retries = 3) {
  try {
    console.log(`Fetching transcript for video: ${videoId}`);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      console.warn(`No transcript available for video: ${videoId}`);
      return null;
    }
    
    return transcript;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Error fetching transcript for ${videoId}, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return getVideoTranscript(videoId, retries - 1);
    }
    
    console.error(`Failed to fetch transcript for video ${videoId}:`, error.message);
    return null;
  }
}

// Main processing function
async function processPlaylistWithTranscripts() {
  try {
    console.log(`Processing playlist: ${PLAYLIST_ID}`);
    console.log('=====================================\n');
    
    // Step 1: Get playlist videos
    const playlistVideos = await getPlaylistVideos(PLAYLIST_ID);
    console.log(`Found ${playlistVideos.length} videos in playlist\n`);
    
    // Step 2: Get detailed video information
    const videoIds = playlistVideos.map(v => v.videoId);
    const videoDetails = await getVideoDetails(videoIds);
    console.log(`Fetched details for ${videoDetails.length} videos\n`);
    
    // Step 3: Merge playlist and detail data
    const enrichedVideos = playlistVideos.map(playlistVideo => {
      const details = videoDetails.find(d => d.id === playlistVideo.videoId);
      
      return {
        ...playlistVideo,
        duration: details ? formatDuration(details.contentDetails.duration) : '0:00',
        totalMinutes: details ? durationToMinutes(details.contentDetails.duration) : 0,
        rawDuration: details?.contentDetails.duration || 'PT0S'
      };
    });
    
    // Step 4: Fetch transcripts for each video
    const videosWithTranscripts = [];
    
    for (let i = 0; i < enrichedVideos.length; i++) {
      const video = enrichedVideos[i];
      console.log(`\nProcessing video ${i + 1}/${enrichedVideos.length}: ${video.title}`);
      
      const transcript = await getVideoTranscript(video.videoId);
      
      videosWithTranscripts.push({
        id: `video-1-3-${Math.floor(i/5) + 1}-${(i%5) + 1}`, // Generate curriculum-style ID
        youtubeId: video.videoId,
        title: video.title,
        creator: video.channelTitle,
        description: video.description.substring(0, 300) + '...', // Truncate description
        duration: video.duration,
        totalMinutes: video.totalMinutes,
        thumbnail: video.thumbnail,
        xpReward: Math.min(50, Math.max(20, Math.floor(video.totalMinutes / 2))), // XP based on duration
        position: video.position,
        transcript: transcript,
        hasTranscript: !!transcript,
        transcriptLength: transcript ? transcript.length : 0
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n=====================================');
    console.log('Processing Complete!');
    console.log(`Total videos processed: ${videosWithTranscripts.length}`);
    console.log(`Videos with transcripts: ${videosWithTranscripts.filter(v => v.hasTranscript).length}`);
    console.log(`Videos without transcripts: ${videosWithTranscripts.filter(v => !v.hasTranscript).length}`);
    
    return videosWithTranscripts;
    
  } catch (error) {
    console.error('Error processing playlist:', error);
    throw error;
  }
}

// Save processed data
async function saveProcessedData(videos) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Save full data with transcripts
  const fullDataPath = path.join(__dirname, `../src/data/playlist-${PLAYLIST_ID}-full-${timestamp}.json`);
  fs.writeFileSync(fullDataPath, JSON.stringify(videos, null, 2));
  console.log(`\nFull data saved to: ${fullDataPath}`);
  
  // Save curriculum-ready format (without full transcripts)
  const curriculumVideos = videos.map(video => ({
    id: video.id,
    title: video.title,
    creator: video.creator,
    description: video.description,
    youtubeId: video.youtubeId,
    duration: video.duration,
    totalMinutes: video.totalMinutes,
    thumbnail: video.thumbnail,
    xpReward: video.xpReward,
    hasTranscript: video.hasTranscript
  }));
  
  const curriculumPath = path.join(__dirname, `../src/data/playlist-${PLAYLIST_ID}-curriculum-${timestamp}.json`);
  fs.writeFileSync(curriculumPath, JSON.stringify(curriculumVideos, null, 2));
  console.log(`Curriculum data saved to: ${curriculumPath}`);
  
  // Save transcripts separately
  const transcripts = {};
  videos.forEach(video => {
    if (video.transcript) {
      transcripts[video.youtubeId] = {
        videoId: video.youtubeId,
        title: video.title,
        transcript: video.transcript,
        segmentCount: video.transcript.length
      };
    }
  });
  
  const transcriptsPath = path.join(__dirname, `../src/data/transcripts/playlist-${PLAYLIST_ID}-transcripts-${timestamp}.json`);
  
  // Ensure transcripts directory exists
  const transcriptsDir = path.dirname(transcriptsPath);
  if (!fs.existsSync(transcriptsDir)) {
    fs.mkdirSync(transcriptsDir, { recursive: true });
  }
  
  fs.writeFileSync(transcriptsPath, JSON.stringify(transcripts, null, 2));
  console.log(`Transcripts saved to: ${transcriptsPath}`);
  
  return {
    fullDataPath,
    curriculumPath,
    transcriptsPath,
    videos: curriculumVideos,
    transcripts
  };
}

// Run the script
if (require.main === module) {
  processPlaylistWithTranscripts()
    .then(saveProcessedData)
    .then(result => {
      console.log('\n✅ Script completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Review the generated curriculum data');
      console.log('2. Update curriculum.json with the new videos');
      console.log('3. Test video loading in the interface');
      
      return result;
    })
    .catch(error => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  processPlaylistWithTranscripts,
  saveProcessedData,
  PLAYLIST_ID
};