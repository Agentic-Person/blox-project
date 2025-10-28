/**
 * Test Search with Very Low Threshold
 * See what the search returns even with very low similarity
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

async function testSearchLowThreshold() {
  console.log('\n🔍 TESTING SEARCH WITH LOW THRESHOLD (0.01)\n')
  console.log('='.repeat(60))

  try {
    // Test query about Roblox scripting
    const searchQuery = "How do I learn Roblox scripting for beginners?"
    console.log(`\n📝 Query: "${searchQuery}"`)

    // Generate embedding
    console.log('\n⏳ Generating embedding...')
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: searchQuery.replace(/\n/g, ' ').trim()
    })

    const queryEmbedding = embeddingResponse.data[0].embedding
    console.log(`✅ Embedding generated: ${queryEmbedding.length} dimensions`)

    // Search with very low threshold
    console.log('\n⏳ Searching with threshold 0.01...')
    const { data, error } = await supabase.rpc('search_transcript_chunks', {
      query_embedding: queryEmbedding,
      similarity_threshold: 0.01,
      max_results: 10
    })

    if (error) {
      console.error('\n❌ Search failed:', error)
      return
    }

    console.log(`\n✅ Found ${data?.length || 0} results\n`)

    if (data && data.length > 0) {
      console.log('📊 TOP RESULTS:\n')
      data.forEach((result, index) => {
        console.log(`${index + 1}. "${result.title}"`)
        console.log(`   Similarity: ${(result.similarity_score * 100).toFixed(2)}%`)
        console.log(`   YouTube ID: ${result.youtube_id}`)
        console.log(`   Chunk ${result.chunk_index}: ${result.start_timestamp} - ${result.end_timestamp}`)
        console.log(`   Text: ${result.chunk_text.substring(0, 150)}...`)
        console.log('')
      })

      // Analyze what videos matched
      const uniqueVideos = [...new Set(data.map(r => r.title))]
      console.log('='.repeat(60))
      console.log(`\n📹 Unique Videos Matched: ${uniqueVideos.length}`)
      uniqueVideos.forEach((title, idx) => {
        const chunks = data.filter(r => r.title === title).length
        const avgSimilarity = data
          .filter(r => r.title === title)
          .reduce((sum, r) => sum + r.similarity_score, 0) / chunks
        console.log(`   ${idx + 1}. ${title}`)
        console.log(`      Chunks: ${chunks}, Avg Similarity: ${(avgSimilarity * 100).toFixed(2)}%`)
      })

      // Check if any Roblox videos matched
      const robloxMatches = data.filter(r => r.title.toLowerCase().includes('roblox'))
      console.log(`\n🎮 Roblox Video Matches: ${robloxMatches.length}`)
      if (robloxMatches.length > 0) {
        console.log('   ✅ Roblox videos are being found!')
      } else {
        console.log('   ❌ No Roblox videos matched (this is the problem!)')
      }

    } else {
      console.log('⚠️  No results even at 0.01 threshold!')
      console.log('This suggests a serious issue with the search function or embeddings.')
    }

  } catch (err) {
    console.error('\n❌ Error:', err)
    console.error(err.stack)
  }

  console.log('\n' + '='.repeat(60) + '\n')
}

testSearchLowThreshold()
