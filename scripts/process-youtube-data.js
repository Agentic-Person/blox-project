const fs = require('fs');
const path = require('path');

// Read the YouTube video document
const videoDocPath = path.join(__dirname, '../docs/YouTube video titles-content-creator-URL-link-8-23-2025.md');
const videoDocContent = fs.readFileSync(videoDocPath, 'utf-8');

// Parse the document to extract video data
function parseVideoDocument(content) {
  const lines = content.split('\n');
  const videos = [];
  
  lines.forEach(line => {
    // Skip header lines and empty lines
    if (line.includes('---') || !line.trim() || line.includes('| Day |')) {
      return;
    }
    
    // Parse table rows with video data
    const match = line.match(/\|\s*(\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*\[Watch\]\(https:\/\/www\.youtube\.com\/watch\?v=([^)]+)\)/);
    if (match) {
      const [, day, title, creator, videoId] = match;
      videos.push({
        day: parseInt(day),
        title: title.trim(),
        creator: creator.trim(),
        youtubeId: videoId.trim()
      });
    }
  });
  
  return videos;
}

// Group videos by day
function groupVideosByDay(videos) {
  const videosByDay = {};
  
  videos.forEach(video => {
    if (!videosByDay[video.day]) {
      videosByDay[video.day] = [];
    }
    videosByDay[video.day].push(video);
  });
  
  return videosByDay;
}

// Extract video IDs and organize by module and week
function organizeVideosForCurriculum(videosByDay) {
  const organized = {
    module1: { // Days 1-20
      week1: { days: [1, 2, 3, 4, 5] },
      week2: { days: [6, 7, 8, 9, 10] },
      week3: { days: [11, 12, 13, 14, 15] },
      week4: { days: [16, 17, 18, 19, 20] }
    },
    module2: { // Days 21-40
      week5: { days: [21, 22, 23, 24, 25] },
      week6: { days: [26, 27, 28, 29, 30] },
      week7: { days: [31, 32, 33, 34, 35] },
      week8: { days: [36, 37, 38, 39, 40] }
    },
    module3: { // Days 41-60
      week9: { days: [41, 42, 43, 44, 45] },
      week10: { days: [46, 47, 48, 49, 50] },
      week11: { days: [51, 52, 53, 54, 55] },
      week12: { days: [56, 57, 58, 59, 60] }
    },
    module4: { // Days 61-80
      week13: { days: [61, 62, 63, 64, 65] },
      week14: { days: [66, 67, 68, 69, 70] },
      week15: { days: [71, 72, 73, 74, 75] },
      week16: { days: [76, 77, 78, 79, 80] }
    },
    module5: { // Days 81-100
      week17: { days: [81, 82, 83, 84, 85] },
      week18: { days: [86, 87, 88, 89, 90] },
      week19: { days: [91, 92, 93, 94, 95] },
      week20: { days: [96, 97, 98, 99, 100] }
    },
    module6: { // Days 101-120
      week21: { days: [101, 102, 103, 104, 105] },
      week22: { days: [106, 107, 108, 109, 110] },
      week23: { days: [111, 112, 113, 114, 115] },
      week24: { days: [116, 117, 118, 119, 120] }
    }
  };
  
  const result = {};
  
  Object.entries(organized).forEach(([moduleKey, moduleData]) => {
    result[moduleKey] = {};
    
    Object.entries(moduleData).forEach(([weekKey, weekData]) => {
      result[moduleKey][weekKey] = {};
      
      weekData.days.forEach(dayNum => {
        const dayVideos = videosByDay[dayNum] || [];
        result[moduleKey][weekKey][`day${dayNum}`] = dayVideos;
      });
    });
  });
  
  return result;
}

// Main processing
console.log('Processing YouTube video data...');

const videos = parseVideoDocument(videoDocContent);
console.log(`Found ${videos.length} videos total`);

const videosByDay = groupVideosByDay(videos);
console.log(`Videos organized across ${Object.keys(videosByDay).length} days`);

const organizedVideos = organizeVideosForCurriculum(videosByDay);

// Save the processed data
const outputPath = path.join(__dirname, '../src/data/youtube-videos.json');
fs.writeFileSync(outputPath, JSON.stringify(organizedVideos, null, 2));
console.log(`Processed video data saved to ${outputPath}`);

// Also save a flat list for reference
const flatListPath = path.join(__dirname, '../src/data/youtube-videos-flat.json');
fs.writeFileSync(flatListPath, JSON.stringify(videos, null, 2));
console.log(`Flat video list saved to ${flatListPath}`);

// Print summary statistics
console.log('\nSummary:');
console.log('--------');
Object.entries(videosByDay).forEach(([day, dayVideos]) => {
  console.log(`Day ${day}: ${dayVideos.length} video(s)`);
});