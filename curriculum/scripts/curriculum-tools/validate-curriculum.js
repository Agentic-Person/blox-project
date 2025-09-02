#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Validates curriculum.json structure and content
 * Usage: node validate-curriculum.js [curriculum.json]
 */

// File path
const curriculumPath = process.argv[2] || path.join(__dirname, '../../src/data/curriculum.json');

// Validation rules and helpers
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const DURATION_REGEX = /^\d{1,2}:\d{2}(:\d{2})?$/;

class CurriculumValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      modules: 0,
      weeks: 0,
      days: 0,
      videos: 0,
      placeholders: 0,
      substitutes: 0,
      duplicateIds: 0,
      invalidYouTubeIds: 0,
      missingThumbnails: 0
    };
  }

  addError(message, location = '') {
    this.errors.push({ message, location });
  }

  addWarning(message, location = '') {
    this.warnings.push({ message, location });
  }

  validateYouTubeId(youtubeId) {
    if (youtubeId === 'YOUTUBE_ID_PLACEHOLDER') {
      return 'placeholder';
    }
    if (!youtubeId || !YOUTUBE_ID_REGEX.test(youtubeId)) {
      return 'invalid';
    }
    return 'valid';
  }

  validateDuration(duration) {
    if (!duration) return false;
    return DURATION_REGEX.test(duration);
  }

  validateVideo(video, location) {
    if (!video.id) {
      this.addError('Video missing required field: id', location);
    }

    if (!video.title) {
      this.addError('Video missing required field: title', location);
    } else if (video.title.length < 3) {
      this.addWarning('Video title is very short', location);
    }

    if (!video.creator) {
      this.addError('Video missing required field: creator', location);
    }

    const youtubeStatus = this.validateYouTubeId(video.youtubeId);
    if (youtubeStatus === 'placeholder') {
      this.stats.placeholders++;
      this.addWarning('Video has placeholder YouTube ID', location);
    } else if (youtubeStatus === 'invalid') {
      this.stats.invalidYouTubeIds++;
      this.addError('Invalid YouTube ID format', location);
    }

    if (!this.validateDuration(video.duration)) {
      this.addWarning('Invalid or missing duration format', location);
    }

    if (!video.xpReward || typeof video.xpReward !== 'number') {
      this.addWarning('Invalid or missing XP reward', location);
    } else if (video.xpReward < 1 || video.xpReward > 100) {
      this.addWarning('XP reward seems unusual (should be 1-100)', location);
    }

    if (!video.thumbnail) {
      this.stats.missingThumbnails++;
      this.addWarning('Video missing thumbnail', location);
    }

    if (video.isSubstitute) {
      this.stats.substitutes++;
    }

    this.stats.videos++;
  }

  validateDay(day, moduleIndex, weekIndex, dayIndex) {
    const location = `Module ${moduleIndex + 1}, Week ${weekIndex + 1}, Day ${dayIndex + 1}`;

    if (!day.id) {
      this.addError('Day missing required field: id', location);
    }

    if (!day.title) {
      this.addError('Day missing required field: title', location);
    }

    if (!day.videos || !Array.isArray(day.videos)) {
      this.addError('Day missing or invalid videos array', location);
    } else {
      if (day.videos.length === 0) {
        this.addWarning('Day has no videos assigned', location);
      } else if (day.videos.length > 10) {
        this.addWarning('Day has many videos (>10) - consider splitting', location);
      }

      day.videos.forEach((video, videoIndex) => {
        this.validateVideo(video, `${location}, Video ${videoIndex + 1}`);
      });
    }

    if (day.estimatedTime) {
      if (!day.estimatedTime.match(/\d+[hm]/)) {
        this.addWarning('Estimated time format unclear (suggest: "2h" or "30m")', location);
      }
    }

    this.stats.days++;
  }

  validateWeek(week, moduleIndex, weekIndex) {
    const location = `Module ${moduleIndex + 1}, Week ${weekIndex + 1}`;

    if (!week.id) {
      this.addError('Week missing required field: id', location);
    }

    if (!week.title) {
      this.addError('Week missing required field: title', location);
    }

    if (!week.description) {
      this.addWarning('Week missing description', location);
    }

    if (!week.days || !Array.isArray(week.days)) {
      this.addError('Week missing or invalid days array', location);
    } else {
      if (week.days.length === 0) {
        this.addError('Week has no days', location);
      } else if (week.days.length > 7) {
        this.addWarning('Week has more than 7 days', location);
      }

      week.days.forEach((day, dayIndex) => {
        this.validateDay(day, moduleIndex, weekIndex, dayIndex);
      });
    }

    this.stats.weeks++;
  }

  validateModule(module, moduleIndex) {
    const location = `Module ${moduleIndex + 1}`;

    if (!module.id) {
      this.addError('Module missing required field: id', location);
    }

    if (!module.title) {
      this.addError('Module missing required field: title', location);
    }

    if (!module.description) {
      this.addWarning('Module missing description', location);
    }

    if (typeof module.totalHours !== 'number') {
      this.addWarning('Module missing or invalid totalHours', location);
    }

    if (typeof module.totalXP !== 'number') {
      this.addWarning('Module missing or invalid totalXP', location);
    }

    if (!module.weeks || !Array.isArray(module.weeks)) {
      this.addError('Module missing or invalid weeks array', location);
    } else {
      if (module.weeks.length === 0) {
        this.addError('Module has no weeks', location);
      }

      module.weeks.forEach((week, weekIndex) => {
        this.validateWeek(week, moduleIndex, weekIndex);
      });
    }

    this.stats.modules++;
  }

  validateCurriculum(curriculum) {
    if (!curriculum) {
      this.addError('Curriculum data is null or undefined');
      return;
    }

    if (!curriculum.modules || !Array.isArray(curriculum.modules)) {
      this.addError('Curriculum missing or invalid modules array');
      return;
    }

    if (curriculum.modules.length === 0) {
      this.addError('Curriculum has no modules');
      return;
    }

    curriculum.modules.forEach((module, moduleIndex) => {
      this.validateModule(module, moduleIndex);
    });
  }

  checkForDuplicateIds(curriculum) {
    const allIds = new Set();
    const duplicates = new Set();

    const checkId = (id, location) => {
      if (allIds.has(id)) {
        duplicates.add(id);
        this.addError(`Duplicate ID found: ${id}`, location);
      } else {
        allIds.add(id);
      }
    };

    curriculum.modules?.forEach((module, moduleIndex) => {
      checkId(module.id, `Module ${moduleIndex + 1}`);

      module.weeks?.forEach((week, weekIndex) => {
        checkId(week.id, `Module ${moduleIndex + 1}, Week ${weekIndex + 1}`);

        week.days?.forEach((day, dayIndex) => {
          checkId(day.id, `Module ${moduleIndex + 1}, Week ${weekIndex + 1}, Day ${dayIndex + 1}`);

          day.videos?.forEach((video, videoIndex) => {
            checkId(video.id, `Module ${moduleIndex + 1}, Week ${weekIndex + 1}, Day ${dayIndex + 1}, Video ${videoIndex + 1}`);
          });
        });
      });
    });

    this.stats.duplicateIds = duplicates.size;
  }

  generateReport() {
    const report = [];

    // Header
    report.push('# 📋 Curriculum Validation Report');
    report.push('');
    report.push(`**Validation Date:** ${new Date().toISOString()}`);
    report.push(`**File:** ${path.basename(curriculumPath)}`);
    report.push('');

    // Overall Status
    const hasErrors = this.errors.length > 0;
    const hasWarnings = this.warnings.length > 0;
    
    if (!hasErrors && !hasWarnings) {
      report.push('## ✅ Validation Status: PASSED');
      report.push('No errors or warnings found!');
    } else if (!hasErrors) {
      report.push('## ⚠️ Validation Status: WARNINGS');
      report.push('No critical errors, but some warnings to review.');
    } else {
      report.push('## ❌ Validation Status: FAILED');
      report.push('Critical errors found that need to be fixed.');
    }
    report.push('');

    // Statistics
    report.push('## 📊 Curriculum Statistics');
    report.push('');
    report.push(`- **Modules:** ${this.stats.modules}`);
    report.push(`- **Weeks:** ${this.stats.weeks}`);
    report.push(`- **Days:** ${this.stats.days}`);
    report.push(`- **Total Videos:** ${this.stats.videos}`);
    report.push(`- **Valid Videos:** ${this.stats.videos - this.stats.placeholders - this.stats.invalidYouTubeIds}`);
    report.push(`- **Placeholder Videos:** ${this.stats.placeholders}`);
    report.push(`- **Substitute Videos:** ${this.stats.substitutes}`);
    report.push(`- **Invalid YouTube IDs:** ${this.stats.invalidYouTubeIds}`);
    report.push(`- **Missing Thumbnails:** ${this.stats.missingThumbnails}`);
    report.push(`- **Duplicate IDs:** ${this.stats.duplicateIds}`);
    report.push('');

    // Errors
    if (this.errors.length > 0) {
      report.push(`## ❌ Errors (${this.errors.length})`);
      report.push('');
      this.errors.forEach((error, index) => {
        report.push(`${index + 1}. **${error.message}**`);
        if (error.location) {
          report.push(`   📍 Location: ${error.location}`);
        }
        report.push('');
      });
    }

    // Warnings
    if (this.warnings.length > 0) {
      report.push(`## ⚠️ Warnings (${this.warnings.length})`);
      report.push('');
      this.warnings.forEach((warning, index) => {
        report.push(`${index + 1}. **${warning.message}**`);
        if (warning.location) {
          report.push(`   📍 Location: ${warning.location}`);
        }
        report.push('');
      });
    }

    // Recommendations
    report.push('## 💡 Recommendations');
    report.push('');
    
    if (this.stats.placeholders > 0) {
      report.push(`- Replace ${this.stats.placeholders} placeholder YouTube IDs with real video IDs`);
    }
    
    if (this.stats.invalidYouTubeIds > 0) {
      report.push(`- Fix ${this.stats.invalidYouTubeIds} invalid YouTube ID formats`);
    }
    
    if (this.stats.duplicateIds > 0) {
      report.push(`- Resolve ${this.stats.duplicateIds} duplicate ID conflicts`);
    }
    
    if (this.stats.missingThumbnails > 0) {
      report.push(`- Add thumbnail URLs for ${this.stats.missingThumbnails} videos`);
    }
    
    const avgVideosPerDay = this.stats.days > 0 ? (this.stats.videos / this.stats.days).toFixed(1) : 0;
    if (avgVideosPerDay > 5) {
      report.push(`- Consider reducing video load per day (current avg: ${avgVideosPerDay} videos/day)`);
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      report.push('- Curriculum structure looks great! 🎉');
      report.push('- Consider running `npm run curriculum:check-youtube` to verify video availability');
    }

    return report.join('\n');
  }

  validate() {
    console.log('🔍 Validating curriculum structure...');

    try {
      const curriculumData = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
      
      this.validateCurriculum(curriculumData);
      this.checkForDuplicateIds(curriculumData);
      
      return this.generateReport();
      
    } catch (error) {
      this.addError(`Failed to read or parse curriculum file: ${error.message}`);
      return this.generateReport();
    }
  }
}

// Main execution
try {
  console.log(`📖 Reading: ${curriculumPath}`);
  
  if (!fs.existsSync(curriculumPath)) {
    console.error(`❌ Error: Curriculum file not found: ${curriculumPath}`);
    process.exit(1);
  }
  
  const validator = new CurriculumValidator();
  const report = validator.validate();
  
  // Write report to file
  const reportPath = path.join(__dirname, '../../docs/curriculum-validation-report.md');
  fs.writeFileSync(reportPath, report, 'utf8');
  
  // Console output
  console.log(report);
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  const hasErrors = validator.errors.length > 0;
  process.exit(hasErrors ? 1 : 0);
  
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}