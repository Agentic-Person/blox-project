// JavaScript version of transcript processor for immediate use
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const { YoutubeTranscript } = require('youtube-transcript')

// Load environment
require('dotenv').config({ path: '.env' })

const openaiApiKey = process.env.OPENAI_API_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!openaiApiKey || !supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Simple OpenAI API call for embeddings
async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.trim()
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

// Convert seconds to MM:SS format
function secondsToTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Create text chunks with overlap
function createChunks(segments) {
  const chunks = []
  let currentText = ''
  let currentStartTime = 0
  let currentStartTimestamp = '0:00'
  let chunkIndex = 0
  const CHUNK_SIZE = 500 * 4 // Rough: 1 token ≈ 4 characters
  const OVERLAP_SIZE = 100 * 4

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const newText = currentText ? `${currentText} ${segment.text}` : segment.text

    if (newText.length >= CHUNK_SIZE && currentText) {
      // Create chunk
      chunks.push({
        text: currentText,
        chunkIndex,
        startTime: currentStartTime,
        endTime: segment.offset,
        startTimestamp: currentStartTimestamp,
        endTimestamp: secondsToTimestamp(segment.offset)
      })

      // Start new chunk with overlap
      const overlapText = currentText.length <= OVERLAP_SIZE 
        ? currentText 
        : currentText.slice(-OVERLAP_SIZE)
      
      currentText = overlapText + ' ' + segment.text
      currentStartTime = segment.offset
      currentStartTimestamp = secondsToTimestamp(segment.offset)
      chunkIndex++
    } else {
      if (!currentText) {
        currentStartTime = segment.offset
        currentStartTimestamp = secondsToTimestamp(segment.offset)
      }
      currentText = newText
    }
  }

  // Add final chunk
  if (currentText) {
    const lastSegment = segments[segments.length - 1]
    chunks.push({
      text: currentText,
      chunkIndex,
      startTime: currentStartTime,
      endTime: lastSegment.offset + (lastSegment.duration || 0),
      startTimestamp: currentStartTimestamp,
      endTimestamp: secondsToTimestamp(lastSegment.offset + (lastSegment.duration || 0))
    })
  }

  return chunks
}

// Process a single video
async function processVideo(video) {
  console.log(`🎥 Processing: ${video.title} (${video.youtubeId})`)
  
  try {
    // Check if already processed
    const { data: existing } = await supabase
      .from('video_transcripts')
      .select('id')
      .eq('youtube_id', video.youtubeId)
      .single()

    if (existing) {
      console.log(`✅ Already processed: ${video.youtubeId}`)
      return { success: true, chunks: 0, cached: true }
    }

    // Fetch transcript
    console.log(`🔍 Fetching transcript for ${video.youtubeId}`)
    const transcript = await YoutubeTranscript.fetchTranscript(video.youtubeId)
    
    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript available')
    }

    console.log(`📝 Found ${transcript.length} transcript segments`)

    // Convert to structured format and create full transcript
    const fullTranscript = transcript.map(item => item.text).join(' ')
    const transcriptJson = transcript.map(item => ({
      text: item.text.trim(),
      startTime: item.offset || 0,
      duration: item.duration || 0,
      timestamp: secondsToTimestamp(item.offset || 0)
    }))

    // Create chunks
    const chunks = createChunks(transcript)
    console.log(`📦 Created ${chunks.length} chunks`)

    // Store video transcript
    const { data: videoRecord, error: videoError } = await supabase
      .from('video_transcripts')
      .insert({
        video_id: video.id,
        youtube_id: video.youtubeId,
        title: video.title,
        creator: video.creator,
        full_transcript: fullTranscript,
        transcript_json: transcriptJson,
        processed_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (videoError) {
      throw new Error(`Failed to store video: ${videoError.message}`)
    }

    const transcriptId = videoRecord.id
    console.log(`💾 Stored video record: ${transcriptId}`)

    // Process chunks with embeddings
    let chunksProcessed = 0
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      try {
        console.log(`🔮 Generating embedding for chunk ${i + 1}/${chunks.length}`)
        const embedding = await generateEmbedding(chunk.text)
        
        const { error: chunkError } = await supabase
          .from('transcript_chunks')
          .insert({
            transcript_id: transcriptId,
            chunk_text: chunk.text,
            chunk_index: chunk.chunkIndex,
            start_timestamp: chunk.startTimestamp,
            end_timestamp: chunk.endTimestamp,
            start_seconds: Math.round(chunk.startTime),
            end_seconds: Math.round(chunk.endTime),
            embedding: embedding
          })

        if (chunkError) {
          console.warn(`⚠️  Failed to store chunk ${i}: ${chunkError.message}`)
        } else {
          chunksProcessed++
        }

        // Brief pause to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }

      } catch (error) {
        console.warn(`⚠️  Failed to process chunk ${i}: ${error.message}`)
      }
    }

    console.log(`✅ Successfully processed ${video.youtubeId} - ${chunksProcessed}/${chunks.length} chunks stored`)
    
    return { 
      success: true, 
      chunks: chunksProcessed,
      cached: false 
    }

  } catch (error) {
    console.error(`❌ Failed to process ${video.youtubeId}: ${error.message}`)
    return { 
      success: false, 
      chunks: 0,
      error: error.message 
    }
  }
}

// Main processing function
async function main() {
  try {
    console.log('🚀 Starting Module 1 Transcript Processing')
    
    // Load video list
    const videoListPath = path.join(__dirname, 'module1-week12-videos.json')
    const videos = JSON.parse(fs.readFileSync(videoListPath, 'utf8'))
    
    console.log(`📋 Processing ${videos.length} videos`)
    console.log(`💰 Estimated cost: $${(videos.length * 0.05).toFixed(2)} USD`)
    
    // Process in batches to avoid overwhelming the APIs
    const BATCH_SIZE = 3
    const results = []
    
    for (let i = 0; i < videos.length; i += BATCH_SIZE) {
      const batch = videos.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(videos.length / BATCH_SIZE)
      
      console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} videos)`)
      
      // Process batch sequentially to be gentle on APIs
      for (const video of batch) {
        const result = await processVideo(video)
        results.push({ video: video.title, ...result })
      }
      
      // Pause between batches
      if (i + BATCH_SIZE < videos.length) {
        console.log('⏳ Pausing 5 seconds between batches...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
    
    // Summary
    const successful = results.filter(r => r.success).length
    const totalChunks = results.reduce((sum, r) => sum + r.chunks, 0)
    const cached = results.filter(r => r.cached).length
    
    console.log('\n🎉 Processing Complete!')
    console.log(`✅ Successful: ${successful}/${videos.length}`)
    console.log(`🔄 Cached (already processed): ${cached}`)
    console.log(`📊 Total chunks created: ${totalChunks}`)
    
    // Save results
    const resultsPath = path.join(__dirname, 'processing-results.json')
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalVideos: videos.length,
      successful,
      totalChunks,
      results
    }, null, 2))
    
    console.log(`💾 Results saved to: ${resultsPath}`)
    
    if (successful > 0) {
      console.log('\n🎯 Ready for next steps:')
      console.log('1. Test vector search functionality')
      console.log('2. Update Chat API to use real data')
      console.log('3. Create frontend chat component')
    }
    
  } catch (error) {
    console.error('💥 Processing failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}