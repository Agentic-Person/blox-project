/**
 * Check which videos have embedded transcript chunks
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkEmbeddings() {
  console.log('\n--- CHECKING WHICH VIDEOS HAVE EMBEDDINGS ---\n')

  // Get all videos
  const { data: videos } = await supabase
    .from('video_transcripts')
    .select('id, youtube_id, title')

  console.log(`Total videos in database: ${videos?.length}`)

  // For each video, check if it has chunks with embeddings
  console.log('\nChecking embeddings for each video:\n')

  for (const video of videos || []) {
    const { count } = await supabase
      .from('transcript_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', video.youtube_id)
      .not('embedding', 'is', null)

    const status = count > 0 ? 'YES' : 'NO'
    console.log(`[${status}] ${video.title}`)
    console.log(`       YouTube ID: ${video.youtube_id}`)
    console.log(`       Embedded chunks: ${count}`)
    console.log('')
  }

  // Summary
  const { data: allChunks } = await supabase
    .from('transcript_chunks')
    .select('video_id')
    .not('embedding', 'is', null)

  const uniqueVideos = [...new Set(allChunks?.map(c => c.video_id))]

  console.log('SUMMARY:')
  console.log(`  Total videos: ${videos?.length}`)
  console.log(`  Videos with embeddings: ${uniqueVideos.length}`)
  console.log(`  Videos WITHOUT embeddings: ${(videos?.length || 0) - uniqueVideos.length}`)
}

checkEmbeddings()
