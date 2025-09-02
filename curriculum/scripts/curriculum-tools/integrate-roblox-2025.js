#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Integrates Roblox Studio 2025 Basics curriculum into Weeks 1 and 2
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

function extractYouTubeId(url) {
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : 'YOUTUBE_ID_PLACEHOLDER';
}

function generateVideoId(moduleIndex, weekIndex, dayIndex, videoIndex) {
  return `video-${moduleIndex + 1}-${weekIndex + 1}-${dayIndex + 1}-${videoIndex + 1}`;
}

// Roblox Studio 2025 Basics - 10-Day Curriculum Data
const robloxVideosData = {
  week1: {
    title: "Roblox Studio 2025 Basics - Part One",
    description: "Master the new Creator Hub and Roblox Studio 2025 interface fundamentals",
    days: [
      {
        title: "D1: New Creator Hub and Studio Interface",
        topic: "Creator Hub & Studio Interface",
        practiceTask: "Set up Creator Hub account and navigate Studio interface",
        videos: [
          {
            title: "How To Access Creator Hub on Roblox Mobile App - Full Guide",
            creator: "JustBOZ",
            url: "https://www.youtube.com/watch?v=futOITieBkI",
            duration: "8:23"
          },
          {
            title: "How to Use the Roblox Creator Hub",
            creator: "Driple Studios", 
            url: "https://www.youtube.com/watch?v=m-GoBc0JSB8",
            duration: "12:45"
          }
        ]
      },
      {
        title: "D2: Studio Tools and Workspace Building Fundamentals",
        topic: "Studio Tools & Workspace",
        practiceTask: "Master essential Studio tools and customize workspace",
        videos: [
          {
            title: "The ULTIMATE Beginner Guide to Roblox Studio! (2025)",
            creator: "AlvinBlox",
            url: "https://www.youtube.com/watch?v=iHxioRE8kRU",
            duration: "15:34"
          },
          {
            title: "Roblox Studio Basics - Roblox Beginners Scripting Tutorial #1 (2025)",
            creator: "ByteBlox",
            url: "https://www.youtube.com/watch?v=9MUgLaF22Yo",
            duration: "11:28"
          }
        ]
      },
      {
        title: "D3: Properties and Basic Part Manipulation",
        topic: "Properties & Fundamentals",
        practiceTask: "Practice modifying part properties and basic manipulation",
        videos: [
          {
            title: "Properties - Roblox Beginners Scripting Tutorial #5 (2025)",
            creator: "ByteBlox",
            url: "https://www.youtube.com/watch?v=zuwX4qwQTs8",
            duration: "9:17"
          },
          {
            title: "The properties of a part in roblox Studio",
            creator: "Tutorial Creator",
            url: "https://www.youtube.com/watch?v=0BgjU--bLsw",
            duration: "7:43"
          }
        ]
      },
      {
        title: "D4: Basic Building Techniques",
        topic: "Basic Building Techniques", 
        practiceTask: "Build basic structures using fundamental techniques",
        videos: [
          {
            title: "Roblox Studio - Building Tutorial | Basics",
            creator: "Building Tutorial Creator",
            url: "https://www.youtube.com/watch?v=EAtKeffHRRI",
            duration: "13:22"
          },
          {
            title: "ROBLOX - How to Build for Beginners",
            creator: "CovertCode",
            url: "https://www.youtube.com/watch?v=xQcT7sS6Z2o",
            duration: "10:15"
          }
        ]
      },
      {
        title: "D5: Groups and Organization",
        topic: "Groups & Organization",
        practiceTask: "Organize workspace with groups and team create features",
        videos: [
          {
            title: "Group and UnGroup to Organize Parts (Roblox Studio Tutorial for Beginners)",
            creator: "PrizeCP Roblox",
            url: "https://www.youtube.com/watch?v=AqbwjzzRdaA",
            duration: "6:54"
          },
          {
            title: "How To Use Team Create in Roblox Studio 2025! Tutorial",
            creator: "Tutorial Workspace",
            url: "https://www.youtube.com/watch?v=RXWft-DBlPw",
            duration: "8:12"
          }
        ]
      }
    ]
  },
  week2: {
    title: "Roblox Studio 2025 Basics - Part Two",
    description: "Advanced Studio features including terrain, physics, lighting, UI, and game publishing",
    days: [
      {
        title: "D1: Terrain Tools and Environment Models",
        topic: "Terrain Tools & Environment Models",
        practiceTask: "Create terrain environments and landscapes",
        videos: [
          {
            title: "How To Use Terrain Editor in Roblox Studio 2025! Tutorial",
            creator: "Tutorial Workspace",
            url: "https://www.youtube.com/watch?v=cKkPMozEWWE",
            duration: "14:27"
          },
          {
            title: "How to Build Terrain on Roblox Studio! (2025)",
            creator: "Super",
            url: "https://www.youtube.com/watch?v=yUWE-bEBJWA",
            duration: "12:18"
          }
        ]
      },
      {
        title: "D2: Physics and Constraints",
        topic: "Physics & Constraints",
        practiceTask: "Implement physics and constraints in your builds",
        videos: [
          {
            title: "ROBLOX Building - How to use all Physics & Constraints - Part 1",
            creator: "Physics Tutorial Creator",
            url: "https://www.youtube.com/watch?v=Rx0v2aYAF2Q",
            duration: "16:45"
          },
          {
            title: "ROBLOX Building - How to use all Physics & Constraints - Part 2", 
            creator: "Physics Tutorial Creator",
            url: "https://www.youtube.com/watch?v=aIh9fkZz-Uw",
            duration: "13:32"
          }
        ]
      },
      {
        title: "D3: Lighting and Atmosphere",
        topic: "Lighting & Atmosphere",
        practiceTask: "Design atmospheric lighting for your game environment",
        videos: [
          {
            title: "NEW! How to Add Lighting Effects in Roblox Studio in 2025!",
            creator: "SOLVED IT",
            url: "https://www.youtube.com/watch?v=kXh1scXpDdM",
            duration: "11:23"
          },
          {
            title: "How to use lighting and effects on Roblox",
            creator: "Lighting Tutorial Creator",
            url: "https://www.youtube.com/watch?v=UPMWq2viV5I",
            duration: "9:47"
          }
        ]
      },
      {
        title: "D4: UI Design Basics",
        topic: "UI Design Basics",
        practiceTask: "Create basic user interfaces for your game",
        videos: [
          {
            title: "How To Create a GUI Interface in Roblox Studio 2025! Tutorial",
            creator: "Tutorial Workspace",
            url: "https://www.youtube.com/watch?v=sq4PM0xURMs",
            duration: "18:29"
          },
          {
            title: "UI Layouts - Roblox GUI Tutorial #13 (2025)",
            creator: "ByteBlox",
            url: "https://www.youtube.com/watch?v=jRnyca_BWZQ",
            duration: "14:16"
          }
        ]
      },
      {
        title: "D5: First Game Environment",
        topic: "First Game Environment",
        practiceTask: "Create and publish your first complete game environment",
        videos: [
          {
            title: "How To Publish Your Roblox Game in Roblox Studio 2025! Tutorial",
            creator: "Tutorial Workspace",
            url: "https://www.youtube.com/watch?v=rwDsm2x5iTU",
            duration: "10:33"
          },
          {
            title: "How To Make A Roblox Game - 2023 Beginner Tutorial!",
            creator: "AlvinBlox",
            url: "https://www.youtube.com/watch?v=vCpl5M_9mcQ",
            duration: "22:47"
          }
        ]
      }
    ]
  }
};

function integrateRobloxStudio2025() {
  console.log('🚀 Starting Roblox Studio 2025 integration...');
  
  const curriculum = loadCurriculum();
  const module1 = curriculum.modules[0];
  
  console.log('📚 Updating Week 1 and Week 2 with Roblox Studio 2025 content...');
  
  // Update Week 1
  const week1 = module1.weeks[0];
  week1.title = robloxVideosData.week1.title;
  week1.description = robloxVideosData.week1.description;
  
  robloxVideosData.week1.days.forEach((dayData, dayIndex) => {
    if (dayIndex < week1.days.length) {
      const day = week1.days[dayIndex];
      day.title = dayData.title;
      day.practiceTask = dayData.practiceTask;
      day.estimatedTime = `${Math.round(dayData.videos.length * 12 / 60 * 100) / 100}h`;
      
      // Replace videos
      day.videos = dayData.videos.map((videoData, videoIndex) => ({
        id: generateVideoId(0, 0, dayIndex, videoIndex),
        title: videoData.title,
        youtubeId: extractYouTubeId(videoData.url),
        creator: videoData.creator,
        duration: videoData.duration,
        xpReward: 25,
        thumbnail: '/images/placeholder-thumbnail.jpg'
      }));
    }
  });
  
  // Update Week 2
  const week2 = module1.weeks[1];
  week2.title = robloxVideosData.week2.title;
  week2.description = robloxVideosData.week2.description;
  
  robloxVideosData.week2.days.forEach((dayData, dayIndex) => {
    if (dayIndex < week2.days.length) {
      const day = week2.days[dayIndex];
      day.title = dayData.title;
      day.practiceTask = dayData.practiceTask;
      day.estimatedTime = `${Math.round(dayData.videos.length * 12 / 60 * 100) / 100}h`;
      
      // Replace videos
      day.videos = dayData.videos.map((videoData, videoIndex) => ({
        id: generateVideoId(0, 1, dayIndex, videoIndex),
        title: videoData.title,
        youtubeId: extractYouTubeId(videoData.url),
        creator: videoData.creator,
        duration: videoData.duration,
        xpReward: 25,
        thumbnail: '/images/placeholder-thumbnail.jpg'
      }));
    }
  });
  
  console.log('✅ Week 1 updated with Roblox Studio 2025 Basics - Part One');
  console.log(`   - 5 days with ${robloxVideosData.week1.days.reduce((total, day) => total + day.videos.length, 0)} total videos`);
  
  console.log('✅ Week 2 updated with Roblox Studio 2025 Basics - Part Two');
  console.log(`   - 5 days with ${robloxVideosData.week2.days.reduce((total, day) => total + day.videos.length, 0)} total videos`);
  
  return curriculum;
}

async function main() {
  try {
    console.log('🎯 Integrating Roblox Studio 2025 Basics curriculum...');
    
    const updatedCurriculum = integrateRobloxStudio2025();
    
    saveCurriculum(updatedCurriculum);
    
    console.log('\n✅ Successfully integrated Roblox Studio 2025 curriculum!');
    console.log('📍 Updated: Module 1, Weeks 1-2');
    console.log('📚 Total Videos: 20 (10 per week, 2 per day)');
    
    // Show summary
    const module1 = updatedCurriculum.modules[0];
    console.log('\n📊 Updated Weeks Summary:');
    console.log(`Week 1: ${module1.weeks[0].title}`);
    module1.weeks[0].days.forEach((day, index) => {
      console.log(`   Day ${index + 1}: ${day.videos.length} videos - ${day.title}`);
    });
    console.log(`Week 2: ${module1.weeks[1].title}`);
    module1.weeks[1].days.forEach((day, index) => {
      console.log(`   Day ${index + 1}: ${day.videos.length} videos - ${day.title}`);
    });
    
  } catch (error) {
    console.error('❌ Error during integration:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { integrateRobloxStudio2025 };