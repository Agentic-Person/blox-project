// Apply Chat Wizard schema directly to Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Applying Chat Wizard schema to Supabase...');
console.log('📡 URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySchema() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250901142225_chat_wizard_schema.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Applying schema...');
    
    // Apply the entire schema at once
    const { data, error } = await supabase.rpc('exec', {
      query: migrationSql
    });
    
    if (error) {
      console.error('❌ Schema application failed:', error);
      
      // Try individual statements
      console.log('🔄 Trying individual statements...');
      const statements = migrationSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`📝 ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
        
        try {
          const { error: stmtError } = await supabase.rpc('exec', {
            query: statement + ';'
          });
          
          if (stmtError) {
            console.log(`⚠️  Statement ${i + 1} warning:`, stmtError.message);
          } else {
            console.log(`✅ Statement ${i + 1} applied successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} error:`, err.message);
        }
      }
    } else {
      console.log('✅ Schema applied successfully');
    }
    
    // Test if tables were created
    console.log('🔍 Verifying tables...');
    const tables = ['video_transcripts', 'transcript_chunks', 'common_questions', 'question_answers'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`✅ Table '${table}' is ready`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' error: ${err.message}`);
      }
    }
    
    console.log('');
    console.log('🎉 Chat Wizard database setup completed!');
    
  } catch (error) {
    console.error('❌ Failed to apply schema:', error);
  }
}

applySchema();