/**
 * Test Specific Queries
 * Try different queries to see which ones match Roblox videos
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

async function testQuery(query, threshold = 0.15) {
  console.log(`\n📝 Query: "${query}"`)
  console.log(`   Threshold: ${(threshold * 100).toFixed(0)}%`)

  // Generate embedding
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query.replace(/\n/g, ' ').trim()
  })

  const queryEmbedding = embeddingResponse.data[0].embedding

  // Search
  const { data, error } = await supabase.rpc('search_transcript_chunks', {
    query_embedding: queryEmbedding,
    similarity_threshold: threshold,
    max_results: 5
  })

  if (error) {
    console.error('   ❌ Error:', error.message)
    return
  }

  console.log(`   Results: ${data?.length || 0}`)

  if (data && data.length > 0) {
    data.forEach((result, index) => {
      const isRoblox = result.title.toLowerCase().includes('roblox')
      const prefix = isRoblox ? '   🎮' : '   🔷'
      console.log(`${prefix} ${index + 1}. ${result.title} (${(result.similarity_score * 100).toFixed(1)}%)`)
    })
  } else {
    console.log('   No results')
  }
}

async function testSpecificQueries() {
  console.log('\n🔍 TESTING DIFFERENT QUERIES\n')
  console.log('='.repeat(60))

  try {
    await testQuery('How do I create a new part in Roblox scripting?', 0.15)
    await testQuery('Learn Roblox game development', 0.15)
    await testQuery('Roblox Studio tutorial for beginners', 0.15)
    await testQuery('How to make a game in Roblox', 0.15)
    await testQuery('instance new part in Lua', 0.15)
    await testQuery('studio workspace parenting objects', 0.15)

    console.log('\n' + '='.repeat(60))
    console.log('\n📊 KEY OBSERVATIONS:\n')
    console.log('   🎮 = Roblox video')
    console.log('   🔷 = Blender video')
    console.log('\nIf Blender videos consistently rank higher than Roblox videos,')
    console.log('there may be an issue with how the embeddings were generated.')

  } catch (err) {
    console.error('\n❌ Error:', err)
    console.error(err.stack)
  }

  console.log('\n' + '='.repeat(60) + '\n')
}

testSpecificQueries()
