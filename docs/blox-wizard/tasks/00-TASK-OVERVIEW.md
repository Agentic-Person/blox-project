# Chat Wizard Implementation Task Overview
## Senior Developer Notes for Junior Developer Handoff

---

## Project Context

**What we're building**: An intelligent AI assistant that searches across ALL YouTube video transcripts in our curriculum, provides personalized learning recommendations, and creates calendar-based learning schedules.

**Why this approach**: User explicitly doesn't want N8n workflows or Discord bots. They want a direct Next.js implementation that can handle 10K+ concurrent users with smart caching to reduce OpenAI costs by 60-80%.

**Key Business Requirements**:
- Search across ALL video transcripts simultaneously
- Cache the 50 most common questions to reduce API costs
- Create learning schedules and calendar integration
- Provide precise video citations with timestamps
- Handle educational content for ages 10-25

---

## Implementation Timeline: 4 Phases (4 weeks)

### Phase 1: Foundation (Week 1) - 7 Tasks
**Goal**: Set up core infrastructure and basic transcript processing
- Database schema and migrations
- Transcript processing pipeline
- Basic vector search functionality
- Core API endpoints

### Phase 2: Intelligence (Week 2) - 6 Tasks  
**Goal**: Implement smart caching and AI response generation
- Three-tier caching system
- Question pattern detection
- OpenAI integration for responses
- Response quality optimization

### Phase 3: Integration (Week 3) - 5 Tasks
**Goal**: Connect with existing Blox Buddy systems
- AI Journey calendar integration
- Frontend chat interface
- Learning path recommendations
- Progress tracking integration

### Phase 4: Production (Week 4) - 4 Tasks
**Goal**: Production readiness and optimization
- Performance monitoring
- Security hardening
- Load testing
- Production deployment

---

## Task Numbering System

Tasks are numbered as: `{phase}-{sequence}-{component}`

Examples:
- `01-01-database-schema.md` = Phase 1, Task 1, Database Schema
- `02-03-caching-system.md` = Phase 2, Task 3, Caching System

---

## Development Standards for This Project

### Code Quality Requirements
- **TypeScript**: Strict mode enabled, no `any` types
- **Error Handling**: All async operations must have try/catch blocks
- **Testing**: Unit tests for all utility functions
- **Documentation**: JSDoc comments for all public functions
- **Performance**: All database queries must be optimized with proper indexes

### File Organization
```
src/
├── app/api/chat/blox-wizard/     # Chat API endpoints
├── lib/services/blox-wizard/     # Core business logic
├── components/blox-wizard/       # UI components
├── hooks/                        # Custom React hooks
└── types/blox-wizard.ts         # TypeScript definitions
```

### Environment Variables Required
```bash
# OpenAI
OPENAI_API_KEY=your_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# YouTube (for transcript fetching)
YOUTUBE_API_KEY=your_key_here
```

---

## Critical Technical Decisions Made

### 1. Database: PostgreSQL + pgvector (NOT Pinecone)
**Rationale**: Already using Supabase, reduces complexity, free for our scale
**Implementation**: Use pgvector extension for vector similarity search

### 2. AI Model: GPT-4o-mini (NOT GPT-4)
**Rationale**: 50x cost reduction, sufficient quality for educational Q&A
**Implementation**: Smart caching reduces usage by 60-80%

### 3. Chunking Strategy: 500 tokens with 100-token overlap
**Rationale**: Optimal balance between context and search precision
**Implementation**: Store chunks with precise timestamp references

### 4. Caching Strategy: 3-Tier System
**Rationale**: Maximize cache hit rate while minimizing memory usage
- **L1**: In-memory (hot questions, 1 hour TTL)
- **L2**: Database (common patterns, 30 days TTL) 
- **L3**: Embedding cache (query embeddings, 7 days TTL)

---

## Success Criteria for Each Task

Each task must meet these criteria before marking complete:
1. **Functional**: Code works as specified in requirements
2. **Tested**: Unit tests pass and manual testing completed
3. **Documented**: Code comments and documentation updated
4. **Optimized**: Performance meets targets (< 3s response time)
5. **Secure**: Input validation and error handling implemented

---

## Risk Management

### High-Risk Areas to Watch
1. **OpenAI API Costs**: Monitor token usage closely
2. **Database Performance**: Vector search must stay under 500ms
3. **Memory Usage**: In-memory cache must not exceed 1GB
4. **External Dependencies**: YouTube API rate limits

### Mitigation Strategies
1. **Cost Control**: Implement usage alerts at 80% of budget
2. **Performance**: Use database connection pooling
3. **Memory**: Implement LRU eviction for cache
4. **Rate Limits**: Implement exponential backoff

---

## Getting Help

If you get stuck on any task:
1. **Check Documentation**: Review the implementation guide first
2. **Search Patterns**: Look for similar implementations in existing codebase  
3. **API References**: Use the API reference documentation
4. **Troubleshooting**: Check the FAQ for common issues

Remember: This is a complex system, but each task is designed to be manageable when tackled individually. Focus on one task at a time and ensure it meets all success criteria before moving to the next.

---

**Next Step**: Start with `01-01-database-schema.md` to set up the foundation.

*Created by: Senior Developer*  
*Date: Current*  
*Project: Blox Buddy Chat Wizard System*