# YouTube Curriculum Scripts

This directory contains Node.js scripts for managing YouTube video integration with the curriculum.

## Scripts Overview

### Core Scripts

#### `replace-video.js`
Replace individual videos in the curriculum with YouTube metadata.

```bash
# Replace a specific video
node replace-video.js "https://www.youtube.com/watch?v=VIDEO_ID" 1 1 1 1

# Quick replace (Module 1, Week 1, Day 1, Video 1)
node replace-video.js "https://www.youtube.com/watch?v=VIDEO_ID"
```

**Features:**
- Fetches accurate video metadata (title, description, duration, thumbnail)
- Converts ISO 8601 duration to readable format
- Creates automatic backups before changes
- Validates video availability

#### `import-playlist.js`
Import entire YouTube playlists into curriculum weeks.

```bash
# Import playlist into Week 1
node import-playlist.js "https://www.youtube.com/playlist?list=PLAYLIST_ID"
```

**Features:**
- Distributes videos evenly across 5 days
- Calculates optimal watch time per day
- Maintains video order from playlist
- Updates day numbering system

#### `fetch-playlist.js`
Utility for fetching playlist metadata without curriculum integration.

```bash
# Fetch and analyze playlist
node fetch-playlist.js "https://www.youtube.com/playlist?list=PLAYLIST_ID"
```

#### `validate-ids.js`
Validate YouTube video IDs in the curriculum.

```bash
# Check all video IDs
node validate-ids.js

# Check specific modules
node validate-ids.js --module 1
```

## Setup Requirements

### 1. YouTube API Key
Set your YouTube Data API v3 key in `.env.local`:

```bash
NEXT_PUBLIC_YOUTUBE_API_KEY=your_api_key_here
```

### 2. API Key Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Create credentials (API Key)
4. Add the key to your environment

## Usage Patterns

### Single Video Replacement
When you need to replace one video with proper metadata:

```bash
node replace-video.js "https://youtu.be/dQw4w9WgXcQ" 1 1 1 1
```

### Playlist Import
When reorganizing curriculum with a curated playlist:

```bash
node import-playlist.js "https://www.youtube.com/playlist?list=PLEGfj4vwz2bgDtmkK7W3EFSw-Z5rV8AY5"
```

### Batch Validation
When checking curriculum health:

```bash
node validate-ids.js --verbose
```

## File Structure

```
scripts/
├── replace-video.js      # Single video replacement
├── import-playlist.js    # Full playlist import
├── fetch-playlist.js     # Playlist metadata fetching
├── validate-ids.js       # Video ID validation
└── README.md            # This file
```

## Error Handling

All scripts include:
- API key validation
- Network error retry logic
- Graceful failure for private/deleted videos
- Automatic backup creation before changes
- Detailed logging and progress indication

## Integration Notes

These scripts work with:
- `src/data/curriculum.json` - Main curriculum data
- `src/lib/youtube/` - TypeScript utilities and types
- YouTube Data API v3 - For metadata fetching
- Node.js environment - Requires dotenv for API keys

## Common Issues

### "API key not found"
Ensure `NEXT_PUBLIC_YOUTUBE_API_KEY` is set in `.env.local`

### "Video not found"
Video may be private, deleted, or region-restricted

### "Quota exceeded"
YouTube API has daily limits (10,000 units/day for free tier)

### "Invalid playlist ID"
Check playlist URL format and ensure playlist is public

## Development

When adding new scripts:
1. Use the utility functions from `../utils/`
2. Include proper error handling
3. Create backups before modifying curriculum
4. Add progress indicators for long operations
5. Document usage in this README