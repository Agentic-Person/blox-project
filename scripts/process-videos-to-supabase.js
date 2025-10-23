/**
 * Complete Video Processing Pipeline
 *
 * This script handles the entire workflow:
 * 1. Extract transcripts from YouTube videos using youtubei.js
 * 2. Chunk transcripts into 30-second segments
 * 3. Generate embeddings using OpenAI
 * 4. Upload to Supabase (video_transcripts + transcript_chunks tables)
 *
 * Usage:
 *   node scripts/process-videos-to-supabase.js VIDEO_ID1 VIDEO_ID2 VIDEO_ID3...
 *   node scripts/process-videos-to-supabase.js --file video-ids.txt
 */

const { Innertube } = require('youtubei.js');
const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const CHUNK_DURATION_SECONDS = 30;
const BATCH_SIZE = 5; // Process N videos at a time
const EMBEDDING_BATCH_SIZE = 10; // Embed N chunks at a time

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Extract transcript from a YouTube video
 */
async function extractTranscript(videoId) {
  console.log(`\n📹 Processing: ${videoId}`);

  try {
    const youtube = await Innertube.create();
    const info = await youtube.getInfo(videoId);

    const title = info.basic_info.title;
    const author = info.basic_info.author;
    const duration = info.basic_info.duration;
    const description = info.basic_info.short_description || '';

    console.log(`   Title: ${title}`);
    console.log(`   Creator: ${author}`);
    console.log(`   Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`);

    const transcriptData = await info.getTranscript();

    if (!transcriptData || !transcriptData.transcript) {
      console.log(`   ❌ No transcript available`);
      return null;
    }

    const segments = transcriptData.transcript.content.body.initial_segments;

    if (!segments || segments.length === 0) {
      console.log(`   ❌ No transcript segments found`);
      return null;
    }

    // Filter out non-text segments (like headers)
    const textSegments = segments
      .filter(seg => seg.snippet && seg.snippet.text)
      .map(seg => ({
        text: seg.snippet.text,
        start_ms: parseInt(seg.start_ms),
        duration_ms: parseInt(seg.end_ms) - parseInt(seg.start_ms)
      }));

    console.log(`   ✅ Extracted ${textSegments.length} transcript segments`);

    return {
      videoId,
      title,
      creator: author,
      description,
      duration,
      segments: textSegments
    };

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Chunk transcript into 30-second segments
 */
function chunkTranscript(videoData) {
  const chunks = [];
  let currentChunk = {
    text: [],
    start_ms: 0,
    end_ms: 0
  };
  let chunkIndex = 0;

  for (const segment of videoData.segments) {
    const segmentStart = segment.start_ms;
    const segmentEnd = segment.start_ms + segment.duration_ms;
    const chunkEnd = (chunkIndex + 1) * CHUNK_DURATION_SECONDS * 1000;

    // If segment fits in current chunk
    if (segmentEnd <= chunkEnd) {
      if (currentChunk.text.length === 0) {
        currentChunk.start_ms = segmentStart;
      }
      currentChunk.text.push(segment.text);
      currentChunk.end_ms = segmentEnd;
    } else {
      // Save current chunk and start new one
      if (currentChunk.text.length > 0) {
        chunks.push({
          chunk_index: chunkIndex,
          chunk_text: currentChunk.text.join(' '),
          start_seconds: Math.floor(currentChunk.start_ms / 1000),
          end_seconds: Math.floor(currentChunk.end_ms / 1000),
          start_timestamp: formatTimestamp(Math.floor(currentChunk.start_ms / 1000)),
          end_timestamp: formatTimestamp(Math.floor(currentChunk.end_ms / 1000))
        });
        chunkIndex++;
      }

      // Start new chunk with current segment
      currentChunk = {
        text: [segment.text],
        start_ms: segmentStart,
        end_ms: segmentEnd
      };
    }
  }

  // Add final chunk
  if (currentChunk.text.length > 0) {
    chunks.push({
      chunk_index: chunkIndex,
      chunk_text: currentChunk.text.join(' '),
      start_seconds: Math.floor(currentChunk.start_ms / 1000),
      end_seconds: Math.floor(currentChunk.end_ms / 1000),
      start_timestamp: formatTimestamp(Math.floor(currentChunk.start_ms / 1000)),
      end_timestamp: formatTimestamp(Math.floor(currentChunk.end_ms / 1000))
    });
  }

  console.log(`   ✅ Created ${chunks.length} chunks (${CHUNK_DURATION_SECONDS}s each)`);
  return chunks;
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate embeddings for chunks
 */
async function generateEmbeddings(chunks) {
  console.log(`   🤖 Generating embeddings for ${chunks.length} chunks...`);

  const chunksWithEmbeddings = [];

  // Process in batches to avoid rate limits
  for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
    const texts = batch.map(c => c.chunk_text);

    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts
      });

      batch.forEach((chunk, idx) => {
        chunksWithEmbeddings.push({
          ...chunk,
          embedding: response.data[idx].embedding
        });
      });

      console.log(`      Progress: ${Math.min(i + EMBEDDING_BATCH_SIZE, chunks.length)}/${chunks.length} chunks`);

      // Small delay to avoid rate limiting
      if (i + EMBEDDING_BATCH_SIZE < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

    } catch (error) {
      console.error(`   ❌ Error generating embeddings for batch ${i}: ${error.message}`);
      throw error;
    }
  }

  console.log(`   ✅ Generated ${chunksWithEmbeddings.length} embeddings`);
  return chunksWithEmbeddings;
}

/**
 * Upload to Supabase
 */
async function uploadToSupabase(videoData, chunks) {
  console.log(`   💾 Uploading to Supabase...`);

  try {
    // 1. Insert video_transcript record
    // Build insert object with only the fields that exist
    const videoInsert = {
      youtube_id: videoData.videoId,
      full_transcript: videoData.segments
    };

    // Add optional fields if they likely exist
    if (videoData.title) videoInsert.title = videoData.title;
    if (videoData.creator) videoInsert.creator = videoData.creator;

    const { data: videoRecord, error: videoError } = await supabase
      .from('video_transcripts')
      .insert(videoInsert)
      .select()
      .single();

    if (videoError) {
      console.error(`   ❌ Error inserting video: ${videoError.message}`);
      throw videoError;
    }

    console.log(`      ✅ Video record created (ID: ${videoRecord.id})`);

    // 2. Insert transcript_chunks records
    const chunkRecords = chunks.map(chunk => ({
      transcript_id: videoRecord.id,
      chunk_index: chunk.chunk_index,
      chunk_text: chunk.chunk_text,
      start_seconds: chunk.start_seconds,
      end_seconds: chunk.end_seconds,
      start_timestamp: chunk.start_timestamp,
      end_timestamp: chunk.end_timestamp,
      embedding: chunk.embedding // Store as array directly (Supabase handles vector type)
    }));

    const { data: chunkData, error: chunkError } = await supabase
      .from('transcript_chunks')
      .insert(chunkRecords)
      .select();

    if (chunkError) {
      console.error(`   ❌ Error inserting chunks: ${chunkError.message}`);
      throw chunkError;
    }

    console.log(`      ✅ Inserted ${chunkData.length} chunks`);
    console.log(`   ✅ Upload complete!`);

    return { videoRecord, chunks: chunkData };

  } catch (error) {
    console.error(`   ❌ Upload error: ${error.message}`);
    throw error;
  }
}

/**
 * Process a single video through the entire pipeline
 */
async function processVideo(videoId) {
  try {
    // Step 1: Extract transcript
    const videoData = await extractTranscript(videoId);
    if (!videoData) {
      return { success: false, videoId, error: 'No transcript available' };
    }

    // Step 2: Chunk transcript
    const chunks = chunkTranscript(videoData);

    // Step 3: Generate embeddings
    const chunksWithEmbeddings = await generateEmbeddings(chunks);

    // Step 4: Upload to Supabase
    await uploadToSupabase(videoData, chunksWithEmbeddings);

    return { success: true, videoId, chunks: chunks.length };

  } catch (error) {
    console.error(`❌ Failed to process ${videoId}: ${error.message}`);
    return { success: false, videoId, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('❌ No video IDs provided');
    console.log('\nUsage:');
    console.log('  node scripts/process-videos-to-supabase.js VIDEO_ID1 VIDEO_ID2 ...');
    console.log('  node scripts/process-videos-to-supabase.js --file video-ids.txt');
    process.exit(1);
  }

  // Get video IDs from arguments or file
  let videoIds = [];
  if (args[0] === '--file') {
    const filePath = args[1];
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    videoIds = fileContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  } else {
    videoIds = args;
  }

  console.log('\n🚀 Starting Video Processing Pipeline');
  console.log('═'.repeat(60));
  console.log(`📊 Videos to process: ${videoIds.length}`);
  console.log(`⚙️  Chunk duration: ${CHUNK_DURATION_SECONDS}s`);
  console.log('═'.repeat(60));

  const results = [];

  for (const videoId of videoIds) {
    const result = await processVideo(videoId);
    results.push(result);

    // Small delay between videos
    if (videoIds.indexOf(videoId) < videoIds.length - 1) {
      console.log('\n   ⏳ Waiting 2 seconds before next video...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 PROCESSING SUMMARY');
  console.log('═'.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}/${videoIds.length}`);
  console.log(`❌ Failed: ${failed.length}/${videoIds.length}`);

  if (successful.length > 0) {
    console.log('\n✅ Successful videos:');
    successful.forEach(r => {
      console.log(`   - ${r.videoId} (${r.chunks} chunks)`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed videos:');
    failed.forEach(r => {
      console.log(`   - ${r.videoId}: ${r.error}`);
    });
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Pipeline complete!');
  console.log('═'.repeat(60) + '\n');

  process.exit(failed.length > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(2);
  });
}

module.exports = { processVideo, extractTranscript, chunkTranscript, generateEmbeddings, uploadToSupabase };
