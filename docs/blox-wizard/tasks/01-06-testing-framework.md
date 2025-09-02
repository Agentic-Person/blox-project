# Task 01-06: Testing Framework Setup
**Phase 1: Foundation | Week 1**

---

## Task Overview

**Goal**: Establish comprehensive testing framework for Chat Wizard with unit, integration, and performance tests.

**Estimated Time**: 3-4 hours  
**Priority**: Medium (quality assurance)  
**Dependencies**: `01-04-chat-api`, `01-05-frontend-integration`

---

## Senior Developer Notes

Testing is critical for this system because:
1. **Cost Impact**: Bugs in AI integration can be expensive (wasted OpenAI tokens)
2. **User Experience**: Chat responses must be reliable and fast
3. **Data Integrity**: Vector search must return accurate results
4. **Performance**: Sub-3 second response times are required

**Testing Strategy**:
- Unit tests for core services and utilities
- Integration tests for API endpoints  
- Performance tests for search and response times
- Mock external APIs to avoid costs during testing

---

## Testing Architecture

### 1. Testing Stack
- **Test Runner**: Jest (already in Next.js)
- **React Testing**: @testing-library/react
- **API Testing**: Supertest
- **Mocking**: Jest mocks + MSW for API mocking
- **Performance**: Custom benchmarking utilities
- **Coverage**: Built-in Jest coverage

### 2. Test Categories

#### A. Unit Tests (`__tests__/unit/`)
- Individual functions and utilities
- Service class methods
- Type validation
- Error handling

#### B. Integration Tests (`__tests__/integration/`)
- API endpoint flows
- Database operations
- External API integration
- Component interactions

#### C. Performance Tests (`__tests__/performance/`)
- Vector search benchmarks
- API response time tests
- Memory usage monitoring
- Load testing scenarios

---

## Implementation Steps

### Step 1: Install Testing Dependencies

```bash
# Install additional testing tools
npm install --save-dev @testing-library/jest-environment-jsdom
npm install --save-dev @testing-library/user-event
npm install --save-dev supertest
npm install --save-dev msw
npm install --save-dev jest-environment-node
```

### Step 2: Configure Jest

Update `jest.config.js`:
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/__tests__/unit/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jest-environment-jsdom',
    },
    {
      displayName: 'integration', 
      testMatch: ['<rootDir>/__tests__/integration/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jest-environment-node',
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/__tests__/performance/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jest-environment-node',
      testTimeout: 30000, // Longer timeout for performance tests
    },
  ],
}

module.exports = createJestConfig(customJestConfig)
```

### Step 3: Create Test Setup Files

Create `jest.setup.js`:
```javascript
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.YOUTUBE_API_KEY = 'test-youtube-key'

// Mock Next.js router
jest.mock('next/router', () => require('next-router-mock'))

// Mock Image component
jest.mock('next/image', () => {
  return function MockedImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />
  }
})
```

### Step 4: Create Mock Data

Create `__tests__/mocks/test-data.ts`:
```typescript
export const mockVideoReference = {
  title: 'How to Script a Door in Roblox',
  youtubeId: 'dQw4w9WgXcQ',
  creator: 'RobloxEducator',
  timestamp: '5:30',
  relevantSegment: 'To create a door script, you need to understand basic Roblox scripting...',
  thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  timestampUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=330s',
  confidence: 0.85,
  duration: '10:45'
}

export const mockChatResponse = {
  answer: 'To script a door in Roblox, you need to create a script that handles click events...',
  videoReferences: [mockVideoReference],
  suggestedQuestions: [
    'How do I add sound effects to my door?',
    'What about door animations?'
  ],
  sessionId: 'test-session-123',
  usageRemaining: 95,
  responseTime: 1250,
  metadata: {
    cacheHit: false,
    searchResultsCount: 3,
    confidence: 0.85,
    tokensUsed: 150
  }
}

export const mockSearchResults = [
  {
    chunkId: 'chunk-1',
    transcriptId: 'transcript-1',
    videoId: 'video-1',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Door Scripting Tutorial',
    creator: 'RobloxEducator',
    chunkText: 'To create a door script, first create a script inside the door part...',
    startTimestamp: '5:30',
    endTimestamp: '6:15',
    relevanceScore: 0.92,
    confidence: 0.85
  }
]
```

### Step 5: Create API Mocks

Create `__tests__/mocks/handlers.ts`:
```typescript
import { rest } from 'msw'
import { mockChatResponse } from './test-data'

export const handlers = [
  // Mock OpenAI embeddings API
  rest.post('https://api.openai.com/v1/embeddings', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [{
          embedding: new Array(1536).fill(0).map(() => Math.random() - 0.5)
        }],
        usage: { total_tokens: 10 }
      })
    )
  }),

  // Mock OpenAI chat completions API  
  rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
    return res(
      ctx.json({
        choices: [{
          message: {
            content: 'This is a test AI response about Roblox scripting.'
          }
        }],
        usage: { total_tokens: 150 }
      })
    )
  }),

  // Mock our Chat Wizard API
  rest.post('/api/chat/blox-wizard', (req, res, ctx) => {
    return res(ctx.json(mockChatResponse))
  }),

  // Mock YouTube API (if needed)
  rest.get('https://www.googleapis.com/youtube/v3/captions', (req, res, ctx) => {
    return res(
      ctx.json({
        items: [{
          id: 'test-caption-id',
          snippet: {
            language: 'en',
            name: 'English'
          }
        }]
      })
    )
  })
]
```

Create `__tests__/mocks/server.ts`:
```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

---

## Unit Tests

### Step 6: Vector Search Service Tests

Create `__tests__/unit/vector-search.test.ts`:
```typescript
import { VectorSearchService } from '@/lib/services/blox-wizard/vector-search'
import { mockSearchResults } from '../mocks/test-data'

// Mock Supabase client
const mockSupabase = {
  rpc: jest.fn()
}

// Mock OpenAI client  
const mockOpenAI = {
  embeddings: {
    create: jest.fn()
  }
}

describe('VectorSearchService', () => {
  let vectorSearch: VectorSearchService

  beforeEach(() => {
    vectorSearch = new VectorSearchService()
    // Inject mocks
    vectorSearch['supabase'] = mockSupabase as any
    vectorSearch['openai'] = mockOpenAI as any
  })

  test('should perform vector search successfully', async () => {
    // Mock embedding generation
    mockOpenAI.embeddings.create.mockResolvedValue({
      data: [{ embedding: new Array(1536).fill(0.1) }]
    })

    // Mock database search
    mockSupabase.rpc.mockResolvedValue({
      data: mockSearchResults,
      error: null
    })

    const results = await vectorSearch.search('how to script a door')

    expect(results.results).toHaveLength(1)
    expect(results.results[0].title).toBe('Door Scripting Tutorial')
    expect(results.searchTime).toBeLessThan(5000)
    expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
      model: 'text-embedding-ada-002',
      input: 'script door' // Should clean the query
    })
  })

  test('should handle search errors gracefully', async () => {
    mockOpenAI.embeddings.create.mockRejectedValue(new Error('API Error'))

    await expect(vectorSearch.search('test query')).rejects.toThrow('Search failed: API Error')
  })

  test('should clean queries properly', () => {
    const cleanQuery = vectorSearch['cleanQuery']('How do I create a door script?')
    expect(cleanQuery).toBe('create door script')
  })

  test('should calculate relevance scores correctly', () => {
    const result = mockSearchResults[0]
    const score = vectorSearch['calculateRelevanceScore'](result, 'door script')
    expect(score).toBeGreaterThan(0.8)
    expect(score).toBeLessThanOrEqual(1.0)
  })
})
```

### Step 7: Response Generator Tests

Create `__tests__/unit/response-generator.test.ts`:
```typescript
import { ResponseGenerator } from '@/lib/services/blox-wizard/response-generator'
import { mockSearchResults } from '../mocks/test-data'

describe('ResponseGenerator', () => {
  let responseGenerator: ResponseGenerator

  beforeEach(() => {
    responseGenerator = new ResponseGenerator()
  })

  test('should generate appropriate response', async () => {
    const response = await responseGenerator.generateResponse({
      query: 'How do I script a door?',
      searchResults: mockSearchResults,
      sessionId: 'test-session'
    })

    expect(response.text).toBeDefined()
    expect(response.text.length).toBeGreaterThan(50)
    expect(response.tokensUsed).toBeGreaterThan(0)
  })

  test('should generate follow-up questions', async () => {
    const questions = await responseGenerator.generateFollowUpQuestions(
      'How do I script a door?',
      mockSearchResults
    )

    expect(questions).toBeInstanceOf(Array)
    expect(questions.length).toBeLessThanOrEqual(3)
    expect(questions[0]).toContain('?')
  })

  test('should build context from search results', () => {
    const context = responseGenerator['buildContextFromResults'](mockSearchResults)
    
    expect(context).toContain('Door Scripting Tutorial')
    expect(context).toContain('5:30')
    expect(context).toContain('create a door script')
  })
})
```

---

## Integration Tests

### Step 8: API Endpoint Tests

Create `__tests__/integration/chat-api.test.ts`:
```typescript
import request from 'supertest'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { server } from '../mocks/server'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev, quiet: true })
const handle = app.getRequestHandler()

describe('/api/chat/blox-wizard', () => {
  let server: any

  beforeAll(async () => {
    await app.prepare()
    server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true)
      handle(req, res, parsedUrl)
    })
    server.listen(3001)
    
    // Start MSW server for mocking external APIs
    global.msw.server.listen()
  })

  afterAll(async () => {
    server?.close()
    global.msw.server.close()
  })

  test('should handle valid chat request', async () => {
    const response = await request(server)
      .post('/api/chat/blox-wizard')
      .send({
        message: 'How do I script a door?',
        sessionId: 'test-session'
      })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('answer')
    expect(response.body).toHaveProperty('videoReferences')
    expect(response.body).toHaveProperty('responseTime')
    expect(response.body.videoReferences).toBeInstanceOf(Array)
  })

  test('should return 400 for invalid request', async () => {
    const response = await request(server)
      .post('/api/chat/blox-wizard')
      .send({})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error')
  })

  test('should handle long messages', async () => {
    const longMessage = 'a'.repeat(2000)
    
    const response = await request(server)
      .post('/api/chat/blox-wizard')
      .send({
        message: longMessage,
        sessionId: 'test-session'
      })

    expect(response.status).toBe(400)
  })

  test('should maintain session consistency', async () => {
    const sessionId = 'consistent-session-123'
    
    const response1 = await request(server)
      .post('/api/chat/blox-wizard')
      .send({
        message: 'First message',
        sessionId
      })

    const response2 = await request(server)
      .post('/api/chat/blox-wizard')  
      .send({
        message: 'Second message',
        sessionId
      })

    expect(response1.body.sessionId).toBe(sessionId)
    expect(response2.body.sessionId).toBe(sessionId)
  })
})
```

---

## Performance Tests

### Step 9: Performance Benchmarks

Create `__tests__/performance/search-benchmark.test.ts`:
```typescript
import { VectorSearchService } from '@/lib/services/blox-wizard/vector-search'

describe('Vector Search Performance', () => {
  let vectorSearch: VectorSearchService

  beforeAll(() => {
    vectorSearch = new VectorSearchService()
  })

  test('search response time should be under 500ms', async () => {
    const queries = [
      'how to script a door',
      'creating guis in roblox',  
      'datastore tutorial',
      'remote events explained',
      'tween animations'
    ]

    const startTime = Date.now()
    
    const results = await Promise.all(
      queries.map(query => vectorSearch.search(query))
    )

    const totalTime = Date.now() - startTime
    const avgTime = totalTime / queries.length

    expect(avgTime).toBeLessThan(500)
    expect(results.every(r => r.results.length >= 0)).toBe(true)
  })

  test('concurrent searches should not degrade performance', async () => {
    const concurrentQueries = Array(10).fill('roblox scripting basics')
    
    const startTime = Date.now()
    
    await Promise.all(
      concurrentQueries.map(query => vectorSearch.search(query))
    )
    
    const totalTime = Date.now() - startTime
    const avgTime = totalTime / concurrentQueries.length

    expect(avgTime).toBeLessThan(1000) // Slightly higher threshold for concurrent
  })

  test('memory usage should stay reasonable', async () => {
    const initialMemory = process.memoryUsage().heapUsed
    
    // Perform many searches
    for (let i = 0; i < 50; i++) {
      await vectorSearch.search(`test query ${i}`)
    }
    
    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory
    
    // Should not increase memory by more than 100MB
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
  })
})
```

### Step 10: Create Test Scripts

Update `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --selectProjects unit",
    "test:integration": "jest --selectProjects integration", 
    "test:performance": "jest --selectProjects performance",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## Test Data Management

### Step 11: Create Test Database Setup

Create `__tests__/setup/test-db.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export async function setupTestDatabase() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Insert test data
  await supabase.from('video_transcripts').insert([
    {
      video_id: 'test-video-1',
      youtube_id: 'dQw4w9WgXcQ',
      title: 'Test Door Scripting Tutorial',
      creator: 'TestCreator',
      duration_seconds: 645,
      full_transcript: 'This is a test transcript about door scripting...',
      processed_at: new Date().toISOString()
    }
  ])

  // Insert test chunks
  await supabase.from('transcript_chunks').insert([
    {
      transcript_id: 'transcript-id-here',
      chunk_text: 'To create a door script in Roblox, you need to...',
      chunk_index: 0,
      start_timestamp: '5:30',
      end_timestamp: '6:15',
      start_seconds: 330,
      end_seconds: 375,
      embedding: new Array(1536).fill(0.1) // Mock embedding
    }
  ])
}

export async function cleanupTestDatabase() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase.from('transcript_chunks').delete().gte('created_at', '1970-01-01')
  await supabase.from('video_transcripts').delete().gte('created_at', '1970-01-01')
}
```

---

## Continuous Integration

### Step 12: GitHub Actions Workflow

Create `.github/workflows/test.yml`:
```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run unit tests
      run: npm run test:unit

    - name: Run integration tests  
      run: npm run test:integration
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}

    - name: Run performance tests
      run: npm run test:performance

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

---

## Success Criteria

- [ ] Jest configuration works for all test types
- [ ] Unit tests cover core business logic (>70% coverage)
- [ ] Integration tests verify API functionality
- [ ] Performance tests ensure speed requirements are met
- [ ] All tests pass in CI/CD pipeline
- [ ] Mock external APIs to avoid costs during testing
- [ ] Test database setup and cleanup works correctly
- [ ] Coverage reports are generated and accessible

---

## Next Task Dependencies

This task supports:
- All remaining tasks (provides quality assurance)
- `02-01-caching-system` (needs tests for cache functionality)
- Production deployment (CI/CD pipeline)

**Estimated completion**: End of Day 5  
**Critical path**: No - can run parallel with other tasks

---

*Task created by: Senior Developer*  
*Date: Current*  
*Quality focus: Prevent costly bugs in AI integration*