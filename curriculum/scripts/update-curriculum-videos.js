const fs = require('fs');
const path = require('path');

// Load the existing curriculum
const curriculumPath = path.join(__dirname, '../src/data/curriculum.json');
const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));

// Load the processed YouTube videos
const youtubeVideosPath = path.join(__dirname, '../src/data/youtube-videos.json');
const youtubeVideos = JSON.parse(fs.readFileSync(youtubeVideosPath, 'utf-8'));

// Helper function to estimate duration from title
function estimateDuration(title) {
  // Default durations based on content type
  if (title.toLowerCase().includes('complete') || title.toLowerCase().includes('guide')) {
    return '35:00';
  } else if (title.toLowerCase().includes('tutorial') || title.toLowerCase().includes('basics')) {
    return '25:00';
  } else if (title.toLowerCase().includes('tips') || title.toLowerCase().includes('quick')) {
    return '15:00';
  }
  return '20:00';
}

// Helper function to calculate XP based on duration
function calculateXP(duration) {
  const [minutes] = duration.split(':').map(Number);
  if (minutes >= 35) return 70;
  if (minutes >= 25) return 50;
  if (minutes >= 15) return 30;
  return 20;
}

// Update the curriculum with real YouTube data
function updateCurriculum() {
  let updatedCount = 0;
  let placeholderCount = 0;

  // Process each module
  curriculum.modules.forEach((module, moduleIndex) => {
    const moduleKey = `module${moduleIndex + 1}`;
    const moduleVideos = youtubeVideos[moduleKey];

    if (!moduleVideos) {
      console.log(`No video data for ${moduleKey}, keeping placeholders`);
      return;
    }

    // Process each week
    module.weeks.forEach((week, weekIndex) => {
      const weekKey = `week${(moduleIndex * 4) + weekIndex + 1}`;
      const weekVideos = moduleVideos[weekKey];

      if (!weekVideos) {
        console.log(`No video data for ${weekKey}, keeping placeholders`);
        return;
      }

      // Process each day
      week.days.forEach((day, dayIndex) => {
        const dayNum = (moduleIndex * 20) + (weekIndex * 5) + dayIndex + 1;
        const dayKey = `day${dayNum}`;
        const dayVideos = weekVideos[dayKey];

        if (!dayVideos || dayVideos.length === 0) {
          console.log(`No videos for ${dayKey}, keeping placeholders`);
          placeholderCount += day.videos.length;
          return;
        }

        // Replace placeholder videos with real ones
        if (dayVideos.length === 1) {
          // If we have only one real video for the day, update the first video
          const video = dayVideos[0];
          if (day.videos[0]) {
            day.videos[0].title = video.title;
            day.videos[0].youtubeId = video.youtubeId;
            day.videos[0].creator = video.creator;
            day.videos[0].duration = estimateDuration(video.title);
            day.videos[0].xpReward = calculateXP(day.videos[0].duration);
            updatedCount++;
          }
        } else {
          // If we have multiple real videos, replace all videos for the day
          day.videos = dayVideos.map((video, index) => ({
            id: `video-${moduleIndex + 1}-${weekIndex + 1}-${dayIndex + 1}-${index + 1}`,
            title: video.title,
            youtubeId: video.youtubeId,
            creator: video.creator,
            duration: estimateDuration(video.title),
            xpReward: calculateXP(estimateDuration(video.title))
          }));
          updatedCount += dayVideos.length;
        }
      });
    });
  });

  // For days 41-120, generate realistic placeholder data
  console.log('\nGenerating enhanced placeholders for days 41-120...');
  
  // Module 3 (days 41-60) - already has some structure
  // Module 4 (days 61-80) - already has some structure  
  // Module 5 (days 81-100) - already has some structure
  // Module 6 (days 101-120) - already has some structure
  
  // These modules keep their existing structure but we'll mark them clearly as placeholders
  for (let moduleIndex = 2; moduleIndex < 6; moduleIndex++) {
    const module = curriculum.modules[moduleIndex];
    module.weeks.forEach((week, weekIndex) => {
      week.days.forEach((day, dayIndex) => {
        day.videos.forEach((video, videoIndex) => {
          if (!video.youtubeId || video.youtubeId.startsWith('placeholder')) {
            // Keep the existing educational titles but mark as placeholder
            video.youtubeId = `placeholder_${moduleIndex + 1}_${weekIndex + 1}_${dayIndex + 1}_${videoIndex + 1}`;
            video.creator = 'Coming Soon';
            placeholderCount++;
          }
        });
      });
    });
  }

  return { updatedCount, placeholderCount };
}

// Run the update
console.log('Updating curriculum with real YouTube video IDs...\n');
const { updatedCount, placeholderCount } = updateCurriculum();

// Save the updated curriculum
const outputPath = path.join(__dirname, '../src/data/curriculum.json');
fs.writeFileSync(outputPath, JSON.stringify(curriculum, null, 2));

console.log('\n✅ Curriculum updated successfully!');
console.log(`📹 ${updatedCount} videos updated with real YouTube IDs`);
console.log(`⏳ ${placeholderCount} videos remain as placeholders (days 41-120)`);
console.log(`📁 Updated curriculum saved to ${outputPath}`);