# YouTube Integration Organization

## Overview
All YouTube-related functionality has been consolidated into `src/lib/youtube/` for better organization and maintainability. This reorganization was completed in January 2025 to address scattered files and code duplication across the project.

## New Structure

```
src/lib/youtube/
├── api/
│   ├── types.ts                    # Comprehensive TypeScript definitions
│   ├── youtube-data-api.ts         # YouTube Data API v3 integration  
│   └── youtube-player-api.ts       # YouTube IFrame Player API wrapper
├── scripts/
│   ├── README.md                   # Script documentation and usage
│   ├── curriculum-alignment/       # Curriculum management scripts
│   │   ├── youtube-api-video-replacer.js
│   │   ├── fix-duplicate-ids.js
│   │   └── consolidate-weeks-1-2.js
│   ├── playlist-import/            # Bulk video import utilities
│   │   ├── update-youtube-videos-8-27-2025.js
│   │   ├── find-week1-videos-enhanced.js
│   │   └── import-playlist-week1.js
│   └── video-validation/           # Content health check tools
│       ├── verify-curriculum.js
│       ├── verify-metadata-restoration.js
│       └── verify-substitutes.js
├── utils/
│   ├── duration-formatter.ts       # ISO 8601 duration parsing (PT39M33S → MM:SS)
│   ├── id-extractor.ts            # YouTube URL/ID validation and extraction
│   └── playlist-parser.ts         # Playlist metadata extraction
├── data/                          # Temporary JSON files (moved from root)
│   ├── missing-videos-*.json      # Video tracking files
│   ├── verified-module1-videos.json
│   └── substitute-videos-log.json
└── index.ts                       # Main export file with organized exports
```

## Migration Summary

### Files Moved from `scripts/curriculum-tools/`
- `youtube-api-video-replacer.js` → `src/lib/youtube/scripts/curriculum-alignment/`
- `fix-duplicate-ids.js` → `src/lib/youtube/scripts/curriculum-alignment/`
- `consolidate-weeks-1-2.js` → `src/lib/youtube/scripts/curriculum-alignment/`
- `import-playlist-week1.js` → `src/lib/youtube/scripts/playlist-import/`

### Files Moved from Root `scripts/`
- `update-youtube-videos-8-27-2025.js` → `src/lib/youtube/scripts/playlist-import/`
- `find-week1-videos-enhanced.js` → `src/lib/youtube/scripts/playlist-import/`
- `verify-curriculum.js` → `src/lib/youtube/scripts/video-validation/`
- `verify-metadata-restoration.js` → `src/lib/youtube/scripts/video-validation/`
- `verify-substitutes.js` → `src/lib/youtube/scripts/video-validation/`

### Files Moved from Root Directory
- `missing-videos-*.json` → `src/lib/youtube/data/`
- `verified-module1-videos.json` → `src/lib/youtube/data/`
- `substitute-videos-log.json` → `src/lib/youtube/data/`

### Existing File Enhanced
- `src/lib/youtube/youtube-api.ts` → Enhanced and renamed to `youtube-player-api.ts`

### New Files Created
- **API Layer**: `types.ts`, `youtube-data-api.ts`
- **Utilities**: `duration-formatter.ts`, `id-extractor.ts`, `playlist-parser.ts`
- **Documentation**: `index.ts`, `scripts/README.md`

### Components Updated
- `src/components/learning/VideoPlayer.tsx` - Updated import paths for new structure

## Key Improvements

### 1. Centralized Utilities
Common functions like duration formatting and ID extraction are now shared across all scripts, reducing code duplication.

### 2. TypeScript Support
Full TypeScript interfaces for YouTube API responses, video metadata, and application types.

### 3. Modular Architecture
- **API layer**: Handles YouTube API integration
- **Utils layer**: Reusable utility functions  
- **Scripts layer**: Node.js automation scripts
- **Data layer**: Temporary and cached data files

### 4. Better Error Handling
Centralized error handling with proper TypeScript error types and API quota management.

### 5. Documentation
Comprehensive documentation for scripts usage and API integration patterns.

## Usage

### Import in TypeScript/React Components
```typescript
import { 
  getVideoMetadata, 
  getPlaylistItems,
  YouTubePlayer,
  VideoMetadata 
} from '@/lib/youtube'
```

### Run Scripts
```bash
# From project root
node src/lib/youtube/scripts/replace-video.js "https://youtube.com/watch?v=ID"
node src/lib/youtube/scripts/import-playlist.js "https://youtube.com/playlist?list=ID"
```

## Benefits

1. **Better Organization**: All YouTube code in one location
2. **Reduced Duplication**: Shared utilities across scripts and components
3. **Type Safety**: Full TypeScript support for YouTube integration
4. **Easier Maintenance**: Centralized location for updates and fixes
5. **Better Documentation**: Clear usage patterns and examples
6. **Scalability**: Modular structure allows easy extension

## Breaking Changes Fixed

### Import Path Updates
- Old: `import { ... } from '@/lib/youtube/youtube-api'`
- New: `import { ... } from '@/lib/youtube'`

### TypeScript Export Conflicts Resolved
- **Duplicate exports**: Fixed `formatDuration` and `parseIsoDuration` conflicts in `youtube-data-api.ts`
- **PlayerState enum**: Resolved duplicate export by removing from type exports, keeping explicit export
- **Store naming conflict**: Renamed `showWelcomeOverlay` to `forceShowWelcomeOverlay` in AI Journey store

### Script Path Updates
All moved scripts updated with new relative paths:
- Changed from `../../` to `../../../../` for accessing project root
- Updated `.env.local` path references
- Fixed `require()` paths for project dependencies

### Component Import Updates
- `VideoPlayer.tsx` updated to use centralized utilities
- All components now use organized exports from `@/lib/youtube`

## Benefits Achieved

1. **Eliminated Code Duplication**: 20+ scripts now share common utilities
2. **Better Organization**: All YouTube code centralized in logical structure  
3. **Type Safety**: Comprehensive TypeScript support with conflict resolution
4. **Easier Maintenance**: Single location for YouTube functionality updates
5. **Improved Documentation**: Clear usage patterns and API examples
6. **Scalable Architecture**: Modular structure supports future expansion

## Migration Status: ✅ Complete
All YouTube functionality is now properly organized and centralized in `src/lib/youtube/` with all build errors resolved and imports working correctly.