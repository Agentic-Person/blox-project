/**
 * Diagnose Chunk Duplication
 * Check why chunks 0-2 have identical text
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function diagnoseChunkDuplication() {
  console.log('\n🔍 DIAGNOSING CHUNK DUPLICATION\n')
  console.log('='.repeat(60))

  try {
    // Get the Roblox scripting video
    const { data: video } = await supabase
      .from('video_transcripts')
      .select('id, youtube_id, title, full_transcript')
      .eq('youtube_id', 'P2ECl-mLmvY')
      .single()

    console.log(`\n📹 Video: ${video.title}\n`)

    // Get the stored chunks
    const { data: storedChunks } = await supabase
      .from('transcript_chunks')
      .select('chunk_index, chunk_text, start_seconds, end_seconds, start_timestamp, end_timestamp')
      .eq('transcript_id', video.id)
      .order('chunk_index')
      .limit(5)

    console.log('📦 STORED CHUNKS (first 5):\n')
    storedChunks.forEach(chunk => {
      console.log(`Chunk ${chunk.chunk_index}:`)
      console.log(`  Time: ${chunk.start_timestamp} - ${chunk.end_timestamp} (${chunk.start_seconds}s - ${chunk.end_seconds}s)`)
      console.log(`  Text: ${chunk.chunk_text.substring(0, 100)}...`)
      console.log('')
    })

    // Check for exact duplicates
    const texts = storedChunks.map(c => c.chunk_text)
    const uniqueTexts = [...new Set(texts)]

    console.log('='.repeat(60))
    console.log(`\nTotal chunks checked: ${texts.length}`)
    console.log(`Unique texts: ${uniqueTexts.length}`)
    console.log(`Duplicates: ${texts.length - uniqueTexts.length}\n`)

    if (texts.length !== uniqueTexts.length) {
      console.log('❌ DUPLICATES FOUND!')
      console.log('\nComparing chunks 0, 1, 2:')
      console.log(`  Chunk 0 == Chunk 1: ${texts[0] === texts[1]}`)
      console.log(`  Chunk 1 == Chunk 2: ${texts[1] === texts[2]}`)
      console.log(`  Chunk 0 == Chunk 2: ${texts[0] === texts[2]}`)
    }

    // Now test the chunking algorithm with the stored transcript
    console.log('\n' + '='.repeat(60))
    console.log('\n🧪 TESTING CHUNKING ALGORITHM\n')

    let transcript = video.full_transcript

    // Parse if string
    if (typeof transcript === 'string') {
      try {
        transcript = JSON.parse(transcript)
        console.log(`✅ Parsed transcript from JSON string`)
      } catch (e) {
        console.log(`❌ Could not parse transcript: ${e.message}`)
        return
      }
    }

    console.log(`Transcript segments: ${transcript.length}`)
    console.log(`\nFirst 3 segments from full_transcript:`)
    transcript.slice(0, 3).forEach((seg, idx) => {
      console.log(`  ${idx}. Offset: ${(parseFloat(seg.offset) / 1000).toFixed(2)}s, Duration: ${(parseFloat(seg.duration) / 1000).toFixed(2)}s`)
      console.log(`     Text: ${seg.text.substring(0, 80)}...`)
    })

    // Simulate chunking with current algorithm
    console.log('\n🔧 SIMULATING CHUNKING:\n')

    const chunkSizeSeconds = 30
    const chunks = []
    let currentChunk = {
      texts: [],
      startTime: null,
      endTime: null
    }

    let chunkCount = 0
    for (const segment of transcript) {
      const segmentStartSeconds = parseFloat(segment.offset) / 1000
      const segmentDurationSeconds = parseFloat(segment.duration) / 1000

      // Start new chunk if needed
      if (currentChunk.startTime === null || (segmentStartSeconds - currentChunk.startTime) >= chunkSizeSeconds) {
        // Save previous chunk
        if (currentChunk.texts.length > 0) {
          chunks.push({
            startTime: currentChunk.startTime,
            endTime: currentChunk.endTime,
            text: currentChunk.texts.join(' ').trim()
          })

          // Show first 3 chunks
          if (chunkCount < 3) {
            console.log(`Generated Chunk ${chunkCount}:`)
            console.log(`  Time: ${currentChunk.startTime.toFixed(2)}s - ${currentChunk.endTime.toFixed(2)}s`)
            console.log(`  Segments: ${currentChunk.texts.length}`)
            console.log(`  Text: ${currentChunk.texts.join(' ').trim().substring(0, 100)}...`)
            console.log('')
          }
          chunkCount++
        }

        // Start new chunk
        currentChunk = {
          texts: [segment.text],
          startTime: segmentStartSeconds,
          endTime: segmentStartSeconds + segmentDurationSeconds
        }
      } else {
        // Add to current chunk
        currentChunk.texts.push(segment.text)
        currentChunk.endTime = segmentStartSeconds + segmentDurationSeconds
      }
    }

    // Add last chunk
    if (currentChunk.texts.length > 0) {
      chunks.push({
        startTime: currentChunk.startTime,
        endTime: currentChunk.endTime,
        text: currentChunk.texts.join(' ').trim()
      })
    }

    console.log(`Total chunks generated: ${chunks.length}`)

    // Compare with stored
    console.log('\n' + '='.repeat(60))
    console.log('\n📊 COMPARISON:\n')

    console.log(`Stored chunks: ${storedChunks.length} (showing first 5)`)
    console.log(`Generated chunks: ${chunks.length}`)

    console.log('\nGenerated chunk 0 == Stored chunk 0:')
    console.log(`  ${chunks[0].text.substring(0, 100) === storedChunks[0].chunk_text.substring(0, 100)}`)

    console.log('\nGenerated chunks have duplicates:')
    const generatedTexts = chunks.slice(0, 5).map(c => c.text)
    const uniqueGenerated = [...new Set(generatedTexts)]
    console.log(`  First 5 chunks: ${generatedTexts.length - uniqueGenerated.length} duplicates`)

  } catch (err) {
    console.error('\n❌ Error:', err)
    console.error(err.stack)
  }

  console.log('\n' + '='.repeat(60) + '\n')
}

diagnoseChunkDuplication()
