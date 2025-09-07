const fs = require('fs');
const path = require('path');

// Load the extracted playlist data
const playlistFile = 'playlist-PLZ1b66Z1KFKhO7R6Q588cdWxdnVxpPmA8-curriculum-2025-09-02T23-30-41-422Z.json';
const playlistPath = path.join(__dirname, '../src/data', playlistFile);

if (!fs.existsSync(playlistPath)) {
  console.error(`Error: Could not find playlist data at ${playlistPath}`);
  console.log('Please run fetch-playlist-with-transcripts.js first');
  process.exit(1);
}

const playlistVideos = JSON.parse(fs.readFileSync(playlistPath, 'utf-8'));
console.log(`Loaded ${playlistVideos.length} videos from playlist`);

// Load current curriculum
const curriculumPath = path.join(__dirname, '../src/data/curriculum.json');
const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));

// Create backup
const backupPath = path.join(__dirname, '../src/data/curriculum-backup-' + Date.now() + '.json');
fs.writeFileSync(backupPath, JSON.stringify(curriculum, null, 2));
console.log(`Created backup at: ${backupPath}`);

// Find Module 1, Week 3
const module1 = curriculum.modules.find(m => m.id === 'module-1');
if (!module1) {
  console.error('Error: Could not find module-1 in curriculum');
  process.exit(1);
}

const week3 = module1.weeks.find(w => w.id === 'week-3');
if (!week3) {
  console.error('Error: Could not find week-3 in module-1');
  process.exit(1);
}

console.log(`Found Week 3: ${week3.title}`);
console.log(`Current days in week 3: ${week3.days.length}`);

// Update week 3 title and description to reflect Unity content
week3.title = "W3: Unity 6 Game Development Fundamentals";
week3.description = "Complete Unity 6 tutorial series covering basics, materials, prefabs, lighting, physics, and game development fundamentals";

// Distribute 20 videos across 4 days (5 videos each)
const videosPerDay = 5;
const dayTitles = [
  "D11: Unity Basics & Materials", // Videos 1-5
  "D12: Prefabs, Lighting & Physics", // Videos 6-10  
  "D13: Animation & UI Systems", // Videos 11-15
  "D14: Audio, Collectables & Interactions" // Videos 16-20
];

const dayDescriptions = [
  "Learn Unity interface basics, textures, materials, and fundamental concepts",
  "Master prefabs, lighting systems, shadows, gravity, and physics in Unity",
  "Explore animations, UI canvas, Text Mesh Pro, and user interface design",
  "Implement audio systems, collectables, raycasting, and object interactions"
];

const practiceTasks = [
  "Set up Unity 6, explore the interface, create basic materials and textures",
  "Build prefabs, experiment with lighting and shadows, test physics systems",
  "Create animations, design UI elements, work with Text Mesh Pro components",
  "Add sound effects and music, implement collectables, create object interactions"
];

// Update the first 4 days with new video content
for (let dayIndex = 0; dayIndex < 4; dayIndex++) {
  const dayId = `day-${11 + dayIndex}`;
  let day = week3.days.find(d => d.id === dayId);
  
  if (!day) {
    // Create new day if it doesn't exist
    day = {
      id: dayId,
      title: dayTitles[dayIndex],
      videos: [],
      practiceTask: practiceTasks[dayIndex],
      estimatedTime: "2.5h"
    };
    week3.days.push(day);
  } else {
    // Update existing day
    day.title = dayTitles[dayIndex];
    day.practiceTask = practiceTasks[dayIndex];
    day.videos = [];
  }
  
  // Add 5 videos to this day
  const startIndex = dayIndex * videosPerDay;
  const endIndex = startIndex + videosPerDay;
  
  for (let videoIndex = startIndex; videoIndex < endIndex && videoIndex < playlistVideos.length; videoIndex++) {
    const sourceVideo = playlistVideos[videoIndex];
    
    const curriculumVideo = {
      id: `video-1-3-${dayIndex + 1}-${(videoIndex % videosPerDay) + 1}`,
      title: sourceVideo.title,
      creator: sourceVideo.creator,
      description: sourceVideo.description,
      youtubeId: sourceVideo.youtubeId,
      duration: sourceVideo.duration,
      totalMinutes: sourceVideo.totalMinutes,
      thumbnail: sourceVideo.thumbnail,
      xpReward: sourceVideo.xpReward,
      hasTranscript: sourceVideo.hasTranscript,
      source: {
        playlistId: 'PLZ1b66Z1KFKhO7R6Q588cdWxdnVxpPmA8',
        originalPosition: videoIndex + 1,
        extractedAt: new Date().toISOString()
      }
    };
    
    day.videos.push(curriculumVideo);
  }
  
  console.log(`Updated ${day.id}: ${day.title} (${day.videos.length} videos)`);
}

// Ensure day 15 exists but leave it empty as requested
const day15Id = 'day-15';
let day15 = week3.days.find(d => d.id === day15Id);

if (!day15) {
  day15 = {
    id: day15Id,
    title: "D15: Week Review & Practice",
    videos: [],
    practiceTask: "Review the week's concepts and practice building your own Unity project",
    estimatedTime: "3h"
  };
  week3.days.push(day15);
} else {
  // Clear existing videos but keep the structure
  day15.title = "D15: Week Review & Practice";
  day15.videos = [];
  day15.practiceTask = "Review the week's concepts and practice building your own Unity project";
}

console.log(`Kept ${day15.id} empty as requested`);

// Sort days by ID to ensure proper order
week3.days.sort((a, b) => {
  const getNumFromId = (id) => parseInt(id.split('-')[1]);
  return getNumFromId(a.id) - getNumFromId(b.id);
});

// Update metadata
const totalVideos = week3.days.reduce((sum, day) => sum + day.videos.length, 0);
console.log(`\nSummary:`);
console.log(`- Updated Week 3 with ${totalVideos} Unity 6 tutorial videos`);
console.log(`- Distributed across 4 days (5 videos each)`);
console.log(`- Left Day 15 empty for future content`);

// Add metadata to the week
week3.metadata = {
  lastUpdated: new Date().toISOString(),
  videoSource: 'Jimmy Vegas Unity 6 Tutorial Playlist',
  playlistId: 'PLZ1b66Z1KFKhO7R6Q588cdWxdnVxpPmA8',
  totalVideos: totalVideos,
  updatedBy: 'curriculum-update-script'
};

// Save updated curriculum
fs.writeFileSync(curriculumPath, JSON.stringify(curriculum, null, 2));
console.log(`\n✅ Curriculum updated successfully!`);
console.log(`📁 Backup saved to: ${backupPath}`);

// Display the updated structure
console.log(`\n📋 Updated Week 3 Structure:`);
week3.days.forEach(day => {
  console.log(`  ${day.id}: ${day.title} (${day.videos.length} videos)`);
  if (day.videos.length > 0) {
    day.videos.forEach((video, index) => {
      console.log(`    ${index + 1}. ${video.title} (${video.duration})`);
    });
  }
});

console.log(`\n⚠️  Note: These are Unity 6 tutorials, not Roblox tutorials.`);
console.log(`   You may want to find Roblox-specific content for better curriculum alignment.`);

module.exports = {
  playlistVideos,
  updatedWeek: week3
};