// Direct database setup for Chat Wizard - Skip connection test
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

console.log('🚀 Setting up Chat Wizard database schema (Direct Mode)...')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  try {
    console.log('📝 Reading migration file...')
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250901142225_chat_wizard_schema.sql')
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute key SQL statements individually
    const keyStatements = [
      'CREATE EXTENSION IF NOT EXISTS vector;',
      
      `CREATE TABLE IF NOT EXISTS video_transcripts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        video_id TEXT NOT NULL,
        youtube_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        creator TEXT,
        duration_seconds INTEGER,
        full_transcript TEXT,
        transcript_json JSONB,
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS transcript_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transcript_id UUID REFERENCES video_transcripts(id) ON DELETE CASCADE,
        chunk_text TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        start_timestamp TEXT NOT NULL,
        end_timestamp TEXT NOT NULL,
        start_seconds INTEGER NOT NULL,
        end_seconds INTEGER NOT NULL,
        embedding VECTOR(1536),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS common_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_pattern TEXT NOT NULL,
        question_embedding VECTOR(1536),
        usage_count INTEGER DEFAULT 1,
        last_used TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(question_pattern)
      );`,
      
      `CREATE TABLE IF NOT EXISTS question_answers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID REFERENCES common_questions(id) ON DELETE CASCADE,
        answer_text TEXT NOT NULL,
        video_references JSONB NOT NULL,
        confidence_score DECIMAL(3,2),
        generated_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ
      );`
    ]
    
    console.log('⚡ Creating core tables...')
    
    for (let i = 0; i < keyStatements.length; i++) {
      const statement = keyStatements[i]
      console.log(`📊 Executing statement ${i + 1}/${keyStatements.length}`)
      
      try {
        // Try direct query execution
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })
        
        if (error) {
          console.warn(`⚠️  Statement ${i + 1} warning: ${error.message}`)
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.warn(`⚠️  Statement ${i + 1} error: ${err.message}`)
      }
    }
    
    // Create the search function
    const searchFunction = `
      CREATE OR REPLACE FUNCTION search_transcript_chunks(
        query_embedding vector(1536),
        similarity_threshold float DEFAULT 0.7,
        max_results int DEFAULT 20
      )
      RETURNS TABLE (
        chunk_id uuid,
        transcript_id uuid,
        video_id text,
        youtube_id text,
        title text,
        creator text,
        chunk_text text,
        start_timestamp text,
        end_timestamp text,
        start_seconds int,
        end_seconds int,
        similarity_score float
      ) 
      LANGUAGE SQL STABLE
      AS $function$
        SELECT 
          tc.id as chunk_id,
          tc.transcript_id,
          vt.video_id,
          vt.youtube_id,
          vt.title,
          vt.creator,
          tc.chunk_text,
          tc.start_timestamp,
          tc.end_timestamp,
          tc.start_seconds,
          tc.end_seconds,
          1 - (tc.embedding <=> query_embedding) as similarity_score
        FROM transcript_chunks tc
        JOIN video_transcripts vt ON tc.transcript_id = vt.id
        WHERE 1 - (tc.embedding <=> query_embedding) > similarity_threshold
        ORDER BY tc.embedding <=> query_embedding
        LIMIT max_results;
      $function$;
    `
    
    console.log('📊 Creating search function...')
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: searchFunction })
      if (error) {
        console.warn(`⚠️  Search function warning: ${error.message}`)
      } else {
        console.log('✅ Search function created')
      }
    } catch (err) {
      console.warn(`⚠️  Search function error: ${err.message}`)
    }
    
    // Test table access
    console.log('🔍 Testing table access...')
    
    const tables = ['video_transcripts', 'transcript_chunks']
    let accessCount = 0
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(0)
        
        if (!error) {
          console.log(`✅ Can access table: ${table}`)
          accessCount++
        } else {
          console.log(`❌ Cannot access table ${table}: ${error.message}`)
        }
      } catch (err) {
        console.log(`❌ Error accessing table ${table}: ${err.message}`)
      }
    }
    
    console.log(`\n🎉 Database setup completed!`)
    console.log(`✅ Accessible tables: ${accessCount}/${tables.length}`)
    
    if (accessCount > 0) {
      console.log('\n📋 Next Steps:')
      console.log('1. Install ts-node: npm install -g ts-node')
      console.log('2. Or create a compiled version of the transcript processor')
      console.log('3. Ready to start processing transcripts!')
      
      // Create a simple test insertion
      console.log('\n🧪 Testing basic insertion...')
      
      const testVideo = {
        video_id: 'test-001',
        youtube_id: 'test123456',
        title: 'Test Video',
        creator: 'Test Creator',
        full_transcript: 'This is a test transcript.',
        transcript_json: [{ text: 'This is a test transcript.', startTime: 0, duration: 5, timestamp: '0:00' }],
        processed_at: new Date().toISOString()
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('video_transcripts')
        .insert(testVideo)
        .select()
      
      if (!insertError && insertData) {
        console.log('✅ Test insertion successful - database is ready!')
        
        // Clean up test data
        await supabase
          .from('video_transcripts')
          .delete()
          .eq('youtube_id', 'test123456')
          
        console.log('✅ Test data cleaned up')
      } else {
        console.log('⚠️  Test insertion failed:', insertError?.message)
        console.log('Database exists but may have permission issues')
      }
    } else {
      console.log('⚠️  No tables accessible. Check permissions.')
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  }
}

setupDatabase()