/**
 * Check Roblox Scripting Video Chunks
 * See what content is actually in the Roblox scripting video
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkRobloxScriptingChunks() {
  console.log('\n📊 CHECKING ROBLOX SCRIPTING VIDEO CHUNKS\n')
  console.log('='.repeat(60))

  try {
    // Get the scripting video
    const { data: video, error: videoError } = await supabase
      .from('video_transcripts')
      .select('id, youtube_id, title')
      .eq('youtube_id', 'P2ECl-mLmvY')  // The EASIEST Beginner Guide to Scripting (Roblox)
      .single()

    if (videoError || !video) {
      console.error('❌ Video not found:', videoError)
      return
    }

    console.log(`\n📹 Video: ${video.title}`)
    console.log(`YouTube ID: ${video.youtube_id}`)
    console.log(`Transcript ID: ${video.id}\n`)

    // Get chunks for this video
    const { data: chunks, error: chunksError } = await supabase
      .from('transcript_chunks')
      .select('*')
      .eq('transcript_id', video.id)
      .order('chunk_index')

    if (chunksError) {
      console.error('❌ Error fetching chunks:', chunksError)
      return
    }

    console.log(`Found ${chunks.length} chunks\n`)
    console.log('='.repeat(60))

    // Show first 5 chunks
    console.log('\n📝 FIRST 5 CHUNKS:\n')
    chunks.slice(0, 5).forEach((chunk, idx) => {
      console.log(`Chunk ${chunk.chunk_index}:`)
      console.log(`  Time: ${chunk.start_timestamp} - ${chunk.end_timestamp}`)
      console.log(`  Has embedding: ${chunk.embedding ? 'YES' : 'NO'}`)
      console.log(`  Text: ${chunk.chunk_text.substring(0, 200)}...`)
      console.log('')
    })

    // Check embedding status
    const withEmbeddings = chunks.filter(c => c.embedding !== null).length
    const withoutEmbeddings = chunks.filter(c => c.embedding === null).length

    console.log('='.repeat(60))
    console.log('\n📊 EMBEDDING STATUS:')
    console.log(`   Total chunks: ${chunks.length}`)
    console.log(`   With embeddings: ${withEmbeddings}`)
    console.log(`   Without embeddings: ${withoutEmbeddings}`)

    if (withoutEmbeddings > 0) {
      console.log('\n⚠️  PROBLEM: Some chunks are missing embeddings!')
      console.log('   This is why the search is not finding this video.')
    } else {
      console.log('\n✅ All chunks have embeddings.')
      console.log('   The problem must be with the embedding quality or content.')
    }

    // Show a sample embedding
    const chunkWithEmbedding = chunks.find(c => c.embedding !== null)
    if (chunkWithEmbedding) {
      console.log(`\n🔢 Sample Embedding (first 10 values):`)
      const embedding = chunkWithEmbedding.embedding
      if (Array.isArray(embedding)) {
        console.log(`   ${embedding.slice(0, 10).join(', ')}...`)
        console.log(`   Total dimensions: ${embedding.length}`)
      } else {
        console.log(`   Type: ${typeof embedding}`)
        console.log(`   Value: ${JSON.stringify(embedding).substring(0, 100)}...`)
      }
    }

  } catch (err) {
    console.error('\n❌ Error:', err)
    console.error(err.stack)
  }

  console.log('\n' + '='.repeat(60) + '\n')
}

checkRobloxScriptingChunks()
