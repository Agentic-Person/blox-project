# 🔄 Chat Persistence Integration Guide

## Overview

This guide explains how to integrate the new chat persistence system into Blox Wizard chat components. After integration, chat history will:
- ✅ Persist across page navigation
- ✅ Survive browser refresh
- ✅ Sync between dashboard and full page views
- ✅ Store in Supabase database with RLS security

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  React Components                       │
│  (AIChat.tsx, BloxWizardDashboard.tsx)                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Uses
                 ↓
┌─────────────────────────────────────────────────────────┐
│           useChatSession() Hook                         │
│  - Manages state                                        │
│  - Loads/saves messages                                 │
│  - Session lifecycle                                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Calls
                 ↓
┌─────────────────────────────────────────────────────────┐
│         ChatSessionService                              │
│  - Database operations                                  │
│  - Session ID management                                │
│  - localStorage sync                                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Stores in
                 ↓
┌─────────────────────────────────────────────────────────┐
│              Supabase Database                          │
│  - chat_conversations                                   │
│  - chat_messages                                        │
│  - RLS policies (user isolation)                        │
└─────────────────────────────────────────────────────────┘
```

---

## Integration Steps

### Step 1: Update AIChat.tsx

**File:** `src/components/blox-wizard/AIChat.tsx`

```typescript
// Add import at top
import { useChatSession } from '@/hooks/useChatSession'

// Inside AIChat component, replace useState for messages:
export function AIChat({ className = '', onMessageSend }: AIChatProps) {
  const { journey, getNextAction } = useAIJourney()

  // REPLACE THIS:
  // const [messages, setMessages] = useState<Message[]>([...])

  // WITH THIS:
  const {
    sessionId,
    messages: persistedMessages,
    isLoadingHistory,
    saveMessage,
    startNewConversation
  } = useChatSession()

  // Transform persisted messages to component format
  const messages: Message[] = persistedMessages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    suggestions: msg.suggestedQuestions,
    videoReferences: msg.videoReferences
  }))

  // Add initial welcome message if empty and not loading
  useEffect(() => {
    if (messages.length === 0 && !isLoadingHistory) {
      const welcomeMsg: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm your AI learning companion. I'm here to help you master ${
          journey?.gameTitle || 'Roblox development'
        }. How can I assist you today?`,
        timestamp: new Date(),
        suggestions: ['Show my progress', 'What should I learn next?', 'I have a question']
      }
      // Don't save welcome message to DB
      setMessages([welcomeMsg])
    }
  }, [messages.length, isLoadingHistory, journey?.gameTitle])

  // ... keep existing state
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update handleSend to save messages:
  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    // Save user message to database
    await saveMessage({
      id: userMessage.id,
      role: userMessage.role,
      content: userMessage.content,
      timestamp: userMessage.timestamp
    })

    setInput('')
    setIsTyping(true)

    // Call API
    try {
      const messageToSend = input

      const response = await fetch('/api/chat/blox-wizard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          sessionId: sessionId || `session_${Date.now()}`, // Use persistent session ID
          userId: 'user',
          conversationHistory: messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          responseStyle: 'beginner'
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        suggestions: data.suggestedQuestions || ['Tell me more', 'Show examples', 'What\'s next?']
      }

      // Save AI message to database
      await saveMessage({
        id: aiMessage.id,
        role: aiMessage.role,
        content: aiMessage.content,
        timestamp: aiMessage.timestamp,
        videoReferences: data.videoReferences,
        suggestedQuestions: data.suggestedQuestions
      })

      setIsTyping(false)

      if (onMessageSend) {
        onMessageSend(messageToSend)
      }
    } catch (error) {
      console.error('Failed to send message:', error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment!",
        timestamp: new Date(),
        suggestions: ['Try again', 'Ask something else']
      }

      // Don't save error messages
      setMessages(prev => [...prev, errorMessage])
      setIsTyping(false)
    }
  }

  // Add "New Conversation" button in UI:
  const handleNewConversation = async () => {
    await startNewConversation()
    // Optional: Show toast notification
  }

  // Add loading indicator while history loads:
  if (isLoadingHistory) {
    return (
      <div className={`${className} flex items-center justify-center h-full`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blox-teal mx-auto mb-4"></div>
          <p className="text-blox-off-white">Loading conversation...</p>
        </div>
      </div>
    )
  }

  // ... rest of component unchanged
}
```

---

### Step 2: Update BloxWizardDashboard.tsx

**File:** `src/components/dashboard/BloxWizardDashboard.tsx`

Same pattern as AIChat.tsx:

```typescript
// Add import
import { useChatSession } from '@/hooks/useChatSession'

export function BloxWizardDashboard() {
  // Replace message state with persistent hook
  const {
    sessionId,
    messages: persistedMessages,
    isLoadingHistory,
    saveMessage,
    startNewConversation
  } = useChatSession()

  // Transform to component message format
  const messages: Message[] = persistedMessages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    videoReferences: msg.videoReferences,
    suggestedQuestions: msg.suggestedQuestions
  }))

  // Update handleSend to use sessionId and saveMessage
  const handleSend = async () => {
    // ... (same pattern as AIChat.tsx above)

    // When calling API, use sessionId:
    const response = await fetch('/api/chat/blox-wizard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: messageToSend,
        sessionId: sessionId || `dashboard_session_${Date.now()}`,
        // ... rest
      })
    })

    // After getting response, save both messages:
    await saveMessage(userMessage)
    await saveMessage(aiMessage)
  }

  // ... rest of component
}
```

---

### Step 3: Add "New Conversation" Button (Optional)

In both components, add a button to start fresh conversations:

```typescript
<Button
  onClick={async () => {
    await startNewConversation()
    toast.success('Started new conversation')
  }}
  variant="ghost"
  size="sm"
>
  <Plus className="h-4 w-4 mr-2" />
  New Chat
</Button>
```

---

### Step 4: Add Conversation History Sidebar (Optional)

For the full Blox Wizard page (`/blox-wizard`), you can add a sidebar showing recent conversations:

```typescript
import { useChatSession } from '@/hooks/useChatSession'

function ConversationHistory() {
  const {
    recentConversations,
    loadRecentConversations,
    switchConversation,
    deleteConversation,
    sessionId: currentSessionId
  } = useChatSession()

  useEffect(() => {
    loadRecentConversations()
  }, [loadRecentConversations])

  return (
    <div className="w-64 bg-blox-second-dark-blue border-r border-blox-off-white/10 p-4">
      <h3 className="text-sm font-semibold text-blox-white mb-4">
        Recent Conversations
      </h3>

      <div className="space-y-2">
        {recentConversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => switchConversation(conv.sessionId)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              conv.sessionId === currentSessionId
                ? 'bg-blox-teal/20 border border-blox-teal'
                : 'bg-blox-off-white/5 hover:bg-blox-off-white/10'
            }`}
          >
            <p className="text-sm text-blox-white truncate">
              {conv.title || 'Untitled conversation'}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-blox-off-white/60">
                {conv.messageCount} messages
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteConversation(conv.sessionId)
                }}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

---

## Testing Checklist

After integration, verify:

### ✅ **Basic Functionality**
- [ ] Send a message on dashboard
- [ ] Navigate to `/blox-wizard` page
- [ ] Message appears in full page chat
- [ ] Send another message on full page
- [ ] Navigate back to dashboard
- [ ] Both messages visible

### ✅ **Persistence**
- [ ] Send messages
- [ ] Refresh browser (Ctrl+R or F5)
- [ ] All messages still present
- [ ] Session ID unchanged in localStorage

### ✅ **New Conversation**
- [ ] Click "New Conversation" button
- [ ] Chat clears
- [ ] New session ID generated
- [ ] Old conversation still in database
- [ ] Can switch back to old conversation

### ✅ **Error Handling**
- [ ] Network error doesn't crash app
- [ ] Failed save shows error but continues
- [ ] Unauthenticated users can still chat (localStorage only)

---

## Migration Notes

### For Existing Users

If users have been using Blox Wizard without persistence, their first visit after this update will:
1. Start with empty chat history (no migration of old React state)
2. Generate new session ID
3. All future messages will persist

This is expected behavior - there's no old data to migrate since it was only in React state.

### Database Cleanup

Old conversations can be cleaned up with:

```sql
-- Delete conversations older than 90 days
DELETE FROM chat_conversations
WHERE last_message_at < NOW() - INTERVAL '90 days';

-- Or keep only last 50 conversations per user
DELETE FROM chat_conversations c1
WHERE c1.id NOT IN (
  SELECT c2.id
  FROM chat_conversations c2
  WHERE c2.user_id = c1.user_id
  ORDER BY c2.last_message_at DESC
  LIMIT 50
);
```

---

## Troubleshooting

### Messages not persisting

**Check:**
1. Are migrations deployed? (See SUPABASE_DEPLOYMENT_GUIDE.md)
2. Are tables visible in Supabase dashboard?
3. Check browser console for errors
4. Verify RLS policies allow user access

**Debug:**
```typescript
// Add console logging in saveMessage
const success = await saveMessage(message)
console.log('Message saved:', success)
```

### Session ID keeps changing

**Cause:** localStorage not persisting

**Solution:**
- Check browser settings allow localStorage
- Verify domain is consistent (no http vs https mixing)
- Check for incognito/private mode

### Can't see old conversations

**Check:**
1. User is authenticated (Clerk)
2. User ID matches database records
3. RLS policies allow access
4. Conversations exist: `SELECT * FROM chat_conversations WHERE user_id = '...'`

---

## Performance Considerations

### Message Pagination

For conversations with 100+ messages:

```typescript
const loadHistory = useCallback(async () => {
  // Load last 50 messages by default
  const history = await chatSessionService.loadConversationHistory(
    sessionId,
    userId,
    50 // Limit
  )

  // Add "Load more" button if needed
  if (history.length === 50) {
    setHasMore(true)
  }
}, [sessionId, userId])
```

### Caching

The hook automatically caches messages in React state. Database is only queried:
- On component mount
- When switching conversations
- When manually calling `loadHistory()`

---

## Next Steps

1. ✅ Deploy migrations to Supabase
2. ✅ Test integration in development
3. ✅ Deploy to production
4. 📊 Monitor Supabase usage
5. 🎨 Add conversation history UI (optional)
6. 🔔 Add notifications for saved messages (optional)

---

## API Reference

### useChatSession Hook

```typescript
const {
  sessionId,              // Current session ID
  messages,               // Array of messages
  isLoading,             // Saving in progress
  isLoadingHistory,      // Loading history
  saveMessage,           // Save message to DB
  loadHistory,           // Reload from DB
  startNewConversation,  // Start fresh
  switchConversation,    // Load different conversation
  recentConversations,   // List of conversations
  loadRecentConversations, // Fetch conversation list
  deleteConversation,    // Delete conversation
  clearSession           // Logout cleanup
} = useChatSession()
```

### ChatSessionService Methods

```typescript
// Get/create session ID
const sessionId = await chatSessionService.getOrCreateSessionId(userId)

// Save message
const success = await chatSessionService.saveMessage(message, userId)

// Load history
const messages = await chatSessionService.loadConversationHistory(sessionId, userId, limit)

// New conversation
const newId = await chatSessionService.startNewConversation(userId)

// Get user's conversations
const conversations = await chatSessionService.getUserConversations(userId, limit)
```
