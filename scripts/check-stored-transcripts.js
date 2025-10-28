/**
 * Check Stored Transcripts
 * Verify that full_transcript data is available in database
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkStoredTranscripts() {
  console.log('\n📊 CHECKING STORED TRANSCRIPTS\n')
  console.log('='.repeat(60))

  try {
    // Get one Roblox scripting video
    const { data: video, error } = await supabase
      .from('video_transcripts')
      .select('id, youtube_id, title, full_transcript')
      .eq('youtube_id', 'P2ECl-mLmvY')  // The EASIEST Beginner Guide to Scripting
      .single()

    if (error || !video) {
      console.error('❌ Video not found:', error)
      return
    }

    console.log(`\n📹 Video: ${video.title}`)
    console.log(`YouTube ID: ${video.youtube_id}\n`)

    // Check if full_transcript exists
    if (!video.full_transcript) {
      console.log('❌ NO full_transcript stored!')
      console.log('   We WILL need to re-scrape from YouTube.\n')
      return
    }

    console.log('✅ full_transcript IS stored in database!')

    const transcript = video.full_transcript
    console.log(`\nTranscript details:`)
    console.log(`  Type: ${typeof transcript}`)
    console.log(`  Is Array: ${Array.isArray(transcript)}`)

    if (Array.isArray(transcript)) {
      console.log(`  Segments: ${transcript.length}`)
      console.log(`\n  First 3 segments:`)
      transcript.slice(0, 3).forEach((seg, idx) => {
        console.log(`    ${idx}. Offset: ${seg.offset}ms, Duration: ${seg.duration}ms`)
        console.log(`       Text: ${seg.text.substring(0, 80)}...`)
      })

      // Check for duplicates in transcript data
      const texts = transcript.map(s => s.text)
      const uniqueTexts = [...new Set(texts)]

      console.log(`\n  Total segments: ${texts.length}`)
      console.log(`  Unique texts: ${uniqueTexts.length}`)

      if (texts.length !== uniqueTexts.length) {
        console.log(`  ⚠️  WARNING: ${texts.length - uniqueTexts.length} duplicate segments in original transcript!`)
      }
    }

    console.log('\n✅ CONCLUSION: We can re-chunk from stored transcripts!')
    console.log('   No need to re-scrape from YouTube API.')

  } catch (err) {
    console.error('\n❌ Error:', err)
  }

  console.log('\n' + '='.repeat(60) + '\n')
}

checkStoredTranscripts()
