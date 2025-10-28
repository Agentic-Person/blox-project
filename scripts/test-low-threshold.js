/**
 * Test with VERY low threshold
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function testDirect() {
  console.log('\n--- DEEP DIAGNOSTIC ---\n')

  // Check what's in transcript_chunks table
  console.log('STEP 1: Check transcript_chunks table')
  const { data: chunks } = await supabase
    .from('transcript_chunks')
    .select('id, chunk_index, chunk_text')
    .limit(2)

  console.log(`Found ${chunks?.length} sample chunks:`)
  chunks?.forEach((chunk, i) => {
    console.log(`  ${i + 1}. ${chunk.chunk_text?.substring(0, 100)}...`)
  })

  // Check video_transcripts
  console.log('\nSTEP 2: Check video_transcripts table')
  const { data: videos } = await supabase
    .from('video_transcripts')
    .select('youtube_id, title')
    .limit(3)

  console.log(`Found ${videos?.length} videos:`)
  videos?.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.title}`)
  })

  // Test with threshold 0.01
  console.log('\nSTEP 3: Test search with threshold 0.01')

  const searchQuery = "Roblox scripting"
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: searchQuery
  })

  const { data: results } = await supabase.rpc('search_transcript_chunks', {
    query_embedding: embeddingResponse.data[0].embedding,
    similarity_threshold: 0.01,
    max_results: 5
  })

  console.log(`Search returned ${results?.length || 0} results`)

  if (results && results.length > 0) {
    console.log('\nFirst result structure:')
    console.log(JSON.stringify(results[0], null, 2))
  }
}

testDirect()
