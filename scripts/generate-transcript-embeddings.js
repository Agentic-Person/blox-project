const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase configuration');
  console.log('Required environment variables:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL');
  console.log('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!openaiApiKey) {
  console.error('Error: Missing OpenAI API key');
  console.log('Required environment variable:');
  console.log('  OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

// Constants
const EMBEDDING_MODEL = 'text-embedding-ada-002';
const BATCH_SIZE = 10; // Process embeddings in batches to avoid rate limits
const RETRY_DELAY = 1000; // 1 second delay between batches
const MAX_RETRIES = 3;

// Rate limiting helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate embeddings using OpenAI
async function generateEmbedding(text, retries = 0) {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.replace(/\\n/g, ' ').trim(), // Clean up text
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error(`Error generating embedding (attempt ${retries + 1}):`, error.message);
    
    if (retries < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY}ms...`);
      await delay(RETRY_DELAY);
      return generateEmbedding(text, retries + 1);
    }
    
    throw error;
  }
}

// Get all transcript chunks that need embeddings
async function getTranscriptChunksWithoutEmbeddings() {
  console.log('Fetching transcript chunks without embeddings...');

  const { data, error } = await supabase
    .from('transcript_chunks')
    .select('id, transcript_id, chunk_index, chunk_text')
    .is('embedding', null)
    .order('transcript_id, chunk_index');

  if (error) {
    throw new Error(`Error fetching transcript chunks: ${error.message}`);
  }

  // Get video titles for each unique transcript_id
  if (data && data.length > 0) {
    const transcriptIds = [...new Set(data.map(d => d.transcript_id))];
    const { data: videos, error: videosError } = await supabase
      .from('video_transcripts')
      .select('id, title')
      .in('id', transcriptIds);

    if (!videosError && videos) {
      // Map video titles to chunks
      const videoMap = new Map(videos.map(v => [v.id, v.title]));
      data.forEach(chunk => {
        chunk.video_title = videoMap.get(chunk.transcript_id) || 'Unknown';
      });
    }
  }

  console.log(`Found ${data.length} chunks without embeddings`);
  return data;
}

// Update chunk with embedding
async function updateChunkEmbedding(chunkId, embedding) {
  const { error } = await supabase
    .from('transcript_chunks')
    .update({ embedding })
    .eq('id', chunkId);

  if (error) {
    throw new Error(`Error updating chunk ${chunkId}: ${error.message}`);
  }
}

// Process embeddings in batches
async function processEmbeddings() {
  try {
    console.log('Starting embedding generation process...');
    console.log('=====================================\\n');

    // Get all chunks without embeddings
    const chunks = await getTranscriptChunksWithoutEmbeddings();
    
    if (chunks.length === 0) {
      console.log('✅ All transcript chunks already have embeddings!');
      return;
    }

    console.log(`Processing ${chunks.length} transcript chunks...`);
    console.log(`Batch size: ${BATCH_SIZE} chunks`);
    console.log(`Estimated time: ${Math.ceil(chunks.length / BATCH_SIZE * 2)} minutes\\n`);

    let processed = 0;
    let errors = 0;

    // Process in batches
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

      console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} chunks)...`);

      // Process chunks in parallel within batch
      const batchPromises = batch.map(async (chunk) => {
        try {
          // Generate embedding
          const embedding = await generateEmbedding(chunk.chunk_text);

          // Update in database
          await updateChunkEmbedding(chunk.id, embedding);

          processed++;
          console.log(`  ✅ ${chunk.video_title || 'Unknown'} - Chunk ${chunk.chunk_index}`);

        } catch (error) {
          errors++;
          console.error(`  ❌ Error processing chunk ${chunk.id}:`, error.message);
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);

      // Rate limiting delay between batches (except for last batch)
      if (i + BATCH_SIZE < chunks.length) {
        console.log(`  Waiting ${RETRY_DELAY}ms before next batch...\\n`);
        await delay(RETRY_DELAY);
      }
    }

    console.log('\\n=====================================');
    console.log('Embedding generation completed!');
    console.log(`✅ Successfully processed: ${processed} chunks`);
    if (errors > 0) {
      console.log(`❌ Errors encountered: ${errors} chunks`);
    }
    console.log(`📊 Success rate: ${((processed / chunks.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('\\nEmbedding generation failed:', error);
    throw error;
  }
}

// Test the embedding system with a sample query
async function testEmbeddingSearch(query = "how to script in roblox") {
  try {
    console.log('\\n=====================================');
    console.log('Testing vector search...');
    console.log(`Query: "${query}"\\n`);

    // Generate embedding for the query
    console.log('Generating query embedding...');
    const queryEmbedding = await generateEmbedding(query);

    // Search for similar chunks using pgvector
    const { data, error } = await supabase.rpc('search_similar_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7, // Similarity threshold
      match_count: 5
    });

    if (error) {
      console.error('Search failed:', error);
      return;
    }

    console.log(`Found ${data.length} similar chunks:\\n`);
    
    data.forEach((result, index) => {
      console.log(`${index + 1}. ${result.video_title}`);
      console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`   Time: ${Math.floor(result.start_time / 60)}:${(result.start_time % 60).toString().padStart(2, '0')}`);
      console.log(`   Text: ${result.chunk_text.substring(0, 100)}...\\n`);
    });

  } catch (error) {
    console.error('Test search failed:', error);
  }
}

// Get embedding statistics
async function getEmbeddingStats() {
  try {
    console.log('\\n=====================================');
    console.log('Embedding Statistics:\\n');

    // Total chunks
    const { count: totalChunks } = await supabase
      .from('transcript_chunks')
      .select('*', { count: 'exact', head: true });

    // Chunks with embeddings
    const { count: chunksWithEmbeddings } = await supabase
      .from('transcript_chunks')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    // Chunks without embeddings
    const chunksWithoutEmbeddings = totalChunks - chunksWithEmbeddings;

    console.log(`Total transcript chunks: ${totalChunks}`);
    console.log(`Chunks with embeddings: ${chunksWithEmbeddings}`);
    console.log(`Chunks without embeddings: ${chunksWithoutEmbeddings}`);
    console.log(`Completion rate: ${((chunksWithEmbeddings / totalChunks) * 100).toFixed(1)}%`);

    // Get some sample embedded chunks
    if (chunksWithEmbeddings > 0) {
      const { data: sampleChunks } = await supabase
        .from('transcript_chunks')
        .select('transcript_id, chunk_index, chunk_text')
        .not('embedding', 'is', null)
        .limit(3);

      if (sampleChunks && sampleChunks.length > 0) {
        // Get video titles
        const transcriptIds = sampleChunks.map(c => c.transcript_id);
        const { data: videos } = await supabase
          .from('video_transcripts')
          .select('id, title')
          .in('id', transcriptIds);

        const videoMap = new Map(videos?.map(v => [v.id, v.title]) || []);

        console.log('\\nSample embedded chunks:');
        sampleChunks.forEach((chunk, i) => {
          const title = videoMap.get(chunk.transcript_id) || 'Unknown';
          console.log(`  ${i + 1}. ${title} - Chunk ${chunk.chunk_index}`);
        });
      }
    }

  } catch (error) {
    console.error('Error getting stats:', error);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--stats')) {
      await getEmbeddingStats();
    } else if (args.includes('--test')) {
      const query = args[args.indexOf('--test') + 1] || "how to script in roblox";
      await testEmbeddingSearch(query);
    } else {
      // Generate embeddings
      await processEmbeddings();
      
      // Show final stats
      await getEmbeddingStats();
      
      console.log('\\n🎉 Next steps:');
      console.log('1. Test the search: node scripts/generate-transcript-embeddings.js --test "your query"');
      console.log('2. Update Blox Wizard to use vector search');
      console.log('3. Deploy the enhanced search functionality');
    }
    
  } catch (error) {
    console.error('\\n💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = {
  processEmbeddings,
  testEmbeddingSearch,
  getEmbeddingStats,
  generateEmbedding
};

// Run if called directly
if (require.main === module) {
  main();
}