#!/usr/bin/env node

/**
 * Import real transcripts extracted with yt-dlp into Supabase database
 * Generates embeddings and stores transcript chunks for vector search
 */

require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class TranscriptImporter {
  constructor() {
    this.chunkSize = 500; // tokens per chunk
    this.chunkOverlap = 100; // token overlap between chunks
  }

  /**
   * Import all extracted transcripts from results file
   */
  async importTranscripts() {
    console.log('📚 Starting real transcript import process...\n');

    // Load the extracted transcript results
    const resultsFile = path.join(__dirname, 'module1-transcript-results.json');
    if (!fs.existsSync(resultsFile)) {
      throw new Error(`Results file not found: ${resultsFile}`);
    }

    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    const successfulTranscripts = results.transcripts || [];

    console.log(`📊 Found ${successfulTranscripts.length} successful transcripts to import`);
    console.log(`🎯 Success rate: ${results.successRate}`);

    if (successfulTranscripts.length === 0) {
      console.log('❌ No transcripts found to import');
      return;
    }

    // Clear existing transcript data first
    console.log('\n🧹 Clearing existing transcript data...');
    await this.clearExistingData();

    let importedCount = 0;
    let errorCount = 0;

    // Process each transcript
    for (const transcript of successfulTranscripts) {
      try {
        console.log(`\n🔄 Processing: ${transcript.title}`);
        console.log(`   Video ID: ${transcript.videoId}`);
        console.log(`   Length: ${transcript.transcript.length} characters`);

        await this.processTranscript(transcript);
        importedCount++;
        console.log(`✅ Successfully imported transcript for ${transcript.videoId}`);

      } catch (error) {
        console.error(`❌ Failed to import transcript for ${transcript.videoId}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully imported: ${importedCount}/${successfulTranscripts.length}`);
    console.log(`❌ Errors: ${errorCount}/${successfulTranscripts.length}`);

    if (importedCount > 0) {
      console.log('\n🎉 Real transcript import completed successfully!');
      console.log('💡 The Chat Wizard can now use real video content for responses');
      console.log('\nNext steps:');
      console.log('1. Test the Chat API with real transcript data');
      console.log('2. Create the frontend chat component');
      console.log('3. Run end-to-end testing');
    }
  }

  /**
   * Clear existing transcript data from database
   */
  async clearExistingData() {
    try {
      // Delete transcript chunks first (foreign key constraint)
      const { error: chunksError } = await supabaseAdmin
        .from('transcript_chunks')
        .delete()
        .gte('created_at', '1970-01-01'); // Delete all rows using a condition that matches all

      if (chunksError) {
        console.warn('Warning clearing transcript chunks:', chunksError.message);
      }

      // Delete video transcripts
      const { error: transcriptsError } = await supabaseAdmin
        .from('video_transcripts')
        .delete()
        .gte('created_at', '1970-01-01'); // Delete all rows using a condition that matches all

      if (transcriptsError) {
        console.warn('Warning clearing video transcripts:', transcriptsError.message);
      }

      console.log('✅ Cleared existing data');
    } catch (error) {
      console.warn('Warning during data clearing:', error.message);
    }
  }

  /**
   * Process a single transcript: insert video record, chunk transcript, generate embeddings
   */
  async processTranscript(transcript) {
    // 1. Insert video transcript record
    const { data: videoRecord, error: videoError } = await supabaseAdmin
      .from('video_transcripts')
      .insert([
        {
          video_id: transcript.videoId,
          youtube_id: transcript.videoId,
          title: transcript.title,
          creator: 'Various', // We don't have creator info in results
          duration_seconds: transcript.duration || 0,
          full_transcript: transcript.transcript,
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (videoError) {
      throw new Error(`Failed to insert video record: ${videoError.message}`);
    }

    console.log(`   📝 Created video record with ID: ${videoRecord.id}`);

    // 2. Create transcript chunks
    const chunks = this.createChunks(transcript.transcript);
    console.log(`   🔪 Created ${chunks.length} chunks`);

    // 3. Process chunks in batches to avoid overwhelming OpenAI
    const batchSize = 5;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      console.log(`   🔄 Processing chunk batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
      
      const chunkPromises = batch.map(async (chunk, batchIndex) => {
        const chunkIndex = i + batchIndex;
        
        try {
          // Generate embedding
          const embedding = await this.generateEmbedding(chunk.text);
          
          // Calculate timestamps (estimate based on chunk position)
          const startSeconds = Math.floor((chunkIndex / chunks.length) * (transcript.duration || 600));
          const endSeconds = Math.floor(((chunkIndex + 1) / chunks.length) * (transcript.duration || 600));
          
          return {
            transcript_id: videoRecord.id,
            chunk_index: chunkIndex,
            chunk_text: chunk.text,
            start_timestamp: this.secondsToTimestamp(startSeconds),
            end_timestamp: this.secondsToTimestamp(endSeconds),
            start_seconds: startSeconds,
            end_seconds: endSeconds,
            embedding: embedding,
            created_at: new Date().toISOString()
          };
        } catch (error) {
          console.warn(`   ⚠️  Failed to generate embedding for chunk ${chunkIndex}: ${error.message}`);
          // Return chunk without embedding as fallback
          return {
            transcript_id: videoRecord.id,
            chunk_index: chunkIndex,
            chunk_text: chunk.text,
            start_timestamp: this.secondsToTimestamp(startSeconds),
            end_timestamp: this.secondsToTimestamp(endSeconds),
            start_seconds: startSeconds,
            end_seconds: endSeconds,
            embedding: null,
            created_at: new Date().toISOString()
          };
        }
      });

      const batchChunks = await Promise.all(chunkPromises);

      // Insert batch of chunks
      const { error: chunksError } = await supabaseAdmin
        .from('transcript_chunks')
        .insert(batchChunks);

      if (chunksError) {
        throw new Error(`Failed to insert chunks batch: ${chunksError.message}`);
      }

      // Rate limiting - small delay between batches
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`   ✅ Inserted ${chunks.length} chunks with embeddings`);
  }

  /**
   * Create chunks from transcript text
   */
  createChunks(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    let currentTokenCount = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokenCount(sentence);
      
      if (currentTokenCount + sentenceTokens > this.chunkSize && currentChunk) {
        // Start new chunk with overlap
        chunks.push({ text: currentChunk.trim() });
        
        // Create overlap by keeping last sentences
        const overlap = this.createOverlap(currentChunk);
        currentChunk = overlap + sentence;
        currentTokenCount = this.estimateTokenCount(currentChunk);
      } else {
        currentChunk += sentence + '. ';
        currentTokenCount += sentenceTokens;
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({ text: currentChunk.trim() });
    }

    return chunks.map((chunk, index) => ({
      ...chunk,
      index
    }));
  }

  /**
   * Create overlap text from end of previous chunk
   */
  createOverlap(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const overlapSentences = sentences.slice(-2); // Last 2 sentences for overlap
    return overlapSentences.join('. ') + (overlapSentences.length > 0 ? '. ' : '');
  }

  /**
   * Rough token count estimation (1 token ≈ 4 characters)
   */
  estimateTokenCount(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Generate embedding using OpenAI
   */
  async generateEmbedding(text) {
    try {
      const response = await openai.embeddings.create({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      // If OpenAI fails, we'll still save the chunk without embedding
      throw error;
    }
  }

  /**
   * Convert seconds to MM:SS format
   */
  secondsToTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// CLI usage
if (require.main === module) {
  const importer = new TranscriptImporter();
  
  importer.importTranscripts()
    .then(() => {
      console.log('\n✅ Import process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import process failed:', error.message);
      process.exit(1);
    });
}

module.exports = TranscriptImporter;