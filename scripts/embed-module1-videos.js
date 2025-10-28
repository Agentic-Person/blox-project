/**
 * Embed Module 1 Videos
 * Extracts transcripts and creates chunks for missing Module 1 videos
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { YoutubeTranscript } = require('youtube-transcript')
const curriculum = require('../src/data/curriculum.json')
const { verifyModule1Coverage } = require('./verify-module1-coverage')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Configuration
const CHUNK_SIZE_SECONDS = 30
const DELAY_BETWEEN_VIDEOS = 2000 // 2 seconds to avoid rate limiting

/**
 * Fetch transcript for a video
 */
async function fetchTranscript(youtubeId, title, retries = 3) {
  try {
    console.log(`  📥 Fetching transcript...`)
    const transcript = await YoutubeTranscript.fetchTranscript(youtubeId)

    if (!transcript || transcript.length === 0) {
      console.log(`  ⚠️  No transcript available`)
      return null
    }

    console.log(`  ✅ Got ${transcript.length} segments`)
    return transcript
  } catch (error) {
    if (retries > 0 && !error.message.includes('Transcript is disabled')) {
      console.log(`  ⚠️  Retrying... (${retries} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return fetchTranscript(youtubeId, title, retries - 1)
    }

    console.log(`  ❌ Failed: ${error.message}`)
    return null
  }
}

/**
 * Chunk transcript into 30-second segments
 */
function chunkTranscript(transcript, chunkSizeSeconds = CHUNK_SIZE_SECONDS) {
  if (!transcript || !Array.isArray(transcript)) {
    return []
  }

  const chunks = []
  let currentChunk = {
    texts: [],
    startTime: null,
    endTime: null,
    startTimestamp: null,
    endTimestamp: null
  }

  for (const segment of transcript) {
    const segmentStartSeconds = parseFloat(segment.offset) / 1000
    const segmentDurationSeconds = parseFloat(segment.duration) / 1000

    // Start new chunk if needed
    if (currentChunk.startTime === null || (segmentStartSeconds - currentChunk.startTime) >= chunkSizeSeconds) {
      // Save previous chunk
      if (currentChunk.texts.length > 0) {
        chunks.push({
          startSeconds: currentChunk.startTime,
          endSeconds: currentChunk.endTime,
          startTimestamp: formatTimestamp(currentChunk.startTime),
          endTimestamp: formatTimestamp(currentChunk.endTime),
          text: currentChunk.texts.join(' ').trim()
        })
      }

      // Start new chunk
      currentChunk = {
        texts: [segment.text],
        startTime: segmentStartSeconds,
        endTime: segmentStartSeconds + segmentDurationSeconds,
        startTimestamp: formatTimestamp(segmentStartSeconds),
        endTimestamp: formatTimestamp(segmentStartSeconds + segmentDurationSeconds)
      }
    } else {
      // Add to current chunk
      currentChunk.texts.push(segment.text)
      currentChunk.endTime = segmentStartSeconds + segmentDurationSeconds
      currentChunk.endTimestamp = formatTimestamp(segmentStartSeconds + segmentDurationSeconds)
    }
  }

  // Add the last chunk
  if (currentChunk.texts.length > 0) {
    chunks.push({
      startSeconds: currentChunk.startTime,
      endSeconds: currentChunk.endTime,
      startTimestamp: formatTimestamp(currentChunk.startTime),
      endTimestamp: formatTimestamp(currentChunk.endTime),
      text: currentChunk.texts.join(' ').trim()
    })
  }

  return chunks
}

/**
 * Format seconds to timestamp (MM:SS)
 */
function formatTimestamp(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Convert timestamp to seconds
 */
function timestampToSeconds(timestamp) {
  const parts = timestamp.split(':')
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1])
  } else if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
  }
  return 0
}

/**
 * Store video transcript and chunks in database
 */
async function storeVideoTranscript(video, transcript, chunks) {
  try {
    console.log(`  💾 Storing in database...`)

    // Calculate duration from the video object or transcript
    const durationSeconds = video.duration
      ? timestampToSeconds(video.duration)
      : transcript[transcript.length - 1]
        ? Math.floor(parseFloat(transcript[transcript.length - 1].offset) / 1000)
        : 0

    // 1. Insert or update video_transcripts record
    const transcriptRecord = {
      youtube_id: video.youtubeId,
      title: video.title,
      creator: video.creator || 'Unknown',
      duration_seconds: durationSeconds,
      full_transcript: transcript,
      created_at: new Date().toISOString()
    }

    const { data: transcriptData, error: transcriptError } = await supabase
      .from('video_transcripts')
      .upsert(transcriptRecord, {
        onConflict: 'youtube_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (transcriptError) {
      console.error(`  ❌ Error storing transcript:`, transcriptError.message)
      return { success: false, error: transcriptError }
    }

    const transcriptId = transcriptData.id

    console.log(`  ✅ Transcript stored (ID: ${transcriptId})`)

    // 2. Insert chunks
    const chunkRecords = chunks.map((chunk, index) => ({
      transcript_id: transcriptId,
      video_id: video.youtubeId, // Store YouTube ID for compatibility
      chunk_index: index,
      chunk_text: chunk.text,
      start_timestamp: chunk.startTimestamp,
      end_timestamp: chunk.endTimestamp,
      start_seconds: chunk.startSeconds,
      end_seconds: chunk.endSeconds,
      created_at: new Date().toISOString()
    }))

    // Delete existing chunks for this transcript first (in case of re-run)
    await supabase
      .from('transcript_chunks')
      .delete()
      .eq('transcript_id', transcriptId)

    // Insert new chunks in batches
    const BATCH_SIZE = 50
    let totalInserted = 0

    for (let i = 0; i < chunkRecords.length; i += BATCH_SIZE) {
      const batch = chunkRecords.slice(i, i + BATCH_SIZE)

      const { data: chunkData, error: chunkError } = await supabase
        .from('transcript_chunks')
        .insert(batch)
        .select()

      if (chunkError) {
        console.error(`  ❌ Error storing chunks (batch ${Math.floor(i/BATCH_SIZE) + 1}):`, chunkError.message)
        continue
      }

      totalInserted += chunkData.length
    }

    console.log(`  ✅ Stored ${totalInserted} chunks`)

    return {
      success: true,
      transcriptId,
      chunksCreated: totalInserted
    }

  } catch (error) {
    console.error(`  ❌ Storage error:`, error.message)
    return { success: false, error }
  }
}

/**
 * Process a single video
 */
async function processVideo(video, index, total) {
  console.log(`\n[${ index + 1}/${total}] ${video.title}`)
  console.log(`  YouTube ID: ${video.youtubeId}`)
  console.log(`  Location: ${video.location}`)

  // Skip placeholder IDs
  if (video.youtubeId.includes('PLACEHOLDER')) {
    console.log(`  ⏭️  Skipping (placeholder ID)`)
    return { skipped: true, reason: 'placeholder' }
  }

  // Fetch transcript
  const transcript = await fetchTranscript(video.youtubeId, video.title)

  if (!transcript) {
    return { failed: true, reason: 'no transcript' }
  }

  // Chunk transcript
  const chunks = chunkTranscript(transcript)
  console.log(`  📦 Created ${chunks.length} chunks`)

  // Store in database
  const result = await storeVideoTranscript(video, transcript, chunks)

  if (result.success) {
    return {
      success: true,
      transcriptId: result.transcriptId,
      chunksCreated: result.chunksCreated
    }
  } else {
    return { failed: true, reason: 'storage error', error: result.error }
  }
}

/**
 * Main function
 */
async function embedModule1Videos() {
  console.log('\n╔════════════════════════════════════════╗')
  console.log('║   EMBED MODULE 1 VIDEOS                ║')
  console.log('╚════════════════════════════════════════╝\n')

  // Get missing videos
  console.log('Step 1: Checking which videos are missing...\n')
  const coverage = await verifyModule1Coverage()

  if (!coverage || coverage.missing === 0) {
    console.log('\n✅ All Module 1 videos are already in the database!')
    console.log('💡 Run: node scripts/generate-transcript-embeddings.js')
    console.log('   to generate embeddings for the chunks\n')
    return
  }

  const missingVideos = coverage.missingVideos.filter(v => !v.youtubeId.includes('PLACEHOLDER'))
  const totalToProcess = missingVideos.length

  console.log(`\n═══════════════════════════════════════\n`)
  console.log(`Step 2: Processing ${totalToProcess} videos...\n`)

  const stats = {
    success: 0,
    failed: 0,
    skipped: 0,
    totalChunks: 0
  }

  // Process each video
  for (let i = 0; i < missingVideos.length; i++) {
    const video = missingVideos[i]
    const result = await processVideo(video, i, totalToProcess)

    if (result.success) {
      stats.success++
      stats.totalChunks += result.chunksCreated
    } else if (result.skipped) {
      stats.skipped++
    } else {
      stats.failed++
    }

    // Delay between videos to avoid rate limiting
    if (i < missingVideos.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_VIDEOS))
    }
  }

  // Summary
  console.log(`\n═══════════════════════════════════════\n`)
  console.log('📊 PROCESSING COMPLETE!\n')
  console.log(`   Videos processed: ${totalToProcess}`)
  console.log(`   ✅ Success: ${stats.success}`)
  console.log(`   ❌ Failed: ${stats.failed}`)
  console.log(`   ⏭️  Skipped: ${stats.skipped}`)
  console.log(`   📦 Total chunks created: ${stats.totalChunks}`)
  console.log('')

  if (stats.success > 0) {
    console.log('💡 NEXT STEPS:')
    console.log('   1. Generate embeddings:')
    console.log('      node scripts/generate-transcript-embeddings.js')
    console.log('')
    console.log('   2. Verify coverage:')
    console.log('      node scripts/verify-module1-coverage.js')
    console.log('')
  }
}

// Run if called directly
if (require.main === module) {
  embedModule1Videos()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Script failed:', error.message)
      console.error(error.stack)
      process.exit(1)
    })
}

module.exports = { embedModule1Videos, fetchTranscript, chunkTranscript }
