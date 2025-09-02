#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Creates a timestamped backup of curriculum.json
 * Usage: node backup-curriculum.js [curriculum.json]
 */

// File path
const curriculumPath = process.argv[2] || path.join(__dirname, '../../src/data/curriculum.json');

function formatTimestamp() {
  const now = new Date();
  return now.toISOString()
    .replace(/:/g, '-')
    .replace(/\./g, '-')
    .substring(0, 19); // Remove milliseconds and timezone
}

function calculateStats(curriculum) {
  let stats = {
    modules: 0,
    weeks: 0,
    days: 0,
    videos: 0,
    placeholders: 0,
    substitutes: 0,
    totalXP: 0,
    totalHours: 0
  };

  if (!curriculum || !curriculum.modules) {
    return stats;
  }

  curriculum.modules.forEach(module => {
    stats.modules++;
    stats.totalHours += module.totalHours || 0;
    stats.totalXP += module.totalXP || 0;

    if (module.weeks) {
      module.weeks.forEach(week => {
        stats.weeks++;

        if (week.days) {
          week.days.forEach(day => {
            stats.days++;

            if (day.videos) {
              day.videos.forEach(video => {
                stats.videos++;
                if (video.youtubeId === 'YOUTUBE_ID_PLACEHOLDER') {
                  stats.placeholders++;
                }
                if (video.isSubstitute) {
                  stats.substitutes++;
                }
              });
            }
          });
        }
      });
    }
  });

  return stats;
}

function createBackup() {
  try {
    console.log('💾 Creating curriculum backup...');
    console.log(`📖 Reading: ${curriculumPath}`);

    if (!fs.existsSync(curriculumPath)) {
      console.error(`❌ Error: Curriculum file not found: ${curriculumPath}`);
      process.exit(1);
    }

    // Read and parse the curriculum
    const curriculumData = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
    const stats = calculateStats(curriculumData);

    // Create backup filename
    const timestamp = formatTimestamp();
    const backupDir = path.join(__dirname, '../../src/data');
    const backupPath = path.join(backupDir, `curriculum-backup-${timestamp}.json`);

    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Create backup with metadata
    const backupData = {
      metadata: {
        originalFile: path.relative(process.cwd(), curriculumPath),
        backupDate: new Date().toISOString(),
        backupReason: 'Manual backup via backup-curriculum.js',
        stats: stats,
        fileSize: fs.statSync(curriculumPath).size,
        nodeVersion: process.version,
        platform: process.platform
      },
      curriculum: curriculumData
    };

    // Write backup file
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');

    console.log(`✅ Backup created: ${path.basename(backupPath)}`);
    console.log(`📁 Location: ${backupPath}`);

    // Display stats
    console.log(`\n📊 Curriculum Stats:`);
    console.log(`   Modules: ${stats.modules}`);
    console.log(`   Weeks: ${stats.weeks}`);
    console.log(`   Days: ${stats.days}`);
    console.log(`   Videos: ${stats.videos}`);
    console.log(`   Placeholders: ${stats.placeholders}`);
    console.log(`   Substitutes: ${stats.substitutes}`);
    console.log(`   Total XP: ${stats.totalXP}`);
    console.log(`   Total Hours: ${stats.totalHours}`);

    // Show backup file size
    const backupSize = fs.statSync(backupPath).size;
    const backupSizeKB = Math.round(backupSize / 1024 * 100) / 100;
    console.log(`   Backup Size: ${backupSizeKB} KB`);

    return backupPath;

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

function listBackups() {
  try {
    console.log('📋 Listing curriculum backups...\n');

    const backupDir = path.join(__dirname, '../../src/data');
    
    if (!fs.existsSync(backupDir)) {
      console.log('No backup directory found.');
      return;
    }

    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('curriculum-backup-') && file.endsWith('.json'))
      .sort()
      .reverse(); // Most recent first

    if (files.length === 0) {
      console.log('No backup files found.');
      return;
    }

    console.log(`Found ${files.length} backup files:\n`);

    files.forEach((file, index) => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
      
      // Extract timestamp from filename
      const timestampMatch = file.match(/curriculum-backup-(.+)\.json$/);
      let dateStr = 'Unknown date';
      
      if (timestampMatch) {
        try {
          // Convert back to readable date
          const timestamp = timestampMatch[1].replace(/-/g, ':').substring(0, 19);
          const date = new Date(timestamp);
          dateStr = date.toLocaleString();
        } catch (e) {
          dateStr = timestampMatch[1];
        }
      }

      console.log(`${index + 1}. ${file}`);
      console.log(`   📅 Created: ${dateStr}`);
      console.log(`   📦 Size: ${sizeKB} KB`);
      
      // Try to read metadata if it exists
      try {
        const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (backupData.metadata && backupData.metadata.stats) {
          const s = backupData.metadata.stats;
          console.log(`   📊 Content: ${s.modules} modules, ${s.videos} videos, ${s.placeholders} placeholders`);
        }
      } catch (e) {
        // Ignore metadata read errors
      }
      
      console.log('');
    });

    console.log(`💡 To restore a backup:`);
    console.log(`   cp "${path.join(backupDir, '<backup-file>')}" "${path.join(__dirname, '../../src/data/curriculum.json')}"`);

  } catch (error) {
    console.error('❌ Failed to list backups:', error.message);
    process.exit(1);
  }
}

// Main execution
const command = process.argv[2];

if (command === '--list' || command === '-l') {
  listBackups();
} else if (command === '--help' || command === '-h') {
  console.log('📚 Curriculum Backup Tool\n');
  console.log('Usage:');
  console.log('  node backup-curriculum.js              # Create backup');
  console.log('  node backup-curriculum.js --list       # List all backups');
  console.log('  node backup-curriculum.js --help       # Show this help');
  console.log('  node backup-curriculum.js <file.json>  # Backup specific file');
  console.log('');
  console.log('Examples:');
  console.log('  npm run curriculum:backup');
  console.log('  npm run curriculum:backup -- --list');
} else {
  createBackup();
}