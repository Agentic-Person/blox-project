// Create sample transcript data for testing Chat Wizard
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Sample Roblox development content for testing
const sampleVideos = [
  {
    id: 'sample-video-1',
    youtubeId: 'sample001',
    title: 'Introduction to Roblox Studio - Getting Started',
    creator: 'RobloxDev Tutorial',
    transcript: `
      Welcome to Roblox Studio! Today we're going to learn how to get started with building your first game.
      
      First, let's open Roblox Studio and create a new place. You'll see the interface with different panels.
      The Explorer window shows all the objects in your game. The Properties window lets you modify selected objects.
      
      To create a basic part, go to the Home tab and click on Part. This creates a gray block in your workspace.
      You can move it around using the Move tool, or resize it with the Scale tool.
      
      For scripting, you'll need to add a Script object. Right-click in ServerScriptService and insert a Script.
      Scripts control the behavior of your game using the Lua programming language.
      
      Let's create a simple script that prints "Hello World" when the game starts:
      print("Hello World! My first Roblox script is working!")
      
      Remember to save your work frequently using Ctrl+S or File > Save to File.
      That's the basics of getting started with Roblox Studio!
    `
  },
  {
    id: 'sample-video-2', 
    youtubeId: 'sample002',
    title: 'Roblox Scripting Basics - Variables and Functions',
    creator: 'RobloxDev Tutorial',
    transcript: `
      In this tutorial, we'll learn about variables and functions in Roblox scripting.
      
      Variables are containers that store data. In Lua, you create variables like this:
      local playerName = "John"
      local playerScore = 100
      local isGameActive = true
      
      Functions are reusable blocks of code. Here's how to create a function:
      local function greetPlayer(name)
          print("Welcome to the game, " .. name .. "!")
      end
      
      To call the function, you write: greetPlayer("Alice")
      
      You can also create functions that return values:
      local function calculateScore(baseScore, bonus)
          return baseScore + bonus
      end
      
      local finalScore = calculateScore(100, 50)
      print("Final score: " .. finalScore)
      
      Events are important in Roblox. When a player joins, you can run code:
      game.Players.PlayerAdded:Connect(function(player)
          print(player.Name .. " joined the game!")
      end)
      
      This covers the basic building blocks of Roblox scripting!
    `
  },
  {
    id: 'sample-video-3',
    youtubeId: 'sample003', 
    title: 'Building Techniques - Parts, Unions, and Materials',
    creator: 'RobloxDev Tutorial',
    transcript: `
      Let's learn about building techniques in Roblox Studio.
      
      Parts are the basic building blocks. You can create different shapes:
      - Block: The default rectangular part
      - Sphere: Perfect for balls or round objects  
      - Cylinder: Great for pillars or wheels
      - Wedge: Useful for ramps and slopes
      
      To change a part's material, select it and go to the Properties window.
      Popular materials include:
      - Plastic: The default smooth material
      - Wood: Great for structures and furniture
      - Metal: Perfect for machinery and tools
      - Neon: Creates glowing effects
      - Glass: Transparent material for windows
      
      Union operations let you combine multiple parts:
      1. Select two or more parts
      2. Go to Model tab
      3. Click Union to merge them together
      
      You can also use Negate to subtract one part from another.
      This is useful for creating hollow objects or cutting holes.
      
      For precise positioning, use the Properties window to set exact Position and Size values.
      Enable snapping in the Model tab to align parts perfectly.
      
      These techniques will help you create professional-looking builds!
    `
  },
  {
    id: 'sample-video-4',
    youtubeId: 'sample004',
    title: 'Player Interaction and GUIs', 
    creator: 'RobloxDev Tutorial',
    transcript: `
      In this tutorial, we'll create player interactions and graphical user interfaces.
      
      First, let's detect when a player clicks on a part:
      local part = workspace.ClickablePart
      local clickDetector = Instance.new("ClickDetector")
      clickDetector.Parent = part
      
      clickDetector.MouseClick:Connect(function(player)
          print(player.Name .. " clicked the part!")
      end)
      
      For GUIs, we create ScreenGui objects in StarterGui:
      local screenGui = Instance.new("ScreenGui")
      screenGui.Parent = game.StarterGui
      
      Let's add a button:
      local button = Instance.new("TextButton")
      button.Size = UDim2.new(0, 200, 0, 50)
      button.Position = UDim2.new(0.5, -100, 0.5, -25)
      button.Text = "Click Me!"
      button.Parent = screenGui
      
      button.MouseButton1Click:Connect(function()
          print("Button was clicked!")
      end)
      
      You can also create frames for organizing GUI elements:
      local frame = Instance.new("Frame")
      frame.Size = UDim2.new(0, 300, 0, 200)
      frame.Position = UDim2.new(0.5, -150, 0.5, -100)
      frame.BackgroundColor3 = Color3.new(0, 0, 1)
      
      Remember to test your GUIs on different screen sizes!
    `
  }
]

// Function to generate embeddings (mock for now)
async function mockGenerateEmbedding(text) {
  // For testing, we'll create mock embeddings (1536 dimensions)
  // In production, this would call OpenAI API
  return Array.from({ length: 1536 }, () => Math.random() - 0.5)
}

// Function to chunk text
function createChunks(text, chunkSize = 500) {
  const words = text.split(' ')
  const chunks = []
  
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunkWords = words.slice(i, i + chunkSize)
    const chunkText = chunkWords.join(' ')
    
    chunks.push({
      text: chunkText,
      chunkIndex: Math.floor(i / chunkSize),
      startTimestamp: `${Math.floor(i / 10)}:${(i % 10) * 6}`.padStart(4, '0'),
      endTimestamp: `${Math.floor((i + chunkSize) / 10)}:${((i + chunkSize) % 10) * 6}`.padStart(4, '0'),
      startSeconds: i * 2,
      endSeconds: (i + chunkSize) * 2
    })
  }
  
  return chunks
}

async function createSampleData() {
  console.log('🚀 Creating sample transcript data for Chat Wizard testing...')
  
  try {
    // Clear existing sample data
    await supabase
      .from('transcript_chunks')
      .delete()
      .like('chunk_text', '%Welcome to Roblox Studio%')
    
    await supabase
      .from('video_transcripts')
      .delete()
      .in('youtube_id', sampleVideos.map(v => v.youtubeId))
    
    console.log('🧹 Cleared existing sample data')
    
    let totalChunks = 0
    
    for (const video of sampleVideos) {
      console.log(`📹 Processing: ${video.title}`)
      
      // Create transcript segments
      const segments = video.transcript
        .trim()
        .split('\n')
        .filter(line => line.trim())
        .map((text, index) => ({
          text: text.trim(),
          startTime: index * 10,
          duration: 8,
          timestamp: `${Math.floor(index * 10 / 60)}:${(index * 10 % 60).toString().padStart(2, '0')}`
        }))
      
      // Store video transcript
      const { data: videoRecord, error: videoError } = await supabase
        .from('video_transcripts')
        .insert({
          video_id: video.id,
          youtube_id: video.youtubeId,
          title: video.title,
          creator: video.creator,
          full_transcript: video.transcript.trim(),
          transcript_json: segments,
          processed_at: new Date().toISOString()
        })
        .select('id')
        .single()
      
      if (videoError) {
        console.error('❌ Video insert failed:', videoError)
        continue
      }
      
      const transcriptId = videoRecord.id
      console.log(`✅ Created video record: ${transcriptId}`)
      
      // Create chunks
      const chunks = createChunks(video.transcript.replace(/\s+/g, ' ').trim(), 100)
      console.log(`📦 Creating ${chunks.length} chunks`)
      
      // Store chunks with embeddings
      for (const chunk of chunks) {
        const embedding = await mockGenerateEmbedding(chunk.text)
        
        const { error: chunkError } = await supabase
          .from('transcript_chunks')
          .insert({
            transcript_id: transcriptId,
            chunk_text: chunk.text,
            chunk_index: chunk.chunkIndex,
            start_timestamp: chunk.startTimestamp,
            end_timestamp: chunk.endTimestamp,
            start_seconds: chunk.startSeconds,
            end_seconds: chunk.endSeconds,
            embedding: embedding
          })
        
        if (chunkError) {
          console.error('❌ Chunk insert failed:', chunkError)
        } else {
          totalChunks++
        }
      }
      
      console.log(`✅ Completed ${video.title}`)
    }
    
    console.log('\n🎉 Sample data creation completed!')
    console.log(`📊 Created ${sampleVideos.length} videos`)
    console.log(`📦 Created ${totalChunks} transcript chunks`)
    
    // Test database
    console.log('\n🧪 Testing database queries...')
    
    const { data: videoCount } = await supabase
      .from('video_transcripts')
      .select('id')
    
    const { data: chunkCount } = await supabase  
      .from('transcript_chunks')
      .select('id')
    
    console.log(`✅ Database verification:`)
    console.log(`   Videos: ${videoCount?.length || 0}`)
    console.log(`   Chunks: ${chunkCount?.length || 0}`)
    
    console.log('\n🎯 Ready to test Chat Wizard!')
    console.log('You can now:')
    console.log('1. Test vector search functionality')
    console.log('2. Update the Chat API to use real data')
    console.log('3. Create the frontend chat component')
    
  } catch (error) {
    console.error('💥 Sample data creation failed:', error)
  }
}

if (require.main === module) {
  createSampleData()
}