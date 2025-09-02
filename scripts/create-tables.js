// Create Chat Wizard tables directly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Creating Chat Wizard tables directly...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const createTableStatements = [
  // Enable vector extension
  `CREATE EXTENSION IF NOT EXISTS vector`,
  
  // Video transcripts table
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
  )`,
  
  // Transcript chunks table  
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
  )`,
  
  // Common questions table
  `CREATE TABLE IF NOT EXISTS common_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_pattern TEXT NOT NULL,
    question_embedding VECTOR(1536),
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(question_pattern)
  )`,
  
  // Question answers table
  `CREATE TABLE IF NOT EXISTS question_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES common_questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    video_references JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
  )`
];

async function createTables() {
  console.log('Creating tables...');
  
  for (let i = 0; i < createTableStatements.length; i++) {
    const statement = createTableStatements[i];
    const tableMatch = statement.match(/CREATE TABLE.*?(\w+)/);
    const tableName = tableMatch ? tableMatch[1] : `statement ${i + 1}`;
    
    try {
      console.log(`📝 Creating ${tableName}...`);
      
      // Use raw SQL query via REST
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          query: statement
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`⚠️  ${tableName}: ${response.status} - ${errorText}`);
      } else {
        console.log(`✅ ${tableName} created successfully`);
      }
      
    } catch (error) {
      console.log(`❌ Error creating ${tableName}:`, error.message);
    }
  }
}

async function testTablesExist() {
  console.log('\n🔍 Testing if tables exist...');
  const tables = ['video_transcripts', 'transcript_chunks', 'common_questions', 'question_answers'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}': Not accessible`);
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`);
    }
  }
}

async function main() {
  await createTables();
  await testTablesExist();
  console.log('\n🎉 Table creation process completed!');
  console.log('If tables are still not accessible, you may need to apply the schema via the Supabase dashboard SQL editor.');
}

main().catch(console.error);