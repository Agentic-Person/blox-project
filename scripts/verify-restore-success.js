/**
 * Verify Restore Success
 * Check if database was restored to pre-deletion state
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function verifyRestoreSuccess() {
  console.log('\n╔════════════════════════════════════════╗')
  console.log('║   VERIFY RESTORE SUCCESS              ║')
  console.log('╚════════════════════════════════════════╝\n')

  let allChecks = true

  try {
    // Check 1: Video transcripts count
    console.log('📊 Checking database counts...\n')

    const { count: transcriptCount, error: transcriptError } = await supabase
      .from('video_transcripts')
      .select('*', { count: 'exact', head: true })

    if (transcriptError) {
      console.error('❌ Error checking video_transcripts:', transcriptError)
      allChecks = false
    } else {
      console.log(`   Video transcripts: ${transcriptCount}`)
      if (transcriptCount === 0) {
        console.log('   ❌ NO VIDEOS FOUND - Restore may have failed')
        allChecks = false
      } else if (transcriptCount >= 21) {
        console.log('   ✅ Videos restored successfully!')
      } else {
        console.log(`   ⚠️  Only ${transcriptCount} videos (expected ~21)`)
      }
    }

    // Check 2: Transcript chunks count
    const { count: chunkCount, error: chunkError } = await supabase
      .from('transcript_chunks')
      .select('*', { count: 'exact', head: true })

    if (chunkError) {
      console.error('❌ Error checking transcript_chunks:', chunkError)
      allChecks = false
    } else {
      console.log(`   Transcript chunks: ${chunkCount}`)
      if (chunkCount === 0) {
        console.log('   ❌ NO CHUNKS FOUND - Restore may have failed')
        allChecks = false
      } else if (chunkCount >= 121) {
        console.log('   ✅ Chunks restored successfully!')
      } else {
        console.log(`   ⚠️  Only ${chunkCount} chunks (expected ~121)`)
      }
    }

    // Check 3: Embeddings count
    const { count: embeddingCount, error: embeddingError } = await supabase
      .from('transcript_chunks')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null)

    if (embeddingError) {
      console.error('❌ Error checking embeddings:', embeddingError)
      allChecks = false
    } else {
      console.log(`   Chunks with embeddings: ${embeddingCount}`)
      if (embeddingCount === 0) {
        console.log('   ❌ NO EMBEDDINGS FOUND')
        allChecks = false
      } else if (embeddingCount >= 121) {
        console.log('   ✅ Embeddings restored successfully!')
      } else {
        console.log(`   ⚠️  Only ${embeddingCount} chunks have embeddings`)
      }
    }

    console.log('\n' + '='.repeat(60))

    // Check 4: Search function exists
    console.log('\n🔍 Checking search function...\n')

    const { data: functions, error: functionError } = await supabase
      .rpc('search_transcript_chunks', {
        query_embedding: Array(1536).fill(0),
        similarity_threshold: 0.01,
        max_results: 1
      })

    if (functionError) {
      if (functionError.code === '42883') {
        console.log('   ❌ search_transcript_chunks function does NOT exist')
        console.log('   → Run: node scripts/create-search-function.js')
        allChecks = false
      } else {
        console.log('   ⚠️  Function exists but returned error:', functionError.message)
      }
    } else {
      console.log('   ✅ search_transcript_chunks function exists and works!')
    }

    console.log('\n' + '='.repeat(60))

    // Check 5: Sample video data
    console.log('\n📹 Checking sample video data...\n')

    const { data: sampleVideos, error: sampleError } = await supabase
      .from('video_transcripts')
      .select('youtube_id, title, creator')
      .limit(5)

    if (sampleError) {
      console.error('❌ Error fetching sample videos:', sampleError)
      allChecks = false
    } else if (sampleVideos && sampleVideos.length > 0) {
      console.log('   Sample videos restored:')
      sampleVideos.forEach((video, idx) => {
        console.log(`   ${idx + 1}. "${video.title}"`)
        console.log(`      YouTube ID: ${video.youtube_id}`)
        console.log(`      Creator: ${video.creator || 'N/A'}`)
      })
      console.log('\n   ✅ Video data looks good!')
    }

    console.log('\n' + '='.repeat(60))

    // Final verdict
    console.log('\n')
    if (allChecks && transcriptCount >= 20 && chunkCount >= 100 && embeddingCount >= 100) {
      console.log('✅ ✅ ✅  RESTORE SUCCESSFUL! ✅ ✅ ✅')
      console.log('\n📊 Final Status:')
      console.log(`   Video transcripts: ${transcriptCount}`)
      console.log(`   Transcript chunks: ${chunkCount}`)
      console.log(`   Chunks with embeddings: ${embeddingCount}`)
      console.log('\n💡 Next Steps:')
      console.log('   1. Run: node scripts/test-actual-search.js')
      console.log('   2. Test in Blox Wizard UI')
      console.log('   3. Accept low similarity (2-5%) as "good enough for now"')
      console.log('   4. Move on to other features\n')
      return { success: true, transcriptCount, chunkCount, embeddingCount }
    } else if (transcriptCount === 0 && chunkCount === 0) {
      console.log('❌ ❌ ❌  RESTORE FAILED ❌ ❌ ❌')
      console.log('\nDatabase is still empty. Options:')
      console.log('   1. Try restore again with different timestamp')
      console.log('   2. Contact Supabase support')
      console.log('   3. Implement Plan B: Metadata-only search\n')
      return { success: false, reason: 'empty_database' }
    } else {
      console.log('⚠️  PARTIAL RESTORE')
      console.log('\nSome data restored but incomplete:')
      console.log(`   Videos: ${transcriptCount} (expected ~21)`)
      console.log(`   Chunks: ${chunkCount} (expected ~121)`)
      console.log(`   Embeddings: ${embeddingCount} (expected ~121)`)
      console.log('\nOptions:')
      console.log('   1. Accept partial data and test search')
      console.log('   2. Try restore again')
      console.log('   3. Implement Plan B: Metadata-only search\n')
      return { success: 'partial', transcriptCount, chunkCount, embeddingCount }
    }

  } catch (err) {
    console.error('\n❌ Error during verification:', err)
    console.error(err.stack)
    return { success: false, error: err }
  }
}

// Run if called directly
if (require.main === module) {
  verifyRestoreSuccess()
    .then((result) => {
      if (result.success === true) {
        process.exit(0)  // Success
      } else {
        process.exit(1)  // Failed or partial
      }
    })
    .catch(error => {
      console.error('\n❌ Script failed:', error.message)
      process.exit(2)
    })
}

module.exports = { verifyRestoreSuccess }
