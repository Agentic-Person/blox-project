/**
 * Test Database Connection and Video Search
 *
 * This script tests the Supabase connection and checks what data actually exists
 * Run with: node scripts/test-database-connection.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('\n🔍 BLOX WIZARD DATABASE DIAGNOSTICS\n')
console.log('='.repeat(60))

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌')
  process.exit(1)
}

console.log(`\n✅ Supabase URL: ${supabaseUrl}`)
console.log(`✅ Supabase Key: ${supabaseKey.substring(0, 20)}...`)

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('\n📊 PART 1: Checking Tables')
  console.log('='.repeat(60))

  const tables = [
    'transcript_chunks',
    'video_transcript_chunks',
    'videos',
    'video_transcripts'
  ]

  for (const tableName of tables) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ ${tableName}: Does not exist or no access`)
        console.log(`   Error: ${error.message}`)
      } else {
        console.log(`✅ ${tableName}: Exists with ${count} records`)
      }
    } catch (err) {
      console.log(`❌ ${tableName}: Error - ${err.message}`)
    }
  }
}

async function checkVideos() {
  console.log('\n🎥 PART 2: Checking Videos Table')
  console.log('='.repeat(60))

  try {
    // Check total videos
    const { count: totalCount, error: countError } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.log('❌ Cannot access videos table:', countError.message)
      return
    }

    console.log(`\n📈 Total videos: ${totalCount}`)

    // Get Module 1 videos
    const { data: module1Videos, error: module1Error } = await supabase
      .from('videos')
      .select('youtube_id, title, module_id, week_id, day_id')
      .eq('module_id', 'module-1')
      .order('order_index')
      .limit(10)

    if (module1Error) {
      console.log('❌ Error fetching Module 1 videos:', module1Error.message)
      return
    }

    console.log(`\n📚 Module 1 videos (first 10):`)
    module1Videos?.forEach((video, index) => {
      console.log(`   ${index + 1}. ${video.title}`)
      console.log(`      ${video.module_id} → ${video.week_id} → ${video.day_id}`)
    })

    // Check for "Beginner Guide to Roblox Scripting"
    const { data: scriptingVideo, error: scriptingError } = await supabase
      .from('videos')
      .select('*')
      .ilike('title', '%Roblox%Scripting%')
      .limit(1)

    if (scriptingVideo && scriptingVideo.length > 0) {
      console.log(`\n✅ FOUND: "${scriptingVideo[0].title}"`)
    } else {
      console.log(`\n❌ NOT FOUND: "Beginner Guide to Roblox Scripting"`)
    }
  } catch (err) {
    console.log('❌ Error checking videos:', err.message)
  }
}

async function checkTranscriptChunks() {
  console.log('\n📝 PART 3: Checking Transcript Chunks')
  console.log('='.repeat(60))

  // Try old schema first
  try {
    const { count, error } = await supabase
      .from('transcript_chunks')
      .select('*', { count: 'exact', head: true })

    if (!error) {
      console.log(`\n✅ OLD SCHEMA (transcript_chunks): ${count} total chunks`)

      // Check embeddings
      const { count: embeddingCount } = await supabase
        .from('transcript_chunks')
        .select('*', { count: 'exact', head: true })
        .not('embedding', 'is', null)

      console.log(`   └─ ${embeddingCount} chunks have embeddings`)
      console.log(`   └─ ${count - embeddingCount} chunks missing embeddings`)

      // Get sample
      const { data: sample } = await supabase
        .from('transcript_chunks')
        .select('chunk_index, chunk_text')
        .limit(1)

      if (sample && sample.length > 0) {
        console.log(`\n   Sample chunk:`)
        console.log(`   └─ Index: ${sample[0].chunk_index}`)
        console.log(`   └─ Text: ${sample[0].chunk_text?.substring(0, 80)}...`)
      }
    } else {
      console.log(`❌ OLD SCHEMA: table doesn't exist`)
    }
  } catch (err) {
    console.log(`❌ OLD SCHEMA: ${err.message}`)
  }

  // Try new schema
  try {
    const { count, error } = await supabase
      .from('video_transcript_chunks')
      .select('*', { count: 'exact', head: true })

    if (!error) {
      console.log(`\n✅ NEW SCHEMA (video_transcript_chunks): ${count} total chunks`)

      // Check embeddings
      const { count: embeddingCount } = await supabase
        .from('video_transcript_chunks')
        .select('*', { count: 'exact', head: true })
        .not('embedding', 'is', null)

      console.log(`   └─ ${embeddingCount} chunks have embeddings`)
      console.log(`   └─ ${count - embeddingCount} chunks missing embeddings`)

      // Get sample
      const { data: sample } = await supabase
        .from('video_transcript_chunks')
        .select('chunk_index, text')
        .limit(1)

      if (sample && sample.length > 0) {
        console.log(`\n   Sample chunk:`)
        console.log(`   └─ Index: ${sample[0].chunk_index}`)
        console.log(`   └─ Text: ${sample[0].text?.substring(0, 80)}...`)
      }
    } else {
      console.log(`❌ NEW SCHEMA: table doesn't exist`)
    }
  } catch (err) {
    console.log(`❌ NEW SCHEMA: ${err.message}`)
  }
}

async function testSearchFunction() {
  console.log('\n🔍 PART 4: Testing Search Function')
  console.log('='.repeat(60))

  try {
    // Create a test embedding (all zeros - won't find real matches but will test function exists)
    const testEmbedding = Array(1536).fill(0)

    console.log('\nAttempting to call search_transcript_chunks()...')

    const { data, error } = await supabase.rpc('search_transcript_chunks', {
      query_embedding: testEmbedding,
      similarity_threshold: 0.3,
      max_results: 5
    })

    if (error) {
      console.log(`❌ Function call failed:`, error.message)
      console.log(`   Code: ${error.code}`)
      console.log(`   Details: ${error.details}`)
    } else {
      console.log(`✅ Function exists and returned ${data?.length || 0} results`)
      console.log(`   (Zero vector test - expect 0 real matches)`)
    }
  } catch (err) {
    console.log(`❌ Error testing search function:`, err.message)
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('📋 SUMMARY & RECOMMENDATIONS')
  console.log('='.repeat(60))

  try {
    // Check what exists
    const checks = {
      oldChunks: false,
      newChunks: false,
      videos: false,
      embeddings: false
    }

    try {
      const { count } = await supabase.from('transcript_chunks').select('*', { count: 'exact', head: true })
      checks.oldChunks = count > 0
      const { count: embCount } = await supabase.from('transcript_chunks').select('*', { count: 'exact', head: true }).not('embedding', 'is', null)
      checks.embeddings = embCount > 0
    } catch (e) { /* ignore */ }

    try {
      const { count } = await supabase.from('video_transcript_chunks').select('*', { count: 'exact', head: true })
      checks.newChunks = count > 0
    } catch (e) { /* ignore */ }

    try {
      const { count } = await supabase.from('videos').select('*', { count: 'exact', head: true })
      checks.videos = count > 0
    } catch (e) { /* ignore */ }

    console.log('\nStatus:')
    console.log(`  ${checks.oldChunks ? '✅' : '❌'} Old schema transcript_chunks has data`)
    console.log(`  ${checks.newChunks ? '✅' : '❌'} New schema video_transcript_chunks has data`)
    console.log(`  ${checks.videos ? '✅' : '❌'} Videos table has data`)
    console.log(`  ${checks.embeddings ? '✅' : '❌'} Embeddings are generated`)

    console.log('\nRecommended Action:')
    if (checks.oldChunks && checks.embeddings) {
      console.log('  💡 Old schema has data AND embeddings')
      console.log('  → Debug why search_transcript_chunks() returns 0 results')
      console.log('  → Check if function parameters match what code sends')
    } else if (checks.oldChunks && !checks.embeddings) {
      console.log('  ⚠️  Old schema has data but NO embeddings')
      console.log('  → Need to regenerate embeddings with OpenAI')
      console.log('  → Run: node scripts/generate-embeddings.js')
    } else if (checks.videos && !checks.oldChunks && !checks.newChunks) {
      console.log('  📹 Videos exist but NO transcript data')
      console.log('  → Need to extract transcripts from YouTube')
      console.log('  → Run: node scripts/youtube-transcript-extractor.js module1')
      console.log('  → Then: node scripts/import-real-transcripts.js')
    } else if (!checks.videos) {
      console.log('  🚨 Database is EMPTY - no videos or transcripts')
      console.log('  → Deploy migrations: supabase db push')
      console.log('  → Import video data')
      console.log('  → Extract transcripts')
    } else {
      console.log('  ❓ Unclear state - review output above')
    }
  } catch (err) {
    console.log('\n❌ Error generating summary:', err.message)
  }

  console.log('\n' + '='.repeat(60) + '\n')
}

async function main() {
  try {
    await checkTables()
    await checkVideos()
    await checkTranscriptChunks()
    await testSearchFunction()
    await printSummary()
  } catch (err) {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  }
}

main()
