/**
 * Check Which Videos Have Embeddings
 * This will tell us exactly which videos have embedded chunks
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkEmbeddingCoverage() {
  console.log('\n📊 CHECKING EMBEDDING COVERAGE\n')
  console.log('='.repeat(60))

  try {
    // Get all videos
    const { data: videos, error: videosError } = await supabase
      .from('video_transcripts')
      .select('id, youtube_id, title')
      .order('title')

    if (videosError) {
      console.error('❌ Error fetching videos:', videosError)
      return
    }

    console.log(`\n📚 Total videos in database: ${videos.length}\n`)

    // Check each video for embedded chunks
    const results = []

    for (const video of videos) {
      const { count, error } = await supabase
        .from('transcript_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('transcript_id', video.id)
        .not('embedding', 'is', null)

      if (error) {
        console.error(`Error checking ${video.title}:`, error)
        continue
      }

      results.push({
        title: video.title,
        youtube_id: video.youtube_id,
        hasEmbeddings: count > 0,
        embeddedChunks: count || 0
      })
    }

    // Separate into with/without embeddings
    const withEmbeddings = results.filter(r => r.hasEmbeddings)
    const withoutEmbeddings = results.filter(r => !r.hasEmbeddings)

    // Display results
    console.log('✅ VIDEOS WITH EMBEDDINGS:\n')
    if (withEmbeddings.length > 0) {
      withEmbeddings.forEach((video, idx) => {
        console.log(`  ${idx + 1}. ${video.title}`)
        console.log(`     Chunks: ${video.embeddedChunks}`)
        console.log(`     YouTube ID: ${video.youtube_id}\n`)
      })
    } else {
      console.log('  None\n')
    }

    console.log('='.repeat(60))
    console.log('\n❌ VIDEOS WITHOUT EMBEDDINGS:\n')
    if (withoutEmbeddings.length > 0) {
      withoutEmbeddings.forEach((video, idx) => {
        console.log(`  ${idx + 1}. ${video.title}`)
        console.log(`     YouTube ID: ${video.youtube_id}\n`)
      })
    } else {
      console.log('  None\n')
    }

    console.log('='.repeat(60))
    console.log('\n📊 SUMMARY:')
    console.log(`   Total Videos: ${videos.length}`)
    console.log(`   With Embeddings: ${withEmbeddings.length}`)
    console.log(`   Without Embeddings: ${withoutEmbeddings.length}`)

    const totalEmbeddedChunks = withEmbeddings.reduce((sum, v) => sum + v.embeddedChunks, 0)
    console.log(`   Total Embedded Chunks: ${totalEmbeddedChunks}`)

    // Check if any are Roblox videos
    console.log('\n🎮 ROBLOX VIDEO CHECK:')
    const robloxWithEmbeddings = withEmbeddings.filter(v =>
      v.title.toLowerCase().includes('roblox')
    )
    const robloxWithoutEmbeddings = withoutEmbeddings.filter(v =>
      v.title.toLowerCase().includes('roblox')
    )

    console.log(`   Roblox videos WITH embeddings: ${robloxWithEmbeddings.length}`)
    console.log(`   Roblox videos WITHOUT embeddings: ${robloxWithoutEmbeddings.length}`)

    if (robloxWithoutEmbeddings.length > 0) {
      console.log('\n⚠️  ISSUE FOUND:')
      console.log('   Roblox videos exist but have no embeddings!')
      console.log('   These videos cannot be found via AI search.\n')
    }

  } catch (err) {
    console.error('\n❌ Error:', err)
    console.error(err.stack)
  }

  console.log('\n' + '='.repeat(60) + '\n')
}

checkEmbeddingCoverage()
