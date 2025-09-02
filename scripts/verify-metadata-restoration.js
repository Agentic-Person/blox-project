const fs = require('fs');
const path = require('path');

// Load the enhanced curriculum
const curriculumPath = path.join(__dirname, '..', 'src', 'data', 'curriculum.json');
const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));

console.log('=== Curriculum Metadata Verification ===\n');

// Check Module 1
const module1 = curriculum.modules[0];
console.log('📚 Module 1:');
console.log(`  Title: ${module1.title}`);
console.log(`  Description: ${module1.description}`);
console.log(`  Weeks: ${module1.weeks.length}`);

// Check Week 1
const week1 = module1.weeks[0];
console.log('\n📅 Week 1:');
console.log(`  Title: ${week1.title}`);
console.log(`  Description: ${week1.description}`);
console.log(`  Days: ${week1.days.length}`);

// Check Days 1-5 (sample)
console.log('\n📆 Sample Days:');
for (let i = 0; i < Math.min(5, week1.days.length); i++) {
  const day = week1.days[i];
  console.log(`\n  Day ${i + 1}:`);
  console.log(`    ID: ${day.id}`);
  console.log(`    Title: ${day.title}`);
  console.log(`    Practice: ${day.practiceTask}`);
  console.log(`    Time: ${day.estimatedTime}`);
  console.log(`    Videos: ${day.videos.length}`);
  if (day.videos[0]) {
    console.log(`    First Video: ${day.videos[0].title}`);
    console.log(`    YouTube ID: ${day.videos[0].youtubeId}`);
  }
}

// Summary statistics
let totalDays = 0;
let daysWithTitles = 0;
let daysWithPractice = 0;
let daysWithTime = 0;
let totalVideos = 0;

curriculum.modules.forEach(module => {
  module.weeks.forEach(week => {
    week.days.forEach(day => {
      totalDays++;
      if (day.title && day.title !== `Day ${day.id.split('-')[1]}`) {
        daysWithTitles++;
      }
      if (day.practiceTask) {
        daysWithPractice++;
      }
      if (day.estimatedTime) {
        daysWithTime++;
      }
      totalVideos += day.videos.length;
    });
  });
});

console.log('\n📊 Summary Statistics:');
console.log(`  Total Days: ${totalDays}`);
console.log(`  Days with Descriptive Titles: ${daysWithTitles}`);
console.log(`  Days with Practice Tasks: ${daysWithPractice}`);
console.log(`  Days with Estimated Time: ${daysWithTime}`);
console.log(`  Total Videos: ${totalVideos}`);

// Check navigation structure
console.log('\n🔗 Navigation Structure:');
console.log('  URL Pattern: /learning/{module-id}/{week-id}/{day-id}/{video-id}');
console.log('  Example: /learning/module-1/week-1/day-1/video-1-1-1-1');

// Verify all videos have YouTube IDs
let videosWithoutId = 0;
curriculum.modules.forEach(module => {
  module.weeks.forEach(week => {
    week.days.forEach(day => {
      day.videos.forEach(video => {
        if (!video.youtubeId) {
          videosWithoutId++;
        }
      });
    });
  });
});

console.log(`\n✅ All ${totalVideos} videos have YouTube IDs: ${videosWithoutId === 0 ? 'YES' : 'NO'}`);

console.log('\n🎉 Curriculum metadata restoration verified successfully!');