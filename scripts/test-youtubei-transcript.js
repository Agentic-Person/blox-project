/**
 * Test Video Transcript with YouTubeI.js (More Reliable)
 * Uses the youtubei.js library which reverse-engineers YouTube's internal API
 *
 * Usage:
 *   node scripts/test-youtubei-transcript.js VIDEO_ID
 */

const { Innertube } = require('youtubei.js');

// Extract video ID from URL or use directly
function extractVideoId(input) {
  if (!input) {
    console.error('❌ Error: No video ID or URL provided');
    console.log('\nUsage:');
    console.log('  node scripts/test-youtubei-transcript.js VIDEO_ID');
    console.log('  node scripts/test-youtubei-transcript.js https://youtube.com/watch?v=VIDEO_ID');
    process.exit(1);
  }

  // If it's already just an ID
  if (input.length === 11 && !input.includes('/')) {
    return input;
  }

  // Extract from URL
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }

  // If no pattern matched, assume it's an ID
  return input;
}

async function testTranscript(videoId) {
  console.log('\n🔍 Testing Transcript Availability (YouTubeI.js)\n');
  console.log('═'.repeat(60));
  console.log(`Video ID: ${videoId}`);
  console.log(`URL: https://youtube.com/watch?v=${videoId}`);
  console.log('═'.repeat(60));

  try {
    console.log('\n⏳ Initializing YouTube client...');
    const youtube = await Innertube.create();

    console.log('⏳ Fetching video info...');
    const info = await youtube.getInfo(videoId);

    // Get video details
    const title = info.basic_info.title;
    const author = info.basic_info.author;
    const duration = info.basic_info.duration;

    console.log(`\n📹 Video Info:`);
    console.log(`   Title: ${title}`);
    console.log(`   Creator: ${author}`);
    console.log(`   Duration: ${duration}s (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`);

    console.log('\n⏳ Fetching transcript...');

    // Get transcript
    const transcriptData = await info.getTranscript();

    if (!transcriptData || !transcriptData.transcript) {
      console.log('\n❌ NO TRANSCRIPT AVAILABLE');
      console.log('   Video has no captions/subtitles enabled');
      console.log('\n💡 Recommendation: Find alternative video with captions\n');
      return { available: false, segments: 0 };
    }

    const transcript = transcriptData.transcript;
    const segments = transcript.content.body.initial_segments;

    if (!segments || segments.length === 0) {
      console.log('\n❌ NO TRANSCRIPT SEGMENTS FOUND');
      return { available: false, segments: 0 };
    }

    console.log('\n✅ TRANSCRIPT AVAILABLE!');
    console.log(`\n📊 Stats:`);
    console.log(`   Segments: ${segments.length}`);
    console.log(`   Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`);

    // Show first 3 segments as preview
    console.log(`\n📝 Preview (first 3 segments):`);
    segments.slice(0, 3).forEach((seg, idx) => {
      const startTime = (seg.start_ms / 1000).toFixed(2);
      const text = seg.snippet?.text || seg.text || JSON.stringify(seg);
      const displayText = typeof text === 'string' ? text : JSON.stringify(text);
      console.log(`   ${idx + 1}. [${startTime}s] ${displayText.substring(0, 60)}${displayText.length > 60 ? '...' : ''}`);
    });

    // Calculate chunk count (30-second chunks)
    const estimatedChunks = Math.ceil(duration / 30);
    console.log(`\n🔢 Estimated chunks (30s): ${estimatedChunks}`);

    console.log('\n✅ This video is GOOD TO USE!\n');
    console.log('═'.repeat(60));
    console.log('\n📋 Add to CURATED-VIDEOS-MASTER-LIST.md:');
    console.log(`| # | ${title} | ${author} | https://youtube.com/watch?v=${videoId} | ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')} | ✅ Verified | Pending |\n`);

    return {
      available: true,
      videoId,
      title,
      creator: author,
      duration,
      segments: segments.length,
      estimatedChunks,
      transcriptSegments: segments
    };

  } catch (error) {
    console.log('\n❌ ERROR: Cannot fetch transcript');
    console.log(`   ${error.message}`);

    if (error.message.includes('not available')) {
      console.log('\n💡 This video has transcripts DISABLED by the creator');
    } else if (error.message.includes('not found')) {
      console.log('\n💡 Video not found or unavailable');
    } else {
      console.log('\n💡 Unexpected error occurred');
      console.log('\nFull error:', error);
    }

    console.log('\n🔄 Recommendation: Try another video\n');

    return { available: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  const input = process.argv[2];
  const videoId = extractVideoId(input);

  testTranscript(videoId)
    .then(result => {
      process.exit(result.available ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Unexpected error:', error.message);
      console.error(error);
      process.exit(2);
    });
}

module.exports = { testTranscript, extractVideoId };
