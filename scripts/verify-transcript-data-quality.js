/**
 * Verify Transcript Data Quality
 * Check if full_transcript data can be used for re-chunking
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function verifyTranscriptDataQuality() {
  console.log('\n╔════════════════════════════════════════╗')
  console.log('║   VERIFY TRANSCRIPT DATA QUALITY      ║')
  console.log('╚════════════════════════════════════════╝\n')

  try {
    // Get all videos with transcripts
    const { data: videos, error } = await supabase
      .from('video_transcripts')
      .select('id, youtube_id, title, full_transcript')

    if (error) {
      console.error('❌ Error fetching videos:', error)
      return { viable: false, reason: 'database_error' }
    }

    console.log(`📚 Found ${videos.length} videos with transcript data\n`)
    console.log('='.repeat(60))

    let usable = 0
    let unusable = 0
    const issues = []

    for (const video of videos) {
      const result = {
        title: video.title,
        youtube_id: video.youtube_id,
        status: 'unknown',
        issue: null,
        segmentCount: 0
      }

      // Check if full_transcript exists
      if (!video.full_transcript) {
        result.status = 'missing'
        result.issue = 'No full_transcript data'
        unusable++
        issues.push(result)
        continue
      }

      let transcript = video.full_transcript

      // Try to parse if it's a string
      if (typeof transcript === 'string') {
        try {
          transcript = JSON.parse(transcript)
        } catch (parseError) {
          result.status = 'corrupted'
          result.issue = `Cannot parse JSON: ${parseError.message.substring(0, 50)}`
          unusable++
          issues.push(result)
          continue
        }
      }

      // Check if it's an array
      if (!Array.isArray(transcript)) {
        result.status = 'invalid'
        result.issue = `Not an array, type: ${typeof transcript}`
        unusable++
        issues.push(result)
        continue
      }

      // Check if array has elements
      if (transcript.length === 0) {
        result.status = 'empty'
        result.issue = 'Empty transcript array'
        unusable++
        issues.push(result)
        continue
      }

      // Verify structure of first segment
      const firstSegment = transcript[0]
      if (!firstSegment.offset || !firstSegment.duration || !firstSegment.text) {
        result.status = 'malformed'
        result.issue = `Missing required fields (offset/duration/text)`
        unusable++
        issues.push(result)
        continue
      }

      // Success!
      result.status = 'usable'
      result.segmentCount = transcript.length
      usable++
    }

    // Report results
    console.log(`\n📊 VERIFICATION RESULTS:\n`)
    console.log(`   Total videos: ${videos.length}`)
    console.log(`   ✅ Usable transcripts: ${usable}`)
    console.log(`   ❌ Unusable transcripts: ${unusable}`)
    console.log(`   Success rate: ${((usable / videos.length) * 100).toFixed(1)}%\n`)

    if (issues.length > 0) {
      console.log('='.repeat(60))
      console.log(`\n❌ ISSUES FOUND (${issues.length} videos):\n`)
      issues.forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue.title}`)
        console.log(`   YouTube ID: ${issue.youtube_id}`)
        console.log(`   Status: ${issue.status}`)
        console.log(`   Issue: ${issue.issue}`)
        console.log('')
      })
    }

    console.log('='.repeat(60))
    console.log('\n💡 RECOMMENDATION:\n')

    if (usable === videos.length) {
      console.log('✅ PATH B (RE-CHUNK FROM DATABASE) - VIABLE')
      console.log('   All transcripts are usable. Proceed with re-chunking.')
      console.log('   Estimated time: 10-15 minutes\n')
      return { viable: true, usableCount: usable, totalCount: videos.length }
    } else if (usable > 0) {
      console.log('⚠️  PATH B (PARTIAL) - SOME VIDEOS NEED RE-SCRAPING')
      console.log(`   ${usable} videos can be re-chunked from database`)
      console.log(`   ${unusable} videos need to be re-scraped from YouTube`)
      console.log('   Estimated time: 15-30 minutes\n')
      return { viable: 'partial', usableCount: usable, totalCount: videos.length }
    } else {
      console.log('❌ PATH A (RE-SCRAPE) - REQUIRED')
      console.log('   No usable transcript data in database.')
      console.log('   Must re-scrape all videos from YouTube API.')
      console.log('   Estimated time: 3-4 hours\n')
      return { viable: false, usableCount: 0, totalCount: videos.length }
    }

  } catch (err) {
    console.error('\n❌ Error:', err)
    console.error(err.stack)
    return { viable: false, reason: 'script_error' }
  }
}

// Run if called directly
if (require.main === module) {
  verifyTranscriptDataQuality()
    .then((result) => {
      if (result.viable === true) {
        process.exit(0)  // Success - can proceed with Path B
      } else if (result.viable === 'partial') {
        process.exit(1)  // Partial - hybrid approach needed
      } else {
        process.exit(2)  // Failed - must use Path A
      }
    })
    .catch(error => {
      console.error('\n❌ Script failed:', error.message)
      process.exit(3)
    })
}

module.exports = { verifyTranscriptDataQuality }
