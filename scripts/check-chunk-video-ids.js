/**
 * Check what video IDs the chunks are using
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkChunkVideoIds() {
  console.log('\n--- CHECKING CHUNK VIDEO IDS ---\n')

  // Get unique video IDs from chunks
  const { data: chunks } = await supabase
    .from('transcript_chunks')
    .select('video_id')
    .not('embedding', 'is', null)

  const uniqueVideoIds = [...new Set(chunks?.map(c => c.video_id))]

  console.log(`Total chunks with embeddings: ${chunks?.length}`)
  console.log(`Unique video IDs in chunks: ${uniqueVideoIds.length}`)
  console.log('\nVideo IDs found in chunks:')
  uniqueVideoIds.forEach(id => console.log(`  - ${id}`))

  // Now check if these match video_transcripts
  console.log('\n--- CHECKING IF CHUNKS MATCH video_transcripts ---\n')

  for (const videoId of uniqueVideoIds) {
    const { data: video } = await supabase
      .from('video_transcripts')
      .select('youtube_id, title')
      .eq('youtube_id', videoId)
      .single()

    if (video) {
      console.log(`MATCH: ${videoId}`)
      console.log(`  Title: ${video.title}`)
    } else {
      console.log(`NO MATCH: ${videoId}`)
      console.log(`  This video_id exists in chunks but NOT in video_transcripts!`)
    }
    console.log('')
  }

  // Get sample chunk data
  console.log('--- SAMPLE CHUNK DATA ---\n')
  const { data: sample } = await supabase
    .from('transcript_chunks')
    .select('*')
    .not('embedding', 'is', null)
    .limit(3)

  sample?.forEach((chunk, i) => {
    console.log(`Chunk ${i + 1}:`)
    console.log(`  ID: ${chunk.id}`)
    console.log(`  video_id: ${chunk.video_id}`)
    console.log(`  transcript_id: ${chunk.transcript_id}`)
    console.log(`  Text: ${chunk.chunk_text?.substring(0, 80)}...`)
    console.log('')
  })
}

checkChunkVideoIds()
