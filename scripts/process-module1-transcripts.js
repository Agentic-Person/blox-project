// Process YouTube transcripts for Module 1 Week 1-2 only (53 videos)
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env' })

// Import the TypeScript service (we'll need to compile it first)
console.log('🚀 Starting Module 1 Transcript Processing...')
console.log('📚 Processing ONLY Module 1, Week 1-2 videos (53 total)')

// Load curriculum data
const curriculumPath = path.join(__dirname, '..', 'src', 'data', 'curriculum.json')
const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'))

/**
 * Extract videos from Module 1, Week 1-2 only
 */
function extractModule1Week12Videos() {
  const videos = []
  const module1 = curriculum.modules.find(m => m.id === 'module-1')
  
  if (!module1) {
    throw new Error('Module 1 not found in curriculum!')
  }

  // Get weeks 1 and 2 only
  const weeks12 = module1.weeks.filter(w => w.id === 'week-1' || w.id === 'week-2')
  
  console.log(`📅 Found ${weeks12.length} weeks to process`)

  for (const week of weeks12) {
    console.log(`📖 Processing ${week.id}: ${week.title}`)
    
    for (const day of week.days) {
      console.log(`📅 Processing ${day.id}: ${day.title}`)
      
      for (const video of day.videos) {
        // Only process videos with YouTube IDs (skip assignments)
        if (video.youtubeId) {
          videos.push({
            id: video.id,
            youtubeId: video.youtubeId,
            title: video.title,
            creator: video.creator || 'Unknown',
            moduleId: module1.id,
            weekId: week.id,
            dayId: day.id,
            duration: video.duration,
            description: video.description || ''
          })
        }
      }
    }
  }

  return videos
}

/**
 * Main processing function
 */
async function main() {
  try {
    // Extract videos
    const videos = extractModule1Week12Videos()
    console.log(`\n🎯 Total videos to process: ${videos.length}`)
    
    // Log video summary
    console.log('\n📋 Video Summary:')
    const byWeek = videos.reduce((acc, video) => {
      acc[video.weekId] = (acc[video.weekId] || 0) + 1
      return acc
    }, {})
    
    Object.entries(byWeek).forEach(([week, count]) => {
      console.log(`   ${week}: ${count} videos`)
    })

    // Save video list for reference
    const outputPath = path.join(__dirname, 'module1-week12-videos.json')
    fs.writeFileSync(outputPath, JSON.stringify(videos, null, 2))
    console.log(`💾 Video list saved to: ${outputPath}`)

    console.log('\n🚨 IMPORTANT: To continue processing, you need to:')
    console.log('1. Ensure your .env file has OPENAI_API_KEY and Supabase credentials')
    console.log('2. Run the database migration: node scripts/setup-chat-wizard-db.js')
    console.log('3. Then run: node scripts/process-transcripts-runner.js')
    console.log('\n📊 Expected processing time: ~2-3 hours for all 53 videos')
    console.log('💰 Estimated OpenAI costs: ~$2-4 USD for embeddings')

    // Log some sample videos for verification
    console.log('\n🔍 Sample videos to be processed:')
    videos.slice(0, 5).forEach(video => {
      console.log(`   - ${video.title} (${video.youtubeId}) by ${video.creator}`)
    })

    if (videos.length > 5) {
      console.log(`   ... and ${videos.length - 5} more videos`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)