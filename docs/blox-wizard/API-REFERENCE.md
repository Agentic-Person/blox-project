# Chat Wizard API Reference
## Complete API Documentation with Examples

---

## Overview

The Chat Wizard API provides intelligent AI-powered chat capabilities with video transcript search, learning recommendations, and calendar integration. All endpoints follow RESTful conventions and return JSON responses.

### Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.vercel.app/api
```

### Authentication
All API endpoints require valid Supabase authentication. Include the JWT token in the Authorization header:

```bash
Authorization: Bearer <supabase-jwt-token>
```

### Response Format
All API responses follow this consistent format:

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    requestId: string
    timestamp: string
    processingTime: string
  }
}
```

---

## Chat Endpoints

### POST /api/chat/blox-wizard
**Main chat endpoint for AI-powered responses with video search**

#### Request Body
```typescript
interface ChatRequest {
  message: string           // User's question (required)
  sessionId: string        // Session identifier (required)
  userId?: string          // User ID for personalization
  videoContext?: {         // Current video context
    videoId: string
    title: string
    youtubeId: string
    transcript?: string
    currentTime?: number   // Current playback time in seconds
    duration?: string      // Video duration
  }
}
```

#### Response
```typescript
interface ChatResponse {
  answer: string                    // AI-generated response
  videoReferences: VideoReference[] // Relevant videos with timestamps
  suggestedQuestions: string[]      // Follow-up question suggestions
  usageRemaining: number           // Remaining API calls for user
  responseTime: string             // Processing time
  citations?: Citation[]           // Source citations from transcripts
  metadata: {
    cacheHit: boolean             // Whether response came from cache
    searchResultsCount: number    // Number of transcript chunks found
    confidence: number            // Answer confidence score (0-1)
    processingSteps: string[]     // Debug info about processing pipeline
    tokensUsed?: number          // OpenAI tokens consumed
  }
}

interface VideoReference {
  title: string        // Video title
  youtubeId: string   // YouTube video ID
  timestamp: string   // Relevant timestamp (e.g., "15:30")
  relevantSegment: string // Text snippet from video
  thumbnailUrl: string    // YouTube thumbnail URL
  confidence: number      // Relevance score (0-1)
  creator?: string       // Content creator name
  duration?: string      // Total video duration
}

interface Citation {
  id: number
  videoTitle: string
  timestamp: string
  url: string           // YouTube URL with timestamp
  relevanceScore: number
  snippet: string      // Relevant text from transcript
}
```

#### Example Request
```bash
curl -X POST https://your-domain.vercel.app/api/chat/blox-wizard \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "message": "How do I script a door that opens when clicked?",
    "sessionId": "session_123",
    "userId": "user_456"
  }'
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "answer": "To script a door that opens when clicked, you'll need to use a ClickDetector and connect it to a script that changes the door's position or rotation. Here's the basic approach:\n\n1. Add a ClickDetector to your door part\n2. Create a Script that handles the MouseClick event\n3. Use TweenService to smoothly animate the door opening\n\nThe key is connecting the ClickDetector.MouseClick event to your door animation function.",
    "videoReferences": [
      {
        "title": "Complete Guide to Interactive Objects in Roblox",
        "youtubeId": "abc123def456",
        "timestamp": "8:45",
        "relevantSegment": "In this section, we cover how to make doors that respond to player clicks using ClickDetector...",
        "thumbnailUrl": "https://img.youtube.com/vi/abc123def456/maxresdefault.jpg",
        "confidence": 0.92,
        "creator": "RobloxDev",
        "duration": "25:30"
      },
      {
        "title": "TweenService for Smooth Animations",
        "youtubeId": "def456ghi789",
        "timestamp": "12:15",
        "relevantSegment": "Here we demonstrate using TweenService to create smooth door animations...",
        "thumbnailUrl": "https://img.youtube.com/vi/def456ghi789/maxresdefault.jpg",
        "confidence": 0.87,
        "creator": "ScriptingMaster",
        "duration": "18:22"
      }
    ],
    "suggestedQuestions": [
      "How do I add sound effects to my door?",
      "Can I make doors that only certain players can open?",
      "How do I create sliding doors instead of rotating ones?",
      "What's the best way to handle multiple doors in one script?"
    ],
    "usageRemaining": 47,
    "responseTime": "1.2s",
    "citations": [
      {
        "id": 1,
        "videoTitle": "Complete Guide to Interactive Objects in Roblox",
        "timestamp": "8:45",
        "url": "https://youtube.com/watch?v=abc123def456&t=525s",
        "relevanceScore": 0.92,
        "snippet": "Add a ClickDetector to your part and connect it to a script that handles the MouseClick event..."
      }
    ],
    "metadata": {
      "cacheHit": false,
      "searchResultsCount": 12,
      "confidence": 0.89,
      "processingSteps": [
        "Generated query embedding",
        "Searched transcript database",
        "Found 12 relevant chunks",
        "Generated AI response",
        "Formatted video references",
        "Updated question cache"
      ],
      "tokensUsed": 450
    }
  }
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "error": "Missing required field: message",
  "metadata": {
    "requestId": "req_123",
    "timestamp": "2025-01-01T12:00:00Z"
  }
}
```

**429 Rate Limited**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again in 60 seconds.",
  "metadata": {
    "requestId": "req_124",
    "timestamp": "2025-01-01T12:01:00Z",
    "retryAfter": 60
  }
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal server error. Please try again.",
  "metadata": {
    "requestId": "req_125",
    "timestamp": "2025-01-01T12:02:00Z"
  }
}
```

#### Status Codes
- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid/missing auth token)
- `429` - Rate Limited
- `500` - Internal Server Error

---

## Transcript Management Endpoints

### POST /api/transcripts/process
**Process video transcripts and generate searchable content**

#### Request Body
```typescript
interface ProcessRequest {
  videoIds?: string[]      // Specific video IDs to process (optional)
  forceReprocess?: boolean // Reprocess existing transcripts (default: false)
  batchSize?: number      // Number of videos to process in parallel (default: 5)
  source?: 'curriculum' | 'manual' // Source of video data (default: 'curriculum')
}
```

#### Response
```typescript
interface ProcessResponse {
  processed: ProcessedVideo[]
  failed: FailedVideo[]
  summary: {
    total: number
    successful: number
    failed: number
    skipped: number
    processingTime: string
  }
}

interface ProcessedVideo {
  videoId: string
  youtubeId: string
  title: string
  chunksCreated: number
  embeddingsGenerated: number
  processingTime: string
}

interface FailedVideo {
  videoId: string
  youtubeId?: string
  title?: string
  error: string
  errorCode: string
}
```

#### Example Request
```bash
curl -X POST https://your-domain.vercel.app/api/transcripts/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "videoIds": ["video-1-1-1-1", "video-1-1-2-1"],
    "forceReprocess": false,
    "batchSize": 3
  }'
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "processed": [
      {
        "videoId": "video-1-1-1-1",
        "youtubeId": "p005iduooyw",
        "title": "The ULTIMATE Beginner Guide to Roblox Studio",
        "chunksCreated": 24,
        "embeddingsGenerated": 24,
        "processingTime": "3.2s"
      }
    ],
    "failed": [
      {
        "videoId": "video-1-1-2-1",
        "youtubeId": "P2ECl-mLmvY",
        "title": "The EASIEST Beginner Guide to Scripting",
        "error": "Transcript not available",
        "errorCode": "TRANSCRIPT_UNAVAILABLE"
      }
    ],
    "summary": {
      "total": 2,
      "successful": 1,
      "failed": 1,
      "skipped": 0,
      "processingTime": "4.1s"
    }
  }
}
```

### GET /api/transcripts/status
**Get processing status and system health**

#### Query Parameters
```typescript
interface StatusQuery {
  detailed?: boolean // Include per-video status (default: false)
  limit?: number    // Limit number of recent videos shown (default: 20)
}
```

#### Response
```typescript
interface StatusResponse {
  system: {
    totalVideos: number
    processedVideos: number
    failedVideos: number
    lastProcessed: string | null
    processingQueue: number
    systemHealth: 'healthy' | 'degraded' | 'down'
  }
  recent?: ProcessingActivity[] // If detailed=true
  statistics: {
    totalTranscriptChunks: number
    totalEmbeddings: number
    averageChunksPerVideo: number
    storageUsed: string
  }
}

interface ProcessingActivity {
  videoId: string
  title: string
  status: 'success' | 'failed' | 'processing'
  processedAt: string
  error?: string
}
```

#### Example Request
```bash
curl "https://your-domain.vercel.app/api/transcripts/status?detailed=true&limit=10" \
  -H "Authorization: Bearer <jwt-token>"
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "system": {
      "totalVideos": 150,
      "processedVideos": 142,
      "failedVideos": 8,
      "lastProcessed": "2025-01-01T11:45:00Z",
      "processingQueue": 0,
      "systemHealth": "healthy"
    },
    "recent": [
      {
        "videoId": "video-1-1-1-1",
        "title": "The ULTIMATE Beginner Guide to Roblox Studio",
        "status": "success",
        "processedAt": "2025-01-01T11:45:00Z"
      },
      {
        "videoId": "video-1-1-2-1",
        "title": "The EASIEST Beginner Guide to Scripting",
        "status": "failed",
        "processedAt": "2025-01-01T11:44:30Z",
        "error": "Transcript not available"
      }
    ],
    "statistics": {
      "totalTranscriptChunks": 3420,
      "totalEmbeddings": 3420,
      "averageChunksPerVideo": 24.1,
      "storageUsed": "42.3 MB"
    }
  }
}
```

---

## Search Endpoints

### POST /api/search/videos
**Search for videos across all transcripts**

#### Request Body
```typescript
interface SearchRequest {
  query: string              // Search query (required)
  limit?: number            // Max results (default: 10, max: 50)
  minConfidence?: number    // Min confidence score (default: 0.7)
  filters?: {
    creator?: string        // Filter by content creator
    module?: string         // Filter by curriculum module
    duration?: {            // Filter by video duration
      min?: number         // Minimum seconds
      max?: number         // Maximum seconds
    }
  }
  includeTranscripts?: boolean // Include transcript excerpts (default: true)
}
```

#### Response
```typescript
interface SearchResponse {
  results: SearchResult[]
  totalFound: number
  query: string
  searchTime: string
}

interface SearchResult {
  videoId: string
  youtubeId: string
  title: string
  creator: string
  duration: number
  confidence: number
  relevantSegments: TranscriptSegment[]
  thumbnailUrl: string
}

interface TranscriptSegment {
  text: string
  timestamp: string
  confidence: number
  chunkId: string
}
```

#### Example Request
```bash
curl -X POST https://your-domain.vercel.app/api/search/videos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "query": "how to create custom animations",
    "limit": 5,
    "minConfidence": 0.8,
    "filters": {
      "module": "module-3"
    }
  }'
```

### GET /api/search/suggestions
**Get search suggestions based on query**

#### Query Parameters
```typescript
interface SuggestionsQuery {
  q: string        // Partial query (required)
  limit?: number   // Max suggestions (default: 5)
}
```

#### Response
```typescript
interface SuggestionsResponse {
  suggestions: string[]
  basedOn: 'popular_queries' | 'transcript_content' | 'common_topics'
}
```

---

## Calendar Integration Endpoints

### POST /api/calendar/schedule
**Create learning schedule entries**

#### Request Body
```typescript
interface ScheduleRequest {
  videos: string[]           // Video IDs to schedule (required)
  timeframe: {              // When to schedule
    startDate: string       // ISO date string
    endDate?: string       // Auto-calculated if not provided
    dailyTimeMinutes?: number // Available time per day (default: 60)
  }
  preferences?: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
    focusAreas?: string[]   // Specific topics to prioritize
    skipWeekends?: boolean  // Skip Saturday/Sunday (default: false)
  }
  userId: string            // User identifier (required)
}
```

#### Response
```typescript
interface ScheduleResponse {
  scheduleId: string
  entries: ScheduleEntry[]
  summary: {
    totalVideos: number
    totalDuration: number
    startDate: string
    endDate: string
    dailyAverage: number
  }
}

interface ScheduleEntry {
  id: string
  videoId: string
  videoTitle: string
  scheduledDate: string
  estimatedMinutes: number
  priority: 'high' | 'medium' | 'low'
  prerequisites?: string[]
}
```

#### Example Request
```bash
curl -X POST https://your-domain.vercel.app/api/calendar/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "videos": ["video-1-1-1-1", "video-1-1-2-1", "video-1-1-3-1"],
    "timeframe": {
      "startDate": "2025-01-02",
      "dailyTimeMinutes": 90
    },
    "preferences": {
      "difficulty": "beginner",
      "skipWeekends": true
    },
    "userId": "user_456"
  }'
```

### GET /api/calendar/schedule/:userId
**Get user's learning schedule**

#### Query Parameters
```typescript
interface ScheduleQuery {
  startDate?: string    // Filter from date (ISO string)
  endDate?: string      // Filter to date (ISO string)
  status?: 'pending' | 'completed' | 'overdue' | 'all'
  limit?: number        // Max entries (default: 50)
}
```

#### Response
```typescript
interface UserScheduleResponse {
  schedule: ScheduleEntry[]
  progress: {
    totalScheduled: number
    completed: number
    overdue: number
    upcoming: number
    completionRate: number
  }
}
```

### PUT /api/calendar/schedule/:entryId/complete
**Mark a scheduled video as completed**

#### Request Body
```typescript
interface CompleteRequest {
  completedAt?: string     // ISO timestamp (defaults to now)
  rating?: number         // User rating 1-5
  notes?: string          // User notes about the video
  timeSpent?: number      // Actual minutes spent
}
```

---

## Analytics Endpoints

### GET /api/analytics/usage
**Get usage statistics and patterns**

#### Query Parameters
```typescript
interface AnalyticsQuery {
  period: 'day' | 'week' | 'month'  // Time period
  startDate?: string               // Custom start date
  endDate?: string                 // Custom end date
  userId?: string                  // Filter by user (admin only)
}
```

#### Response
```typescript
interface UsageResponse {
  period: string
  metrics: {
    totalQueries: number
    uniqueUsers: number
    averageResponseTime: number
    cacheHitRate: number
    topQuestions: TopQuestion[]
    popularVideos: PopularVideo[]
  }
  trends: {
    queryVolume: TimeSeriesData[]
    responseTime: TimeSeriesData[]
    userEngagement: TimeSeriesData[]
  }
}

interface TopQuestion {
  question: string
  count: number
  averageConfidence: number
}

interface PopularVideo {
  videoId: string
  title: string
  referenceCount: number
  averageConfidence: number
}
```

### GET /api/analytics/performance
**Get system performance metrics**

#### Response
```typescript
interface PerformanceResponse {
  system: {
    uptime: number
    memoryUsage: number
    cpuUsage: number
    dbConnections: number
  }
  api: {
    requestsPerMinute: number
    averageResponseTime: number
    errorRate: number
    slowQueries: number
  }
  ai: {
    tokensUsed: number
    embeddingsGenerated: number
    cacheEfficiency: number
    costEstimate: number
  }
}
```

---

## Admin Endpoints

### POST /api/admin/cache/clear
**Clear question cache (admin only)**

#### Request Body
```typescript
interface CacheClearRequest {
  type: 'all' | 'expired' | 'pattern'
  pattern?: string    // If type='pattern', specify pattern to match
}
```

### POST /api/admin/reindex
**Reindex all transcripts (admin only)**

#### Request Body
```typescript
interface ReindexRequest {
  force?: boolean       // Force reindex even if embeddings exist
  batchSize?: number   // Processing batch size (default: 10)
}
```

---

## Error Codes Reference

### Chat API Errors
- `CHAT_001` - Missing required fields
- `CHAT_002` - Invalid session ID format
- `CHAT_003` - Message too long (max 1000 characters)
- `CHAT_004` - Rate limit exceeded
- `CHAT_005` - OpenAI API error
- `CHAT_006` - Vector search failed
- `CHAT_007` - No relevant content found

### Transcript Processing Errors
- `TRANSCRIPT_001` - YouTube API error
- `TRANSCRIPT_002` - Transcript not available
- `TRANSCRIPT_003` - Invalid video ID
- `TRANSCRIPT_004` - Embedding generation failed
- `TRANSCRIPT_005` - Database storage error
- `TRANSCRIPT_006` - Processing timeout

### Authentication Errors
- `AUTH_001` - Missing authorization header
- `AUTH_002` - Invalid JWT token
- `AUTH_003` - Token expired
- `AUTH_004` - Insufficient permissions

### System Errors
- `SYS_001` - Database connection failed
- `SYS_002` - External API unavailable
- `SYS_003` - Service temporarily unavailable
- `SYS_004` - Configuration error

---

## Rate Limiting

### Limits by Endpoint

| Endpoint | Authenticated | Anonymous |
|----------|---------------|-----------|
| `/api/chat/blox-wizard` | 60/minute | 5/minute |
| `/api/search/videos` | 30/minute | 10/minute |
| `/api/transcripts/process` | 5/minute | Not allowed |
| `/api/calendar/*` | 30/minute | Not allowed |
| `/api/analytics/*` | 20/minute | Not allowed |

### Rate Limit Headers

All responses include rate limiting headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

### Handling Rate Limits

When rate limited, implement exponential backoff:

```typescript
async function apiCallWithBackoff(apiCall: () => Promise<Response>, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await apiCall()
    
    if (response.status !== 429) {
      return response
    }
    
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
    const delay = Math.min(retryAfter * 1000, Math.pow(2, attempt) * 1000)
    
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  
  throw new Error('Rate limit exceeded, max retries reached')
}
```

---

## SDK Examples

### JavaScript/TypeScript SDK

```typescript
class ChatWizardClient {
  constructor(
    private baseUrl: string,
    private authToken: string
  ) {}

  async chat(message: string, sessionId: string, options?: ChatOptions): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat/blox-wizard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({
        message,
        sessionId,
        ...options
      })
    })

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status}`)
    }

    return response.json()
  }

  async searchVideos(query: string, options?: SearchOptions): Promise<SearchResponse> {
    const response = await fetch(`${this.baseUrl}/search/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({
        query,
        ...options
      })
    })

    return response.json()
  }
}

// Usage
const client = new ChatWizardClient(
  'https://your-domain.vercel.app/api',
  'your-jwt-token'
)

const response = await client.chat(
  'How do I create a custom tool?',
  'session_123'
)
```

### Python SDK

```python
import requests
from typing import Optional, List, Dict, Any

class ChatWizardClient:
    def __init__(self, base_url: str, auth_token: str):
        self.base_url = base_url
        self.auth_token = auth_token
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {auth_token}'
        }
    
    def chat(self, message: str, session_id: str, **kwargs) -> Dict[str, Any]:
        """Send a chat message and get AI response with video references."""
        data = {
            'message': message,
            'sessionId': session_id,
            **kwargs
        }
        
        response = requests.post(
            f'{self.base_url}/chat/blox-wizard',
            headers=self.headers,
            json=data
        )
        
        response.raise_for_status()
        return response.json()
    
    def search_videos(self, query: str, **kwargs) -> Dict[str, Any]:
        """Search for videos across all transcripts."""
        data = {
            'query': query,
            **kwargs
        }
        
        response = requests.post(
            f'{self.base_url}/search/videos',
            headers=self.headers,
            json=data
        )
        
        return response.json()

# Usage
client = ChatWizardClient(
    'https://your-domain.vercel.app/api',
    'your-jwt-token'
)

response = client.chat(
    'How do I script player teleportation?',
    'session_456'
)
```

---

## Testing API Endpoints

### Using cURL

#### Basic Chat Request
```bash
curl -X POST https://your-domain.vercel.app/api/chat/blox-wizard \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "message": "How do I create a GUI button?",
    "sessionId": "test-session-123"
  }'
```

#### Search Videos
```bash
curl -X POST https://your-domain.vercel.app/api/search/videos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "query": "scripting basics",
    "limit": 3
  }'
```

### Using Postman

Import this collection for testing:

```json
{
  "info": {
    "name": "Chat Wizard API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "https://your-domain.vercel.app/api"
    },
    {
      "key": "jwt_token",
      "value": "your-jwt-token"
    }
  ],
  "item": [
    {
      "name": "Chat Request",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"message\": \"How do I script a moving platform?\",\n  \"sessionId\": \"{{$randomUUID}}\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/chat/blox-wizard",
          "host": ["{{base_url}}"],
          "path": ["chat", "blox-wizard"]
        }
      }
    }
  ]
}
```

---

This API reference should provide everything needed to integrate with and test the Chat Wizard system. Keep it updated as new endpoints are added or existing ones are modified.

*Last updated: [Current Date]*