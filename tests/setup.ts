/**
 * Test Setup Configuration
 * 
 * Global test setup for the AI-Powered Learning System integration tests
 */

import { beforeAll, afterAll, vi } from 'vitest'

// Mock environment variables
beforeAll(() => {
  process.env.OPENAI_API_KEY = 'sk-test-key-for-testing'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
})

// Global mocks
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: 'mock-id' }, error: null })),
          order: vi.fn(() => ({ data: [], error: null }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: { video_references: [] }, error: null })),
          order: vi.fn(() => ({ data: [], error: null })),
          in: vi.fn(() => ({ data: [], error: null })),
          lte: vi.fn(() => ({ data: [], error: null })),
          contains: vi.fn(() => ({ data: [], error: null }))
        })),
        contains: vi.fn(() => ({ data: [], error: null }))
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
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(() => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify([{
                title: 'Mock Todo',
                description: 'Mock description',
                priority: 'medium',
                category: 'practice',
                estimatedMinutes: 30,
                confidence: 0.9,
                prerequisites: [],
                learningObjectives: ['Mock objective']
              }])
            }
          }]
        }))
      }
    },
    embeddings: {
      create: vi.fn(() => Promise.resolve({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      }))
    }
  }))
}))

// Cleanup
afterAll(() => {
  vi.restoreAllMocks()
})