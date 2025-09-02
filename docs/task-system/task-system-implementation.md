# Practice Task System Implementation Guide

**Author**: Senior Developer  
**Date**: September 1, 2025  
**Version**: 1.0  
**Status**: Ready for Implementation

## Executive Summary

This document outlines the complete implementation plan for the Practice Task System, a comprehensive learning reinforcement feature that combines AI-generated content reviews with interactive note-taking capabilities. The system will provide students with a structured way to review daily content, take notes, and document their progress through screenshots and visual materials.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Design](#architecture-design)
3. [Component Specifications](#component-specifications)
4. [Implementation Phases](#implementation-phases)
5. [Technical Requirements](#technical-requirements)
6. [API Integrations](#api-integrations)
7. [Data Models](#data-models)
8. [User Flow](#user-flow)
9. [Development Tasks](#development-tasks)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Checklist](#deployment-checklist)

---

## System Overview

### Purpose
The Practice Task System transforms the existing simple practice task strings into a full-featured learning experience that:
- Provides AI-generated summaries of daily video content
- Offers an interactive canvas for note-taking and mind mapping
- Supports multimedia content (screenshots, images, diagrams)
- Persists student work across sessions
- Tracks completion and progress

### Core Features
1. **AI Content Review**: Automated generation of video summaries and key learning points
2. **Interactive Whiteboard**: TLDraw-based canvas for notes and visual content
3. **Media Support**: Drag-and-drop and paste support for images
4. **Persistence**: Auto-save functionality with cloud backup
5. **Progress Tracking**: Integration with existing learning progress system

---

## Architecture Design

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├───────────────────────────┬─────────────────────────────────┤
│   PracticeTaskView        │      WhiteboardCanvas           │
│   Component               │      (TLDraw Integration)       │
├───────────────────────────┴─────────────────────────────────┤
│                      Service Layer                          │
├─────────────────┬──────────────────┬───────────────────────┤
│  AI Review      │  Storage         │  Progress             │
│  Service        │  Service         │  Service              │
├─────────────────┴──────────────────┴───────────────────────┤
│                      Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Supabase       │  LocalStorage    │  OpenAI API           │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 14, React, TypeScript
- **Canvas**: TLDraw v2
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand
- **Storage**: Supabase (primary), LocalStorage (fallback)
- **AI**: OpenAI API (GPT-4 for summaries)

---

## Component Specifications

### 1. PracticeTaskView Component
**Location**: `src/components/learning/PracticeTaskView.tsx`

```typescript
interface PracticeTaskViewProps {
  day: Day
  moduleId: string
  weekId: string
  dayId: string
  onComplete?: () => void
  onBack?: () => void
}

interface PracticeTaskViewFeatures {
  // Header Section
  - Day title and navigation breadcrumbs
  - Back to day overview button
  - Completion status indicator
  
  // AI Review Section
  - Collapsible card with day overview
  - Bullet-point list of key concepts
  - Loading state for AI generation
  - Cache indicator
  
  // Whiteboard Section
  - Full-width TLDraw canvas (min-height: 600px)
  - Toolbar with essential tools
  - Auto-save indicator
  - Export options (PNG, JSON)
  
  // Footer Section
  - Mark as complete button
  - Progress save confirmation
}
```

### 2. Practice Task Route
**Location**: `src/app/(app)/learning/[moduleId]/[weekId]/[dayId]/practice/page.tsx`

```typescript
// Server Component
export default async function PracticeTaskPage({ params }) {
  // 1. Fetch day data from curriculum
  // 2. Check for cached AI review
  // 3. Generate review if needed
  // 4. Load saved whiteboard state
  // 5. Render PracticeTaskView
}
```

### 3. AI Review Service
**Location**: `src/lib/services/aiReview.ts`

```typescript
interface AIReviewService {
  generateDayReview(day: Day): Promise<DayReview>
  getCachedReview(dayId: string): DayReview | null
  formatBulletPoints(videos: Video[]): string[]
  generateOverview(videos: Video[], practiceTask: string): string
}

interface DayReview {
  dayId: string
  overview: string
  keyPoints: string[]
  generatedAt: Date
  model: string
}
```

### 4. Enhanced Whiteboard Integration
**Location**: `src/components/whiteboard/PracticeWhiteboard.tsx`

```typescript
interface PracticeWhiteboardProps {
  boardId: string  // Format: `practice-${moduleId}-${weekId}-${dayId}`
  onAutoSave: (data: TLStoreSnapshot) => void
  initialData?: TLStoreSnapshot
}

// Features to implement:
// - Paste image from clipboard
// - Drag and drop files
// - Auto-save every 30 seconds
// - Quick actions toolbar
// - Export functionality
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Days 1-2)
- [ ] Create practice route and page component
- [ ] Set up basic PracticeTaskView layout
- [ ] Update navigation from "Start Day" button
- [ ] Create data models and types

### Phase 2: AI Integration (Days 3-4)
- [ ] Implement AI review service
- [ ] Set up OpenAI API integration
- [ ] Create review caching system
- [ ] Design review UI components

### Phase 3: Whiteboard Integration (Days 5-6)
- [ ] Adapt WhiteboardCanvas for practice tasks
- [ ] Implement auto-save functionality
- [ ] Add image paste/drop support
- [ ] Create unique board IDs per day

### Phase 4: Persistence & Progress (Days 7-8)
- [ ] Implement storage service
- [ ] Create Supabase tables for practice data
- [ ] Update learning progress tracking
- [ ] Add completion states

### Phase 5: Polish & Testing (Days 9-10)
- [ ] UI/UX refinements
- [ ] Error handling and loading states
- [ ] Performance optimization
- [ ] End-to-end testing

---

## Technical Requirements

### Data Models

```typescript
// Update existing Day interface
interface Day {
  id: string
  title: string
  videos: Video[]
  practiceTask?: string | PracticeTask  // Enhanced from string
  estimatedTime?: string
  review?: DayReview  // Cached AI review
}

// New PracticeTask interface
interface PracticeTask {
  id: string
  title: string
  description: string
  dayOverview?: string     // AI-generated
  keyPoints?: string[]     // AI-extracted
  whiteboardId?: string    // Link to saved canvas
  completedAt?: Date
  resources?: string[]
}

// Whiteboard save data
interface PracticeWhiteboardData {
  id: string
  userId: string
  dayId: string
  snapshot: TLStoreSnapshot
  createdAt: Date
  updatedAt: Date
  thumbnailUrl?: string
}

// Progress tracking
interface PracticeProgress {
  id: string
  userId: string
  dayId: string
  startedAt: Date
  completedAt?: Date
  timeSpent: number  // in seconds
  whiteboardSaves: number
  aiReviewViewed: boolean
}
```

### Database Schema (Supabase)

```sql
-- Practice task reviews table
CREATE TABLE practice_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id VARCHAR(255) NOT NULL UNIQUE,
  overview TEXT NOT NULL,
  key_points JSONB NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  model VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Practice whiteboards table
CREATE TABLE practice_whiteboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  day_id VARCHAR(255) NOT NULL,
  snapshot JSONB NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, day_id)
);

-- Practice progress table
CREATE TABLE practice_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  day_id VARCHAR(255) NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  time_spent INTEGER DEFAULT 0,
  whiteboard_saves INTEGER DEFAULT 0,
  ai_review_viewed BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, day_id)
);
```

---

## User Flow

### Primary User Journey

```
1. Student views Week Overview
   ↓
2. Clicks "Start Day X" button
   ↓
3. Navigates to /learning/[module]/[week]/[day]/practice
   ↓
4. Page loads with:
   - AI review (generated or cached)
   - Empty or saved whiteboard
   ↓
5. Student reads AI review
   - Overview paragraph
   - Key points from videos
   ↓
6. Student takes notes on whiteboard
   - Types text notes
   - Pastes screenshots
   - Draws diagrams
   - Creates mind maps
   ↓
7. Auto-save triggers every 30 seconds
   ↓
8. Student clicks "Mark as Complete"
   ↓
9. Progress saved and redirects to day overview
```

### Alternative Flows

**Returning Student**:
1. Clicks "Continue Day X"
2. Loads saved whiteboard state
3. Continues where they left off

**Review Mode**:
1. Clicks "Review Day X" (completed)
2. Views AI review and past notes
3. Can still edit/export whiteboard

---

## Development Tasks

### Backend Tasks

1. **API Routes**
   - [ ] `POST /api/practice/generate-review` - Generate AI review
   - [ ] `GET /api/practice/review/[dayId]` - Get cached review
   - [ ] `POST /api/practice/whiteboard/save` - Save whiteboard
   - [ ] `GET /api/practice/whiteboard/[dayId]` - Load whiteboard
   - [ ] `POST /api/practice/progress` - Update progress

2. **Services**
   - [ ] Implement OpenAI integration service
   - [ ] Create review caching logic
   - [ ] Build whiteboard storage service
   - [ ] Update progress tracking service

3. **Database**
   - [ ] Create Supabase migrations
   - [ ] Set up Row Level Security
   - [ ] Create indexes for performance

### Frontend Tasks

1. **Components**
   - [ ] Build PracticeTaskView layout
   - [ ] Create AIReviewCard component
   - [ ] Adapt WhiteboardCanvas
   - [ ] Build progress indicators
   - [ ] Add loading states

2. **State Management**
   - [ ] Update learningStore for practice tasks
   - [ ] Create practiceStore for whiteboard state
   - [ ] Implement auto-save logic

3. **Routing**
   - [ ] Create practice route
   - [ ] Update navigation logic
   - [ ] Handle back navigation

### Integration Tasks

1. **AI Service**
   - [ ] Set up OpenAI API key
   - [ ] Implement prompt engineering
   - [ ] Add error handling
   - [ ] Create fallback content

2. **Storage**
   - [ ] Configure Supabase client
   - [ ] Implement file upload for images
   - [ ] Set up CDN for thumbnails

---

## API Integrations

### OpenAI API Integration

```typescript
// src/lib/services/openai.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateDayReview(videos: Video[], practiceTask: string) {
  const prompt = `
    You are an educational assistant for a Roblox game development course.
    
    Given these videos watched today:
    ${videos.map(v => `- "${v.title}" by ${v.creator} (${v.duration})`).join('\n')}
    
    And this practice task: "${practiceTask}"
    
    Generate:
    1. A 2-3 sentence overview of what was learned today
    2. 5-7 key bullet points of important concepts
    
    Format as JSON with 'overview' and 'keyPoints' fields.
  `
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

### TLDraw Configuration

```typescript
// src/components/whiteboard/practiceConfig.ts
export const practiceWhiteboardConfig = {
  tools: [
    'select',
    'draw',
    'text',
    'note',
    'arrow',
    'rectangle',
    'ellipse'
  ],
  features: {
    paste: true,
    dragDrop: true,
    export: true,
    autoSave: true
  },
  theme: {
    background: '#001D39',  // Blox dark blue
    gridColor: '#002246'
  }
}
```

---

## Testing Strategy

### Unit Tests
- [ ] AI review generation
- [ ] Whiteboard save/load
- [ ] Progress tracking
- [ ] Data transformations

### Integration Tests
- [ ] Complete user flow
- [ ] Auto-save functionality
- [ ] Image upload/paste
- [ ] API error handling

### E2E Tests
- [ ] Start day → Complete practice
- [ ] Resume saved practice
- [ ] Review completed practice
- [ ] Multiple browser support

### Performance Tests
- [ ] Whiteboard with 100+ elements
- [ ] Large image uploads
- [ ] API response times
- [ ] Auto-save intervals

---

## Deployment Checklist

### Environment Variables
```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
PRACTICE_TASK_ENABLED=true
AI_REVIEW_CACHE_TTL=604800  # 7 days in seconds
```

### Pre-deployment
- [ ] Run database migrations
- [ ] Test OpenAI API access
- [ ] Verify Supabase RLS policies
- [ ] Check storage bucket permissions
- [ ] Test in staging environment

### Deployment
- [ ] Deploy backend changes first
- [ ] Deploy frontend with feature flag
- [ ] Monitor error rates
- [ ] Check auto-save functionality
- [ ] Verify AI generation works

### Post-deployment
- [ ] Monitor user engagement
- [ ] Check storage usage
- [ ] Review AI API costs
- [ ] Gather user feedback
- [ ] Plan iterations

---

## Security Considerations

1. **API Keys**: Store securely in environment variables
2. **User Data**: Implement proper RLS in Supabase
3. **File Uploads**: Validate image types and sizes
4. **AI Content**: Filter inappropriate responses
5. **Rate Limiting**: Prevent API abuse

---

## Performance Optimizations

1. **Caching**: Cache AI reviews for 7 days
2. **Lazy Loading**: Load whiteboard on demand
3. **Image Optimization**: Compress uploaded images
4. **Debouncing**: Debounce auto-save calls
5. **CDN**: Serve static assets from CDN

---

## Future Enhancements

### Phase 2 Features (Post-MVP)
- Collaborative whiteboards for team projects
- AI-powered feedback on practice work
- Export notes as PDF study guides
- Integration with Discord for sharing
- Gamification with practice streaks

### Phase 3 Features
- Video timestamp linking in notes
- AI-generated practice exercises
- Peer review system
- Portfolio generation from practice work
- Mobile app support

---

## Implementation Notes for Junior Developer

### Getting Started

1. **Read this entire document first** - Understanding the full scope will help you make better decisions during implementation.

2. **Set up your development environment**:
   ```bash
   # Install dependencies
   npm install @tldraw/tldraw openai
   
   # Set up environment variables
   cp .env.example .env.local
   # Add your API keys
   ```

3. **Start with Phase 1** - Get the basic routing and layout working before adding complex features.

4. **Use existing components** - We already have WhiteboardCanvas and learning components. Adapt them rather than rebuilding.

5. **Test as you go** - Don't wait until the end to test. Each phase should be functional.

### Key Files to Study

Before starting, review these existing files:
- `src/components/whiteboard/WhiteboardCanvas.tsx` - Understand TLDraw integration
- `src/components/learning/DayView.tsx` - Current practice task display
- `src/store/learningStore.ts` - Progress tracking logic
- `src/types/learning.ts` - Current data models

### Common Pitfalls to Avoid

1. **Don't over-engineer** - Start simple, iterate
2. **Handle loading states** - Users should always know what's happening
3. **Save frequently** - Don't lose user work
4. **Cache wisely** - AI calls are expensive
5. **Test edge cases** - What if AI fails? Network is slow?

### Questions to Ask

Before implementing each feature, ask:
- Does this improve the learning experience?
- Is there a simpler way to achieve this?
- How will this scale with more users?
- What happens if this fails?

### Code Style Guidelines

Follow our existing patterns:
- Use TypeScript strictly
- Implement proper error boundaries
- Add loading and error states
- Use our color scheme (blox-* colors)
- Keep components under 200 lines
- Extract reusable logic to hooks

---

## Contact & Support

**Project Lead**: Senior Developer  
**Technical Questions**: Post in #dev-questions channel  
**Design Questions**: Review with UX team first  
**API Issues**: Check with DevOps for keys/limits  

Remember: This is a learning platform. Every feature should enhance the student's learning experience. If you're unsure about an implementation detail, ask for clarification rather than guessing.

Good luck with the implementation! 🚀