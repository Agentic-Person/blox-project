#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Converts curriculum.json to an editable Markdown format
 * Usage: node json-to-markdown.js [input.json] [output.md]
 */

// File paths
const inputPath = process.argv[2] || path.join(__dirname, '../../src/data/curriculum.json');
const outputPath = process.argv[3] || path.join(__dirname, '../../docs/curriculum-editable.md');

// Helper function to get video status emoji
function getVideoStatus(video) {
  if (video.youtubeId === 'YOUTUBE_ID_PLACEHOLDER') return '❌';
  if (video.thumbnail && video.thumbnail.includes('placeholder')) return '⚠️';
  if (video.isSubstitute) return '🔄';
  return '✅';
}

// Helper function to format duration
function formatDuration(duration) {
  if (!duration) return 'N/A';
  return duration;
}

// Helper function to create video table row
function createVideoRow(video, index) {
  const status = getVideoStatus(video);
  const youtubeId = video.youtubeId === 'YOUTUBE_ID_PLACEHOLDER' ? '(missing)' : video.youtubeId;
  const creator = video.creator || '(unknown)';
  const duration = formatDuration(video.duration);
  
  return `| ${index + 1} | ${video.title} | ${creator} | ${duration} | ${video.xpReward || 20} | ${youtubeId} | ${status} |`;
}

// Helper function to calculate totals
function calculateTotals(videos) {
  const totalVideos = videos.length;
  const totalXP = videos.reduce((sum, video) => sum + (video.xpReward || 20), 0);
  
  // Estimate duration in minutes
  let totalMinutes = 0;
  videos.forEach(video => {
    if (video.duration && video.duration !== 'N/A') {
      const parts = video.duration.split(':');
      if (parts.length === 2) {
        totalMinutes += parseInt(parts[0]) * 60 + parseInt(parts[1]);
      } else if (parts.length === 3) {
        totalMinutes += parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      }
    }
  });
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  
  return { totalVideos, totalXP, timeStr };
}

function convertToMarkdown(curriculum) {
  let markdown = '';
  
  // Header
  markdown += '# Blox Buddy Learning Curriculum\n\n';
  markdown += '> **Generated from:** `curriculum.json`\n';
  markdown += `> **Generated on:** ${new Date().toISOString()}\n`;
  markdown += '> **Status Legend:** ✅ Valid | ⚠️ Needs Review | ❌ Missing | 🔄 Substitute\n\n';
  
  // Overall statistics
  let totalModuleVideos = 0;
  let totalModuleXP = 0;
  let totalModuleHours = 0;
  
  curriculum.modules.forEach(module => {
    module.weeks.forEach(week => {
      week.days.forEach(day => {
        totalModuleVideos += day.videos.length;
        totalModuleXP += day.videos.reduce((sum, video) => sum + (video.xpReward || 20), 0);
      });
    });
    totalModuleHours += module.totalHours || 0;
  });
  
  markdown += '## 📊 Curriculum Overview\n\n';
  markdown += `- **Total Modules:** ${curriculum.modules.length}\n`;
  markdown += `- **Total Videos:** ${totalModuleVideos}\n`;
  markdown += `- **Total XP:** ${totalModuleXP}\n`;
  markdown += `- **Estimated Hours:** ${totalModuleHours}\n\n`;
  markdown += '---\n\n';
  
  // Process each module
  curriculum.modules.forEach((module, moduleIndex) => {
    markdown += `# 📚 ${module.title}\n\n`;
    markdown += `**Description:** ${module.description}\n\n`;
    markdown += `**Module Stats:**\n`;
    markdown += `- Total Hours: ${module.totalHours || 'TBD'}\n`;
    markdown += `- Total XP: ${module.totalXP || 'TBD'}\n`;
    markdown += `- Weeks: ${module.weeks.length}\n\n`;
    
    // Process each week
    module.weeks.forEach((week, weekIndex) => {
      markdown += `## 📅 ${week.title}\n\n`;
      markdown += `> ${week.description}\n\n`;
      
      // Week statistics
      let weekVideos = 0;
      let weekXP = 0;
      week.days.forEach(day => {
        weekVideos += day.videos.length;
        weekXP += day.videos.reduce((sum, video) => sum + (video.xpReward || 20), 0);
      });
      
      markdown += `**Week ${weekIndex + 1} Stats:** ${weekVideos} videos | ${weekXP} XP\n\n`;
      
      // Process each day
      week.days.forEach((day, dayIndex) => {
        markdown += `### 🎯 ${day.title}\n\n`;
        
        if (day.practiceTask) {
          markdown += `**Practice Task:** ${day.practiceTask}\n\n`;
        }
        
        if (day.estimatedTime) {
          markdown += `**Estimated Time:** ${day.estimatedTime}\n\n`;
        }
        
        const dayTotals = calculateTotals(day.videos);
        markdown += `**Day ${dayIndex + 1} Summary:** ${dayTotals.totalVideos} videos | ${dayTotals.totalXP} XP | ~${dayTotals.timeStr}\n\n`;
        
        // Video table
        if (day.videos.length > 0) {
          markdown += '| # | Title | Creator | Duration | XP | YouTube ID | Status |\n';
          markdown += '|---|-------|---------|----------|----|-----------:|--------|\n';
          
          day.videos.forEach((video, videoIndex) => {
            markdown += createVideoRow(video, videoIndex) + '\n';
          });
          
          markdown += '\n';
        } else {
          markdown += '*No videos assigned to this day.*\n\n';
        }
        
        markdown += '---\n\n';
      });
    });
    
    markdown += '\n';
  });
  
  // Footer
  markdown += '## 🔧 How to Edit This File\n\n';
  markdown += '1. **Edit videos:** Modify the table rows directly\n';
  markdown += '2. **Add videos:** Add new rows to any table\n';
  markdown += '3. **Remove videos:** Delete table rows\n';
  markdown += '4. **Change order:** Move table rows up/down\n';
  markdown += '5. **Update YouTube IDs:** Replace the ID in the YouTube ID column\n';
  markdown += '6. **Convert back:** Run `npm run curriculum:save` to update curriculum.json\n\n';
  
  markdown += '**⚠️ Important Notes:**\n';
  markdown += '- Keep table formatting intact (pipes and alignment)\n';
  markdown += '- Don\'t change the `# | Title | Creator` headers\n';
  markdown += '- YouTube IDs should be 11 characters (e.g., `dQw4w9WgXcQ`)\n';
  markdown += '- XP rewards should be numbers\n';
  markdown += '- Duration format: `MM:SS` or `HH:MM:SS`\n\n';
  
  return markdown;
}

// Main execution
try {
  console.log('🔄 Converting curriculum.json to Markdown...');
  console.log(`📖 Reading: ${inputPath}`);
  
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }
  
  const curriculumData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const markdown = convertToMarkdown(curriculumData);
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, markdown, 'utf8');
  
  console.log(`✅ Successfully converted to: ${outputPath}`);
  console.log(`📄 Generated ${markdown.split('\n').length} lines of Markdown`);
  
  // Quick stats
  const videoCount = (markdown.match(/\|\s*\d+\s*\|/g) || []).length;
  const placeholderCount = (markdown.match(/❌/g) || []).length;
  const substituteCount = (markdown.match(/🔄/g) || []).length;
  
  console.log(`\n📊 Content Summary:`);
  console.log(`   Total Videos: ${videoCount}`);
  console.log(`   Missing IDs: ${placeholderCount}`);
  console.log(`   Substitutes: ${substituteCount}`);
  console.log(`   Valid Videos: ${videoCount - placeholderCount - substituteCount}`);
  
} catch (error) {
  console.error('❌ Error during conversion:', error.message);
  process.exit(1);
}