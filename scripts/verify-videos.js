/**
 * Verify Videos Script
 *
 * Quick script to verify the videos were uploaded correctly
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('\n🔍 Verifying Videos in Database\n');

  // Get total count
  const { count } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total videos: ${count}\n`);

  // Get sample videos
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .order('order_index')
    .limit(5);

  console.log('📹 Sample videos (first 5):');
  videos.forEach((v, i) => {
    console.log(`\n${i + 1}. ${v.title}`);
    console.log(`   YouTube ID: ${v.youtube_id}`);
    console.log(`   Creator: ${v.creator}`);
    console.log(`   Duration: ${v.duration} (${v.total_minutes} min)`);
    console.log(`   XP Reward: ${v.xp_reward}`);
    console.log(`   Location: ${v.module_id} > ${v.week_id} > ${v.day_id}`);
  });

  // Get videos by module
  const { data: moduleStats } = await supabase
    .from('videos')
    .select('module_id');

  const counts = moduleStats.reduce((acc, v) => {
    acc[v.module_id] = (acc[v.module_id] || 0) + 1;
    return acc;
  }, {});

  console.log('\n\n📊 Videos by module:');
  Object.entries(counts).forEach(([module, count]) => {
    console.log(`   ${module}: ${count} videos`);
  });

  console.log('\n✅ Verification complete!\n');
}

main().catch(console.error);
