/**
 * Test Video Transcript Availability
 * Quick script to check if a YouTube video has transcripts
 *
 * Usage:
 *   node scripts/test-video-transcript.js VIDEO_ID
 *   node scripts/test-video-transcript.js https://youtube.com/watch?v=VIDEO_ID
 */

const { YoutubeTranscript } = require('youtube-transcript')

// Extract video ID from URL or use directly
function extractVideoId(input) {
  if (!input) {
    console.error('❌ Error: No video ID or URL provided')
    console.log('\nUsage:')
    console.log('  node scripts/test-video-transcript.js VIDEO_ID')
    console.log('  node scripts/test-video-transcript.js https://youtube.com/watch?v=VIDEO_ID')
    process.exit(1)
  }

  // If it's already just an ID
  if (input.length === 11 && !input.includes('/')) {
    return input
  }

  // Extract from URL
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
  ]

  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) return match[1]
  }

  // If no pattern matched, assume it's an ID
  return input
}

async function testTranscript(videoId) {
  console.log('\n🔍 Testing Transcript Availability\n')
  console.log('═'.repeat(60))
  console.log(`Video ID: ${videoId}`)
  console.log(`URL: https://youtube.com/watch?v=${videoId}`)
  console.log('═'.repeat(60))

  try {
    console.log('\n⏳ Fetching transcript...')

    const transcript = await YoutubeTranscript.fetchTranscript(videoId)

    if (!transcript || transcript.length === 0) {
      console.log('\n❌ NO TRANSCRIPT AVAILABLE')
      console.log('   Video has no captions/subtitles enabled')
      console.log('\n💡 Recommendation: Find alternative video with captions\n')
      return { available: false, segments: 0 }
    }

    console.log('\n✅ TRANSCRIPT AVAILABLE!')
    console.log(`\n📊 Stats:`)
    console.log(`   Segments: ${transcript.length}`)

    // Calculate total duration
    const lastSegment = transcript[transcript.length - 1]
    const totalSeconds = (parseFloat(lastSegment.offset) + parseFloat(lastSegment.duration)) / 1000
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    console.log(`   Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`)

    // Show first 3 segments as preview
    console.log(`\n📝 Preview (first 3 segments):`)
    transcript.slice(0, 3).forEach((seg, idx) => {
      const startTime = (parseFloat(seg.offset) / 1000).toFixed(2)
      console.log(`   ${idx + 1}. [${startTime}s] ${seg.text.substring(0, 60)}${seg.text.length > 60 ? '...' : ''}`)
    })

    // Calculate chunk count (30-second chunks)
    const estimatedChunks = Math.ceil(totalSeconds / 30)
    console.log(`\n🔢 Estimated chunks (30s): ${estimatedChunks}`)

    console.log('\n✅ This video is GOOD TO USE!\n')
    console.log('═'.repeat(60))
    console.log('\n📋 Add to CURATED-VIDEOS-MASTER-LIST.md:')
    console.log(`| # | [Title] | [Creator] | https://youtube.com/watch?v=${videoId} | ${minutes}:${seconds.toString().padStart(2, '0')} | ✅ Verified | Pending |\n`)

    return {
      available: true,
      segments: transcript.length,
      duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      estimatedChunks,
      transcript
    }

  } catch (error) {
    console.log('\n❌ ERROR: Cannot fetch transcript')
    console.log(`   ${error.message}`)

    if (error.message.includes('disabled')) {
      console.log('\n💡 This video has transcripts DISABLED by the creator')
    } else if (error.message.includes('not found')) {
      console.log('\n💡 Video not found or unavailable')
    } else {
      console.log('\n💡 Transcript not available for this video')
    }

    console.log('\n🔄 Recommendation: Try another video\n')

    return { available: false, error: error.message }
  }
}

// Run if called directly
if (require.main === module) {
  const input = process.argv[2]
  const videoId = extractVideoId(input)

  testTranscript(videoId)
    .then(result => {
      process.exit(result.available ? 0 : 1)
    })
    .catch(error => {
      console.error('\n❌ Unexpected error:', error.message)
      process.exit(2)
    })
}

module.exports = { testTranscript, extractVideoId }
