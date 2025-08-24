const fs = require('fs');
const path = require('path');
const https = require('https');

// Read curriculum data
const curriculumPath = path.join(__dirname, '../src/data/curriculum.json');
const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));

// Extract all YouTube video IDs with metadata
function extractAllVideos() {
  const videos = [];
  let videoIndex = 0;
  
  curriculum.modules.forEach((module, moduleIndex) => {
    module.weeks.forEach((week, weekIndex) => {
      week.days.forEach((day, dayIndex) => {
        day.videos.forEach((video, vidIndex) => {
          videoIndex++;
          videos.push({
            index: videoIndex,
            moduleId: module.id,
            moduleTitle: module.title,
            weekId: week.id,
            weekTitle: week.title,
            dayId: day.id,
            dayTitle: day.title,
            videoId: video.id,
            title: video.title,
            youtubeId: video.youtubeId,
            creator: video.creator || 'Unknown',
            duration: video.duration,
            xpReward: video.xpReward,
            dayNumber: parseInt(day.id.replace('day-', ''))
          });
        });
      });
    });
  });
  
  return videos;
}

// Test if YouTube video exists using oEmbed API
async function testVideoOEmbed(youtubeId) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
    
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ 
              status: 'WORKS', 
              method: 'oEmbed',
              title: json.title,
              author: json.author_name 
            });
          } catch {
            resolve({ status: 'BROKEN', method: 'oEmbed', error: 'Invalid JSON' });
          }
        });
      } else if (res.statusCode === 401 || res.statusCode === 403) {
        resolve({ status: 'RESTRICTED', method: 'oEmbed', error: `HTTP ${res.statusCode}` });
      } else {
        resolve({ status: 'BROKEN', method: 'oEmbed', error: `HTTP ${res.statusCode}` });
      }
    }).on('error', (err) => {
      resolve({ status: 'ERROR', method: 'oEmbed', error: err.message });
    });
  });
}

// Test if YouTube thumbnail exists
async function testVideoThumbnail(youtubeId) {
  return new Promise((resolve) => {
    const url = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
    
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        resolve({ status: 'WORKS', method: 'thumbnail' });
      } else if (res.statusCode === 404) {
        resolve({ status: 'BROKEN', method: 'thumbnail', error: 'Not found' });
      } else {
        resolve({ status: 'UNKNOWN', method: 'thumbnail', error: `HTTP ${res.statusCode}` });
      }
    }).on('error', (err) => {
      resolve({ status: 'ERROR', method: 'thumbnail', error: err.message });
    });
  });
}

// Test video using noembed.com (alternative to YouTube oEmbed)
async function testVideoNoEmbed(youtubeId) {
  return new Promise((resolve) => {
    const url = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${youtubeId}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            resolve({ status: 'BROKEN', method: 'noembed', error: json.error });
          } else if (json.title) {
            resolve({ 
              status: 'WORKS', 
              method: 'noembed',
              title: json.title,
              author: json.author_name 
            });
          } else {
            resolve({ status: 'UNKNOWN', method: 'noembed' });
          }
        } catch {
          resolve({ status: 'ERROR', method: 'noembed', error: 'Invalid JSON' });
        }
      });
    }).on('error', (err) => {
      resolve({ status: 'ERROR', method: 'noembed', error: err.message });
    });
  });
}

// Main testing function
async function testAllVideos() {
  const videos = extractAllVideos();
  const results = [];
  
  console.log(`\n🎬 Testing ${videos.length} YouTube videos from curriculum...`);
  console.log('='*60);
  
  for (const video of videos) {
    process.stdout.write(`\nTesting ${video.index}/${videos.length}: ${video.title.substring(0, 40)}...`);
    
    const result = {
      ...video,
      tests: {}
    };
    
    // Skip if no YouTube ID
    if (!video.youtubeId || video.youtubeId === 'PLACEHOLDER') {
      result.status = 'NO_ID';
      result.tests = { message: 'No YouTube ID provided' };
      results.push(result);
      console.log(' ⚠️  NO ID');
      continue;
    }
    
    // Test with multiple methods
    const [oembedTest, thumbnailTest, noembedTest] = await Promise.all([
      testVideoOEmbed(video.youtubeId),
      testVideoThumbnail(video.youtubeId),
      testVideoNoEmbed(video.youtubeId)
    ]);
    
    result.tests = {
      oembed: oembedTest,
      thumbnail: thumbnailTest,
      noembed: noembedTest
    };
    
    // Determine overall status
    if (oembedTest.status === 'WORKS' || noembedTest.status === 'WORKS') {
      result.status = 'WORKS';
      console.log(' ✅ WORKS');
    } else if (oembedTest.status === 'RESTRICTED' || noembedTest.status === 'RESTRICTED') {
      result.status = 'RESTRICTED';
      console.log(' 🔒 RESTRICTED');
    } else if (thumbnailTest.status === 'WORKS') {
      result.status = 'EXISTS_NO_EMBED';
      console.log(' ⚠️  EXISTS BUT CAN\'T EMBED');
    } else {
      result.status = 'BROKEN';
      console.log(' ❌ BROKEN');
    }
    
    results.push(result);
  }
  
  return results;
}

// Generate report
function generateReport(results) {
  const report = {
    summary: {
      total: results.length,
      working: results.filter(r => r.status === 'WORKS').length,
      broken: results.filter(r => r.status === 'BROKEN').length,
      restricted: results.filter(r => r.status === 'RESTRICTED').length,
      existsNoEmbed: results.filter(r => r.status === 'EXISTS_NO_EMBED').length,
      noId: results.filter(r => r.status === 'NO_ID').length
    },
    byStatus: {
      working: [],
      broken: [],
      restricted: [],
      existsNoEmbed: [],
      noId: []
    },
    byDay: {}
  };
  
  results.forEach(result => {
    // Group by status
    switch(result.status) {
      case 'WORKS':
        report.byStatus.working.push(result);
        break;
      case 'BROKEN':
        report.byStatus.broken.push(result);
        break;
      case 'RESTRICTED':
        report.byStatus.restricted.push(result);
        break;
      case 'EXISTS_NO_EMBED':
        report.byStatus.existsNoEmbed.push(result);
        break;
      case 'NO_ID':
        report.byStatus.noId.push(result);
        break;
    }
    
    // Group by day
    const dayKey = `Day ${result.dayNumber}`;
    if (!report.byDay[dayKey]) {
      report.byDay[dayKey] = [];
    }
    report.byDay[dayKey].push({
      title: result.title,
      youtubeId: result.youtubeId,
      creator: result.creator,
      status: result.status
    });
  });
  
  return report;
}

// Print report to console
function printReport(report) {
  console.log('\n' + '='*60);
  console.log('📊 VIDEO TEST REPORT');
  console.log('='*60);
  
  console.log('\n📈 SUMMARY:');
  console.log(`  Total Videos: ${report.summary.total}`);
  console.log(`  ✅ Working: ${report.summary.working} (${(report.summary.working/report.summary.total*100).toFixed(1)}%)`);
  console.log(`  ❌ Broken: ${report.summary.broken} (${(report.summary.broken/report.summary.total*100).toFixed(1)}%)`);
  console.log(`  🔒 Restricted: ${report.summary.restricted} (${(report.summary.restricted/report.summary.total*100).toFixed(1)}%)`);
  console.log(`  ⚠️  Exists but can't embed: ${report.summary.existsNoEmbed} (${(report.summary.existsNoEmbed/report.summary.total*100).toFixed(1)}%)`);
  console.log(`  ⚠️  No ID: ${report.summary.noId} (${(report.summary.noId/report.summary.total*100).toFixed(1)}%)`);
  
  console.log('\n❌ BROKEN VIDEOS (Need Replacement):');
  if (report.byStatus.broken.length > 0) {
    report.byStatus.broken.forEach(video => {
      console.log(`  Day ${video.dayNumber}: ${video.title}`);
      console.log(`    ID: ${video.youtubeId} | Creator: ${video.creator}`);
    });
  } else {
    console.log('  None found!');
  }
  
  console.log('\n🔒 RESTRICTED VIDEOS (Can\'t Embed):');
  if (report.byStatus.restricted.length > 0) {
    report.byStatus.restricted.forEach(video => {
      console.log(`  Day ${video.dayNumber}: ${video.title}`);
      console.log(`    ID: ${video.youtubeId} | Creator: ${video.creator}`);
    });
  } else {
    console.log('  None found!');
  }
  
  console.log('\n⚠️  EXISTS BUT CAN\'T EMBED:');
  if (report.byStatus.existsNoEmbed.length > 0) {
    report.byStatus.existsNoEmbed.forEach(video => {
      console.log(`  Day ${video.dayNumber}: ${video.title}`);
      console.log(`    ID: ${video.youtubeId} | Creator: ${video.creator}`);
    });
  } else {
    console.log('  None found!');
  }
}

// Run the tests
async function main() {
  console.log('🚀 Starting YouTube Video Verification...');
  
  const results = await testAllVideos();
  const report = generateReport(results);
  
  // Save detailed results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(__dirname, `../video-test-report-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  printReport(report);
  
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  console.log('\n✅ Testing complete!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { extractAllVideos, testVideoOEmbed, testVideoThumbnail, testAllVideos };