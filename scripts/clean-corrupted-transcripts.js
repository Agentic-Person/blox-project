/**
 * Clean Corrupted Transcripts
 * Delete all corrupted transcript data to start fresh
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.toLowerCase())
    })
  })
}

async function cleanCorruptedTranscripts() {
  console.log('\n⚠️  CLEAN CORRUPTED TRANSCRIPTS\n')
  console.log('='.repeat(60))

  try {
    // Get current counts
    const { count: transcriptCount } = await supabase
      .from('video_transcripts')
      .select('*', { count: 'exact', head: true })

    const { count: chunkCount } = await supabase
      .from('transcript_chunks')
      .select('*', { count: 'exact', head: true })

    console.log(`\n📊 Current Database Status:`)
    console.log(`   Video transcripts: ${transcriptCount}`)
    console.log(`   Transcript chunks: ${chunkCount}`)

    console.log(`\n⚠️  WARNING: This will DELETE ALL transcript data!`)
    console.log(`   - All ${transcriptCount} video transcripts`)
    console.log(`   - All ${chunkCount} transcript chunks`)
    console.log(`   - All embeddings\n`)

    console.log(`✅ After deletion, you can run:`)
    console.log(`   node scripts/embed-module1-videos.js`)
    console.log(`   to re-scrape fresh data from YouTube\n`)

    console.log('='.repeat(60))

    // Confirmation prompt
    const answer = await promptUser('\n🔴 Are you sure you want to DELETE ALL transcript data? (yes/no): ')

    if (answer !== 'yes') {
      console.log('\n❌ Deletion cancelled. No changes made.\n')
      return { deleted: false, reason: 'user_cancelled' }
    }

    console.log('\n🗑️  Deleting data...\n')

    // Delete chunks first (foreign key constraint)
    console.log('Step 1: Deleting transcript chunks...')
    const { error: chunksError, count: deletedChunks } = await supabase
      .from('transcript_chunks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')  // Delete all (neq ensures we match all records)

    if (chunksError) {
      console.error('❌ Error deleting chunks:', chunksError)
      return { deleted: false, error: chunksError }
    }

    console.log(`✅ Deleted all transcript chunks`)

    // Delete transcripts
    console.log('\nStep 2: Deleting video transcripts...')
    const { error: transcriptsError, count: deletedTranscripts } = await supabase
      .from('video_transcripts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')  // Delete all

    if (transcriptsError) {
      console.error('❌ Error deleting transcripts:', transcriptsError)
      return { deleted: false, error: transcriptsError }
    }

    console.log(`✅ Deleted all video transcripts`)

    // Verify deletion
    const { count: remainingTranscripts } = await supabase
      .from('video_transcripts')
      .select('*', { count: 'exact', head: true })

    const { count: remainingChunks } = await supabase
      .from('transcript_chunks')
      .select('*', { count: 'exact', head: true })

    console.log('\n' + '='.repeat(60))
    console.log('\n✅ DELETION COMPLETE!\n')
    console.log(`📊 Final Status:`)
    console.log(`   Video transcripts: ${remainingTranscripts}`)
    console.log(`   Transcript chunks: ${remainingChunks}`)

    console.log('\n💡 NEXT STEPS:')
    console.log('   1. Run: node scripts/embed-module1-videos.js')
    console.log('      This will scrape all 90 Module 1 videos from YouTube')
    console.log('      Estimated time: 3-4 hours')
    console.log('')
    console.log('   2. Run: node scripts/generate-transcript-embeddings.js')
    console.log('      This will generate embeddings for all chunks')
    console.log('      Estimated time: 15-20 minutes')
    console.log('')
    console.log('   3. Test search functionality')
    console.log('      node scripts/test-actual-search.js\n')

    return {
      deleted: true,
      deletedTranscripts: transcriptCount,
      deletedChunks: chunkCount
    }

  } catch (err) {
    console.error('\n❌ Error:', err)
    console.error(err.stack)
    return { deleted: false, error: err }
  }
}

// Run if called directly
if (require.main === module) {
  cleanCorruptedTranscripts()
    .then((result) => {
      if (result.deleted) {
        console.log('\n✅ Ready to re-scrape fresh data!\n')
        process.exit(0)
      } else {
        console.log('\n❌ Deletion failed or was cancelled\n')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('\n❌ Script failed:', error.message)
      process.exit(1)
    })
}

module.exports = { cleanCorruptedTranscripts }
