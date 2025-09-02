const fs = require('fs');
const path = require('path');

// Read the reference document
const referenceDoc = fs.readFileSync(path.join(__dirname, '..', 'docs', 'YouTube video titles-content-creator-URL-link-8-23-2025.md'), 'utf8');

// Read the updated curriculum
const curriculumPath = path.join(__dirname, '..', 'src', 'data', 'curriculum.json');
const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));

// Parse reference document to get expected videos by day
const lines = referenceDoc.split('\n');
const expectedVideosByDay = {};

for (const line of lines) {
  const match = line.match(/\|\s*(\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*\[Watch\]\(([^)]+)\)/);
  if (match) {
    const [, day, title, creator, url] = match;
    const dayNum = parseInt(day);
    const youtubeId = url.match(/watch\?v=([^&]+)/)?.[1];
    
    if (!expectedVideosByDay[dayNum]) {
      expectedVideosByDay[dayNum] = [];
    }
    
    expectedVideosByDay[dayNum].push({
      title: title.trim(),
      creator: creator.trim(),
      youtubeId: youtubeId
    });
  }
}

// Extract videos from curriculum by day
const actualVideosByDay = {};

curriculum.modules.forEach(module => {
  module.weeks.forEach(week => {
    week.days.forEach(day => {
      const dayNum = parseInt(day.id.replace('day-', ''));
      actualVideosByDay[dayNum] = day.videos.map(v => ({
        title: v.title,
        creator: v.creator,
        youtubeId: v.youtubeId
      }));
    });
  });
});

// Verification report
console.log('=== Curriculum Verification Report ===\n');

let correctDays = 0;
let incorrectDays = 0;
let totalVideosExpected = 0;
let totalVideosActual = 0;

// Check each day
for (let day = 1; day <= 40; day++) {
  const expected = expectedVideosByDay[day] || [];
  const actual = actualVideosByDay[day] || [];
  
  totalVideosExpected += expected.length;
  totalVideosActual += actual.length;
  
  if (expected.length !== actual.length) {
    console.log(`❌ Day ${day}: Expected ${expected.length} videos, got ${actual.length}`);
    incorrectDays++;
  } else if (expected.length > 0) {
    // Check if videos match
    let allMatch = true;
    for (let i = 0; i < expected.length; i++) {
      if (expected[i].youtubeId !== actual[i]?.youtubeId) {
        allMatch = false;
        break;
      }
    }
    
    if (allMatch) {
      console.log(`✅ Day ${day}: All ${expected.length} videos correctly placed`);
      correctDays++;
    } else {
      console.log(`⚠️  Day ${day}: Video IDs don't match`);
      incorrectDays++;
    }
  }
}

console.log('\n=== Summary ===');
console.log(`Total days checked: 40`);
console.log(`Correct days: ${correctDays}`);
console.log(`Incorrect days: ${incorrectDays}`);
console.log(`Total expected videos: ${totalVideosExpected}`);
console.log(`Total actual videos: ${totalVideosActual}`);

// List sample videos from Day 1
console.log('\n=== Sample: Day 1 Videos ===');
if (actualVideosByDay[1]) {
  actualVideosByDay[1].forEach((video, index) => {
    console.log(`${index + 1}. ${video.title} by ${video.creator}`);
    console.log(`   YouTube ID: ${video.youtubeId}`);
  });
}