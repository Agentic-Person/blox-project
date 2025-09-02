#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const curriculumPath = path.join(__dirname, '../../../../src/data/curriculum.json');
const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

function checkYouTubeIds() {
  console.log('🔍 Checking YouTube IDs in curriculum...\n');
  
  let totalVideos = 0;
  let validIds = 0;
  let invalidIds = 0;
  let placeholders = 0;
  
  curriculum.modules.forEach((module, moduleIndex) => {
    module.weeks.forEach((week, weekIndex) => {
      week.days.forEach((day, dayIndex) => {
        day.videos.forEach((video, videoIndex) => {
          totalVideos++;
          
          if (video.youtubeId === 'YOUTUBE_ID_PLACEHOLDER') {
            placeholders++;
          } else if (YOUTUBE_ID_REGEX.test(video.youtubeId)) {
            validIds++;
          } else {
            invalidIds++;
            console.log(`❌ Invalid ID: "${video.youtubeId}" (length: ${video.youtubeId.length})`);
            console.log(`   📍 Location: Module ${moduleIndex + 1}, Week ${weekIndex + 1}, Day ${dayIndex + 1}, Video ${videoIndex + 1}`);
            console.log(`   📺 Title: ${video.title}`);
            console.log('');
          }
        });
      });
    });
  });
  
  console.log('📊 Summary:');
  console.log(`   Total Videos: ${totalVideos}`);
  console.log(`   Valid IDs: ${validIds}`);
  console.log(`   Placeholders: ${placeholders}`);
  console.log(`   Invalid IDs: ${invalidIds}`);
}

checkYouTubeIds();