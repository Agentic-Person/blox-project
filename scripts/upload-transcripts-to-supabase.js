const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase configuration');
  console.log('Required environment variables:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL');
  console.log('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// File paths for the transcript data you already have
const TRANSCRIPT_FILE = path.join(__dirname, '../src/data/transcripts/playlist-PLZ1b66Z1KFKhO7R6Q588cdWxdnVxpPmA8-transcripts-2025-09-02T23-30-41-422Z.json');
const CURRICULUM_FILE = path.join(__dirname, '../src/data/playlist-PLZ1b66Z1KFKhO7R6Q588cdWxdnVxpPmA8-curriculum-2025-09-02T23-30-41-422Z.json');
const FULL_DATA_FILE = path.join(__dirname, '../src/data/playlist-PLZ1b66Z1KFKhO7R6Q588cdWxdnVxpPmA8-full-2025-09-02T23-30-41-422Z.json');

// Utility function to chunk transcript text for better searchability
function chunkTranscript(transcript, chunkSizeSeconds = 30) {
  if (!transcript || !Array.isArray(transcript)) {
    return [];
  }

  const chunks = [];
  let currentChunk = {
    texts: [],
    startTime: null,
    endTime: null
  };

  for (const segment of transcript) {
    const segmentStart = parseFloat(segment.offset) / 1000; // Convert to seconds
    
    // Start new chunk if this is the first segment or if we've exceeded chunk size
    if (currentChunk.startTime === null || (segmentStart - currentChunk.startTime) >= chunkSizeSeconds) {
      // Save previous chunk if it has content
      if (currentChunk.texts.length > 0) {
        chunks.push({
          startTime: currentChunk.startTime,
          endTime: currentChunk.endTime,
          text: currentChunk.texts.join(' ').trim()
        });
      }
      
      // Start new chunk
      currentChunk = {
        texts: [segment.text],
        startTime: segmentStart,
        endTime: segmentStart + (parseFloat(segment.duration) / 1000)
      };
    } else {
      // Add to current chunk
      currentChunk.texts.push(segment.text);
      currentChunk.endTime = segmentStart + (parseFloat(segment.duration) / 1000);
    }
  }

  // Add the last chunk
  if (currentChunk.texts.length > 0) {
    chunks.push({
      startTime: currentChunk.startTime,
      endTime: currentChunk.endTime,
      text: currentChunk.texts.join(' ').trim()
    });
  }

  return chunks;
}

// Function to upload videos to Supabase
async function uploadVideos(curriculumData) {
  console.log('Uploading video metadata...');
  const videos = [];
  
  for (const video of curriculumData) {
    const videoData = {
      youtube_id: video.youtubeId,
      title: video.title,
      creator: video.creator,
      description: video.description,
      duration: video.duration,
      total_minutes: video.totalMinutes,
      thumbnail_url: video.thumbnail,
      xp_reward: video.xpReward || 25,
      module_id: video.id.split('-')[1], // Extract module from ID like "video-1-3-1-1"
      week_id: video.id.split('-')[2],
      day_id: video.id.split('-')[3],
      order_index: parseInt(video.id.split('-')[4]) || 0
    };
    
    videos.push(videoData);
  }

  // Insert videos in batches to avoid hitting limits
  const batchSize = 50;
  const insertedVideos = [];
  
  for (let i = 0; i < videos.length; i += batchSize) {
    const batch = videos.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('videos')
      .upsert(batch, { 
        onConflict: 'youtube_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error(`Error inserting video batch ${Math.floor(i/batchSize) + 1}:`, error);
      continue;
    }

    insertedVideos.push(...data);
    console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(videos.length/batchSize)} (${data.length} videos)`);
  }

  console.log(`Total videos uploaded: ${insertedVideos.length}`);
  return insertedVideos;
}

// Function to upload transcripts to Supabase
async function uploadTranscripts(transcriptData, videoMap) {
  console.log('Uploading transcript data...');
  const transcripts = [];
  const chunks = [];

  for (const [youtubeId, transcriptInfo] of Object.entries(transcriptData)) {
    const video = videoMap.get(youtubeId);
    if (!video) {
      console.warn(`Video not found for YouTube ID: ${youtubeId}`);
      continue;
    }

    // Create transcript record
    const transcriptRecord = {
      video_id: video.id,
      youtube_id: youtubeId,
      full_transcript: transcriptInfo.transcript,
      segment_count: transcriptInfo.segmentCount || transcriptInfo.transcript?.length || 0,
      language: 'en'
    };

    transcripts.push(transcriptRecord);

    // Create transcript chunks for better searchability
    const transcriptChunks = chunkTranscript(transcriptInfo.transcript);
    
    for (let i = 0; i < transcriptChunks.length; i++) {
      const chunk = transcriptChunks[i];
      chunks.push({
        video_id: video.id,
        youtube_id: youtubeId,
        chunk_index: i,
        start_time: chunk.startTime,
        end_time: chunk.endTime,
        text: chunk.text
      });
    }
  }

  // Upload transcript records
  const { data: transcriptRecords, error: transcriptError } = await supabase
    .from('video_transcripts')
    .upsert(transcripts, { 
      onConflict: 'video_id,youtube_id',
      ignoreDuplicates: false 
    })
    .select();

  if (transcriptError) {
    console.error('Error uploading transcripts:', transcriptError);
    return;
  }

  console.log(`Uploaded ${transcriptRecords.length} transcript records`);

  // Create transcript ID map for chunks
  const transcriptMap = new Map();
  transcriptRecords.forEach(record => {
    transcriptMap.set(record.youtube_id, record.id);
  });

  // Add transcript IDs to chunks
  chunks.forEach(chunk => {
    chunk.transcript_id = transcriptMap.get(chunk.youtube_id);
  });

  // Upload transcript chunks in batches
  const batchSize = 100;
  let totalChunks = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('video_transcript_chunks')
      .upsert(batch, { 
        onConflict: 'transcript_id,chunk_index',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error(`Error uploading chunk batch ${Math.floor(i/batchSize) + 1}:`, error);
      continue;
    }

    totalChunks += data.length;
    console.log(`Uploaded chunk batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)} (${data.length} chunks)`);
  }

  console.log(`Total transcript chunks uploaded: ${totalChunks}`);
}

// Main function to upload all data
async function uploadAllData() {
  try {
    console.log('Starting transcript upload to Supabase...');
    console.log('=====================================\\n');

    // Check if files exist
    if (!fs.existsSync(TRANSCRIPT_FILE)) {
      console.error(`Transcript file not found: ${TRANSCRIPT_FILE}`);
      process.exit(1);
    }

    if (!fs.existsSync(CURRICULUM_FILE)) {
      console.error(`Curriculum file not found: ${CURRICULUM_FILE}`);
      process.exit(1);
    }

    // Load the data
    console.log('Loading transcript and curriculum data...');
    const transcriptData = JSON.parse(fs.readFileSync(TRANSCRIPT_FILE, 'utf8'));
    const curriculumData = JSON.parse(fs.readFileSync(CURRICULUM_FILE, 'utf8'));

    console.log(`Loaded ${Object.keys(transcriptData).length} transcripts`);
    console.log(`Loaded ${curriculumData.length} curriculum videos\\n`);

    // Upload videos first
    const uploadedVideos = await uploadVideos(curriculumData);
    
    // Create video map for transcript upload
    const videoMap = new Map();
    uploadedVideos.forEach(video => {
      videoMap.set(video.youtube_id, video);
    });

    console.log('\\n=====================================\\n');

    // Upload transcripts
    await uploadTranscripts(transcriptData, videoMap);

    console.log('\\n=====================================');
    console.log('Upload completed successfully!');
    console.log('\\nNext steps:');
    console.log('1. Verify data in Supabase dashboard');
    console.log('2. Test video search functionality');
    console.log('3. Update Blox Wizard to use real data');

  } catch (error) {
    console.error('\\nUpload failed:', error);
    console.error('\\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Function to test the upload by querying some data
async function testUpload() {
  try {
    console.log('\\nTesting upload by querying data...');
    
    // Test video count
    const { count: videoCount, error: videoError } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    if (videoError) {
      console.error('Error counting videos:', videoError);
    } else {
      console.log(`Videos in database: ${videoCount}`);
    }

    // Test transcript count
    const { count: transcriptCount, error: transcriptError } = await supabase
      .from('video_transcripts')
      .select('*', { count: 'exact', head: true });

    if (transcriptError) {
      console.error('Error counting transcripts:', transcriptError);
    } else {
      console.log(`Transcripts in database: ${transcriptCount}`);
    }

    // Test chunk count
    const { count: chunkCount, error: chunkError } = await supabase
      .from('video_transcript_chunks')
      .select('*', { count: 'exact', head: true });

    if (chunkError) {
      console.error('Error counting chunks:', chunkError);
    } else {
      console.log(`Transcript chunks in database: ${chunkCount}`);
    }

    // Test search function
    console.log('\\nTesting transcript search...');
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_video_transcripts', { 
        search_query: 'roblox studio',
        limit_count: 3
      });

    if (searchError) {
      console.error('Search test failed:', searchError);
    } else {
      console.log(`Found ${searchResults.length} search results for "roblox studio"`);
      searchResults.forEach((result, i) => {
        console.log(`  ${i + 1}. ${result.video_title} (${result.start_time}s-${result.end_time}s)`);
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    testUpload();
  } else {
    uploadAllData()
      .then(() => testUpload())
      .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  uploadAllData,
  uploadVideos,
  uploadTranscripts,
  testUpload
};