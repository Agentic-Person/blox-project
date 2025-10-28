/**
 * Check actual schema of transcript_chunks table
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkSchema() {
  console.log('\n--- CHECKING ACTUAL TABLE SCHEMA ---\n')

  // Get one record to see all columns
  const { data, error } = await supabase
    .from('transcript_chunks')
    .select('*')
    .limit(1)

  if (error) {
    console.log('Error:', error.message)
    return
  }

  if (data && data.length > 0) {
    console.log('Columns in transcript_chunks table:')
    console.log(Object.keys(data[0]))
    console.log('\nFull record structure:')
    console.log(JSON.stringify(data[0], null, 2))
  }

  // Also check video_transcripts
  const { data: videoData } = await supabase
    .from('video_transcripts')
    .select('*')
    .limit(1)

  if (videoData && videoData.length > 0) {
    console.log('\n\nColumns in video_transcripts table:')
    console.log(Object.keys(videoData[0]))
  }
}

checkSchema()
