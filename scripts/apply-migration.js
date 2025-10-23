/**
 * Apply migration to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function applyMigration(migrationFile) {
  console.log(`\n📝 Applying migration: ${migrationFile}`);

  const sqlContent = fs.readFileSync(migrationFile, 'utf-8');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      // If exec_sql doesn't exist, try direct execution (Supabase free tier)
      console.log('   ⚠️  exec_sql not available, trying direct execution...');

      // Split by semicolons and execute each statement
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement) {
          const { error: execError } = await supabase.rpc('exec', { sql: statement });
          if (execError) {
            console.error(`   ❌ Error executing statement:`, execError.message);
          }
        }
      }
    }

    console.log(`   ✅ Migration applied successfully`);
    return true;

  } catch (error) {
    console.error(`   ❌ Migration failed:`, error.message);
    console.log('\n💡 You may need to run this migration manually in Supabase SQL Editor:');
    console.log(`   ${migrationFile}\n`);
    return false;
  }
}

// Run
const migrationFile = process.argv[2] || path.join(__dirname, '../supabase/migrations/011_add_video_metadata_columns.sql');
applyMigration(migrationFile);
