Blox Wizard Implementation Plan.md
# 🧙‍♂️ Blox Wizard - AI Assistant Implementation Plan

## 📋 **Project Overview**

**Blox Wizard** is an intelligent AI chatbot that will provide contextual assistance to Blox Buddy users by leveraging transcripts from 100+ YouTube videos in the curriculum. Users can ask questions and receive answers with direct video references and timestamps for easy navigation.

### **Key Features**
- **Smart Video Matching**: AI-powered search through video transcripts
- **Timestamp Precision**: Direct links to relevant video moments
- **Premium Model**: $4.99/month after free trial (3-5 questions)
- **N8N Integration**: Backend workflow for chat memory and processing
- **Seamless UI**: Integrated chat widget matching Blox Buddy design

---

## 🎯 **Implementation Phases**

### **Phase 1: Backend Infrastructure (8-10 hours)**

#### **1.1 YouTube Transcript Collection & Processing (3-4 hours)**

**Objective**: Build a system to collect and process transcripts from all curriculum videos

**Tasks**:
- [ ] **YouTube API Integration**
  - Set up YouTube Data API v3 credentials
  - Create transcript extraction service
  - Handle rate limiting and error scenarios

- [ ] **Transcript Processing Pipeline**
  ```javascript
  // API endpoint: /api/transcripts/sync
  const transcriptProcessor = {
    extractTranscripts: async (videoIds) => {
      // Use youtube-transcript npm package
      // Format: [{text, start, duration}]
    },
    createEmbeddings: async (transcriptText) => {
      // OpenAI embeddings API
      // Store as vectors for semantic search
    },
    linkToCurriculum: async (transcript, videoId) => {
      // Match to curriculum.json structure
      // Maintain video metadata relationships
    }
  }
  ```

- [ ] **Database Schema Design**
  ```sql
  -- New tables for transcript storage
  CREATE TABLE video_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id TEXT, -- Links to curriculum.json video IDs
    youtube_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    transcript_text TEXT NOT NULL,
    segments JSONB NOT NULL, -- [{start_time, end_time, text, embedding_chunk}]
    full_embedding VECTOR(1536), -- OpenAI ada-002 embeddings
    metadata JSONB, -- {duration, thumbnail_url, module_id, week_id, day_id}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX idx_video_transcripts_youtube_id ON video_transcripts(youtube_id);
  CREATE INDEX idx_video_transcripts_embedding ON video_transcripts USING ivfflat (full_embedding vector_cosine_ops);
  ```

#### **1.2 N8N Workflow Setup (2-3 hours)**

**Objective**: Create backend workflows for chat processing and memory management

**N8N Workflow Components**:

1. **Chat Memory Management Workflow**
   - [ ] **User Session Tracking**
     - Store conversation history per user
     - Maintain context window (last 10 messages)
     - Session persistence across browser refreshes

   - [ ] **Usage Tracking**
     - Free trial counter (3-5 daily questions)
     - Premium subscription validation
     - Rate limiting implementation

2. **AI Processing Pipeline Workflow**
   - [ ] **Question Analysis**
     - Extract intent and keywords from user questions
     - Determine question complexity and scope
     - Route to appropriate processing branch

   - [ ] **Vector Similarity Search**
     - Convert user question to embeddings
     - Search transcript database for relevant matches
     - Rank results by relevance score

   - [ ] **Response Generation**
     - Send context + question to OpenAI/Claude API
     - Format response with video references
     - Include suggested follow-up questions

3. **Response Formatting Workflow**
   ```javascript
   // N8N response structure
   const responseFormat = {
     answer: "Detailed explanation of the concept...",
     videoReferences: [
       {
         title: "Roblox Studio 2024 Complete Beginner Guide",
         youtubeId: "dQw4w9WgXcQ",
         timestamp: "15:30",
         relevantSegment: "This section covers workspace customization...",
         thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
         confidence: 0.89
       }
     ],
     suggestedQuestions: [
       "How do I customize the Studio interface?",
       "What are the new 2024 Studio features?"
     ],
     responseTime: "2.3s",
     usageRemaining: 2 // For free tier users
   }
   ```

#### **1.3 Database Schema Extension (1 hour)**

**Additional Tables**:
```sql
-- Chat session management
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  session_data JSONB NOT NULL DEFAULT '{"messages": [], "context": {}}',
  usage_count INTEGER DEFAULT 0,
  daily_usage_count INTEGER DEFAULT 0,
  last_usage_date DATE DEFAULT CURRENT_DATE,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage analytics
CREATE TABLE wizard_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  question TEXT NOT NULL,
  response_time_ms INTEGER,
  videos_referenced INTEGER,
  user_satisfaction INTEGER, -- 1-5 rating
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **Phase 2: Enhanced UI Components (4-5 hours)**

#### **2.1 Build New Chat Components (2-3 hours)**

**Note**: Starting fresh since previous implementation crashed

**Components to Create**:

1. **`BloxWizardWidget.tsx`** - Main chat interface
   ```typescript
   interface BloxWizardWidgetProps {
     isOpen: boolean;
     onToggle: () => void;
     userPremiumStatus: boolean;
     remainingQuestions?: number;
   }
   
   // Features:
   - Floating chat button (bottom-right)
   - Expandable chat window
   - Message history
   - Video reference cards
   - Premium upgrade prompts
   - Sample question suggestions
   ```

2. **`VideoReferenceCard.tsx`** - Display video suggestions
   ```typescript
   interface VideoReference {
     title: string;
     youtubeId: string;
     timestamp: string;
     relevantSegment: string;
     thumbnailUrl: string;
     confidence: number;
   }
   
   // Features:
   - Video thumbnail display
   - Clickable timestamp links
   - Confidence indicator
   - "Jump to video" button
   - Relevance snippet preview
   ```

3. **`ChatMessage.tsx`** - Enhanced message display
   ```typescript
   // Enhanced features:
   - User/AI message differentiation
   - Video reference integration
   - Timestamp formatting
   - Copy message functionality
   - Loading states for AI responses
   ```

4. **`SampleQuestions.tsx`** - Quick-start suggestions
   ```typescript
   const sampleQuestions = [
     "How do I create a teleport script?",
     "What's the best way to handle player data?",
     "How do I make a GUI that follows the player?",
     "Show me how to use TweenService",
     "What are the new 2024 Roblox Studio features?"
   ];
   ```

#### **2.2 Premium Integration Components (1-2 hours)**

1. **`PremiumGate.tsx`** - Usage limiting
   ```typescript
   interface PremiumGateProps {
     remainingQuestions: number;
     onUpgrade: () => void;
     isBlocked: boolean;
   }
   
   // Features:
   - Usage counter display
   - Premium benefits list
   - Upgrade CTA button
   - Trial exhaustion handling
   ```

2. **`WizardUpgradeModal.tsx`** - Subscription flow
   ```typescript
   // Integration with existing Stripe system
   // $4.99/month subscription
   // Benefits highlighting
   // Payment form integration
   ```

#### **2.3 Navigation Integration (30 minutes)**

- [ ] **Add to Sidebar Navigation**
  ```typescript
  // Add to existing navigation in layout/Sidebar.tsx
  {
    name: 'Blox Wizard',
    href: '/ai-assistant',
    icon: Bot,
    badge: 'AI', // New feature badge
    isPremium: true
  }
  ```

- [ ] **Floating Widget Integration**
  - Add to main app layout
  - Position in bottom-right corner
  - Integrate with existing theme

---

### **Phase 3: AI Logic & Response System (6-8 hours)**

#### **3.1 Intelligent Video Matching System (3-4 hours)**

**Core Matching Algorithm**:
```typescript
interface VideoMatcher {
  semanticSearch: (question: string) => Promise<VideoMatch[]>;
  keywordExtraction: (question: string) => string[];
  contextAwareRanking: (matches: VideoMatch[], userContext: UserContext) => VideoMatch[];
  timestampPrecision: (match: VideoMatch, question: string) => string;
}

interface VideoMatch {
  videoId: string;
  title: string;
  relevanceScore: number;
  matchedSegments: TranscriptSegment[];
  suggestedTimestamp: string;
  contextSnippet: string;
}
```

**Implementation Tasks**:
- [ ] **Vector Similarity Search**
  - Implement cosine similarity matching
  - Set relevance threshold (0.7+ for high confidence)
  - Handle multiple video matches

- [ ] **Keyword Extraction & Matching**
  - Extract technical terms from questions
  - Match against video titles and descriptions
  - Boost relevance for exact keyword matches

- [ ] **Context-Aware Ranking**
  - Consider user's current module/week
  - Boost recently watched videos
  - Prioritize beginner vs advanced content

- [ ] **Timestamp Precision**
  - Analyze transcript segments for best match
  - Calculate optimal start time for user
  - Provide 30-second context window

#### **3.2 Response Generation System (2-3 hours)**

**AI Prompt Engineering**:
```typescript
const systemPrompt = `
You are Blox Wizard, an AI assistant for Roblox game development learning.
You help users by providing clear explanations and directing them to specific 
video content with precise timestamps.

Guidelines:
- Be encouraging and supportive for young developers
- Use simple, clear language appropriate for teens
- Always reference specific videos when possible
- Provide actionable next steps
- Encourage hands-on practice

Context: User is currently in ${currentModule} studying ${currentTopic}
Available videos: ${relevantVideos}
`;
```

**Response Processing**:
- [ ] **Answer Generation**
  - Clear, age-appropriate explanations
  - Step-by-step instructions when needed
  - Encouraging tone for young developers

- [ ] **Video Reference Integration**
  - Smart timestamp suggestions
  - Multiple video options when relevant
  - Confidence scoring for recommendations

- [ ] **Follow-up Question Generation**
  - Context-aware suggestions
  - Progressive learning path recommendations
  - Related topic exploration

#### **3.3 Context Integration System (1-2 hours)**

**User Context Tracking**:
```typescript
interface UserContext {
  currentModule: string;
  currentWeek: string;
  currentDay: string;
  completedVideos: string[];
  recentlyWatched: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredTopics: string[];
  chatHistory: Message[];
}
```

**Implementation**:
- [ ] **Progress Integration**
  - Read from existing learning progress system
  - Adjust recommendations based on completion
  - Suggest next logical steps

- [ ] **Chat Memory**
  - Maintain conversation context
  - Reference previous questions
  - Build on earlier explanations

- [ ] **Personalization**
  - Learn user preferences over time
  - Adapt explanation complexity
  - Remember successful video recommendations

---

### **Phase 4: API Integration & Backend (3-4 hours)**

#### **4.1 API Endpoint Development (1-2 hours)**

**Main Chat Endpoint**:
```typescript
// /api/chat/blox-wizard
export async function POST(request: Request) {
  const { message, userId, sessionId } = await request.json();
  
  try {
    // 1. Validate user premium status and usage limits
    const userStatus = await validateUserStatus(userId);
    
    // 2. Process question through N8N workflow
    const response = await processQuestionThroughN8N({
      message,
      userId,
      sessionId,
      userContext: userStatus.context
    });
    
    // 3. Update usage tracking
    await updateUsageTracking(userId, response.responseTime);
    
    // 4. Return formatted response
    return Response.json({
      answer: response.answer,
      videoReferences: response.videoReferences,
      suggestedQuestions: response.suggestedQuestions,
      usageRemaining: userStatus.remainingQuestions,
      responseTime: response.responseTime
    });
    
  } catch (error) {
    return Response.json({ error: 'Failed to process question' }, { status: 500 });
  }
}
```

**Supporting Endpoints**:
- [ ] **`/api/wizard/usage`** - Get user usage stats
- [ ] **`/api/wizard/upgrade`** - Handle premium upgrades
- [ ] **`/api/wizard/feedback`** - Collect user feedback
- [ ] **`/api/transcripts/search`** - Direct transcript search

#### **4.2 N8N Workflow Integration (1-2 hours)**

**Workflow Connection**:
```typescript
const n8nClient = {
  async processChat(data: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${N8N_WEBHOOK_URL}/blox-wizard-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    return response.json();
  },
  
  async updateMemory(sessionId: string, message: Message): Promise<void> {
    await fetch(`${N8N_WEBHOOK_URL}/blox-wizard-memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message })
    });
  }
};
```

#### **4.3 Error Handling & Resilience (30 minutes)**

- [ ] **Graceful Degradation**
  - Fallback responses when AI is unavailable
  - Basic keyword matching as backup
  - Clear error messages for users

- [ ] **Rate Limiting**
  - Implement request throttling
  - Queue management for high traffic
  - Premium user prioritization

---

### **Phase 5: Premium Features & Monetization (2-3 hours)**

#### **5.1 Subscription Integration (1-2 hours)**

**Premium Features**:
- ✅ Unlimited questions per day
- ✅ Priority response times
- ✅ Advanced video recommendations
- ✅ Chat history preservation
- ✅ Personalized learning suggestions

**Stripe Integration**:
```typescript
// Use existing Stripe setup from project
const BLOX_WIZARD_PRICE_ID = 'price_bloxwizard_monthly_499';

const createSubscription = async (userId: string) => {
  const session = await stripe.checkout.sessions.create({
    customer: userId,
    payment_method_types: ['card'],
    line_items: [{
      price: BLOX_WIZARD_PRICE_ID,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_URL}/wizard/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/wizard/cancel`,
  });
  
  return session.url;
};
```

#### **5.2 Usage Tracking & Analytics (1 hour)**

**Metrics to Track**:
- Daily/monthly active users
- Question categories and frequency
- Video click-through rates
- User satisfaction scores
- Conversion from free to premium

**Analytics Dashboard** (Future enhancement):
- Usage patterns visualization
- Popular question categories
- Video recommendation effectiveness
- Revenue metrics

---

### **Phase 6: Testing & Quality Assurance (2-3 hours)**

#### **6.1 Functional Testing (1-2 hours)**

**Test Scenarios**:
- [ ] **Question Processing**
  - Simple questions: "How do I make a script?"
  - Complex questions: "How do I create a multiplayer teleport system with cooldowns?"
  - Edge cases: Gibberish, non-Roblox questions

- [ ] **Video Matching Accuracy**
  - Verify timestamp precision
  - Check relevance scoring
  - Test multiple video recommendations

- [ ] **Premium Flow**
  - Free trial exhaustion
  - Upgrade process
  - Premium feature access

#### **6.2 Performance Testing (30 minutes)**

**Benchmarks**:
- Response time < 3 seconds
- Concurrent user handling
- Database query optimization
- N8N workflow performance

#### **6.3 User Experience Testing (30 minutes)**

- [ ] **UI Responsiveness**
  - Mobile compatibility
  - Chat widget behavior
  - Loading states and animations

- [ ] **Integration Testing**
  - Sidebar navigation
  - Video player integration
  - Progress tracking compatibility

---

## 🎨 **UI/UX Design Specifications**

### **Chat Widget Design**
- **Position**: Fixed bottom-right corner
- **Colors**: Match existing Blox Buddy theme (teal accents, dark blue background)
- **Size**: 400px wide × 600px tall when expanded
- **Animation**: Smooth expand/collapse with Framer Motion

### **Video Reference Cards**
```css
.video-reference-card {
  background: glass-card effect with teal tint;
  border: 1px solid rgba(54, 176, 217, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin: 8px 0;
}

.timestamp-link {
  color: #36B0D9;
  font-weight: 600;
  cursor: pointer;
  hover: glow effect;
}
```

### **Premium Upgrade Modal**
- Match existing upgrade components
- Highlight key benefits
- Clear pricing display
- One-click upgrade flow

---

## 📊 **Success Metrics & KPIs**

### **Technical Metrics**
- **Response Accuracy**: 90%+ relevant video matches
- **Response Time**: <3 seconds average
- **Uptime**: 99.9% availability
- **User Satisfaction**: 4.5+ stars average

### **Business Metrics**
- **Free-to-Premium Conversion**: Target 15%
- **Daily Active Users**: Track engagement
- **Question Volume**: Monitor usage patterns
- **Revenue Impact**: Monthly recurring revenue

### **User Experience Metrics**
- **Video Click-through Rate**: Track video engagement
- **Session Duration**: Average chat session length
- **Return Usage**: Users coming back for more questions
- **Feature Discovery**: How users find the wizard

---

## 🚀 **Implementation Timeline**

### **Week 1: Backend Foundation**
- **Days 1-2**: Transcript collection system
- **Days 3-4**: N8N workflow setup
- **Day 5**: Database schema and API endpoints

### **Week 2: Frontend & Integration**
- **Days 1-2**: UI components development
- **Days 3-4**: AI logic and response system
- **Day 5**: Premium features and testing

### **Total Estimated Time: 20-25 hours**

---

## 🔧 **Technical Requirements**

### **Dependencies to Add**
```json
{
  "youtube-transcript": "^1.0.6",
  "openai": "^4.0.0",
  "@supabase/vecs": "^0.1.0",
  "pg-vector": "^0.1.0"
}
```

### **Environment Variables**
```env
# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# N8N Integration
N8N_WEBHOOK_URL=your_n8n_webhook_url
N8N_API_KEY=your_n8n_api_key

# Blox Wizard Settings
BLOX_WIZARD_FREE_DAILY_LIMIT=5
BLOX_WIZARD_PREMIUM_PRICE=499
```

### **Database Extensions**
```sql
-- Enable vector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 📝 **Next Steps**

1. **Review and approve this implementation plan**
2. **Set up development environment with required APIs**
3. **Begin with Phase 1: Backend Infrastructure**
4. **Create project milestone tracking**
5. **Establish testing protocols**

---

## 💡 **Future Enhancements**

### **Phase 2 Features** (Post-Launch)
- **Voice Chat**: Audio input/output capabilities
- **Screen Sharing**: Visual debugging assistance
- **Code Analysis**: Upload and review user scripts
- **Learning Path Integration**: Personalized curriculum recommendations
- **Community Features**: Share popular Q&As

### **Advanced AI Features**
- **Multi-modal Understanding**: Image and video input
- **Code Generation**: Create scripts based on descriptions
- **Project Planning**: Help users plan game development projects
- **Debugging Assistant**: Analyze error messages and provide solutions

---

*This implementation plan provides a comprehensive roadmap for building the Blox Wizard AI Assistant. The phased approach ensures steady progress while maintaining quality and user experience standards.*
```

Perfect! I've now created the actual **Blox Wizard Implementation Plan.md** file in your `docs` directory. The comprehensive plan includes:

✅ **6 detailed implementation phases**
✅ **Complete technical specifications**
✅ **Database schemas and API designs**
✅ **UI/UX components and styling**
✅ **N8N workflow integration**
✅ **Premium subscription model ($4.99/month)**
✅ **Timeline and resource estimates (20-25 hours)**
✅ **Success metrics and testing protocols**

