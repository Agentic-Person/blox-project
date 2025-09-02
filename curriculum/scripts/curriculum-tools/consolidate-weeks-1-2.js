#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Consolidates Week 1 and Week 2 content into a single "Introduction to Roblox Studio" week
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

function generateVideoId(moduleIndex, weekIndex, dayIndex, videoIndex) {
  return `video-${moduleIndex + 1}-${weekIndex + 1}-${dayIndex + 1}-${videoIndex + 1}`;
}

function consolidateWeeks() {
  console.log('🚀 Starting Week 1 & 2 consolidation...');
  
  const curriculum = loadCurriculum();
  const module1 = curriculum.modules[0];
  const week1 = module1.weeks[0];
  const week2 = module1.weeks[1];
  
  console.log(`📊 Current Week 1: ${week1.title} (${week1.days.reduce((total, day) => total + day.videos.length, 0)} videos)`);
  console.log(`📊 Current Week 2: ${week2.title} (${week2.days.reduce((total, day) => total + day.videos.length, 0)} videos)`);
  
  // Collect all videos from both weeks
  const allVideos = [];
  
  // Week 1 videos
  week1.days.forEach(day => {
    day.videos.forEach(video => {
      allVideos.push({
        ...video,
        sourceWeek: 1,
        sourceDay: day.title
      });
    });
  });
  
  // Week 2 videos  
  week2.days.forEach(day => {
    day.videos.forEach(video => {
      allVideos.push({
        ...video,
        sourceWeek: 2,
        sourceDay: day.title
      });
    });
  });
  
  console.log(`🎬 Total videos collected: ${allVideos.length}`);
  
  // New consolidated week structure
  const consolidatedWeek = {
    id: "week-1",
    title: "Introduction to Roblox Studio",
    description: "Complete introduction to Roblox Studio 2025 - from interface basics to creating your first game",
    days: [
      {
        id: "day-1",
        title: "D1: Getting Started with Roblox Studio",
        videos: [
          // 39:33 + 12:45 + 8:12 + 6:54 = 67 minutes
          allVideos[0],  // The ULTIMATE Beginner Guide (39:33)
          allVideos[1],  // How to Use Creator Hub (12:45)
          allVideos[9],  // Team Create (8:12)
          allVideos[8],  // Group and UnGroup (6:54)
        ],
        practiceTask: "Set up Roblox Studio, explore Creator Hub, and practice basic workspace organization",
        estimatedTime: "1.1h"
      },
      {
        id: "day-2", 
        title: "D2: Studio Interface & Tools",
        videos: [
          // 15:34 + 11:28 + 9:17 + 7:43 + 9:47 = 54 minutes
          allVideos[2],  // AlvinBlox Guide (15:34)
          allVideos[3],  // ByteBlox Basics (11:28)
          allVideos[4],  // Properties Tutorial (9:17)
          allVideos[5],  // Part Properties (7:43)
          allVideos[17], // Lighting effects (9:47)
        ],
        practiceTask: "Master Studio tools, understand properties panel, and experiment with basic lighting",
        estimatedTime: "0.9h"
      },
      {
        id: "day-3",
        title: "D3: Building Fundamentals", 
        videos: [
          // 13:22 + 10:15 + 14:27 + 12:18 + 11:23 = 62 minutes
          allVideos[6],  // Building Tutorial Basics (13:22)
          allVideos[7],  // How to Build for Beginners (10:15)
          allVideos[10], // Terrain Editor (14:27)
          allVideos[11], // Build Terrain (12:18)
          allVideos[16], // Lighting Effects (11:23)
        ],
        practiceTask: "Create basic structures, experiment with terrain tools, and add atmospheric lighting",
        estimatedTime: "1.0h"
      },
      {
        id: "day-4",
        title: "D4: Advanced Building & Physics",
        videos: [
          // 16:45 + 13:32 + 14:16 = 44 minutes
          allVideos[12], // Physics & Constraints Part 1 (16:45)
          allVideos[13], // Physics & Constraints Part 2 (13:32)
          allVideos[19], // UI Layouts (14:16)
        ],
        practiceTask: "Implement physics systems, create constraints, and design basic user interfaces",
        estimatedTime: "0.7h"
      },
      {
        id: "day-5",
        title: "D5: Creating Your First Game",
        videos: [
          // 18:29 + 22:47 + 10:33 = 52 minutes
          allVideos[18], // GUI Interface (18:29)
          allVideos[15], // Make A Roblox Game (22:47)
          allVideos[14], // Publish Your Game (10:33)
        ],
        practiceTask: "Create a complete game with GUI, gameplay mechanics, and publish to Roblox",
        estimatedTime: "0.9h"
      }
    ]
  };
  
  // Update video IDs for the new structure
  consolidatedWeek.days.forEach((day, dayIndex) => {
    day.videos.forEach((video, videoIndex) => {
      video.id = generateVideoId(0, 0, dayIndex, videoIndex);
      // Remove source tracking
      delete video.sourceWeek;
      delete video.sourceDay;
    });
  });
  
  // Replace Week 1 with consolidated content
  week1.title = consolidatedWeek.title;
  week1.description = consolidatedWeek.description;
  week1.days = consolidatedWeek.days;
  
  console.log('\n✅ Week 1 Updated:');
  week1.days.forEach((day, index) => {
    const dayMinutes = day.videos.reduce((total, video) => {
      const parts = video.duration.split(':');
      return total + parseInt(parts[0]) + (parts[1] ? parseInt(parts[1])/60 : 0);
    }, 0);
    console.log(`   Day ${index + 1}: ${day.videos.length} videos, ${Math.round(dayMinutes)} minutes - ${day.title}`);
  });
  
  // Clear Week 2 for future content
  week2.title = "W2: [Available for New Content]";
  week2.description = "This week is available for new curriculum content";
  week2.days = week2.days.map((day, dayIndex) => ({
    id: `day-${dayIndex + 1}`,
    title: `D${dayIndex + 1}: [Available for New Content]`,
    videos: [],
    practiceTask: "Content to be added",
    estimatedTime: "TBD"
  }));
  
  console.log('\n📝 Week 2 Cleared for future content');
  
  return curriculum;
}

async function main() {
  try {
    console.log('🎯 Consolidating Weeks 1 & 2 into "Introduction to Roblox Studio"...');
    
    const updatedCurriculum = consolidateWeeks();
    
    saveCurriculum(updatedCurriculum);
    
    console.log('\n✅ Successfully consolidated weeks!');
    console.log('📍 Week 1: Introduction to Roblox Studio (20 videos across 5 days)');
    console.log('📍 Week 2: Cleared and ready for new content');
    
    // Calculate totals
    const week1 = updatedCurriculum.modules[0].weeks[0];
    const totalVideos = week1.days.reduce((total, day) => total + day.videos.length, 0);
    const totalMinutes = week1.days.reduce((total, day) => {
      return total + day.videos.reduce((dayTotal, video) => {
        const parts = video.duration.split(':');
        return dayTotal + parseInt(parts[0]) + (parts[1] ? parseInt(parts[1])/60 : 0);
      }, 0);
    }, 0);
    
    console.log(`\n📊 Final Statistics:`);
    console.log(`   Total Videos: ${totalVideos}`);
    console.log(`   Total Time: ${Math.round(totalMinutes)} minutes (${(totalMinutes/60).toFixed(1)} hours)`);
    console.log(`   Average per Day: ${Math.round(totalMinutes/5)} minutes`);
    
  } catch (error) {
    console.error('❌ Error during consolidation:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { consolidateWeeks };