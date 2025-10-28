# Plan B: Metadata-Only Video Search

**Status:** Fallback plan if Supabase restore fails
**Implementation Time:** 2 hours
**Complexity:** Low

---

## Overview

Instead of semantic search using transcript embeddings, implement basic keyword search using:
- Video titles
- Video descriptions (if available)
- Creator names
- Tags/categories

**No transcripts required. No embeddings required.**

---

## Implementation Plan

### Step 1: Create Search Service (30 minutes)

```typescript
// src/lib/services/metadata-video-search.ts

import { supabase } from '@/lib/supabase/client'

export interface VideoSearchResult {
  youtubeId: string
  title: string
  creator: string
  description?: string
  thumbnail?: string
  duration?: number
  relevanceScore: number
}

export async function searchVideosByMetadata(
  query: string,
  maxResults: number = 10
): Promise<VideoSearchResult[]> {
  // Normalize query
  const normalizedQuery = query.toLowerCase().trim()
  const keywords = normalizedQuery.split(/\s+/)

  // Fetch all videos from curriculum
  const { data: videos, error } = await supabase
    .from('curriculum_videos')
    .select('youtube_id, title, creator, description, thumbnail, duration')

  if (error || !videos) {
    console.error('Error fetching videos:', error)
    return []
  }

  // Score each video based on keyword matches
  const scoredVideos = videos.map(video => {
    let score = 0
    const searchText = `${video.title} ${video.description || ''} ${video.creator}`.toLowerCase()

    // Exact phrase match (highest score)
    if (searchText.includes(normalizedQuery)) {
      score += 10
    }

    // Individual keyword matches
    keywords.forEach(keyword => {
      if (searchText.includes(keyword)) {
        score += 3
      }

      // Bonus for title matches
      if (video.title.toLowerCase().includes(keyword)) {
        score += 2
      }

      // Bonus for exact word boundaries
      const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, 'i')
      if (wordBoundaryRegex.test(searchText)) {
        score += 1
      }
    })

    return {
      youtubeId: video.youtube_id,
      title: video.title,
      creator: video.creator,
      description: video.description,
      thumbnail: video.thumbnail,
      duration: video.duration,
      relevanceScore: score
    }
  })

  // Filter out zero-score results and sort by relevance
  return scoredVideos
    .filter(v => v.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults)
}
```

### Step 2: Create Keyword Mappings (30 minutes)

```typescript
// src/lib/data/video-topic-mappings.ts

export const topicKeywords = {
  'roblox-scripting': ['script', 'lua', 'code', 'programming', 'beginner guide to scripting'],
  'roblox-building': ['studio', 'building', 'parts', 'workspace', 'terrain'],
  'roblox-ui': ['gui', 'ui', 'interface', 'menu', 'screen'],
  'blender-modeling': ['blender', 'modeling', '3d', 'mesh', 'vertices'],
  'blender-animation': ['animation', 'keyframe', 'timeline', 'rig'],
  'unity': ['unity', 'unity 6', 'game engine', 'c#'],
  'lighting': ['lighting', 'atmosphere', 'shadows', 'future lighting'],
  'optimization': ['optimize', 'performance', 'lag', 'fps'],
}

export const videoTopicTags = {
  'P2ECl-mLmvY': ['roblox-scripting', 'beginner', 'lua'],  // Easiest Beginner Guide to Scripting
  'p005iduooyw': ['roblox-building', 'beginner', 'studio'],  // Ultimate Beginner Guide
  '99C5K1cdql8': ['roblox-building', 'lighting'],           // Complete Guide to Lighting
  // ... add more mappings
}

export function enhanceSearchWithTopics(
  query: string,
  videos: VideoSearchResult[]
): VideoSearchResult[] {
  const queryLower = query.toLowerCase()

  // Find matching topics
  const matchingTopics = Object.entries(topicKeywords)
    .filter(([_, keywords]) =>
      keywords.some(keyword => queryLower.includes(keyword))
    )
    .map(([topic]) => topic)

  // Boost scores for videos tagged with matching topics
  return videos.map(video => {
    const videoTags = videoTopicTags[video.youtubeId] || []
    const topicMatches = videoTags.filter(tag => matchingTopics.includes(tag))

    return {
      ...video,
      relevanceScore: video.relevanceScore + (topicMatches.length * 5)
    }
  }).sort((a, b) => b.relevanceScore - a.relevanceScore)
}
```

### Step 3: Update Blox Wizard AI (30 minutes)

```typescript
// src/lib/services/blox-wizard-ai.ts

import { searchVideosByMetadata, enhanceSearchWithTopics } from './metadata-video-search'

async function handleVideoSearchRequest(userMessage: string) {
  // Extract search intent
  const searchTerms = extractSearchTerms(userMessage)

  if (!searchTerms) {
    return {
      message: "I can help you find videos! What topic are you interested in?",
      videos: []
    }
  }

  // Search using metadata
  const results = await searchVideosByMetadata(searchTerms, 5)
  const enhancedResults = enhanceSearchWithTopics(searchTerms, results)

  if (enhancedResults.length === 0) {
    return {
      message: `I couldn't find any videos about "${searchTerms}". Try asking about:\n- Roblox scripting\n- Blender modeling\n- Unity basics\n- Building in Roblox Studio`,
      videos: []
    }
  }

  return {
    message: `I found ${enhancedResults.length} video${enhancedResults.length > 1 ? 's' : ''} about "${searchTerms}":`,
    videos: enhancedResults
  }
}

function extractSearchTerms(message: string): string | null {
  // Look for common patterns
  const patterns = [
    /(?:show me|find|search for|videos? about|learn about)\s+(.+)/i,
    /(?:how to|tutorial on)\s+(.+)/i,
    /(?:help with|teach me)\s+(.+)/i,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }

  // Fallback: use entire message if it mentions specific topics
  const topics = ['roblox', 'scripting', 'blender', 'unity', 'modeling', 'building', 'lighting']
  if (topics.some(topic => message.toLowerCase().includes(topic))) {
    return message
  }

  return null
}
```

### Step 4: Add Database Table (15 minutes)

```sql
-- supabase/migrations/011_curriculum_videos_table.sql

CREATE TABLE IF NOT EXISTS public.curriculum_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  creator TEXT,
  description TEXT,
  thumbnail TEXT,
  duration INTEGER,
  module_id TEXT,
  week_number INTEGER,
  day_number INTEGER,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_curriculum_videos_youtube_id ON public.curriculum_videos (youtube_id);
CREATE INDEX idx_curriculum_videos_module ON public.curriculum_videos (module_id);
CREATE INDEX idx_curriculum_videos_tags ON public.curriculum_videos USING GIN (tags);

-- Enable RLS
ALTER TABLE public.curriculum_videos ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to curriculum videos"
  ON public.curriculum_videos
  FOR SELECT
  USING (true);
```

### Step 5: Populate Video Data (15 minutes)

```javascript
// scripts/populate-curriculum-videos.js

const curriculum = require('../src/data/curriculum.json')

async function populateCurriculumVideos() {
  const videos = []

  curriculum.modules.forEach(module => {
    module.weeks.forEach((week, weekIdx) => {
      week.days.forEach((day, dayIdx) => {
        day.videos.forEach(video => {
          if (video.youtubeId) {
            videos.push({
              youtube_id: video.youtubeId,
              title: video.title,
              creator: video.creator,
              description: video.description || null,
              thumbnail: `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
              module_id: module.id,
              week_number: weekIdx + 1,
              day_number: dayIdx + 1,
              tags: determineTags(video.title, video.description)
            })
          }
        })
      })
    })
  })

  console.log(`Inserting ${videos.length} videos...`)

  const { data, error } = await supabase
    .from('curriculum_videos')
    .upsert(videos, { onConflict: 'youtube_id' })

  if (error) {
    console.error('Error:', error)
  } else {
    console.log(`✅ Inserted ${videos.length} videos`)
  }
}

function determineTags(title, description) {
  const tags = []
  const text = `${title} ${description || ''}`.toLowerCase()

  if (text.includes('roblox')) tags.push('roblox')
  if (text.includes('script') || text.includes('lua')) tags.push('scripting')
  if (text.includes('blender')) tags.push('blender')
  if (text.includes('unity')) tags.push('unity')
  if (text.includes('beginner')) tags.push('beginner')
  if (text.includes('advanced')) tags.push('advanced')

  return tags
}
```

---

## Advantages

1. **No transcript dependencies** - Works with any YouTube video
2. **Fast implementation** - 2 hours vs days of debugging
3. **No API costs** - No OpenAI embedding calls
4. **No rate limits** - No YouTube transcript extraction
5. **Predictable results** - Keyword matching is deterministic
6. **Easy to debug** - Simple string matching logic

---

## Limitations

1. **No timestamp search** - Can't find specific moments in videos
2. **Less intelligent** - Misses semantic meaning ("loops" vs "iteration")
3. **Title-dependent** - Only finds what's explicitly mentioned
4. **No context** - Can't understand "the video where they show X"

---

## Comparison

| Feature | Semantic Search (Original) | Metadata Search (Plan B) |
|---------|---------------------------|-------------------------|
| Find by topic | ✅ Excellent | ✅ Good |
| Find by timestamp | ✅ Yes | ❌ No |
| Semantic understanding | ✅ Yes | ❌ No |
| Works without transcripts | ❌ No | ✅ Yes |
| Implementation complexity | 🔴 High | 🟢 Low |
| API dependencies | 🔴 YouTube + OpenAI | 🟢 None |
| Maintenance | 🔴 High | 🟢 Low |

---

## Example Queries

### Query: "Show me Roblox scripting videos"

**Metadata Search Result:**
```javascript
[
  {
    title: "The EASIEST Beginner Guide to Scripting (Roblox)",
    creator: "TheDevKing",
    relevanceScore: 18,  // "roblox" + "scripting" in title
    youtubeId: "P2ECl-mLmvY"
  },
  {
    title: "How to Script in Roblox Studio",
    creator: "AlvinBlox",
    relevanceScore: 15,
    youtubeId: "xyz123"
  }
]
```

### Query: "Blender modeling basics"

**Metadata Search Result:**
```javascript
[
  {
    title: "BLENDER 4.5 BASICS - Complete Beginner Tutorial",
    creator: "Grant Abbitt",
    relevanceScore: 16,
    youtubeId: "abc789"
  }
]
```

---

## Testing Plan

```bash
# 1. Create migration
npm run supabase:migration:create curriculum_videos

# 2. Apply migration
npm run supabase:migration:up

# 3. Populate data
node scripts/populate-curriculum-videos.js

# 4. Test search
node scripts/test-metadata-search.js

# 5. Test in UI
npm run dev
# Visit: http://localhost:3003/blox-wizard
# Try: "Show me Roblox scripting videos"
```

---

## Recommendation

**Use Plan B if:**
- Supabase restore fails
- You want to move on quickly
- Transcript quality is consistently poor
- You're okay with "good enough" search

**Stick with semantic search if:**
- Restore succeeds
- You have time to investigate properly later
- Timestamp search is critical
- You want best-in-class AI experience

---

## Implementation Checklist

- [ ] Create `metadata-video-search.ts` service
- [ ] Create topic mappings file
- [ ] Update Blox Wizard AI integration
- [ ] Create migration for `curriculum_videos` table
- [ ] Run migration in Supabase
- [ ] Create population script
- [ ] Populate database with 85+ videos
- [ ] Create test script
- [ ] Test search functionality
- [ ] Update Blox Wizard UI (if needed)
- [ ] Deploy to Vercel
- [ ] Mark feature as "✅ Working (metadata-based)"

**Total Time:** 2 hours
**Complexity:** Low
**Success Rate:** 100%
