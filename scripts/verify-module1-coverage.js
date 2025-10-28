/**
 * Verify Module 1 Video Coverage
 * Checks which Module 1 videos are in the database and which are missing
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const curriculum = require('../src/data/curriculum.json')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function verifyModule1Coverage() {
  console.log('\n╔════════════════════════════════════════╗')
  console.log('║   MODULE 1 VIDEO COVERAGE CHECK       ║')
  console.log('╚════════════════════════════════════════╝\n')

  // Get Module 1 from curriculum
  const module1 = curriculum.modules.find(m => m.id === 'module-1')

  if (!module1) {
    console.error('❌ Module 1 not found in curriculum.json')
    return
  }

  // Extract all videos with YouTube IDs from Module 1
  const curriculumVideos = []
  module1.weeks.forEach((week, weekIdx) => {
    week.days.forEach((day, dayIdx) => {
      day.videos.forEach((video, videoIdx) => {
        if (video.youtubeId) {
          curriculumVideos.push({
            youtubeId: video.youtubeId,
            title: video.title,
            creator: video.creator || 'Unknown',
            week: weekIdx + 1,
            day: dayIdx + 1,
            videoIndex: videoIdx + 1,
            duration: video.duration,
            location: `Week ${weekIdx + 1}, Day ${dayIdx + 1}, Video ${videoIdx + 1}`
          })
        }
      })
    })
  })

  console.log(`📚 Module 1 Curriculum: ${curriculumVideos.length} videos\n`)

  // Get videos from database
  const { data: dbVideos, error } = await supabase
    .from('video_transcripts')
    .select('youtube_id, title')

  if (error) {
    console.error('❌ Error fetching database videos:', error.message)
    return
  }

  console.log(`💾 Database: ${dbVideos?.length || 0} videos\n`)

  // Create lookup map
  const dbVideoMap = new Map()
  dbVideos?.forEach(video => {
    dbVideoMap.set(video.youtube_id, video)
  })

  // Check coverage
  const missing = []
  const present = []

  curriculumVideos.forEach(video => {
    if (dbVideoMap.has(video.youtubeId)) {
      present.push(video)
    } else {
      missing.push(video)
    }
  })

  // Display results
  console.log('═══════════════════════════════════════\n')
  console.log(`✅ PRESENT IN DATABASE: ${present.length} videos\n`)

  if (present.length > 0 && present.length <= 25) {
    present.forEach((video, idx) => {
      console.log(`  ${idx + 1}. ${video.title}`)
      console.log(`     ${video.location}`)
      console.log('')
    })
  } else if (present.length > 25) {
    console.log('  (Showing first 10 only)\n')
    present.slice(0, 10).forEach((video, idx) => {
      console.log(`  ${idx + 1}. ${video.title}`)
      console.log(`     ${video.location}`)
      console.log('')
    })
  }

  console.log('═══════════════════════════════════════\n')
  console.log(`❌ MISSING FROM DATABASE: ${missing.length} videos\n`)

  if (missing.length > 0) {
    missing.forEach((video, idx) => {
      console.log(`  ${idx + 1}. ${video.title}`)
      console.log(`     YouTube ID: ${video.youtubeId}`)
      console.log(`     ${video.location}`)
      console.log('')
    })
  }

  console.log('═══════════════════════════════════════\n')
  console.log('📊 SUMMARY:')
  console.log(`   Total Module 1 Videos: ${curriculumVideos.length}`)
  console.log(`   Present in Database: ${present.length} (${Math.round(present.length / curriculumVideos.length * 100)}%)`)
  console.log(`   Missing from Database: ${missing.length} (${Math.round(missing.length / curriculumVideos.length * 100)}%)`)
  console.log('')

  if (missing.length > 0) {
    console.log('💡 NEXT STEPS:')
    console.log('   Run: node scripts/embed-module1-videos.js')
    console.log('   This will extract and embed all missing videos\n')
  } else {
    console.log('🎉 All Module 1 videos are in the database!\n')
  }

  // Check embeddings for present videos
  if (present.length > 0) {
    console.log('═══════════════════════════════════════\n')
    console.log('📊 CHECKING EMBEDDINGS...\n')

    let videosWithEmbeddings = 0
    let videosWithoutEmbeddings = 0

    for (const video of present) {
      const { count } = await supabase
        .from('transcript_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', video.youtubeId)
        .not('embedding', 'is', null)

      if (count > 0) {
        videosWithEmbeddings++
      } else {
        videosWithoutEmbeddings++
      }
    }

    console.log(`   Videos with embeddings: ${videosWithEmbeddings}`)
    console.log(`   Videos without embeddings: ${videosWithoutEmbeddings}`)

    if (videosWithoutEmbeddings > 0) {
      console.log('\n💡 Some videos need embeddings. Run:')
      console.log('   node scripts/generate-transcript-embeddings.js\n')
    }
  }

  return {
    total: curriculumVideos.length,
    present: present.length,
    missing: missing.length,
    missingVideos: missing
  }
}

// Run if called directly
if (require.main === module) {
  verifyModule1Coverage()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Script failed:', error.message)
      process.exit(1)
    })
}

module.exports = { verifyModule1Coverage }
