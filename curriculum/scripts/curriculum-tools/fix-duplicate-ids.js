#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Fixes duplicate IDs in curriculum
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

function fixDuplicateIds(curriculum) {
  console.log('🔧 Fixing duplicate IDs in curriculum...');
  
  curriculum.modules.forEach((module, moduleIndex) => {
    module.weeks.forEach((week, weekIndex) => {
      // Fix week ID
      week.id = `week-${(moduleIndex * 4) + weekIndex + 1}`;
      
      week.days.forEach((day, dayIndex) => {
        // Fix day ID
        day.id = `day-${(moduleIndex * 20) + (weekIndex * 5) + dayIndex + 1}`;
        
        day.videos.forEach((video, videoIndex) => {
          // Fix video ID
          video.id = `video-${moduleIndex + 1}-${weekIndex + 1}-${dayIndex + 1}-${videoIndex + 1}`;
        });
      });
    });
  });
  
  console.log('✅ Fixed all duplicate IDs');
  return curriculum;
}

async function main() {
  try {
    console.log('🚀 Starting duplicate ID fix...');
    
    const curriculum = loadCurriculum();
    const fixedCurriculum = fixDuplicateIds(curriculum);
    
    saveCurriculum(fixedCurriculum);
    
    console.log('\n✅ Successfully fixed duplicate IDs!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixDuplicateIds };