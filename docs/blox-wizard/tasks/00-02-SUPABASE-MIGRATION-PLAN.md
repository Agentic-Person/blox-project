# Task 00-02: Complete Migration from Mock Data to Real Supabase Cloud
**Priority**: Critical (Prerequisite for all Chat Wizard development)

---

## Overview

**Goal**: Eliminate all mock data systems and establish real Supabase cloud integration for Chat Wizard development.

**Why This Matters**: The current system uses extensive mock data which will create integration issues. We need a single source of truth using the existing Supabase cloud instance.

---

## Phase 1: Environment & Configuration Updates ✅ COMPLETE

### 1.1 Update Environment Variables (.env.local) ✅ COMPLETE
```bash
# Change from mock to real - APPLIED
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_USE_MOCK_SUPABASE=false  
NEXT_PUBLIC_USE_MOCK_AUTH=false

# Real Supabase credentials - CONFIGURED
NEXT_PUBLIC_SUPABASE_URL=https://jpkwtpvwimhclncdswdk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[configured]
SUPABASE_SERVICE_ROLE_KEY=[configured]

# Chat Wizard specific - READY
OPENAI_API_KEY=[configured]
```

### 1.2 Update Feature Flags (src/lib/config/features.ts) ✅ COMPLETE
```typescript
export const FEATURES = {
  USE_MOCK_AUTH: false,        // ✅ Applied
  USE_MOCK_DATA: false,        // ✅ Applied
  USE_REAL_AUTH: true,         // ✅ Applied
  USE_REAL_DB: true,           // ✅ Applied
  USE_AI_ASSISTANT: true,      // ✅ Applied
  // ... other features maintained
}
```

### 1.3 Update Supabase Client (src/lib/supabase/client.ts) ✅ COMPLETE
```typescript
// Conditional mock logic removed - ✅ Applied
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
// Service role client added for Chat Wizard - ✅ Applied
export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceKey, {...})
```

---

## Phase 2: Database Schema Setup (Cloud) ✅ COMPLETE

### 2.1 Apply Chat Wizard Migration ✅ COMPLETE
- ✅ **pgvector extension** enabled successfully  
- ✅ **video_transcripts** table created
- ✅ **transcript_chunks** table created with vector embeddings
- ✅ **common_questions** table created for caching
- ✅ **question_answers** table created for cached responses
- ✅ **Performance indexes** applied (including vector indexes)
- ✅ **RLS policies** configured for security
- ✅ **Search functions** created (search_transcript_chunks, search_diverse_sources)

**Applied via Supabase Dashboard SQL Editor in 10 manual steps**

### 2.2 Verify Integration ✅ COMPLETE
- ✅ All 4 Chat Wizard tables accessible and ready
- ✅ Vector search functions operational
- ✅ Database connection tested and confirmed

---

## Phase 3: Remove Mock Data Systems

### 3.1 Files to Update
```
src/app/api/chat/blox-wizard/route.ts - Remove mock responses
src/store/profileStore.ts - Use real user data  
src/store/teamStore.ts - Connect real teams data
src/store/walletStore.ts - Real wallet integration
src/hooks/useAIJourney.ts - Real AI Journey data
```

### 3.2 Files to Delete
```
src/lib/mockData/ - Entire directory
Remove all mock data imports throughout codebase
```

### 3.3 API Routes to Update
- All API endpoints to use real Supabase client
- Remove mock response logic
- Add proper error handling

---

## Phase 4: Implement Chat Wizard Core Services

### 4.1 Transcript Processing Service
**File**: `src/lib/services/blox-wizard/transcript-processor.ts`
- Process curriculum.json videos
- Generate OpenAI embeddings
- Store in Supabase with timestamps

### 4.2 Vector Search Service  
**File**: `src/lib/services/blox-wizard/vector-search.ts`
- Semantic search using pgvector
- Target <500ms response times
- Multi-video result ranking

### 4.3 Response Generator
**File**: `src/lib/services/blox-wizard/response-generator.ts`
- GPT-4o-mini integration
- Educational response formatting
- Video reference generation

### 4.4 Update Chat API
**File**: `src/app/api/chat/blox-wizard/route.ts`
- Connect to vector search
- Real AI response generation
- Video reference formatting
- Question caching foundation

---

## Phase 5: Testing & Verification

### 5.1 Database Testing
```sql
-- Test pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Test search function
SELECT * FROM search_transcript_chunks('[test_embedding]'::vector, 0.7, 5);
```

### 5.2 Service Testing
- Process 2-3 sample videos
- Test vector search functionality
- Verify response generation
- Check video reference formatting

### 5.3 End-to-End Testing
- Test chat interface with real data
- Verify all mock flags are disabled
- Check response times
- Validate error handling

---

## Success Criteria

- [ ] All mock data flags set to false
- [ ] Real Supabase connection established
- [ ] Chat Wizard schema applied to cloud database
- [ ] All mock data files removed
- [ ] Core Chat Wizard services implemented
- [ ] Chat API returns real responses with video references
- [ ] End-to-end chat flow works with real data
- [ ] Response times meet targets (<3s total, <500ms search)

---

## Required Information (User to Provide)

```bash
# Supabase Cloud Credentials
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI Credentials  
OPENAI_API_KEY=
```

---

## Benefits of This Migration

✅ **Single Source of Truth** - All data in Supabase cloud
✅ **No Sync Issues** - Direct cloud connection eliminates local/cloud conflicts
✅ **Production Ready** - Same environment for development and production
✅ **Team Collaboration** - Everyone works with same live database
✅ **Real-time Features** - Leverage Supabase's real-time capabilities
✅ **Scalability** - Cloud infrastructure handles growth automatically

---

**Next Steps**: Begin implementation starting with Phase 1 environment updates, then proceed through each phase systematically.

*Task documented by: Senior Developer*  
*Implementation Priority: Complete before any other Chat Wizard tasks*