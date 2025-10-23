/**
 * Find and Verify Videos with Transcripts
 *
 * This script helps you search for YouTube videos and verify they have transcripts.
 * It can test multiple video IDs and output a list of valid ones.
 *
 * Usage:
 *   node scripts/find-videos-with-transcripts.js VIDEO_ID1 VIDEO_ID2 VIDEO_ID3...
 *   node scripts/find-videos-with-transcripts.js --file test-videos.txt
 */

const { Innertube } = require('youtubei.js');
const fs = require('fs');

/**
 * Test if a video has transcripts available
 */
async function testVideo(videoId, youtube = null) {
  try {
    const yt = youtube || await Innertube.create();
    const info = await yt.getInfo(videoId);

    const title = info.basic_info.title;
    const author = info.basic_info.author;
    const duration = info.basic_info.duration;

    const transcriptData = await info.getTranscript();

    if (!transcriptData || !transcriptData.transcript) {
      return {
        videoId,
        title,
        author,
        duration,
        hasTranscript: false,
        segments: 0
      };
    }

    const segments = transcriptData.transcript.content.body.initial_segments;
    const textSegments = segments.filter(seg => seg.snippet && seg.snippet.text);

    return {
      videoId,
      title,
      author,
      duration,
      hasTranscript: true,
      segments: textSegments.length
    };

  } catch (error) {
    return {
      videoId,
      error: error.message,
      hasTranscript: false
    };
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('❌ No video IDs provided');
    console.log('\nUsage:');
    console.log('  node scripts/find-videos-with-transcripts.js VIDEO_ID1 VIDEO_ID2 ...');
    console.log('  node scripts/find-videos-with-transcripts.js --file test-videos.txt');
    console.log('\nExample:');
    console.log('  node scripts/find-videos-with-transcripts.js p005iduooyw dQw4w9WgXcQ');
    process.exit(1);
  }

  // Get video IDs from arguments or file
  let videoIds = [];
  if (args[0] === '--file') {
    const filePath = args[1];
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    videoIds = fileContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  } else {
    videoIds = args;
  }

  console.log('\n🔍 Testing Videos for Transcript Availability');
  console.log('═'.repeat(60));
  console.log(`📊 Videos to test: ${videoIds.length}\n`);

  const youtube = await Innertube.create();
  const results = [];

  for (const videoId of videoIds) {
    process.stdout.write(`Testing ${videoId}... `);
    const result = await testVideo(videoId, youtube);
    results.push(result);

    if (result.hasTranscript) {
      console.log(`✅ (${result.segments} segments)`);
    } else {
      console.log(`❌ ${result.error || 'No transcript'}`);
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('═'.repeat(60));

  const withTranscripts = results.filter(r => r.hasTranscript);
  const withoutTranscripts = results.filter(r => !r.hasTranscript);

  console.log(`✅ With transcripts: ${withTranscripts.length}/${videoIds.length}`);
  console.log(`❌ Without transcripts: ${withoutTranscripts.length}/${videoIds.length}`);

  if (withTranscripts.length > 0) {
    console.log('\n✅ Videos WITH transcripts:');
    console.log('═'.repeat(60));
    withTranscripts.forEach(r => {
      const duration = r.duration ? `${Math.floor(r.duration / 60)}:${(r.duration % 60).toString().padStart(2, '0')}` : 'Unknown';
      console.log(`\nVideo ID: ${r.videoId}`);
      console.log(`Title: ${r.title}`);
      console.log(`Creator: ${r.author}`);
      console.log(`Duration: ${duration}`);
      console.log(`Segments: ${r.segments}`);
      console.log(`URL: https://youtube.com/watch?v=${r.videoId}`);
    });

    // Generate video-ids.txt file
    const validIds = withTranscripts.map(r => r.videoId).join('\n');
    fs.writeFileSync('valid-video-ids.txt', validIds);

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Valid video IDs saved to: valid-video-ids.txt');
    console.log('\nYou can now process these videos with:');
    console.log('  node scripts/process-videos-to-supabase.js --file valid-video-ids.txt');
  }

  if (withoutTranscripts.length > 0) {
    console.log('\n❌ Videos WITHOUT transcripts:');
    console.log('═'.repeat(60));
    withoutTranscripts.forEach(r => {
      console.log(`- ${r.videoId}: ${r.error || 'No transcript available'}`);
    });
  }

  console.log('\n' + '═'.repeat(60) + '\n');

  process.exit(withoutTranscripts.length > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(2);
  });
}

module.exports = { testVideo };
