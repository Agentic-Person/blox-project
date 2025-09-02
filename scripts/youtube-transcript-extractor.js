#!/usr/bin/env node

/**
 * Node.js wrapper for the Python YouTube transcript extractor
 * Integrates yt-dlp based transcript extraction with our existing system
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class YouTubeTranscriptExtractor {
  constructor() {
    this.pythonScript = path.join(__dirname, 'extract-transcripts.py');
  }

  /**
   * Extract transcript for a single video
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} Transcript result
   */
  async extractTranscript(videoId) {
    return new Promise((resolve, reject) => {
      console.log(`🔄 Extracting transcript for video: ${videoId}`);
      
      const python = spawn('python', [this.pythonScript, videoId], {
        cwd: path.dirname(this.pythonScript)
      });
      
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            if (result.success) {
              console.log(`✅ Successfully extracted transcript for ${videoId}`);
              console.log(`   Title: ${result.title}`);
              console.log(`   Method: ${result.method}`);
              console.log(`   Length: ${result.transcript ? result.transcript.length : 0} characters`);
            } else {
              console.log(`❌ Failed to extract transcript for ${videoId}: ${result.error}`);
            }
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse Python output: ${error.message}`));
          }
        } else {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });
      
      python.on('error', (error) => {
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });
    });
  }

  /**
   * Extract transcripts for multiple videos
   * @param {Array} videos - Array of video objects with youtubeId property
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} Array of transcript results
   */
  async extractMultipleTranscripts(videos, options = {}) {
    const { 
      batchSize = 5,
      delayMs = 1000,
      retryFailures = true,
      maxRetries = 3
    } = options;

    const results = [];
    const failures = [];
    
    console.log(`📦 Processing ${videos.length} videos in batches of ${batchSize}`);
    
    // Process videos in batches to avoid overwhelming YouTube
    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = videos.slice(i, i + batchSize);
      console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(videos.length / batchSize)}`);
      
      const batchPromises = batch.map(async (video) => {
        try {
          const result = await this.extractTranscript(video.youtubeId);
          return {
            video,
            result,
            success: result.success
          };
        } catch (error) {
          console.error(`❌ Error processing ${video.youtubeId}: ${error.message}`);
          return {
            video,
            result: null,
            success: false,
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Track failures for potential retry
      batchResults.forEach(result => {
        if (!result.success) {
          failures.push(result);
        }
      });
      
      // Delay between batches to be respectful to YouTube
      if (i + batchSize < videos.length) {
        console.log(`⏱️  Waiting ${delayMs}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    // Retry failures if enabled
    if (retryFailures && failures.length > 0) {
      console.log(`\n🔄 Retrying ${failures.length} failed extractions...`);
      
      for (const failure of failures) {
        let retryCount = 0;
        let success = false;
        
        while (retryCount < maxRetries && !success) {
          try {
            console.log(`🔄 Retry ${retryCount + 1}/${maxRetries} for ${failure.video.youtubeId}`);
            const result = await this.extractTranscript(failure.video.youtubeId);
            
            if (result.success) {
              // Update the original result
              const originalIndex = results.findIndex(r => 
                r.video.youtubeId === failure.video.youtubeId
              );
              if (originalIndex !== -1) {
                results[originalIndex] = {
                  video: failure.video,
                  result,
                  success: true
                };
              }
              success = true;
              console.log(`✅ Retry successful for ${failure.video.youtubeId}`);
            }
          } catch (error) {
            console.log(`❌ Retry ${retryCount + 1} failed for ${failure.video.youtubeId}: ${error.message}`);
          }
          
          retryCount++;
          if (retryCount < maxRetries && !success) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait longer between retries
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Process Module 1 videos and save results
   */
  async processModule1Videos() {
    console.log('🚀 Starting Module 1 transcript extraction...\n');
    
    // Load Module 1 videos
    const videosFile = path.join(__dirname, 'module1-week12-videos.json');
    
    if (!fs.existsSync(videosFile)) {
      throw new Error(`Videos file not found: ${videosFile}`);
    }
    
    const videos = JSON.parse(fs.readFileSync(videosFile, 'utf8'));
    console.log(`📚 Loaded ${videos.length} Module 1 videos`);
    
    // Extract transcripts
    const results = await this.extractMultipleTranscripts(videos, {
      batchSize: 3, // Smaller batches for better reliability
      delayMs: 2000, // Longer delays
      retryFailures: true,
      maxRetries: 2
    });
    
    // Generate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    console.log('\n📊 Extraction Summary:');
    console.log(`✅ Successful: ${successful}/${results.length} (${((successful/results.length)*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed}/${results.length} (${((failed/results.length)*100).toFixed(1)}%)`);
    
    // Save results
    const outputFile = path.join(__dirname, 'module1-transcript-results.json');
    const outputData = {
      timestamp: new Date().toISOString(),
      totalVideos: videos.length,
      successful,
      failed,
      successRate: `${((successful/results.length)*100).toFixed(1)}%`,
      results: results.map(r => ({
        videoId: r.video.youtubeId,
        title: r.video.title,
        success: r.success,
        transcriptLength: r.result?.transcript?.length || 0,
        method: r.result?.method || null,
        error: r.result?.error || r.error || null
      })),
      transcripts: results
        .filter(r => r.success && r.result?.transcript)
        .map(r => ({
          videoId: r.video.youtubeId,
          title: r.result.title,
          transcript: r.result.transcript,
          duration: r.result.duration,
          method: r.result.method,
          language: r.result.language
        }))
    };
    
    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
    console.log(`💾 Results saved to: ${outputFile}`);
    
    if (successful > 0) {
      console.log('\n🎉 Transcript extraction completed successfully!');
      console.log('Next steps:');
      console.log('1. Review the results file');
      console.log('2. Import successful transcripts into database');
      console.log('3. Generate embeddings for vector search');
    } else {
      console.log('\n⚠️  No transcripts were successfully extracted.');
      console.log('Check the error messages above and try again.');
    }
    
    return outputData;
  }
}

// CLI usage
if (require.main === module) {
  const extractor = new YouTubeTranscriptExtractor();
  
  const command = process.argv[2];
  
  if (command === 'single' && process.argv[3]) {
    // Extract single video transcript
    const videoId = process.argv[3];
    extractor.extractTranscript(videoId)
      .then(result => {
        console.log(JSON.stringify(result, null, 2));
      })
      .catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
      });
  } else if (command === 'module1') {
    // Process all Module 1 videos
    extractor.processModule1Videos()
      .then(() => {
        console.log('\n✅ Processing complete!');
      })
      .catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  node youtube-transcript-extractor.js single <video_id>');
    console.log('  node youtube-transcript-extractor.js module1');
  }
}

module.exports = YouTubeTranscriptExtractor;