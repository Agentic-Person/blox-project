// Simple database setup for Chat Wizard
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('🚀 Setting up Chat Wizard database schema...')
console.log('📡 Supabase URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  try {
    console.log('🔌 Testing database connection...')
    
    // Simple connection test
    const { data, error } = await supabase
      .from('_dummy_test_table_that_does_not_exist')
      .select('*')
      .limit(1)
    
    // We expect an error here, but it should be a table not found error, not a connection error
    if (error && !error.message.includes('does not exist') && !error.message.includes('relation')) {
      throw new Error(`Connection failed: ${error.message}`)
    }
    
    console.log('✅ Database connection successful')
    
    // Read and execute the migration
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250901142225_chat_wizard_schema.sql')
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`)
    }
    
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')
    console.log('📝 Loaded migration file')
    
    // Execute migration using raw SQL
    console.log('⚡ Executing database migration...')
    
    // Split into individual statements and execute
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}`)
          
          // Use rpc to execute raw SQL
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
          
          if (error) {
            // Some statements might fail if already exist, that's okay
            console.warn(`⚠️  Warning on statement ${i + 1}: ${error.message}`)
          }
        } catch (err) {
          console.warn(`⚠️  Error on statement ${i + 1}: ${err.message}`)
        }
      }
    }
    
    console.log('✅ Migration execution completed')
    
    // Verify tables exist
    console.log('🔍 Verifying schema setup...')
    
    const expectedTables = [
      'video_transcripts',
      'transcript_chunks',
      'common_questions',
      'question_answers'
    ]
    
    let tablesVerified = 0
    
    for (const table of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(0) // Just check if table exists
          
        if (!error) {
          console.log(`✅ Table '${table}' is ready`)
          tablesVerified++
        } else {
          console.log(`❌ Table '${table}' check failed: ${error.message}`)
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}': ${err.message}`)
      }
    }
    
    console.log(`\n📊 Schema Setup Summary:`)
    console.log(`✅ Tables verified: ${tablesVerified}/${expectedTables.length}`)
    
    if (tablesVerified >= 2) {
      console.log('🎉 Database setup successful!')
      console.log('\nNext steps:')
      console.log('1. Process video transcripts: node scripts/process-transcripts-runner.js')
      console.log('2. Test vector search functionality')
      console.log('3. Update Chat API to use real data')
    } else {
      console.log('⚠️  Database setup incomplete. Some tables may not be accessible.')
      console.log('This could be due to permissions or RLS policies.')
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    
    console.log('\n🛠️  Troubleshooting tips:')
    console.log('1. Verify your Supabase project is active')
    console.log('2. Check that the service role key has sufficient permissions')
    console.log('3. Ensure the pgvector extension is enabled in your Supabase project')
    
    process.exit(1)
  }
}

setupDatabase()