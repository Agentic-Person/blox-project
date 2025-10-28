/**
 * Test Actual Search with Real Embedding
 * This will show us exactly what columns the search function returns
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

async function testRealSearch() {
  console.log('\n🔍 TESTING REAL SEARCH WITH ACTUAL EMBEDDING\n')
  console.log('='.repeat(60))

  try {
    // Step 1: Generate embedding for a Roblox scripting query
    const searchQuery = "How do I learn Roblox scripting for beginners?"
    console.log(`\n📝 Query: "${searchQuery}"`)

    console.log('\n⏳ Generating embedding with OpenAI...')
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: searchQuery.replace(/\n/g, ' ').trim()
    })

    const queryEmbedding = embeddingResponse.data[0].embedding
    console.log(`✅ Embedding generated: ${queryEmbedding.length} dimensions`)

    // Step 2: Call the search function
    console.log('\n⏳ Calling search_transcript_chunks()...')
    const { data, error } = await supabase.rpc('search_transcript_chunks', {
      query_embedding: queryEmbedding,
      similarity_threshold: 0.3,
      max_results: 5
    })

    if (error) {
      console.error('\n❌ Search failed:', error)
      console.error('Code:', error.code)
      console.error('Message:', error.message)
      console.error('Details:', error.details)
      return
    }

    console.log(`\n✅ Search returned ${data?.length || 0} results`)

    // Step 3: Show the exact structure
    if (data && data.length > 0) {
      console.log('\n📊 RESULT STRUCTURE (showing first result):')
      console.log('='.repeat(60))
      console.log('\nActual columns returned:')
      console.log(Object.keys(data[0]))

      console.log('\n\nFirst Result Detail:')
      console.log(JSON.stringify(data[0], null, 2))

      // Show all results summary
      console.log('\n\n📋 All Results Summary:')
      data.forEach((result, index) => {
        console.log(`\n  ${index + 1}. Chunk #${result.chunk_index || result.chunk_id}`)
        console.log(`     Text: ${(result.chunk_text || result.text || '').substring(0, 100)}...`)
        console.log(`     Start: ${result.start_seconds || result.start_timestamp || result.start_time}`)
        console.log(`     End: ${result.end_seconds || result.end_timestamp || result.end_time}`)
        console.log(`     YouTube ID: ${result.youtube_id || 'N/A'}`)
        console.log(`     Title: ${result.title || result.video_title || 'N/A'}`)
        console.log(`     Similarity: ${result.similarity || result.similarity_score || 'N/A'}`)
      })
    } else {
      console.log('\n⚠️ No results returned!')
      console.log('This means the search found no matches above the 0.3 threshold.')
      console.log('Try:')
      console.log('  1. Lowering the threshold even more (0.1)')
      console.log('  2. Using a different query')
      console.log('  3. Checking if embeddings are generated correctly')
    }

  } catch (err) {
    console.error('\n❌ Error during test:', err)
    console.error(err.stack)
  }

  console.log('\n' + '='.repeat(60) + '\n')
}

testRealSearch()
