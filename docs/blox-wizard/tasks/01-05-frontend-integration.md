# Task 01-05: Frontend Integration & UI Updates  
**Phase 1: Foundation | Week 1**

---

## Task Overview

**Goal**: Update the existing chat interface to work seamlessly with the new Chat Wizard API and display video references properly.

**Estimated Time**: 4-5 hours  
**Priority**: High (user experience)  
**Dependencies**: `01-04-chat-api`

---

## Senior Developer Notes

The existing `BloxChatInterface.tsx` has basic chat functionality, but needs significant updates to handle:
- Video reference cards with thumbnails and timestamps
- Suggested follow-up questions  
- Loading states and error handling
- Session management
- Response time display

**Key UI Requirements**:
- Video cards should be visually appealing and clickable
- Timestamps should be prominent and functional
- Smooth loading animations
- Mobile-responsive design
- Accessibility compliance

---

## Current State Analysis

### Existing Files to Update:
1. `src/components/blox-wizard/BloxChatInterface.tsx` - Main chat component
2. `src/components/blox-wizard/` - Supporting components (create new ones as needed)
3. `src/types/blox-wizard.ts` - Type definitions

### UI Components Needed:
1. **VideoReferenceCard** - Display video with thumbnail and timestamp
2. **SuggestedQuestions** - Show follow-up question buttons  
3. **ChatMessage** - Enhanced message display
4. **LoadingIndicator** - Better loading states
5. **ErrorBoundary** - Graceful error handling

---

## Implementation Steps

### Step 1: Update Type Definitions

First, update `src/types/blox-wizard.ts`:

```typescript
// Add to existing types
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

export interface VideoReference {
  title: string;
  youtubeId: string;
  creator?: string;
  timestamp: string;
  relevantSegment: string;
  thumbnailUrl: string;
  videoUrl: string;
  timestampUrl: string;
  confidence: number;
  duration?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  sessionId: string;
  currentInput: string;
  error: string | null;
  usageRemaining: number;
}
```

### Step 2: Create VideoReferenceCard Component

Create: `src/components/blox-wizard/VideoReferenceCard.tsx`

```typescript
import React from 'react';
import Image from 'next/image';
import { ExternalLink, Clock, User } from 'lucide-react';
import { VideoReference } from '@/types/blox-wizard';

interface VideoReferenceCardProps {
  video: VideoReference;
  index: number;
  onVideoClick?: (video: VideoReference) => void;
}

export function VideoReferenceCard({ video, index, onVideoClick }: VideoReferenceCardProps) {
  const handleClick = () => {
    onVideoClick?.(video);
    // Open video in new tab with timestamp
    window.open(video.timestampUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer"
      onClick={handleClick}
    >
      {/* Video Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg">
        <Image
          src={video.thumbnailUrl}
          alt={`${video.title} thumbnail`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Timestamp Overlay */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {video.timestamp}
        </div>
        
        {/* Confidence Indicator */}
        {video.confidence > 0.8 && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            High Match
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
          {video.title}
        </h3>
        
        {video.creator && (
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <User className="w-3 h-3" />
            {video.creator}
          </div>
        )}
        
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
          {video.relevantSegment}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Click to watch at {video.timestamp}
          </span>
          
          <ExternalLink className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors" />
        </div>
      </div>
      
      {/* Hover Effect */}
      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg" />
    </div>
  );
}
```

### Step 3: Create SuggestedQuestions Component

Create: `src/components/blox-wizard/SuggestedQuestions.tsx`

```typescript
import React from 'react';
import { MessageCircle } from 'lucide-react';

interface SuggestedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

export function SuggestedQuestions({ questions, onQuestionClick }: SuggestedQuestionsProps) {
  if (!questions.length) return null;

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          You might also ask:
        </span>
      </div>
      
      <div className="space-y-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="block w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-md transition-colors"
          >
            "{question}"
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Step 4: Create Enhanced LoadingIndicator

Create: `src/components/blox-wizard/LoadingIndicator.tsx`

```typescript
import React from 'react';
import { Loader2, Search, Brain, Video } from 'lucide-react';

interface LoadingIndicatorProps {
  stage?: 'searching' | 'processing' | 'generating';
  message?: string;
}

export function LoadingIndicator({ stage = 'searching', message }: LoadingIndicatorProps) {
  const getStageInfo = () => {
    switch (stage) {
      case 'searching':
        return {
          icon: Search,
          text: 'Searching through video transcripts...',
          color: 'text-blue-500'
        };
      case 'processing':
        return {
          icon: Brain,
          text: 'Processing your question with AI...',
          color: 'text-green-500'
        };
      case 'generating':
        return {
          icon: Video,
          text: 'Generating response with video references...',
          color: 'text-purple-500'
        };
      default:
        return {
          icon: Loader2,
          text: 'Loading...',
          color: 'text-gray-500'
        };
    }
  };

  const { icon: Icon, text, color } = getStageInfo();

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <Icon className={`w-5 h-5 animate-spin ${color}`} />
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {message || text}
      </span>
    </div>
  );
}
```

### Step 5: Update Main Chat Interface

Update `src/components/blox-wizard/BloxChatInterface.tsx`:

```typescript
import React, { useState, useRef, useCallback } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { VideoReferenceCard } from './VideoReferenceCard';
import { SuggestedQuestions } from './SuggestedQuestions';
import { LoadingIndicator } from './LoadingIndicator';
import { ChatMessage, ChatState, VideoReference } from '@/types/blox-wizard';
import { v4 as uuidv4 } from 'uuid';

export function BloxChatInterface() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    sessionId: uuidv4(),
    currentInput: '',
    error: null,
    usageRemaining: 100
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [chatState.messages, scrollToBottom]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || chatState.isLoading) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      type: 'user',
      message: message.trim(),
      timestamp: new Date()
    };

    // Add user message and show loading
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      currentInput: '',
      error: null
    }));

    try {
      const response = await fetch('/api/chat/blox-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          sessionId: chatState.sessionId,
          userId: 'user-id', // TODO: Get from auth context
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const botMessage: ChatMessage = {
        id: uuidv4(),
        type: 'bot',
        message: data.answer,
        timestamp: new Date(),
        videoReferences: data.videoReferences,
        suggestedQuestions: data.suggestedQuestions,
        responseTime: data.responseTime
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, botMessage],
        isLoading: false,
        usageRemaining: data.usageRemaining
      }));

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        type: 'bot',
        message: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
        error: error.message
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false,
        error: error.message
      }));
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatState.currentInput.trim()) {
      handleSendMessage(chatState.currentInput);
    }
  };

  const handleQuestionClick = (question: string) => {
    setChatState(prev => ({ ...prev, currentInput: question }));
    handleSendMessage(question);
  };

  const handleVideoClick = (video: VideoReference) => {
    // Analytics tracking could go here
    console.log('Video clicked:', video.title, 'at', video.timestamp);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <Sparkles className="w-6 h-6 text-blue-500" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Blox Wizard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI assistant for Roblox development
          </p>
        </div>
        <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {chatState.usageRemaining} queries remaining
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {chatState.messages.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Welcome to Blox Wizard!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Ask me anything about Roblox development! I can search through all our educational videos to help you learn.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleQuestionClick("How do I create my first script?")}
                className="block mx-auto text-blue-600 dark:text-blue-400 hover:underline"
              >
                "How do I create my first script?"
              </button>
              <button
                onClick={() => handleQuestionClick("What are RemoteEvents and how do I use them?")}
                className="block mx-auto text-blue-600 dark:text-blue-400 hover:underline"
              >
                "What are RemoteEvents and how do I use them?"
              </button>
            </div>
          </div>
        )}

        {chatState.messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'} rounded-lg p-4`}>
              <div className="whitespace-pre-wrap">{msg.message}</div>
              
              {msg.responseTime && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Responded in {msg.responseTime}ms
                </div>
              )}

              {/* Video References */}
              {msg.videoReferences && msg.videoReferences.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">
                    Referenced Videos:
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {msg.videoReferences.map((video, index) => (
                      <VideoReferenceCard
                        key={`${video.youtubeId}-${index}`}
                        video={video}
                        index={index}
                        onVideoClick={handleVideoClick}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Questions */}
              {msg.suggestedQuestions && (
                <SuggestedQuestions
                  questions={msg.suggestedQuestions}
                  onQuestionClick={handleQuestionClick}
                />
              )}
            </div>
          </div>
        ))}

        {chatState.isLoading && (
          <div className="flex justify-start">
            <LoadingIndicator stage="searching" />
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleInputSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={chatState.currentInput}
            onChange={(e) => setChatState(prev => ({ ...prev, currentInput: e.target.value }))}
            placeholder="Ask me anything about Roblox development..."
            className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={chatState.isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleInputSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={chatState.isLoading || !chatState.currentInput.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg px-4 py-2 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## Mobile Responsiveness

### Key Mobile Considerations:
1. **Video Cards**: Stack vertically on mobile, side-by-side on tablet+
2. **Touch Targets**: Ensure buttons are at least 44px for accessibility
3. **Text Sizing**: Use responsive text classes
4. **Keyboard Handling**: Auto-resize textarea, handle virtual keyboard

### CSS Utilities Needed:
```css
/* Add to global CSS or component styles */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 640px) {
  .mobile-stack {
    grid-template-columns: 1fr;
  }
}
```

---

## Accessibility Improvements

### 1. ARIA Labels and Roles
```typescript
// Add to VideoReferenceCard
<div 
  role="button"
  tabIndex={0}
  aria-label={`Watch ${video.title} at timestamp ${video.timestamp}`}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  className="..."
>
```

### 2. Focus Management
```typescript
// Auto-focus input after bot response
React.useEffect(() => {
  if (!chatState.isLoading && inputRef.current) {
    inputRef.current.focus();
  }
}, [chatState.isLoading]);
```

---

## Testing Requirements

### 1. Component Tests
```typescript
// __tests__/VideoReferenceCard.test.tsx
describe('VideoReferenceCard', () => {
  test('renders video information correctly', () => {
    const mockVideo: VideoReference = {
      title: 'Test Video',
      youtubeId: 'test123',
      timestamp: '5:30',
      relevantSegment: 'Test segment',
      thumbnailUrl: 'https://img.youtube.com/vi/test123/mqdefault.jpg',
      videoUrl: 'https://youtube.com/watch?v=test123',
      timestampUrl: 'https://youtube.com/watch?v=test123&t=330s',
      confidence: 0.9
    };

    render(<VideoReferenceCard video={mockVideo} index={0} />);
    
    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('5:30')).toBeInTheDocument();
    expect(screen.getByText('Test segment')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests
```typescript
// Test complete chat flow
test('complete chat interaction', async () => {
  render(<BloxChatInterface />);
  
  const input = screen.getByPlaceholderText(/Ask me anything/);
  const sendButton = screen.getByRole('button', { name: /send/i });
  
  fireEvent.change(input, { target: { value: 'How do I script?' } });
  fireEvent.click(sendButton);
  
  // Wait for loading to appear
  expect(screen.getByText(/Searching through video/)).toBeInTheDocument();
  
  // Wait for response (mock the API call)
  await waitFor(() => {
    expect(screen.getByText(/script/i)).toBeInTheDocument();
  });
});
```

---

## Performance Optimization

### 1. Image Optimization
- Use Next.js Image component with proper sizing
- Lazy load video thumbnails
- Preload critical images

### 2. Memory Management
- Limit chat history to last 50 messages
- Clean up event listeners
- Optimize re-renders with React.memo

### 3. Bundle Size
- Lazy load non-critical components
- Use dynamic imports for large dependencies
- Tree-shake unused utilities

---

## Success Criteria

- [ ] Chat interface works smoothly with new API
- [ ] Video reference cards display correctly with thumbnails
- [ ] Timestamps link to correct YouTube positions
- [ ] Suggested questions are clickable and functional
- [ ] Loading states provide good user feedback
- [ ] Error handling is graceful and informative
- [ ] Mobile experience is fully responsive
- [ ] Accessibility standards are met
- [ ] Performance is smooth (no lag during typing/sending)

---

## Next Task Dependencies

This task enables:
- `02-02-question-cache-ui` (shows cache hit indicators)
- `03-01-calendar-integration` (might add calendar UI elements)

**Estimated completion**: End of Day 5  
**Critical path**: Yes - this is the primary user interface

---

*Task created by: Senior Developer*  
*Date: Current*  
*UI Focus: Video references are the key differentiator*