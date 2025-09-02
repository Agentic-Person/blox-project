# Blox Wizard N8n Workflows

This directory contains all N8n workflows for the Blox Wizard Knowledge Engine system.

## 🚀 Quick Start

### 1. Import Order (CRITICAL - Follow Exactly)

Import workflows in this specific order to avoid dependency issues:

```bash
# STEP 1: Foundation Infrastructure (Required First)
1. shared/error-handler.json           # System-wide error management
2. shared/state-manager.json           # User state persistence
3. orchestrator/master-orchestrator.json  # Central event routing

# STEP 2: Knowledge Engine (Core AI Features)
4. knowledge-engine/transcript-indexer.json    # Video transcript processing
5. knowledge-engine/semantic-search.json       # Vector similarity search
6. knowledge-engine/answer-generator.json      # AI response generation

# STEP 3: Additional Engines (Optional but Recommended)
7. scheduler/daily-task-generator.json          # Personalized scheduling
8. analytics/interaction-tracker.json          # User behavior analytics
```

### 2. Environment Variables Required

Before importing, ensure these environment variables are configured in your N8n instance:

```bash
# OpenAI Integration (Required)
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Database Connections (Required)
POSTGRES_CONNECTION=postgresql://user:pass@localhost:5432/blox_wizard
REDIS_URL=redis://localhost:6379

# N8n Configuration (Required)
N8N_WEBHOOK_URL=https://your-n8n-domain.com
N8N_API_KEY=your_n8n_api_key

# Alert Integrations (Optional)
SLACK_ERROR_WEBHOOK_URL=https://hooks.slack.com/services/...
PAGERDUTY_WEBHOOK_URL=https://events.pagerduty.com/...
PAGERDUTY_API_KEY=your_pagerduty_key
PAGERDUTY_ROUTING_KEY=your_routing_key
```

### 3. Database Setup

Run these SQL commands before importing workflows:

```sql
-- Install required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create transcript embeddings table
CREATE TABLE transcript_embeddings (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(255) NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(1536),
    video_title VARCHAR(500),
    youtube_id VARCHAR(50),
    duration VARCHAR(20),
    start_char INTEGER,
    end_char INTEGER,
    chunk_length INTEGER,
    embedding_model VARCHAR(50) DEFAULT 'text-embedding-3-small',
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, chunk_index)
);

-- Create indexes for performance
CREATE INDEX idx_video_id ON transcript_embeddings(video_id);
CREATE INDEX idx_youtube_id ON transcript_embeddings(youtube_id);
CREATE INDEX idx_embedding_similarity ON transcript_embeddings 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create daily tasks table
CREATE TABLE daily_tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    task_date DATE NOT NULL,
    tasks JSONB NOT NULL,
    preferences JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, task_date)
);

-- Create user interactions table
CREATE TABLE user_interactions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    interaction_type VARCHAR(50) NOT NULL,
    interaction_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX idx_daily_tasks_user_date ON daily_tasks(user_id, task_date);
```

## 📁 Workflow Directory Structure

```
n8n/workflows/
├── orchestrator/
│   └── master-orchestrator.json     # Central event routing hub
├── shared/
│   ├── error-handler.json           # System-wide error management  
│   └── state-manager.json           # User state persistence
├── knowledge-engine/
│   ├── transcript-indexer.json      # Video transcript processing
│   ├── semantic-search.json         # Vector similarity search
│   └── answer-generator.json        # AI response generation
├── scheduler/
│   └── daily-task-generator.json    # Personalized learning schedules
├── analytics/
│   └── interaction-tracker.json     # User behavior analytics
└── README.md                        # This file
```

## 🔧 Workflow Details

### Core Infrastructure

#### Master Orchestrator
- **Purpose**: Central event routing for all system interactions
- **Webhook**: `/webhook/orchestrator`
- **Events**: `chat_query`, `user_interaction`, `schedule_request`, `health_check`
- **Features**: Event validation, routing, response formatting
- **Sticky Notes**: 15+ detailed annotations for developers

#### Error Handler  
- **Purpose**: System-wide error detection and management
- **Trigger**: Automatic on any workflow error
- **Severity**: CRITICAL, HIGH, MEDIUM, LOW classification
- **Alerts**: Slack notifications, PagerDuty escalation
- **Features**: Error analysis, resolution suggestions

#### State Manager
- **Purpose**: User context and state persistence
- **Webhook**: `/webhook/state-manager`  
- **Operations**: GET, SET, UPDATE, DELETE state data
- **Storage**: Redis with intelligent TTL management
- **Features**: State merging strategies, conflict resolution

### Knowledge Engine

#### Transcript Indexer
- **Purpose**: Process video transcripts into searchable embeddings
- **Webhook**: `/webhook/transcript-indexer`
- **Process**: Text chunking → OpenAI embeddings → PostgreSQL storage
- **Features**: Duplicate detection, batch processing, cost optimization

#### Semantic Search
- **Purpose**: Vector similarity search through transcript database  
- **Webhook**: `/webhook/semantic-search`
- **Technology**: PGVector with cosine similarity
- **Features**: Query enhancement, relevance scoring, context extraction

#### Answer Generator
- **Purpose**: AI-powered response generation with citations
- **Webhook**: `/webhook/answer-generator`
- **Model**: GPT-4o-mini (temperature: 0.3)
- **Features**: Citation system, response quality scoring, multi-style responses

### Additional Engines

#### Daily Task Generator
- **Purpose**: Personalized learning schedule generation
- **Triggers**: Cron (daily at midnight) + Webhook (`/webhook/generate-schedule`)
- **AI**: GPT-4o-mini for creative scheduling (temperature: 0.7)
- **Features**: Adaptive difficulty, progress-based optimization

#### Interaction Tracker  
- **Purpose**: User behavior analytics and pattern analysis
- **Webhook**: `/webhook/track-interaction`
- **Events**: VIDEO_WATCH, CHAT_QUERY, TASK_COMPLETE, etc.
- **Features**: Real-time analysis, flag detection, security measures

## 🧪 Testing Your Installation

### Test 1: System Health Check
```bash
curl -X POST https://your-n8n-domain.com/webhook/orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "health_check",
    "userId": "test_user",
    "sessionId": "test_session",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }'
```

**Expected Response**: System status with service health information

### Test 2: Knowledge Engine Query
```bash
curl -X POST https://your-n8n-domain.com/webhook/orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "chat_query",
    "userId": "test_user", 
    "sessionId": "test_session",
    "data": {
      "query": "How do I create a script in Roblox Studio?",
      "responseStyle": "beginner"
    },
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }'
```

**Expected Response**: AI-generated answer with video citations

### Test 3: User Interaction Tracking
```bash
curl -X POST https://your-n8n-domain.com/webhook/orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "user_interaction",
    "userId": "test_user",
    "sessionId": "test_session", 
    "data": {
      "interactionType": "VIDEO_WATCH",
      "videoId": "intro-to-scripting",
      "watchTime": 240,
      "completed": true
    },
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }'
```

**Expected Response**: Interaction logged successfully

## 🚨 Troubleshooting

### Common Issues

#### "Workflow import failed"
- **Cause**: Missing dependencies or wrong import order
- **Solution**: Import in exact order specified above, ensure error-handler is first

#### "Database connection failed"
- **Cause**: PostgreSQL not configured or PGVector extension missing
- **Solution**: Install PGVector extension, verify connection string

#### "OpenAI API errors"
- **Cause**: Invalid API key or quota exceeded  
- **Solution**: Verify API key, check usage limits

#### "Redis connection failed"
- **Cause**: Redis server not running or wrong URL
- **Solution**: Start Redis server, verify REDIS_URL

### Performance Optimization

1. **Database Indexes**: Ensure all recommended indexes are created
2. **Redis Memory**: Configure appropriate memory limits and eviction policies  
3. **Connection Pooling**: Set up connection pools for PostgreSQL
4. **Rate Limiting**: Configure OpenAI rate limits based on your quota

## 📊 Monitoring

### Key Metrics to Track
- Response times (target: < 5s for chat queries)
- Error rates (target: < 2%)
- OpenAI token usage and costs
- Database performance and query times
- User interaction patterns

### Log Locations
- N8n execution logs: Check N8n UI under "Executions"
- Error logs: Redis keys matching `error_log:*`
- Metrics: Redis keys matching `error_count:*`

## 🔒 Security Considerations

1. **API Keys**: Store in N8n credentials, never in workflow JSON
2. **Input Validation**: All workflows include XSS protection  
3. **Rate Limiting**: Configure appropriate limits for public endpoints
4. **Database Security**: Use connection pooling, parameterized queries
5. **Error Handling**: Sanitize error messages before displaying to users

## 🤝 Support

For issues with these workflows:
1. Check N8n execution logs for specific errors
2. Verify all environment variables are set correctly  
3. Test database and API connections independently
4. Review the sticky notes in each workflow for troubleshooting tips

Each workflow contains extensive sticky notes with developer annotations, configuration details, and troubleshooting guidance.

---

**Status**: All 8 workflows ready for production deployment
**Version**: 1.0
**Last Updated**: January 2025