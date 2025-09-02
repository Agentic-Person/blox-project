// Test vector search functionality
const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Mock embedding generation (in production, this would call OpenAI)
async function generateMockEmbedding(text) {
  // Create a deterministic embedding based on text content
  const hash = text.toLowerCase().split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  // Generate 1536 dimensional embedding with some patterns based on content
  return Array.from({ length: 1536 }, (_, i) => {
    const value = Math.sin(hash * i * 0.001) * 0.5
    return Math.max(-1, Math.min(1, value + (Math.random() - 0.5) * 0.1))
  })
}

// Test basic search functionality
async function testBasicSearch() {
  console.log('🔍 Testing basic vector search...')
  
  try {
    // Generate query embedding
    const query = "how to create parts in Roblox Studio"
    console.log(`Query: "${query}"`)
    
    const queryEmbedding = await generateMockEmbedding(query)
    
    // Perform vector search
    const { data, error } = await supabase
      .rpc('search_transcript_chunks', {
        query_embedding: queryEmbedding,
        similarity_threshold: 0.1, // Lower threshold for testing
        max_results: 10
      })
    
    if (error) {
      throw new Error(`Search failed: ${error.message}`)
    }
    
    console.log(`✅ Found ${data?.length || 0} results`)
    
    if (data && data.length > 0) {
      console.log('\n📋 Top Results:')
      data.slice(0, 3).forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.title}`)
        console.log(`   Creator: ${result.creator}`)
        console.log(`   Time: ${result.start_timestamp}-${result.end_timestamp}`)
        console.log(`   Score: ${result.similarity_score.toFixed(4)}`)
        console.log(`   Text: ${result.chunk_text.substring(0, 150)}...`)
      })
    }
    
    return { success: true, resultCount: data?.length || 0 }
    
  } catch (error) {
    console.error('❌ Basic search failed:', error.message)
    return { success: false, error: error.message }
  }
}

// Test different query types
async function testQueryTypes() {
  console.log('\n🎯 Testing different query types...')
  
  const testQueries = [
    "scripting in Roblox",
    "how to build parts",
    "creating GUIs", 
    "variables and functions",
    "materials and textures"
  ]
  
  const results = []
  
  for (const query of testQueries) {
    try {
      console.log(`\n🔍 Testing: "${query}"`)
      
      const queryEmbedding = await generateMockEmbedding(query)
      
      const { data, error } = await supabase
        .rpc('search_transcript_chunks', {
          query_embedding: queryEmbedding,
          similarity_threshold: 0.1,
          max_results: 3
        })
      
      if (error) {
        console.error(`   ❌ Error: ${error.message}`)
        results.push({ query, success: false, error: error.message })
      } else {
        console.log(`   ✅ Found ${data?.length || 0} results`)
        if (data && data.length > 0) {
          console.log(`   Top result: ${data[0].title} (${data[0].similarity_score.toFixed(4)})`)
        }
        results.push({ query, success: true, resultCount: data?.length || 0 })
      }
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`)
      results.push({ query, success: false, error: error.message })
    }
  }
  
  return results
}

// Test database stats
async function testDatabaseStats() {
  console.log('\n📊 Testing database statistics...')
  
  try {
    const [videosResult, chunksResult] = await Promise.all([
      supabase.from('video_transcripts').select('id, title, creator'),
      supabase.from('transcript_chunks').select('id, chunk_index')
    ])
    
    console.log(`✅ Videos in database: ${videosResult.data?.length || 0}`)
    console.log(`✅ Chunks in database: ${chunksResult.data?.length || 0}`)
    
    if (videosResult.data && videosResult.data.length > 0) {
      console.log('\n📹 Available Videos:')
      videosResult.data.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title} by ${video.creator}`)
      })
    }
    
    return {
      videoCount: videosResult.data?.length || 0,
      chunkCount: chunksResult.data?.length || 0
    }
    
  } catch (error) {
    console.error('❌ Database stats failed:', error.message)
    return { videoCount: 0, chunkCount: 0, error: error.message }
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Vector Search Tests\n')
  
  try {
    // Test database stats
    const stats = await testDatabaseStats()
    
    if (stats.videoCount === 0) {
      console.log('\n❌ No videos found in database!')
      console.log('Run "node scripts/create-sample-data.js" first.')
      return
    }
    
    // Test basic search
    const basicResult = await testBasicSearch()
    
    // Test different queries
    const queryResults = await testQueryTypes()
    
    // Summary
    console.log('\n🎉 Test Summary:')
    console.log(`📊 Database: ${stats.videoCount} videos, ${stats.chunkCount} chunks`)
    console.log(`🔍 Basic search: ${basicResult.success ? '✅ PASS' : '❌ FAIL'}`)
    
    const successfulQueries = queryResults.filter(r => r.success).length
    console.log(`🎯 Query tests: ${successfulQueries}/${queryResults.length} passed`)
    
    if (basicResult.success && successfulQueries > 0) {
      console.log('\n✅ Vector search is working! Ready for Chat API integration.')
    } else {
      console.log('\n⚠️  Some tests failed. Check the logs above.')
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error)
  }
}

if (require.main === module) {
  runTests()
}