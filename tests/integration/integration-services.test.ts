/**
 * Integration Services Test Suite
 * 
 * Tests the core integration services for AI-Powered Learning System
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  TodoVideoLinker,
  SmartTodoGenerator,
  LearningPathSync,
  IntegrationServices
} from '../../src/services/integration'
import { 
  mockVideoReferences,
  mockTodoSuggestions,
  mockChatResponse,
  MockDataFactory
} from '../fixtures/mock-data'
import { IntegrationConfig } from '../../src/types/shared'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: 'test-id' }, error: null }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: { video_references: [] }, error: null })),
          order: vi.fn(() => ({ data: [], error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      })),
      upsert: vi.fn(() => ({ error: null })),
      rpc: vi.fn(() => ({ data: [], error: null }))
    }))
  }
}))

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(() => ({
          choices: [{
            message: {
              content: JSON.stringify([{
                title: 'Test Todo',
                description: 'Test description',
                priority: 'medium',
                category: 'practice',
                estimatedMinutes: 30,
                confidence: 0.9
              }])
            }
          }]
        }))
      }
    },
    embeddings: {
      create: vi.fn(() => ({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      }))
    }
  }))
}))

describe('Integration Services', () => {
  let config: IntegrationConfig
  let services: IntegrationServices

  beforeEach(() => {
    config = {
      openaiApiKey: 'test-key',
      openaiModel: 'gpt-4o-mini',
      embeddingModel: 'text-embedding-3-small',
      enableTodoGeneration: true,
      enableSmartScheduling: true,
      enableLearningPaths: true,
      enableProgressSync: true,
      maxVideoReferences: 5,
      maxTodoSuggestions: 3,
      cacheTimeoutMinutes: 60,
      defaultTodoPriority: 'medium',
      defaultSchedulingDuration: 60,
      autoLinkVideosToTodos: true
    }
    services = new IntegrationServices(config)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('TodoVideoLinker', () => {
    test('should link todo to video successfully', async () => {
      const linker = services.todoVideoLinker
      const todoId = 'test-todo-id'
      const videoRef = mockVideoReferences[0]

      const result = await linker.linkTodoToVideo(todoId, videoRef, 'reference', 'Test notes')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.todoId).toBe(todoId)
      expect(result.data?.videoReference.youtubeId).toBe(videoRef.youtubeId)
    })

    test('should get todo video links', async () => {
      const linker = services.todoVideoLinker
      const todoId = 'test-todo-id'

      const result = await linker.getTodoVideoLinks(todoId)

      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })

    test('should sync video progress', async () => {
      const linker = services.todoVideoLinker
      const userId = 'test-user'
      const youtubeId = 'test-video'
      const watchProgress = 95
      const currentPosition = 1140

      const result = await linker.syncVideoProgress(userId, youtubeId, watchProgress, currentPosition)

      expect(result.success).toBe(true)
    })

    test('should handle errors gracefully', async () => {
      // Mock Supabase to return an error
      const supabaseMock = await import('@/lib/supabase/client')
      vi.mocked(supabaseMock.supabase.from).mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: new Error('Database error') }))
          }))
        }))
      } as any)

      const linker = services.todoVideoLinker
      const result = await linker.linkTodoToVideo('test-id', mockVideoReferences[0])

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database error')
    })
  })

  describe('SmartTodoGenerator', () => {
    test('should generate todos from transcript', async () => {
      const generator = services.smartTodoGenerator
      const videoRef = mockVideoReferences[0]
      const transcript = 'In this video, we learn about variables in Lua programming...'

      const result = await generator.generateTodosFromTranscript(
        videoRef,
        transcript,
        'beginner',
        'Learning Lua basics'
      )

      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data?.[0]?.title).toBeDefined()
      expect(result.data?.[0]?.autoGenerated).toBe(true)
    })

    test('should generate todos from chat', async () => {
      const generator = services.smartTodoGenerator
      const chatMessage = 'How do I create variables in Lua?'
      const videoRefs = [mockVideoReferences[0]]

      const result = await generator.generateTodosFromChat(
        chatMessage,
        videoRefs,
        'beginner'
      )

      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data?.length).toBeGreaterThan(0)
    })

    test('should generate learning path', async () => {
      const generator = services.smartTodoGenerator
      const videoRefs = mockVideoReferences
      const objectives = ['Learn Lua basics', 'Create simple scripts']

      const result = await generator.generateLearningPath(videoRefs, objectives, 'intermediate')

      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })

    test('should get similar suggestions', async () => {
      const generator = services.smartTodoGenerator
      const content = 'variables and functions in Lua'

      const result = await generator.getSimilarSuggestions(content, 3)

      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })

    test('should handle AI API errors', async () => {
      // Mock OpenAI to throw an error
      const OpenAI = await import('openai')
      const mockOpenAI = vi.mocked(OpenAI.default)
      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('API Error'))
          }
        }
      } as any))

      const generator = new SmartTodoGenerator(config)
      const result = await generator.generateTodosFromTranscript(
        mockVideoReferences[0],
        'test transcript',
        'beginner'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('API Error')
    })
  })

  describe('LearningPathSync', () => {
    test('should create learning path', async () => {
      const pathSync = services.learningPathSync
      const userId = 'test-user'
      const title = 'Lua Programming Basics'
      const videoRefs = mockVideoReferences
      const objectives = ['Variables', 'Functions', 'Control structures']

      const result = await pathSync.createLearningPath(
        userId,
        title,
        videoRefs,
        objectives,
        'Complete Lua programming course'
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    test('should sync progress', async () => {
      const pathSync = services.learningPathSync
      const userId = 'test-user'
      const pathId = 'test-path'
      const progressEvent = {
        type: 'video_watched' as const,
        userId,
        timestamp: new Date().toISOString(),
        source: 'video_player' as const,
        data: {
          youtubeId: 'test-video',
          watchedSeconds: 900,
          totalSeconds: 1000
        },
        relatedEntities: {
          videoIds: ['test-video'],
          todoIds: []
        }
      }

      const result = await pathSync.syncProgress(userId, pathId, progressEvent)

      expect(result.success).toBe(true)
    })

    test('should generate scheduling suggestions', async () => {
      const pathSync = services.learningPathSync
      const userId = 'test-user'
      const pathId = 'test-path'
      const preferences = {
        sessionsPerWeek: 3,
        sessionDuration: 60,
        preferredTimes: ['evening'],
        startDate: new Date().toISOString()
      }

      const result = await pathSync.generateSchedulingSuggestions(userId, pathId, preferences)

      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })

    test('should get path progress', async () => {
      const pathSync = services.learningPathSync
      const userId = 'test-user'
      const pathId = 'test-path'

      const result = await pathSync.getPathProgress(userId, pathId)

      expect(result.success).toBe(true)
      expect(result.data?.completionPercentage).toBeDefined()
    })
  })

  describe('IntegrationServices Factory', () => {
    test('should create services with default config', () => {
      const services = IntegrationServices.create('test-api-key')

      expect(services).toBeInstanceOf(IntegrationServices)
      expect(services.todoVideoLinker).toBeInstanceOf(TodoVideoLinker)
      expect(services.smartTodoGenerator).toBeInstanceOf(SmartTodoGenerator)
      expect(services.learningPathSync).toBeInstanceOf(LearningPathSync)
    })

    test('should perform health check', async () => {
      const services = IntegrationServices.create('test-api-key')
      const health = await services.healthCheck()

      expect(health.todoVideoLinker).toBe(true)
      expect(health.smartTodoGenerator).toBe(true)
      expect(health.learningPathSync).toBe(true)
      expect(health.timestamp).toBeDefined()
    })
  })
})

describe('Integration Flow Tests', () => {
  let services: IntegrationServices

  beforeEach(() => {
    services = IntegrationServices.create('test-api-key')
  })

  test('should complete end-to-end todo-video integration flow', async () => {
    // 1. Generate todo from transcript
    const videoRef = mockVideoReferences[0]
    const transcript = 'Learn about Lua variables and how to use them effectively'
    
    const todoResult = await services.smartTodoGenerator.generateTodosFromTranscript(
      videoRef,
      transcript,
      'beginner'
    )
    
    expect(todoResult.success).toBe(true)
    
    // 2. Link the generated todo to the video
    const mockTodoId = 'generated-todo-id'
    const linkResult = await services.todoVideoLinker.linkTodoToVideo(
      mockTodoId,
      videoRef,
      'reference'
    )
    
    expect(linkResult.success).toBe(true)
    
    // 3. Simulate video watching progress
    const progressResult = await services.todoVideoLinker.syncVideoProgress(
      'test-user',
      videoRef.youtubeId,
      95,
      videoRef.timestampSeconds || 0
    )
    
    expect(progressResult.success).toBe(true)
  })

  test('should complete learning path creation and scheduling flow', async () => {
    // 1. Create learning path
    const pathResult = await services.learningPathSync.createLearningPath(
      'test-user',
      'Complete Lua Course',
      mockVideoReferences,
      ['Master Lua basics', 'Build projects']
    )
    
    expect(pathResult.success).toBe(true)
    
    // 2. Generate scheduling suggestions
    const scheduleResult = await services.learningPathSync.generateSchedulingSuggestions(
      'test-user',
      pathResult.data!,
      {
        sessionsPerWeek: 2,
        sessionDuration: 90,
        preferredTimes: ['morning', 'evening']
      }
    )
    
    expect(scheduleResult.success).toBe(true)
    expect(scheduleResult.data?.length).toBeGreaterThan(0)
  })

  test('should handle complex multi-service error scenarios', async () => {
    // Test resilience when one service fails
    const supabaseMock = await import('@/lib/supabase/client')
    
    // Mock database failure
    vi.mocked(supabaseMock.supabase.from).mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: new Error('Connection failed') }))
        }))
      }))
    } as any)

    const pathResult = await services.learningPathSync.createLearningPath(
      'test-user',
      'Test Path',
      mockVideoReferences
    )
    
    expect(pathResult.success).toBe(false)
    expect(pathResult.error).toContain('Connection failed')
  })
})