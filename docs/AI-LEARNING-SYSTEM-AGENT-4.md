# Agent 4: Test Engineer
> Testing Infrastructure for AI-Powered Learning System Integration
> **Agent Role**: Testing Framework & Quality Assurance
> **Time Allocation**: 2 hours
> **Dependencies**: Can start framework setup, tests updated as other agents complete

---

## 🎯 Mission Statement

You are responsible for creating comprehensive testing infrastructure that ensures the AI-powered learning system integration works flawlessly. Focus on building test frameworks, mock data generators, and validation suites that other agents can use immediately.

---

## 📋 Task List

### Task 4.1: Integration Test Framework (45 minutes)
**File**: `tests/integration/setup.ts` & `tests/integration/helpers.ts`

Create the foundation for integration testing:

```typescript
// tests/integration/setup.ts
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { createClient } from '@supabase/supabase-js'
import { generateMockData } from './mock-data'

// Test database configuration
const TEST_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const TEST_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'

export const testClient = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY)

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up integration tests...')
  
  // Seed test database with mock data
  await setupTestDatabase()
})

afterAll(async () => {
  console.log('🧹 Cleaning up integration tests...')
  
  // Clean up test data
  await cleanupTestDatabase()
})

beforeEach(() => {
  // Reset any global state before each test
})

afterEach(() => {
  // Clean up React Testing Library
  cleanup()
})

async function setupTestDatabase() {
  try {
    // Create test user
    const testUser = await generateMockData.user()
    
    // Create test transcripts
    const testTranscripts = await generateMockData.transcripts(5)
    
    // Create test todos
    const testTodos = await generateMockData.todos(10, testUser.id)
    
    // Create test learning paths
    const testPaths = await generateMockData.learningPaths(3, testUser.id)
    
    console.log('✅ Test database seeded successfully')
    
    // Store test data for use in tests
    global.testData = {
      user: testUser,
      transcripts: testTranscripts,
      todos: testTodos,
      learningPaths: testPaths
    }
  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    throw error
  }
}

async function cleanupTestDatabase() {
  try {
    // Clean up in reverse order of creation
    await testClient.from('learning_path_steps').delete().neq('id', '')
    await testClient.from('learning_paths').delete().neq('id', '')
    await testClient.from('todo_video_links').delete().neq('id', '')
    await testClient.from('todos').delete().neq('id', '')
    await testClient.from('transcript_chunks').delete().neq('id', '')
    await testClient.from('video_transcripts').delete().neq('id', '')
    
    console.log('✅ Test database cleaned up')
  } catch (error) {
    console.warn('⚠️ Cleanup failed (non-critical):', error)
  }
}

// Helper types for tests
export interface TestContext {
  user: any
  transcripts: any[]
  todos: any[]
  learningPaths: any[]
}

declare global {
  var testData: TestContext
}
```

```typescript
// tests/integration/helpers.ts
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Test utilities
export const waitForLoadingToFinish = async () => {
  await new Promise(resolve => setTimeout(resolve, 100))
}

export const mockApiResponse = <T>(data: T, delay: number = 0): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay)
  })
}

export const mockApiError = (message: string, delay: number = 0): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay)
  })
}

// Service mocking utilities
export const mockServices = {
  todoVideoLinker: {
    linkTodoToVideo: vi.fn(),
    getTodosForVideo: vi.fn(),
    getVideosForTodo: vi.fn(),
    syncWatchProgress: vi.fn()
  },
  
  smartTodoGenerator: {
    generateTodosFromTranscript: vi.fn(),
    createPracticeExercises: vi.fn(),
    generateMilestones: vi.fn()
  },
  
  learningPathSync: {
    createPathFromPlaylist: vi.fn(),
    schedulePathSessions: vi.fn(),
    updateProgressFromVideo: vi.fn(),
    getNextRecommendedVideo: vi.fn()
  }
}

// Reset all mocks
export const resetAllMocks = () => {
  Object.values(mockServices).forEach(service => {
    Object.values(service).forEach(mock => {
      if (typeof mock.mockReset === 'function') {
        mock.mockReset()
      }
    })
  })
}

// Assertion helpers
export const expectTodoToBeLinkedToVideo = (todo: any, videoId: string) => {
  expect(todo.videoReferences).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ youtubeId: videoId })
    ])
  )
}

export const expectVideoToHaveTimestamp = (video: any, timestamp: string) => {
  expect(video.timestamp).toBe(timestamp)
  expect(video.timestampUrl).toContain(`t=${timestamp.replace(':', 'm')}s`)
}

export const expectTodoSuggestionToBeValid = (suggestion: any) => {
  expect(suggestion).toMatchObject({
    title: expect.any(String),
    priority: expect.stringMatching(/^(low|medium|high|urgent)$/),
    category: expect.any(String),
    estimatedMinutes: expect.any(Number),
    autoGenerated: expect.any(Boolean),
    confidence: expect.any(Number)
  })
  
  expect(suggestion.confidence).toBeGreaterThan(0)
  expect(suggestion.confidence).toBeLessThanOrEqual(1)
}

// Data builders for specific test scenarios
export const buildTestScenario = {
  userWithTodos: () => ({
    user: global.testData.user,
    todos: global.testData.todos.slice(0, 3)
  }),
  
  videoWithTranscript: () => ({
    video: global.testData.transcripts[0],
    chunks: generateMockData.transcriptChunks(global.testData.transcripts[0].id, 5)
  }),
  
  learningPathWithVideos: () => ({
    path: global.testData.learningPaths[0],
    videos: global.testData.transcripts.slice(0, 3)
  })
}
```

### Task 4.2: Mock Data Generators (45 minutes)
**File**: `tests/mocks/mock-data.ts`

Comprehensive mock data for all system components:

```typescript
// tests/mocks/mock-data.ts
import { faker } from '@faker-js/faker'
import type {
  UnifiedVideoReference,
  UnifiedChatResponse,
  TodoSuggestion,
  CalendarAction,
  Todo,
  ProgressSyncEvent
} from '@/types/shared'

export const generateMockData = {
  // User data
  user: () => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    avatar_url: faker.image.avatar(),
    created_at: faker.date.past().toISOString(),
    updated_at: new Date().toISOString()
  }),

  // Video references
  videoReference: (overrides?: Partial<UnifiedVideoReference>): UnifiedVideoReference => ({
    videoId: faker.string.uuid(),
    youtubeId: faker.string.alphanumeric(11),
    title: faker.lorem.sentence(),
    thumbnailUrl: `https://img.youtube.com/vi/${faker.string.alphanumeric(11)}/maxresdefault.jpg`,
    creatorName: faker.person.fullName(),
    timestamp: `${faker.number.int({min: 0, max: 59})}:${faker.number.int({min: 0, max: 59})}`,
    timestampSeconds: faker.number.int({min: 0, max: 3600}),
    relevantSegment: faker.lorem.paragraph(),
    confidence: faker.number.float({min: 0.5, max: 1}),
    duration: faker.number.int({min: 300, max: 1800}),
    watchProgress: faker.number.int({min: 0, max: 100}),
    videoUrl: `https://youtube.com/watch?v=${faker.string.alphanumeric(11)}`,
    timestampUrl: `https://youtube.com/watch?v=${faker.string.alphanumeric(11)}&t=${faker.number.int({min: 0, max: 3600})}s`,
    addedAt: faker.date.recent().toISOString(),
    learningObjectives: faker.helpers.arrayElements([
      'Understanding variables and data types',
      'Learning function creation',
      'Mastering event handling',
      'Building user interfaces',
      'Database integration'
    ], {min: 1, max: 3}),
    ...overrides
  }),

  // Video transcripts
  transcripts: (count: number = 5) => {
    return Array.from({length: count}, () => ({
      id: faker.string.uuid(),
      video_id: faker.string.uuid(),
      youtube_id: faker.string.alphanumeric(11),
      title: faker.lorem.sentence(),
      creator: faker.person.fullName(),
      duration_seconds: faker.number.int({min: 300, max: 1800}),
      full_transcript: faker.lorem.paragraphs(10),
      processed_at: faker.date.past().toISOString(),
      created_at: faker.date.past().toISOString()
    }))
  },

  // Transcript chunks
  transcriptChunks: (transcriptId: string, count: number = 10) => {
    return Array.from({length: count}, (_, index) => ({
      id: faker.string.uuid(),
      transcript_id: transcriptId,
      chunk_index: index,
      chunk_text: faker.lorem.paragraph(),
      start_timestamp: `${Math.floor(index * 2)}:${(index * 30) % 60}`,
      end_timestamp: `${Math.floor((index + 1) * 2)}:${((index + 1) * 30) % 60}`,
      start_seconds: index * 120,
      end_seconds: (index + 1) * 120,
      embedding: Array.from({length: 1536}, () => faker.number.float({min: -1, max: 1})),
      created_at: faker.date.past().toISOString()
    }))
  },

  // Todos
  todos: (count: number, userId: string) => {
    const priorities = ['low', 'medium', 'high', 'urgent'] as const
    const statuses = ['pending', 'in_progress', 'completed', 'cancelled'] as const
    const categories = ['practice', 'learn', 'build', 'review', 'project'] as const

    return Array.from({length: count}, () => ({
      id: faker.string.uuid(),
      user_id: userId,
      journey_id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      status: faker.helpers.arrayElement(statuses),
      priority: faker.helpers.arrayElement(priorities),
      category: faker.helpers.arrayElement(categories),
      due_date: faker.date.future().toISOString(),
      completed_at: faker.helpers.maybe(() => faker.date.past().toISOString()),
      video_references: [generateMockData.videoReference()],
      tags: faker.helpers.arrayElements(['tutorial', 'scripting', 'building', 'ui', 'game'], {min: 1, max: 3}),
      estimated_minutes: faker.number.int({min: 15, max: 120}),
      actual_minutes: faker.helpers.maybe(() => faker.number.int({min: 10, max: 150})),
      parent_todo_id: faker.helpers.maybe(() => faker.string.uuid()),
      template_id: faker.helpers.maybe(() => faker.string.uuid()),
      generated_from: faker.helpers.arrayElement(['user', 'ai', 'video', 'learning_path']),
      metadata: {
        autoCompleteOnVideoWatch: faker.datatype.boolean(),
        learningObjectives: faker.helpers.arrayElements([
          'Learn basic scripting',
          'Understand game mechanics',
          'Master UI design',
          'Build complete project'
        ], {min: 1, max: 2})
      },
      created_at: faker.date.past().toISOString(),
      updated_at: faker.date.recent().toISOString()
    }))
  },

  // Todo suggestions
  todoSuggestion: (overrides?: Partial<TodoSuggestion>): TodoSuggestion => ({
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
    category: faker.helpers.arrayElement(['practice', 'learn', 'build', 'review']),
    estimatedMinutes: faker.number.int({min: 15, max: 120}),
    videoReferences: [generateMockData.videoReference()],
    suggestedDueDate: faker.date.future().toISOString(),
    prerequisites: faker.helpers.arrayElements([
      'Basic Lua knowledge',
      'Understanding of events',
      'Familiarity with Roblox Studio'
    ], {min: 0, max: 2}),
    learningObjectives: faker.helpers.arrayElements([
      'Understand variable scope',
      'Learn event handling',
      'Master function creation'
    ], {min: 1, max: 3}),
    autoGenerated: faker.datatype.boolean(),
    confidence: faker.number.float({min: 0.5, max: 1}),
    ...overrides
  }),

  // Learning paths
  learningPaths: (count: number, userId: string) => {
    return Array.from({length: count}, () => ({
      id: faker.string.uuid(),
      user_id: userId,
      journey_id: faker.string.uuid(),
      name: faker.lorem.words(3),
      description: faker.lorem.paragraph(),
      goal_analysis: {
        primaryGoal: faker.lorem.sentence(),
        skillLevel: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
        timeCommitment: faker.number.int({min: 1, max: 10})
      },
      total_estimated_hours: faker.number.float({min: 5, max: 50}),
      difficulty_level: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
      status: faker.helpers.arrayElement(['draft', 'active', 'paused', 'completed']),
      progress_percentage: faker.number.int({min: 0, max: 100}),
      ai_generated: faker.datatype.boolean(),
      metadata: {
        videoCount: faker.number.int({min: 3, max: 15}),
        categories: faker.helpers.arrayElements(['scripting', 'building', 'ui', 'game-design'], {min: 1, max: 3})
      },
      created_at: faker.date.past().toISOString(),
      updated_at: faker.date.recent().toISOString()
    }))
  },

  // Calendar actions
  calendarAction: (overrides?: Partial<CalendarAction>): CalendarAction => ({
    type: faker.helpers.arrayElement(['schedule_video', 'schedule_practice', 'schedule_review', 'block_time']),
    title: faker.lorem.words(4),
    description: faker.lorem.sentence(),
    startTime: faker.date.future().toISOString(),
    endTime: faker.date.future().toISOString(),
    duration: faker.number.int({min: 15, max: 120}),
    videoReference: generateMockData.videoReference(),
    relatedTodos: [faker.string.uuid(), faker.string.uuid()],
    recurring: faker.helpers.maybe(() => ({
      frequency: faker.helpers.arrayElement(['daily', 'weekly', 'monthly']),
      interval: faker.number.int({min: 1, max: 4}),
      endDate: faker.date.future().toISOString()
    })),
    ...overrides
  }),

  // Chat responses
  chatResponse: (overrides?: Partial<UnifiedChatResponse>): UnifiedChatResponse => ({
    answer: faker.lorem.paragraphs(2),
    videoReferences: Array.from({length: faker.number.int({min: 1, max: 5})}, () => 
      generateMockData.videoReference()
    ),
    suggestedQuestions: faker.helpers.arrayElements([
      'How do I handle events in Roblox?',
      'What are the best practices for scripting?',
      'How do I create custom tools?',
      'What is the difference between server and client?'
    ], {min: 2, max: 4}),
    sessionId: faker.string.uuid(),
    responseTime: faker.number.int({min: 500, max: 3000}),
    suggestedTodos: Array.from({length: faker.number.int({min: 0, max: 3})}, () => 
      generateMockData.todoSuggestion()
    ),
    schedulingActions: Array.from({length: faker.number.int({min: 0, max: 2})}, () => 
      generateMockData.calendarAction()
    ),
    actionButtons: [
      {
        id: 'create-todo',
        label: 'Create Todo',
        action: {
          type: 'CREATE_TODO',
          payload: { title: faker.lorem.sentence() }
        },
        variant: 'primary'
      },
      {
        id: 'schedule-video',
        label: 'Schedule Learning',
        action: {
          type: 'SCHEDULE_VIDEO',
          payload: { videoId: faker.string.uuid() }
        },
        variant: 'secondary'
      }
    ],
    metadata: {
      cacheHit: faker.datatype.boolean(),
      searchResultsCount: faker.number.int({min: 0, max: 20}),
      confidence: faker.number.float({min: 0.5, max: 1}),
      tokensUsed: faker.number.int({min: 100, max: 2000}),
      intent: {
        primary: faker.helpers.arrayElement(['question', 'schedule', 'todo', 'learn', 'track']),
        confidence: faker.number.float({min: 0.6, max: 1}),
        extractedEntities: {
          timeReferences: faker.helpers.arrayElements(['tomorrow', 'next week', '3pm'], {min: 0, max: 2}),
          videoReferences: faker.helpers.arrayElements(['tutorial', 'scripting video'], {min: 0, max: 2}),
          concepts: faker.helpers.arrayElements(['variables', 'functions', 'events'], {min: 1, max: 3})
        }
      }
    },
    ...overrides
  }),

  // Progress sync events
  progressSyncEvent: (overrides?: Partial<ProgressSyncEvent>): ProgressSyncEvent => ({
    type: faker.helpers.arrayElement(['video_watched', 'todo_completed', 'path_advanced', 'milestone_reached']),
    userId: faker.string.uuid(),
    timestamp: faker.date.recent().toISOString(),
    source: faker.helpers.arrayElement(['video_player', 'todo_system', 'calendar', 'chat']),
    data: {
      videoId: faker.string.uuid(),
      progress: faker.number.int({min: 0, max: 100}),
      timeSpent: faker.number.int({min: 1, max: 120})
    },
    relatedEntities: {
      videoIds: [faker.string.uuid(), faker.string.uuid()],
      todoIds: [faker.string.uuid()],
      pathIds: [faker.string.uuid()]
    },
    ...overrides
  }),

  // Calendar events
  calendarEvent: (overrides?: any) => ({
    id: faker.string.uuid(),
    title: faker.lorem.words(4),
    description: faker.lorem.sentence(),
    startTime: faker.date.future().toISOString(),
    duration: faker.number.int({min: 15, max: 120}),
    type: faker.helpers.arrayElement(['video_session', 'practice', 'review', 'project']),
    status: faker.helpers.arrayElement(['scheduled', 'in_progress', 'completed', 'missed']),
    videoReference: generateMockData.videoReference(),
    progress: faker.number.int({min: 0, max: 100}),
    relatedTodos: [faker.string.uuid(), faker.string.uuid()],
    ...overrides
  }),

  // Batch generators for testing scenarios
  fullUserScenario: (userId?: string) => {
    const user = userId ? { id: userId, ...generateMockData.user() } : generateMockData.user()
    const transcripts = generateMockData.transcripts(10)
    const todos = generateMockData.todos(15, user.id)
    const learningPaths = generateMockData.learningPaths(3, user.id)
    
    return {
      user,
      transcripts,
      todos,
      learningPaths,
      chatHistory: Array.from({length: 5}, () => generateMockData.chatResponse()),
      calendarEvents: Array.from({length: 10}, () => generateMockData.calendarEvent())
    }
  }
}

// Export specific mock datasets for common test scenarios
export const mockDatasets = {
  // Small dataset for quick tests
  minimal: {
    user: generateMockData.user(),
    transcripts: generateMockData.transcripts(2),
    todos: generateMockData.todos(3, 'test-user-id'),
    chatResponse: generateMockData.chatResponse()
  },

  // Medium dataset for integration tests
  standard: generateMockData.fullUserScenario('test-user-standard'),

  // Large dataset for performance tests
  large: {
    ...generateMockData.fullUserScenario('test-user-large'),
    transcripts: generateMockData.transcripts(100),
    todos: generateMockData.todos(50, 'test-user-large')
  },

  // Edge cases
  edgeCases: {
    emptyResponse: {
      ...generateMockData.chatResponse(),
      videoReferences: [],
      suggestedTodos: [],
      schedulingActions: []
    },
    
    highConfidenceVideo: generateMockData.videoReference({ confidence: 0.95 }),
    
    lowConfidenceVideo: generateMockData.videoReference({ confidence: 0.3 }),
    
    urgentTodo: generateMockData.todoSuggestion({ 
      priority: 'urgent',
      estimatedMinutes: 15 
    }),
    
    completedTodo: generateMockData.todos(1, 'test-user')[0] && {
      ...generateMockData.todos(1, 'test-user')[0],
      status: 'completed',
      completed_at: faker.date.past().toISOString(),
      actual_minutes: faker.number.int({min: 10, max: 60})
    }
  }
}
```

### Task 4.3: Service Integration Tests (30 minutes)
**File**: `tests/integration/services.test.ts`

Test the core integration services:

```typescript
// tests/integration/services.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TodoVideoLinker } from '@/services/integration/todo-video-linker'
import { SmartTodoGenerator } from '@/services/integration/smart-todo-generator'
import { LearningPathSync } from '@/services/integration/learning-path-sync'
import { generateMockData, mockDatasets } from '../mocks/mock-data'
import { mockServices, resetAllMocks } from './helpers'

describe('TodoVideoLinker Integration', () => {
  let linker: TodoVideoLinker
  let mockData: any

  beforeEach(() => {
    linker = new TodoVideoLinker()
    mockData = mockDatasets.standard
    resetAllMocks()
  })

  describe('linkTodoToVideo', () => {
    it('should create bidirectional link between todo and video', async () => {
      const todo = mockData.todos[0]
      const video = mockData.transcripts[0]
      
      const videoRef = generateMockData.videoReference({
        videoId: video.video_id,
        youtubeId: video.youtube_id,
        title: video.title
      })

      const link = await linker.linkTodoToVideo(todo.id, videoRef)

      expect(link).toMatchObject({
        todoId: todo.id,
        videoReference: videoRef,
        linkType: 'reference',
        addedBy: 'system'
      })

      // Verify todo was updated with video reference
      const updatedTodo = await linker.getTodo(todo.id)
      expect(updatedTodo.videoReferences).toContainEqual(
        expect.objectContaining({
          youtubeId: video.youtube_id
        })
      )
    })

    it('should handle timestamp-specific linking', async () => {
      const todo = mockData.todos[0]
      const video = generateMockData.videoReference({
        timestamp: '15:30',
        timestampSeconds: 930
      })

      const link = await linker.linkTodoToVideo(todo.id, video)

      expect(link.videoReference.timestamp).toBe('15:30')
      expect(link.videoReference.timestampSeconds).toBe(930)
    })
  })

  describe('getTodosForVideo', () => {
    it('should return all todos linked to a video', async () => {
      const video = mockData.transcripts[0]
      const todos = mockData.todos.slice(0, 3)

      // Link multiple todos to the video
      for (const todo of todos) {
        await linker.linkTodoToVideo(todo.id, generateMockData.videoReference({
          youtubeId: video.youtube_id
        }))
      }

      const linkedTodos = await linker.getTodosForVideo(video.youtube_id)

      expect(linkedTodos).toHaveLength(3)
      expect(linkedTodos.map(t => t.id)).toEqual(
        expect.arrayContaining(todos.map(t => t.id))
      )
    })

    it('should filter todos by timestamp when provided', async () => {
      const video = mockData.transcripts[0]
      const todoAt1530 = mockData.todos[0]
      const todoAt2000 = mockData.todos[1]

      await linker.linkTodoToVideo(todoAt1530.id, generateMockData.videoReference({
        youtubeId: video.youtube_id,
        timestamp: '15:30'
      }))

      await linker.linkTodoToVideo(todoAt2000.id, generateMockData.videoReference({
        youtubeId: video.youtube_id,
        timestamp: '20:00'
      }))

      const todosAt1530 = await linker.getTodosForVideo(video.youtube_id, '15:30')

      expect(todosAt1530).toHaveLength(1)
      expect(todosAt1530[0].id).toBe(todoAt1530.id)
    })
  })

  describe('syncWatchProgress', () => {
    it('should update progress and auto-complete related todos', async () => {
      const userId = mockData.user.id
      const video = mockData.transcripts[0]
      const todo = {
        ...mockData.todos[0],
        metadata: { autoCompleteOnVideoWatch: true }
      }

      await linker.linkTodoToVideo(todo.id, generateMockData.videoReference({
        youtubeId: video.youtube_id
      }))

      await linker.syncWatchProgress(userId, video.youtube_id, 95)

      // Verify progress was recorded
      const progress = await linker.getVideoProgress(userId, video.youtube_id)
      expect(progress.watch_progress).toBe(95)
      expect(progress.completed).toBe(true)

      // Verify todo was auto-completed
      const updatedTodo = await linker.getTodo(todo.id)
      expect(updatedTodo.status).toBe('completed')
      expect(updatedTodo.completed_at).toBeDefined()
    })

    it('should not auto-complete todos below 90% progress', async () => {
      const userId = mockData.user.id
      const video = mockData.transcripts[0]
      
      await linker.syncWatchProgress(userId, video.youtube_id, 75)

      const progress = await linker.getVideoProgress(userId, video.youtube_id)
      expect(progress.completed).toBe(false)
    })
  })
})

describe('SmartTodoGenerator Integration', () => {
  let generator: SmartTodoGenerator
  let mockData: any

  beforeEach(() => {
    generator = new SmartTodoGenerator()
    mockData = mockDatasets.standard
    resetAllMocks()
  })

  describe('generateTodosFromTranscript', () => {
    it('should generate relevant todos from transcript chunks', async () => {
      const transcriptChunks = generateMockData.transcriptChunks(
        mockData.transcripts[0].id,
        5
      )

      const suggestions = await generator.generateTodosFromTranscript(
        transcriptChunks,
        'beginner'
      )

      expect(suggestions).toHaveLength(expect.any(Number))
      expect(suggestions.length).toBeGreaterThan(0)

      suggestions.forEach(suggestion => {
        expect(suggestion).toMatchObject({
          title: expect.any(String),
          description: expect.any(String),
          priority: expect.stringMatching(/^(low|medium|high|urgent)$/),
          category: expect.any(String),
          estimatedMinutes: expect.any(Number),
          autoGenerated: true,
          confidence: expect.any(Number)
        })

        expect(suggestion.videoReferences).toHaveLength(1)
        expect(suggestion.confidence).toBeGreaterThan(0)
      })
    })

    it('should adjust difficulty based on user level', async () => {
      const transcriptChunks = generateMockData.transcriptChunks(
        mockData.transcripts[0].id,
        3
      )

      const beginnerTodos = await generator.generateTodosFromTranscript(
        transcriptChunks,
        'beginner'
      )

      const advancedTodos = await generator.generateTodosFromTranscript(
        transcriptChunks,
        'advanced'
      )

      // Beginner todos should be simpler (lower time estimates)
      const avgBeginnerTime = beginnerTodos.reduce((sum, t) => sum + t.estimatedMinutes, 0) / beginnerTodos.length
      const avgAdvancedTime = advancedTodos.reduce((sum, t) => sum + t.estimatedMinutes, 0) / advancedTodos.length

      expect(avgBeginnerTime).toBeLessThanOrEqual(avgAdvancedTime)
    })
  })

  describe('createPracticeExercises', () => {
    it('should create practice todos for given concepts', async () => {
      const videoId = mockData.transcripts[0].youtube_id
      const concepts = ['variables', 'functions', 'events']

      const exercises = await generator.createPracticeExercises(videoId, concepts)

      expect(exercises).toHaveLength(3) // One per concept
      
      exercises.forEach((exercise, index) => {
        expect(exercise.title).toContain('Practice') // or contain concept
        expect(exercise.category).toBe('practice')
        expect(exercise.tags).toContain(concepts[index])
        expect(exercise.videoReferences[0].youtubeId).toBe(videoId)
      })
    })
  })
})

describe('LearningPathSync Integration', () => {
  let sync: LearningPathSync
  let mockData: any

  beforeEach(() => {
    sync = new LearningPathSync()
    mockData = mockDatasets.standard
    resetAllMocks()
  })

  describe('createPathFromPlaylist', () => {
    it('should create learning path from video playlist', async () => {
      const videoIds = mockData.transcripts.slice(0, 5).map(t => t.youtube_id)
      const userId = mockData.user.id

      const path = await sync.createPathFromPlaylist(
        videoIds,
        userId,
        'Custom Learning Path'
      )

      expect(path).toMatchObject({
        user_id: userId,
        name: 'Custom Learning Path',
        status: 'active',
        ai_generated: true
      })

      expect(path.segments).toHaveLength(5)
      path.segments.forEach((segment, index) => {
        expect(segment.step_order).toBe(index + 1)
        expect(segment.youtube_id).toBe(videoIds[index])
      })
    })

    it('should calculate total estimated hours correctly', async () => {
      const videos = mockData.transcripts.slice(0, 3).map(t => ({
        ...t,
        duration_seconds: 1800 // 30 minutes each
      }))
      const videoIds = videos.map(v => v.youtube_id)

      const path = await sync.createPathFromPlaylist(videoIds, mockData.user.id)

      // 3 videos × 30 minutes = 90 minutes = 1.5 hours
      expect(path.total_estimated_hours).toBe(1.5)
    })
  })

  describe('schedulePathSessions', () => {
    it('should create calendar events for path segments', async () => {
      const path = mockData.learningPaths[0]
      const preferences = {
        startDate: new Date().toISOString(),
        daysBetweenSessions: 2,
        preferredHour: 15 // 3 PM
      }

      const actions = await sync.schedulePathSessions(path.id, preferences)

      expect(actions).toHaveLength(expect.any(Number))
      
      actions.forEach((action, index) => {
        expect(action.type).toBe('schedule_video')
        expect(action.title).toBeDefined()
        expect(action.duration).toBeGreaterThan(0)
        expect(action.videoReference).toBeDefined()
        
        // Check scheduling interval
        const expectedDate = new Date(preferences.startDate)
        expectedDate.setDate(expectedDate.getDate() + index * preferences.daysBetweenSessions)
        expectedDate.setHours(preferences.preferredHour, 0, 0, 0)
        
        expect(new Date(action.startTime!)).toEqual(expectedDate)
      })
    })
  })

  describe('updateProgressFromVideo', () => {
    it('should update learning path progress when video is watched', async () => {
      const userId = mockData.user.id
      const pathId = mockData.learningPaths[0].id
      const videoId = mockData.transcripts[0].youtube_id

      // Link video to path
      await sync.addVideoToPath(pathId, videoId, 1)

      const update = await sync.updateProgressFromVideo(userId, videoId, 95)

      expect(update).toMatchObject({
        userId,
        youtubeId: videoId,
        watchTime: 95,
        pathsUpdated: expect.arrayContaining([
          expect.objectContaining({
            pathId,
            videoCompleted: true,
            progress: expect.any(Number)
          })
        ])
      })
    })

    it('should not mark video complete if watch time below 90%', async () => {
      const userId = mockData.user.id
      const videoId = mockData.transcripts[0].youtube_id

      const update = await sync.updateProgressFromVideo(userId, videoId, 75)

      update.pathsUpdated?.forEach(pathUpdate => {
        expect(pathUpdate.videoCompleted).toBe(false)
      })
    })
  })

  describe('getNextRecommendedVideo', () => {
    it('should return next incomplete video in learning path', async () => {
      const userId = mockData.user.id
      const path = mockData.learningPaths[0]

      // Mark first video as complete
      const videos = mockData.transcripts.slice(0, 3)
      await sync.markVideoComplete(path.id, videos[0].youtube_id)

      const nextVideo = await sync.getNextRecommendedVideo(userId)

      expect(nextVideo).toMatchObject({
        youtubeId: videos[1].youtube_id,
        title: videos[1].title
      })
    })

    it('should return null when all path videos are complete', async () => {
      const userId = mockData.user.id
      const path = mockData.learningPaths[0]

      // Mark all videos as complete
      const videos = mockData.transcripts.slice(0, 3)
      for (const video of videos) {
        await sync.markVideoComplete(path.id, video.youtube_id)
      }

      const nextVideo = await sync.getNextRecommendedVideo(userId)

      expect(nextVideo).toBeNull()
    })
  })
})

// Integration test scenarios
describe('Full Integration Scenarios', () => {
  it('should handle complete todo-video-calendar workflow', async () => {
    const linker = new TodoVideoLinker()
    const generator = new SmartTodoGenerator()
    const sync = new LearningPathSync()
    
    const mockData = mockDatasets.standard
    const userId = mockData.user.id
    const video = mockData.transcripts[0]

    // 1. Generate todos from video transcript
    const chunks = generateMockData.transcriptChunks(video.id, 5)
    const suggestions = await generator.generateTodosFromTranscript(chunks, 'beginner')
    
    expect(suggestions.length).toBeGreaterThan(0)

    // 2. Create todos and link to video
    const todos = []
    for (const suggestion of suggestions.slice(0, 2)) {
      const todo = await createTodo(userId, suggestion)
      await linker.linkTodoToVideo(todo.id, suggestion.videoReferences[0])
      todos.push(todo)
    }

    // 3. Create learning path with video
    const path = await sync.createPathFromPlaylist([video.youtube_id], userId)
    
    // 4. Schedule learning sessions
    const actions = await sync.schedulePathSessions(path.id, {
      startDate: new Date().toISOString(),
      daysBetweenSessions: 1
    })

    expect(actions.length).toBeGreaterThan(0)

    // 5. Simulate video watching and progress sync
    await linker.syncWatchProgress(userId, video.youtube_id, 95)

    // 6. Verify integration worked
    const updatedPath = await sync.updateProgressFromVideo(userId, video.youtube_id, 95)
    expect(updatedPath.pathsUpdated[0].videoCompleted).toBe(true)

    const linkedTodos = await linker.getTodosForVideo(video.youtube_id)
    expect(linkedTodos.length).toBe(2)
  })
})

// Helper function for creating todos in tests
async function createTodo(userId: string, suggestion: any) {
  return {
    id: faker.string.uuid(),
    userId,
    title: suggestion.title,
    description: suggestion.description,
    status: 'pending',
    priority: suggestion.priority,
    category: suggestion.category,
    videoReferences: suggestion.videoReferences,
    estimatedMinutes: suggestion.estimatedMinutes,
    metadata: suggestion.metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}
```

---

## 📁 File Structure You'll Create

```
tests/
├── integration/
│   ├── setup.ts              ✨ NEW (Task 4.1)
│   ├── helpers.ts             ✨ NEW (Task 4.1)
│   └── services.test.ts       ✨ NEW (Task 4.3)
├── mocks/
│   └── mock-data.ts           ✨ NEW (Task 4.2)
├── unit/
│   ├── components/            📁 For Agent 3's component tests
│   └── services/              📁 For Agent 2's service tests
└── e2e/
    └── integration-flow.test.ts 📝 To be created later
```

---

## ✅ Success Criteria

Your testing infrastructure is complete when:

1. **Test framework is configured** and runs without errors
2. **Mock data generators** create realistic test data
3. **Integration tests pass** with mock services
4. **All services are tested** with different scenarios
5. **Edge cases are covered** (empty data, errors, etc.)
6. **Performance tests** validate response times
7. **Setup and teardown** work properly

---

## 🔄 Coordination Points

### Checkpoint 1 (30 minutes)
Share test interfaces with Agent 1 for type compatibility

### Checkpoint 2 (1 hour)
Provide mock services to Agent 2 for development

### Checkpoint 3 (1.5 hours)
Create component test helpers for Agent 3

### Final (2 hours)
Run full integration test suite with all agents' code

---

## 📝 Testing Configuration

### Vitest Configuration
Add to `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/integration/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.js'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:integration": "vitest tests/integration",
    "test:watch": "vitest --watch"
  }
}
```

---

## 🚀 Getting Started

1. Set up Vitest configuration
2. Create mock data generators first
3. Build integration test helpers
4. Write service integration tests
5. Create component test utilities
6. Add performance benchmarks

---

## ⚠️ Important Notes

- **Use realistic mock data** - not just "test" strings
- **Test edge cases** - empty arrays, null values, errors
- **Mock external APIs** - OpenAI, Supabase, etc.
- **Test async operations** properly with await
- **Clean up after tests** to prevent interference
- **Use descriptive test names** that explain the scenario

---

## 🎯 Deliverables Checklist

- [ ] Test framework setup and configuration
- [ ] Comprehensive mock data generators
- [ ] Integration test helpers and utilities
- [ ] Service integration tests with full coverage
- [ ] Component testing utilities for Agent 3
- [ ] Performance benchmarks and metrics
- [ ] Coordination checkpoints completed

---

**Agent 4 Ready to Deploy!**
Create robust testing infrastructure that catches issues early and gives confidence in the integration!