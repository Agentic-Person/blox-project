# Blox Chat Wizard Integration Guide

## 🎯 Integration Overview

The Blox Chat Wizard is now fully integrated with our N8n Knowledge Engine workflows! This guide shows you how to set up, configure, and test the complete AI chat system.

## 🏗️ Architecture Flow

```mermaid
sequenceDiagram
    participant UI as BloxChatInterface
    participant API as Next.js API Route
    participant N8N as N8n Integration Service
    participant Orchestrator as Master Orchestrator
    participant Knowledge as Knowledge Engine
    participant Analytics as Analytics Engine
    
    UI->>API: User asks question
    API->>N8N: Create chat request
    N8N->>Orchestrator: Send chat_query event
    Orchestrator->>Knowledge: Route to semantic search
    Knowledge->>Knowledge: Search transcripts & generate answer
    Knowledge->>Orchestrator: Return AI response with citations
    Orchestrator->>N8N: Success response
    N8N->>API: Formatted chat response
    API->>UI: Display answer with video references
    
    Note over N8N,Analytics: Async interaction tracking
    N8N->>Analytics: Track user interaction
```

## 🚀 Quick Setup Steps

### 1. Environment Configuration
Copy the updated `.env.example` to `.env.local` and configure:

```bash
# Essential N8n Configuration
N8N_WEBHOOK_URL="http://localhost:5678"
N8N_API_KEY=""  # Optional for development
N8N_FALLBACK_ENABLED="true"

# AI Services (Required)
OPENAI_API_KEY="sk-your-openai-key-here"
OPENAI_MODEL="gpt-4o-mini"

# Database for N8n (Required for production)
POSTGRES_CONNECTION="postgresql://user:pass@localhost:5432/blox_wizard"
REDIS_URL="redis://localhost:6379"

# Chat Configuration
FREE_USER_QUESTIONS_LIMIT="5"
DEFAULT_RESPONSE_STYLE="detailed"
```

### 2. Start N8n Server
```bash
# Option 1: Docker (Recommended)
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e WEBHOOK_URL=http://localhost:5678 \
  n8nio/n8n

# Option 2: npm
npm install n8n -g
n8n start
```

### 3. Import N8n Workflows
Import in this order:
1. `/shared/error-handler.json`
2. `/shared/state-manager.json`
3. `/orchestrator/master-orchestrator.json`
4. `/knowledge-engine/transcript-indexer.json`
5. `/knowledge-engine/semantic-search.json`
6. `/knowledge-engine/answer-generator.json`
7. `/analytics/interaction-tracker.json`

### 4. Test Integration
```bash
# Start your Next.js app
npm run dev

# Visit http://localhost:3000 and find the Blox Chat component
# Ask a question like "How do I create a script in Roblox?"
```

## 📡 Integration Components

### 1. N8n Integration Service (`/lib/services/n8n-integration.ts`)

**Purpose**: Handles communication between Next.js and N8n workflows

**Key Features**:
- Health checking with automatic fallback
- Request/response transformation
- Error handling and retries
- Direct endpoint access for speed

**Usage Example**:
```typescript
import { createN8nService } from '@/lib/services/n8n-integration'

const n8nService = createN8nService()

// Send chat query
const response = await n8nService.sendChatQuery({
  eventType: 'chat_query',
  userId: 'user_123',
  sessionId: 'session_456',
  data: {
    query: 'How do I create a part?',
    responseStyle: 'beginner'
  },
  timestamp: new Date().toISOString()
})
```

### 2. Session Management (`/lib/utils/session-manager.ts`)

**Purpose**: Manages user chat sessions and conversation history

**Features**:
- Persistent session tracking
- Conversation history management
- User preference storage
- Message satisfaction tracking

**Usage Example**:
```typescript
import { chatSessionManager } from '@/lib/utils/session-manager'

// Get or create session
const session = chatSessionManager.getOrCreateSession('user_123', videoContext)

// Add message to history
chatSessionManager.addMessage(session.id, 'user', 'How do I script?')
```

### 3. Updated Chat API (`/api/chat/blox-wizard/route.ts`)

**New Features**:
- Full N8n integration with fallback to mock responses
- Real-time video context support
- Citation and reference handling
- User interaction tracking

**Request Format**:
```typescript
{
  message: string
  sessionId: string
  userId: string
  videoContext?: {
    videoId: string
    title: string
    youtubeId: string
    transcript?: string
    currentTime?: number
    duration?: string
  }
}
```

**Response Format**:
```typescript
{
  answer: string                    // AI-generated response
  videoReferences: VideoReference[] // Related video tutorials
  citations?: Citation[]            // Source citations from N8n
  suggestedQuestions: string[]      // Follow-up questions
  usageRemaining: number            // For free tier limits
  responseTime: string              // Performance metrics
}
```

### 4. Enhanced Chat Interface (`/components/ai/BloxChatInterface.tsx`)

**New Features**:
- Persistent session management
- Improved error handling
- Video context integration
- Better user feedback

## 🧪 Testing the Integration

### Test 1: Basic Chat Functionality
```bash
# Send a POST request to test the API directly
curl -X POST http://localhost:3000/api/chat/blox-wizard \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I create a script in Roblox?",
    "sessionId": "test_session_123",
    "userId": "test_user"
  }'
```

**Expected Response** (N8n running):
- Should receive AI-generated response with citations
- Response time should be < 5 seconds
- Should include video references

**Expected Response** (N8n not running):
- Should gracefully fallback to mock response
- Response should indicate fallback mode
- No citations, but still helpful content

### Test 2: Video Context Integration
```typescript
// In your React component
const videoContext = {
  videoId: 'intro-to-scripting',
  title: 'Roblox Scripting Basics',
  youtubeId: 'abc123',
  currentTime: 150
}

// Component should pass this context to the API
<BloxChatInterface videoContext={videoContext} />
```

### Test 3: N8n Workflow Health Check
```bash
# Test the N8n health check endpoint
curl -X POST http://localhost:5678/webhook/orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "health_check",
    "userId": "system",
    "sessionId": "health_test",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }'
```

### Test 4: End-to-End Integration
1. Start N8n server: `n8n start`
2. Import all workflows (8 total)
3. Start Next.js: `npm run dev`
4. Open chat interface in browser
5. Ask: "How do I create a script?"
6. Verify you get real AI response with citations

## 🔧 Troubleshooting

### Problem: Chat shows "Fallback mode" message
**Cause**: N8n server not running or workflows not imported
**Solution**: 
1. Check N8n server status: `curl http://localhost:5678/healthz`
2. Verify all 8 workflows are imported and active
3. Check `N8N_WEBHOOK_URL` in `.env.local`

### Problem: "Internal server error" in chat
**Cause**: Missing environment variables or invalid configuration
**Solution**:
1. Check all required env vars are set
2. Verify OpenAI API key is valid
3. Check console logs for specific error details

### Problem: No video references in responses
**Cause**: Transcript database not populated or PGVector extension missing
**Solution**:
1. Run transcript indexer workflow first
2. Ensure PostgreSQL has PGVector extension
3. Check database connection string

### Problem: Slow response times (>10 seconds)
**Cause**: Network issues or N8n workflow bottlenecks
**Solution**:
1. Check N8n workflow execution logs
2. Verify Redis and PostgreSQL are running locally
3. Consider using direct endpoints instead of orchestrator

## 📊 Monitoring & Analytics

### N8n Workflow Monitoring
- Access N8n UI at `http://localhost:5678`
- Monitor execution times in workflow history
- Check error rates by workflow
- Review webhook response times

### Application Analytics
The integration automatically tracks:
- Chat interaction success/failure rates
- Response times and performance metrics
- User satisfaction scores (when implemented)
- Session duration and message counts

### Key Metrics to Watch
- **Response Time**: Should be < 5 seconds for chat queries
- **Fallback Rate**: Should be < 5% in production
- **Error Rate**: Should be < 2% for API calls
- **Citation Quality**: Average relevance score > 0.7

## 🚀 Production Deployment

### 1. N8n Production Setup
```bash
# Docker Compose for production
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_secure_password
      - WEBHOOK_URL=https://your-domain.com
    volumes:
      - n8n_data:/home/node/.n8n
```

### 2. Environment Variables for Production
```bash
# Production N8n Configuration
N8N_WEBHOOK_URL="https://your-n8n-domain.com"
N8N_API_KEY="your_production_api_key"
N8N_FALLBACK_ENABLED="false"  # Disable fallback in production

# Production Database
POSTGRES_CONNECTION="postgresql://user:pass@prod-db:5432/blox_wizard"
REDIS_URL="redis://prod-redis:6379"

# Security
N8N_BASIC_AUTH_ACTIVE="true"
```

### 3. SSL/TLS Setup
- Configure SSL certificates for N8n webhooks
- Update webhook URLs to use HTTPS
- Set up reverse proxy (nginx/Cloudflare) for security

### 4. Scaling Considerations
- Use Redis cluster for session management
- Set up PostgreSQL read replicas for search queries
- Consider multiple N8n instances behind load balancer

## ✅ Integration Checklist

- [ ] N8n server running and accessible
- [ ] All 8 workflows imported and active
- [ ] Environment variables configured
- [ ] Database connections working (PostgreSQL + Redis)
- [ ] OpenAI API key configured and valid
- [ ] Chat interface loads without errors
- [ ] Test chat query returns AI response
- [ ] Fallback mode works when N8n is down
- [ ] Video context integration working
- [ ] Session persistence functional
- [ ] Error handling graceful
- [ ] Performance metrics acceptable (< 5s response)

## 🎉 Success! Your Blox Chat Wizard is Ready

You now have a fully integrated AI chat system that:
- ✅ Uses real AI with N8n Knowledge Engine workflows
- ✅ Searches through video transcripts for accurate answers
- ✅ Provides citations and video references
- ✅ Gracefully handles errors with fallback responses
- ✅ Tracks user sessions and conversation history
- ✅ Supports video context awareness
- ✅ Scales for production deployment

The chat system is now ready for your users to get intelligent, contextual help with their Roblox development questions!