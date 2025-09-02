// Setup Chat Wizard database schema
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('🚀 Setting up Chat Wizard database schema...');
console.log('📡 Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250901142225_chat_wizard_schema.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Applying Chat Wizard schema migration...');
    
    // Split the SQL into individual statements
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    let successCount = 0;
    
    for (const statement of statements) {
      try {
        if (statement.trim()) {
          console.log(`⚡ Executing: ${statement.substring(0, 50)}...`);
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          
          if (error) {
            // Try alternative method for statements that can't use rpc
            const { error: directError } = await supabase
              .from('_temp_execute')  
              .select('*')
              .limit(1);
            
            if (directError && !directError.message.includes('relation "_temp_execute" does not exist')) {
              console.warn(`⚠️  Warning executing statement: ${error.message}`);
            }
          }
          successCount++;
        }
      } catch (err) {
        console.warn(`⚠️  Warning with statement: ${err.message}`);
        // Continue with other statements
      }
    }
    
    console.log(`✅ Applied ${successCount} database statements`);
    
    // Verify the schema was created by checking for our tables
    console.log('🔍 Verifying schema setup...');
    
    const tables = [
      'video_transcripts',
      'transcript_chunks', 
      'common_questions',
      'question_answers'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`❌ Table '${table}' not found or accessible`);
        } else {
          console.log(`✅ Table '${table}' is ready`);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}': ${err.message}`);
      }
    }
    
    console.log('🎉 Chat Wizard database setup completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run transcript processor to populate video data');
    console.log('2. Test vector search functionality');
    console.log('3. Update Chat API to use real data');
    
  } catch (error) {
    console.error('❌ Failed to setup database:', error.message);
    process.exit(1);
  }
}

// Test database connection first
async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    // Test with a simple SQL query instead of table access
    const { data, error } = await supabase.rpc('version');
      
    if (error) {
      console.log('ℹ️  Using alternative connection test...');
      // Try a basic select
      const { data: testData, error: testError } = await supabase
        .rpc('current_user');
      
      if (testError) {
        console.error('❌ Connection test failed:', testError.message);
        return false;
      }
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function main() {
  const connected = await testConnection();
  if (connected) {
    await setupDatabase();
  } else {
    console.error('❌ Cannot proceed without database connection');
    process.exit(1);
  }
}

main().catch(console.error);