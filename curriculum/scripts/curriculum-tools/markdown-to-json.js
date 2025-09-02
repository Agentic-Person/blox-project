#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Converts editable Markdown back to curriculum.json format
 * Usage: node markdown-to-json.js [input.md] [output.json]
 */

// File paths
const inputPath = process.argv[2] || path.join(__dirname, '../../docs/curriculum-editable.md');
const outputPath = process.argv[3] || path.join(__dirname, '../../src/data/curriculum.json');

// Helper function to generate video ID
function generateVideoId(moduleIndex, weekIndex, dayIndex, videoIndex) {
  return `video-${moduleIndex + 1}-${weekIndex + 1}-${dayIndex + 1}-${videoIndex + 1}`;
}

// Helper function to parse video table row
function parseVideoRow(row, moduleIndex, weekIndex, dayIndex, videoIndex) {
  const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
  
  if (cells.length < 6) {
    throw new Error(`Invalid video row format: ${row}`);
  }
  
  const [index, title, creator, duration, xpReward, youtubeId, status] = cells;
  
  // Validate YouTube ID
  let validYoutubeId = youtubeId;
  if (youtubeId === '(missing)' || youtubeId === 'YOUTUBE_ID_PLACEHOLDER') {
    validYoutubeId = 'YOUTUBE_ID_PLACEHOLDER';
  } else if (youtubeId.includes('youtube.com') || youtubeId.includes('youtu.be')) {
    // Extract YouTube ID from full URL
    const match = youtubeId.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    validYoutubeId = match ? match[1] : 'YOUTUBE_ID_PLACEHOLDER';
  }
  
  const video = {
    id: generateVideoId(moduleIndex, weekIndex, dayIndex, videoIndex),
    title: title,
    youtubeId: validYoutubeId,
    creator: creator,
    duration: duration === 'N/A' ? '10:00' : duration,
    xpReward: parseInt(xpReward) || 20
  };
  
  // Add thumbnail based on YouTube ID
  if (validYoutubeId !== 'YOUTUBE_ID_PLACEHOLDER') {
    video.thumbnail = `https://i.ytimg.com/vi/${validYoutubeId}/hqdefault.jpg`;
  } else {
    video.thumbnail = '/images/placeholder-thumbnail.jpg';
  }
  
  // Add substitute info if status indicates it
  if (status === '🔄') {
    video.isSubstitute = true;
    video.substituteReason = 'Manually marked as substitute';
  }
  
  return video;
}

// Helper function to parse practice task and estimated time from content
function parseDayMetadata(dayContent) {
  const practiceTaskMatch = dayContent.match(/\*\*Practice Task:\*\* (.+)/);
  const estimatedTimeMatch = dayContent.match(/\*\*Estimated Time:\*\* (.+)/);
  
  return {
    practiceTask: practiceTaskMatch ? practiceTaskMatch[1] : undefined,
    estimatedTime: estimatedTimeMatch ? estimatedTimeMatch[1] : undefined
  };
}

function parseMarkdownToCurriculum(markdown) {
  const lines = markdown.split('\n');
  const curriculum = { modules: [] };
  
  let currentModule = null;
  let currentWeek = null;
  let currentDay = null;
  let inVideoTable = false;
  let videoTableHeaders = false;
  
  let moduleIndex = -1;
  let weekIndex = -1;
  let dayIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('>') || line.startsWith('**Generated')) {
      continue;
    }
    
    // Module header (# 📚 Module Title)
    if (line.match(/^# 📚/)) {
      if (currentModule) {
        curriculum.modules.push(currentModule);
      }
      
      moduleIndex++;
      weekIndex = -1;
      
      const title = line.replace(/^# 📚 /, '');
      currentModule = {
        id: `module-${moduleIndex + 1}`,
        title: title,
        description: '',
        totalHours: 50, // Default, will be updated if found
        totalXP: 750,   // Default, will be updated if found
        weeks: []
      };
      
      // Look for description in next few lines
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine.startsWith('**Description:** ')) {
          currentModule.description = nextLine.replace('**Description:** ', '');
          break;
        }
      }
      
      continue;
    }
    
    // Week header (## 📅 Week Title)
    if (line.match(/^## 📅/)) {
      if (currentWeek) {
        currentModule.weeks.push(currentWeek);
      }
      
      weekIndex++;
      dayIndex = -1;
      
      const title = line.replace(/^## 📅 /, '');
      currentWeek = {
        id: `week-${weekIndex + 1}`,
        title: title,
        description: '',
        days: []
      };
      
      // Look for description in next few lines (quoted with >)
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine.startsWith('> ')) {
          currentWeek.description = nextLine.replace('> ', '');
          break;
        }
      }
      
      continue;
    }
    
    // Day header (### 🎯 Day Title)
    if (line.match(/^### 🎯/)) {
      if (currentDay) {
        currentWeek.days.push(currentDay);
      }
      
      dayIndex++;
      
      const title = line.replace(/^### 🎯 /, '');
      currentDay = {
        id: `day-${dayIndex + 1}`,
        title: title,
        videos: []
      };
      
      // Look for metadata in next few lines
      let j = i + 1;
      let dayContent = '';
      while (j < lines.length && !lines[j].trim().match(/^#{1,3}/)) {
        dayContent += lines[j] + '\n';
        j++;
      }
      
      const metadata = parseDayMetadata(dayContent);
      if (metadata.practiceTask) currentDay.practiceTask = metadata.practiceTask;
      if (metadata.estimatedTime) currentDay.estimatedTime = metadata.estimatedTime;
      
      inVideoTable = false;
      videoTableHeaders = false;
      continue;
    }
    
    // Video table headers
    if (line.match(/^\|\s*#\s*\|\s*Title\s*\|/)) {
      inVideoTable = true;
      videoTableHeaders = false;
      continue;
    }
    
    // Video table separator
    if (inVideoTable && line.match(/^\|[-\s\|:]+\|$/)) {
      videoTableHeaders = true;
      continue;
    }
    
    // Video table row
    if (inVideoTable && videoTableHeaders && line.startsWith('|') && line.endsWith('|')) {
      try {
        const videoIndex = currentDay.videos.length;
        const video = parseVideoRow(line, moduleIndex, weekIndex, dayIndex, videoIndex);
        currentDay.videos.push(video);
      } catch (error) {
        console.warn(`⚠️ Warning: Skipping invalid video row at line ${i + 1}: ${error.message}`);
      }
      continue;
    }
    
    // End of video table
    if (inVideoTable && (line.match(/^#{1,3}/) || line === '---')) {
      inVideoTable = false;
      videoTableHeaders = false;
    }
  }
  
  // Add remaining items
  if (currentDay) {
    currentWeek.days.push(currentDay);
  }
  if (currentWeek) {
    currentModule.weeks.push(currentWeek);
  }
  if (currentModule) {
    curriculum.modules.push(currentModule);
  }
  
  return curriculum;
}

// Main execution
try {
  console.log('🔄 Converting Markdown to curriculum.json...');
  console.log(`📖 Reading: ${inputPath}`);
  
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: Input file not found: ${inputPath}`);
    console.log('💡 Hint: Run `npm run curriculum:edit` first to generate the Markdown file');
    process.exit(1);
  }
  
  const markdownContent = fs.readFileSync(inputPath, 'utf8');
  const curriculum = parseMarkdownToCurriculum(markdownContent);
  
  // Create backup of existing curriculum.json
  if (fs.existsSync(outputPath)) {
    const backupPath = outputPath.replace('.json', `-backup-${Date.now()}.json`);
    fs.copyFileSync(outputPath, backupPath);
    console.log(`💾 Created backup: ${path.basename(backupPath)}`);
  }
  
  // Write the new curriculum
  fs.writeFileSync(outputPath, JSON.stringify(curriculum, null, 2), 'utf8');
  
  console.log(`✅ Successfully converted to: ${outputPath}`);
  
  // Quick stats
  let totalVideos = 0;
  let totalPlaceholders = 0;
  let totalSubstitutes = 0;
  
  curriculum.modules.forEach(module => {
    module.weeks.forEach(week => {
      week.days.forEach(day => {
        day.videos.forEach(video => {
          totalVideos++;
          if (video.youtubeId === 'YOUTUBE_ID_PLACEHOLDER') totalPlaceholders++;
          if (video.isSubstitute) totalSubstitutes++;
        });
      });
    });
  });
  
  console.log(`\n📊 Conversion Summary:`);
  console.log(`   Modules: ${curriculum.modules.length}`);
  console.log(`   Total Videos: ${totalVideos}`);
  console.log(`   Placeholders: ${totalPlaceholders}`);
  console.log(`   Substitutes: ${totalSubstitutes}`);
  console.log(`   Valid Videos: ${totalVideos - totalPlaceholders - totalSubstitutes}`);
  
  if (totalPlaceholders > 0) {
    console.log(`\n⚠️  Found ${totalPlaceholders} videos with missing YouTube IDs`);
  }
  
} catch (error) {
  console.error('❌ Error during conversion:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('   - Check that table formatting is correct (pipes aligned)');
  console.log('   - Ensure all video tables have the required columns');
  console.log('   - Verify YouTube IDs are valid (11 characters)');
  console.log('   - Run `npm run curriculum:validate` to check for issues');
  process.exit(1);
}