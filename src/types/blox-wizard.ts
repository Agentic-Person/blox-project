// Chat Wizard specific types and interfaces

export interface VideoReference {
  title: string;
  youtubeId: string;
  creator?: string;
  timestamp: string; // "15:30" format
  relevantSegment: string; // The actual text that matched
  thumbnailUrl: string;
  videoUrl: string; // Direct YouTube link
  timestampUrl: string; // YouTube link with timestamp
  confidence: number;
  duration?: string;
}

export interface ChatRequest {
  message: string;
  sessionId: string;
  userId?: string; // From Supabase auth
  videoContext?: {
    videoId: string;
    youtubeId: string;  
    currentTime?: number; // If watching a video
  };
  preferences?: {
    maxVideos?: number; // Default 5
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    focusAreas?: string[]; // ['scripting', 'building', 'ui']
  };
}

export interface ChatResponse {
  answer: string;
  videoReferences: VideoReference[];
  suggestedQuestions: string[];
  sessionId: string;
  usageRemaining: number;
  responseTime: number;
  metadata: {
    cacheHit: boolean;
    searchResultsCount: number;
    confidence: number;
    tokensUsed?: number;
  };
}

export interface SearchResult {
  chunkId: string;
  transcriptId: string;
  videoId: string;
  youtubeId: string;
  title: string;
  creator?: string;
  chunkText: string;
  startTimestamp: string;
  endTimestamp: string;
  relevanceScore: number;
  confidence: number;
  videoUrl: string;
  timestampUrl: string;
}

export interface SearchResponse {
  results: SearchResult[];
  totalFound: number;
  searchTime: number;
  cacheHit: boolean;
  query: string;
  queryEmbedding?: number[];
}

export interface TranscriptData {
  id: string;
  videoId: string;
  youtubeId: string;
  title: string;
  creator: string;
  durationSeconds: number;
  fullTranscript: string;
  transcriptJson: TranscriptSegment[];
  processedAt: Date;
  createdAt: Date;
}

export interface TranscriptSegment {
  text: string;
  startTime: number; // seconds
  duration: number; // seconds
  timestamp: string; // "15:30"
}

export interface ChunkedSegment {
  text: string;
  chunkIndex: number;
  startTime: number;
  endTime: number;
  startTimestamp: string;
  endTimestamp: string;
}

export interface ProcessingResult {
  success: boolean;
  videoId: string;
  youtubeId: string;
  chunksCreated: number;
  errors?: string[];
}

// Chat message types for UI
export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
  videoReferences?: VideoReference[];
  suggestedQuestions?: string[];
  responseTime?: number;
  isLoading?: boolean;
  error?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  sessionId: string;
  currentInput: string;
  error: string | null;
  usageRemaining: number;
}

// Service configuration interfaces
export interface SearchConfig {
  maxResults: number; // Default 20
  similarityThreshold: number; // Default 0.7
  multiVideoBoost: boolean; // Prefer diverse video sources
  confidenceWeighting: boolean; // Weight by transcript quality
}

export interface TranscriptProcessorConfig {
  chunkSize: number; // 500 tokens
  chunkOverlap: number; // 100 tokens  
  batchSize: number; // Process N videos at once
  maxRetries: number; // For API failures
}

export interface ResponseGeneratorConfig {
  model: string; // 'gpt-4o-mini'
  maxTokens: number; // 500
  temperature: number; // 0.7
  systemPrompt: string;
}

// Video extraction from curriculum
export interface VideoFromCurriculum {
  id: string; // From curriculum structure
  youtubeId: string; // Extract from URLs
  title: string;
  creator?: string;
  moduleId: string;
  weekId: string;
  dayId: string;
}

// Database raw result types
export interface RawSearchResult {
  chunk_id: string;
  transcript_id: string;
  video_id: string;
  youtube_id: string;
  title: string;
  creator: string;
  chunk_text: string;
  start_timestamp: string;
  end_timestamp: string;
  start_seconds: number;
  end_seconds: number;
  similarity_score: number;
}

// Caching types (for Phase 2)
export interface CachedQuestion {
  id: string;
  questionPattern: string;
  questionEmbedding: number[];
  usageCount: number;
  lastUsed: Date;
  createdAt: Date;
}

export interface CachedAnswer {
  id: string;
  questionId: string;
  answerText: string;
  videoReferences: VideoReference[];
  confidenceScore: number;
  generatedAt: Date;
  expiresAt?: Date;
}