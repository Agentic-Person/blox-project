/**
 * Check Embedding Storage Type
 * Verify how embeddings are actually stored in the database
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkEmbeddingStorageType() {
  console.log('\n🔍 CHECKING EMBEDDING STORAGE TYPE\n')
  console.log('='.repeat(60))

  try {
    // Get column info from information_schema
    const { data: columns, error: columnsError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT
            column_name,
            data_type,
            udt_name,
            character_maximum_length
          FROM information_schema.columns
          WHERE table_name = 'transcript_chunks'
            AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })

    if (columnsError) {
      console.error('❌ Error getting column info:', columnsError)

      // Try alternate method
      console.log('\nTrying alternate method...\n')
      const { data: chunk, error: chunkError } = await supabase
        .from('transcript_chunks')
        .select('id, embedding')
        .not('embedding', 'is', null)
        .limit(1)
        .single()

      if (chunkError) {
        console.error('❌ Error getting sample chunk:', chunkError)
        return
      }

      console.log('📊 Sample Chunk Analysis:')
      console.log(`   ID: ${chunk.id}`)
      console.log(`   Embedding type: ${typeof chunk.embedding}`)
      console.log(`   Is Array: ${Array.isArray(chunk.embedding)}`)

      if (typeof chunk.embedding === 'string') {
        console.log(`   String length: ${chunk.embedding.length}`)
        console.log(`   First 100 chars: ${chunk.embedding.substring(0, 100)}`)

        // Try to parse it
        try {
          const parsed = JSON.parse(chunk.embedding)
          console.log(`   ✅ Can be parsed as JSON`)
          console.log(`   Parsed type: ${typeof parsed}`)
          console.log(`   Parsed is Array: ${Array.isArray(parsed)}`)
          if (Array.isArray(parsed)) {
            console.log(`   Parsed array length: ${parsed.length}`)
            console.log(`   First 5 values: ${parsed.slice(0, 5).join(', ')}`)
          }
        } catch (parseError) {
          console.log(`   ❌ Cannot parse as JSON: ${parseError.message}`)
        }
      } else if (Array.isArray(chunk.embedding)) {
        console.log(`   Array length: ${chunk.embedding.length}`)
        console.log(`   First 5 values: ${chunk.embedding.slice(0, 5).join(', ')}`)
      }

      return
    }

    console.log('📊 TRANSCRIPT_CHUNKS TABLE SCHEMA:\n')
    columns.forEach(col => {
      console.log(`   ${col.column_name}:`)
      console.log(`      Data Type: ${col.data_type}`)
      console.log(`      UDT Name: ${col.udt_name}`)
      if (col.character_maximum_length) {
        console.log(`      Max Length: ${col.character_maximum_length}`)
      }
      console.log('')
    })

  } catch (err) {
    console.error('\n❌ Error:', err)
    console.error(err.stack)
  }

  console.log('\n' + '='.repeat(60) + '\n')
}

checkEmbeddingStorageType()
