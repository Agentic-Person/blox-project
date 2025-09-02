#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Fixes placeholder YouTube IDs to use standard format
 */

function loadCurriculum() {
  const curriculumPath = path.join(__dirname, '../../src/data/curriculum.json');
  return JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
}

function saveCurriculum(curriculum) {
  const curriculumPath = path.join(__dirname, '../../src/data/curriculum.json');
  
  // Create backup first
  const backupPath = curriculumPath.replace('.json', `-backup-${Date.now()}.json`);
  fs.copyFileSync(curriculumPath, backupPath);
  console.log(`💾 Backup created: ${path.basename(backupPath)}`);
  
  // Save updated curriculum
  fs.writeFileSync(curriculumPath, JSON.stringify(curriculum, null, 2));
  console.log(`✅ Updated: ${curriculumPath}`);
}

function fixPlaceholderIds(curriculum) {
  console.log('🔧 Fixing placeholder YouTube IDs...');
  
  let fixedCount = 0;
  
  curriculum.modules.forEach((module, moduleIndex) => {
    module.weeks.forEach((week, weekIndex) => {
      week.days.forEach((day, dayIndex) => {
        day.videos.forEach((video, videoIndex) => {
          // Check for old placeholder format
          if (video.youtubeId && video.youtubeId.startsWith('placeholder_')) {
            video.youtubeId = 'YOUTUBE_ID_PLACEHOLDER';
            video.isPlaceholder = true;
            fixedCount++;
          }
        });
      });
    });
  });
  
  console.log(`✅ Fixed ${fixedCount} placeholder YouTube IDs`);
  return curriculum;
}

async function main() {
  try {
    console.log('🚀 Starting placeholder ID fix...');
    
    const curriculum = loadCurriculum();
    const fixedCurriculum = fixPlaceholderIds(curriculum);
    
    saveCurriculum(fixedCurriculum);
    
    console.log('\n✅ Successfully fixed placeholder IDs!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixPlaceholderIds };