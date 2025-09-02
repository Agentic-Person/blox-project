# Task 03A-04: Natural Language Scheduling
**Phase 3A - Calendar/Todo Foundation** | **Priority**: 🟠 High | **Time**: 6-8 hours

---

## Overview

Build a sophisticated natural language processing system that can parse user scheduling requests from chat and convert them into structured calendar entries and todos. This system enables users to naturally schedule learning activities through conversation with the Blox Wizard.

## Business Requirements

### User Stories
- **As a student**, I want to say "Schedule this video for tomorrow at 3pm" and have it automatically added to my calendar
- **As a student**, I want to say "Remind me to practice scripting every Tuesday and Thursday" and have recurring tasks created
- **As a student**, I want to say "I need to finish this project by Friday" and get a schedule plan
- **As a student**, I want the system to understand context like "this afternoon" or "next week"
- **As a student**, I want scheduling conflicts to be detected and alternatives suggested

### Key Features
1. **Natural Language Parsing**: Understand complex scheduling requests
2. **Intent Detection**: Identify what type of scheduling action is needed
3. **Date/Time Extraction**: Parse relative and absolute time references
4. **Context Awareness**: Use chat history and current state for disambiguation
5. **Conflict Detection**: Identify scheduling conflicts and suggest alternatives
6. **Multi-turn Conversations**: Handle clarifications and follow-up questions

---

## Technical Requirements

### Core NLP Components

**File**: `src/services/natural-language-scheduler.ts`

```typescript
export interface SchedulingIntent {
  type: 'schedule_single' | 'schedule_recurring' | 'reschedule' | 'cancel' | 'find_time' | 'deadline_planning'
  confidence: number
  entities: SchedulingEntity[]
  originalText: string
  processedText: string
  contextUsed: ContextHints[]
}

export interface SchedulingEntity {
  type: 'datetime' | 'duration' | 'task_reference' | 'recurrence_pattern' | 'priority' | 'location'
  value: string
  normalizedValue: any
  confidence: number
  sourceSpan: { start: number; end: number }
  contextualInfo?: any
}

export interface SchedulingContext {
  currentDate: Date
  userTimezone: string
  recentChatMessages: ChatMessage[]
  currentVideoContext?: VideoReference
  userPreferences: UserSchedulePreferences
  existingSchedule: ScheduleEntry[]
  learningProgress: ProgressContext
}

export interface SchedulingResult {
  intent: SchedulingIntent
  proposedActions: ProposedSchedulingAction[]
  clarificationNeeded?: ClarificationRequest
  conflicts?: ScheduleConflict[]
  alternatives?: ScheduleAlternative[]
  confidence: number
}

export interface ProposedSchedulingAction {
  actionType: 'create_schedule' | 'create_todo' | 'create_recurring' | 'update_schedule' | 'cancel_schedule'
  scheduleEntry?: Partial<ScheduleEntry>
  todoEntry?: Partial<Todo>
  recurrenceRule?: string
  reasoning: string
  confidence: number
}

export class NaturalLanguageScheduler {
  // Core parsing and intent detection
  async parseSchedulingRequest(
    text: string,
    context: SchedulingContext
  ): Promise<SchedulingResult>
  
  async detectIntent(
    text: string,
    context: SchedulingContext
  ): Promise<SchedulingIntent>
  
  async extractEntities(
    text: string,
    intent: SchedulingIntent,
    context: SchedulingContext
  ): Promise<SchedulingEntity[]>
  
  // Date/time parsing and normalization
  async parseDateTime(
    text: string,
    context: SchedulingContext
  ): Promise<DateTimeExtraction>
  
  async resolveDateTimeAmbiguity(
    ambiguousDateTime: string,
    context: SchedulingContext,
    possibleInterpretations: DateTimeInterpretation[]
  ): Promise<DateTimeResolution>
  
  async parseRecurrencePattern(
    text: string
  ): Promise<RecurrencePattern>
  
  // Context-aware processing
  async resolveTaskReferences(
    text: string,
    context: SchedulingContext
  ): Promise<TaskReference[]>
  
  async applyContextualInformation(
    entities: SchedulingEntity[],
    context: SchedulingContext
  ): Promise<SchedulingEntity[]>
  
  async inferMissingInformation(
    intent: SchedulingIntent,
    entities: SchedulingEntity[],
    context: SchedulingContext
  ): Promise<InferredInformation>
  
  // Scheduling logic
  async generateSchedulingOptions(
    intent: SchedulingIntent,
    entities: SchedulingEntity[],
    context: SchedulingContext
  ): Promise<SchedulingOption[]>
  
  async validateSchedulingRequest(
    proposedAction: ProposedSchedulingAction,
    context: SchedulingContext
  ): Promise<ValidationResult>
  
  async resolveSchedulingConflicts(
    proposedAction: ProposedSchedulingAction,
    conflicts: ScheduleConflict[],
    context: SchedulingContext
  ): Promise<ConflictResolution[]>
  
  // Clarification and follow-up
  async generateClarificationRequest(
    ambiguousRequest: SchedulingIntent,
    context: SchedulingContext
  ): Promise<ClarificationRequest>
  
  async processClarificationResponse(
    originalRequest: SchedulingIntent,
    clarificationResponse: string,
    context: SchedulingContext
  ): Promise<SchedulingResult>
  
  // Integration helpers
  async convertToScheduleEntry(
    action: ProposedSchedulingAction,
    context: SchedulingContext
  ): Promise<ScheduleEntry>
  
  async convertToTodoEntry(
    action: ProposedSchedulingAction,
    context: SchedulingContext
  ): Promise<Todo>
  
  async generateConfirmationMessage(
    result: SchedulingResult,
    context: SchedulingContext
  ): Promise<string>
}
```

### AI-Powered Intent Detection

```typescript
class SchedulingIntentDetector {
  private openai: OpenAI
  
  async detectComplexIntent(
    text: string,
    context: SchedulingContext
  ): Promise<SchedulingIntent> {
    const systemPrompt = `
You are an expert at understanding scheduling requests in natural language.
Analyze the user's request and identify:
1. Intent type (schedule_single, schedule_recurring, reschedule, cancel, find_time, deadline_planning)
2. Key entities (datetime, duration, task_reference, recurrence_pattern, priority)
3. Confidence level (0.0 to 1.0)

Context:
- Current date: ${context.currentDate.toISOString()}
- User timezone: ${context.userTimezone}
- Recent chat context: ${context.recentChatMessages.slice(-3).map(m => m.message).join('; ')}
${context.currentVideoContext ? `- Current video: ${context.currentVideoContext.title}` : ''}

User request: "${text}"

Respond with JSON format:
{
  "type": "schedule_single|schedule_recurring|reschedule|cancel|find_time|deadline_planning",
  "confidence": 0.0-1.0,
  "entities": [
    {
      "type": "datetime|duration|task_reference|recurrence_pattern|priority",
      "value": "extracted_text",
      "normalizedValue": "structured_format",
      "confidence": 0.0-1.0
    }
  ],
  "reasoning": "explanation of analysis"
}
`
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.3
    })
    
    return JSON.parse(response.choices[0].message.content!)
  }
}
```

### Date/Time Processing Engine

```typescript
class DateTimeProcessor {
  async processNaturalLanguageDateTime(
    text: string,
    referenceDate: Date,
    timezone: string
  ): Promise<DateTimeExtraction> {
    // Handle patterns like:
    // - "tomorrow at 3pm" 
    // - "next Tuesday afternoon"
    // - "in 2 hours"
    // - "every Monday and Wednesday at 2pm"
    // - "by Friday"
    // - "this weekend"
    
    const patterns = await this.identifyDateTimePatterns(text)
    const interpretations = await this.generateInterpretations(patterns, referenceDate, timezone)
    const mostLikely = await this.selectBestInterpretation(interpretations)
    
    return {
      extractedText: text,
      interpretations,
      selectedInterpretation: mostLikely,
      confidence: mostLikely.confidence,
      ambiguityLevel: interpretations.length > 1 ? 'high' : 'low'
    }
  }
  
  private identifyDateTimePatterns(text: string): DateTimePattern[] {
    const patterns: DateTimePattern[] = []
    
    // Relative date patterns
    const relativePatterns = [
      /\b(tomorrow|today|yesterday)\b/gi,
      /\b(next|this|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b(next|this|last)\s+(week|month|year)\b/gi,
      /\bin\s+(\d+)\s+(minutes?|hours?|days?|weeks?)\b/gi
    ]
    
    // Absolute date patterns
    const absolutePatterns = [
      /\b(\d{1,2}\/\d{1,2}\/?\d{0,4})\b/g,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\b/gi
    ]
    
    // Time patterns
    const timePatterns = [
      /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/gi,
      /\b(\d{1,2})\s*(am|pm)\b/gi,
      /\b(morning|afternoon|evening|night)\b/gi
    ]
    
    // Process each pattern type
    for (const pattern of [...relativePatterns, ...absolutePatterns, ...timePatterns]) {
      const matches = text.matchAll(pattern)
      for (const match of matches) {
        patterns.push({
          type: this.classifyPattern(pattern),
          match: match[0],
          position: { start: match.index!, end: match.index! + match[0].length }
        })
      }
    }
    
    return patterns
  }
}
```

### Recurrence Pattern Parser

```typescript
class RecurrencePatternParser {
  async parseRecurrenceFromText(text: string): Promise<RecurrencePattern | null> {
    // Handle patterns like:
    // - "every day"
    // - "every Monday and Wednesday" 
    // - "every other week"
    // - "daily at 3pm"
    // - "weekly on Tuesdays"
    // - "monthly on the 15th"
    
    const recurrenceKeywords = [
      'every', 'daily', 'weekly', 'monthly', 'yearly',
      'each', 'recurring', 'repeat'
    ]
    
    if (!recurrenceKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      return null
    }
    
    // Use OpenAI for complex recurrence pattern parsing
    const systemPrompt = `
Parse the recurrence pattern from the user's text and convert it to RRULE format.

Examples:
- "every day" -> "FREQ=DAILY"
- "every Monday and Wednesday" -> "FREQ=WEEKLY;BYDAY=MO,WE"
- "every other week" -> "FREQ=WEEKLY;INTERVAL=2"
- "monthly on the 15th" -> "FREQ=MONTHLY;BYMONTHDAY=15"

User text: "${text}"

Respond with JSON:
{
  "rrule": "RRULE_string_or_null",
  "humanReadable": "human_description",
  "confidence": 0.0-1.0,
  "pattern": {
    "frequency": "DAILY|WEEKLY|MONTHLY|YEARLY",
    "interval": number,
    "daysOfWeek": ["MO", "TU", ...],
    "endDate": "ISO_date_or_null"
  }
}
`
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }],
      temperature: 0.2
    })
    
    return JSON.parse(response.choices[0].message.content!)
  }
}
```

---

## API Integration

### Chat API Enhancement

```typescript
// Extend existing chat API to handle scheduling
interface ChatSchedulingResponse {
  answer: string
  videoReferences?: VideoReference[]
  schedulingActions?: ProposedSchedulingAction[]
  clarificationNeeded?: ClarificationRequest
  scheduleConflicts?: ScheduleConflict[]
  suggestedAlternatives?: ScheduleAlternative[]
}

// POST /api/chat/blox-wizard - Enhanced with scheduling
interface ChatWithSchedulingBody {
  message: string
  sessionId: string
  userId?: string
  videoContext?: VideoContext
  schedulingContext?: {
    includeScheduling: boolean
    currentTimezone: string
    maxAlternatives?: number
  }
}
```

### Dedicated Scheduling API

```typescript
// POST /api/scheduling/parse - Parse scheduling request
interface ParseSchedulingBody {
  text: string
  context: {
    currentDate?: string
    timezone?: string
    recentMessages?: string[]
    videoContext?: any
    existingSchedule?: any[]
  }
}

// POST /api/scheduling/clarify - Handle clarification
interface ClarifySchedulingBody {
  originalRequestId: string
  clarificationResponse: string
  context: any
}

// POST /api/scheduling/confirm - Confirm and execute scheduling action
interface ConfirmSchedulingBody {
  proposedActions: ProposedSchedulingAction[]
  confirmAll?: boolean
  modifications?: any[]
}

// GET /api/scheduling/suggestions - Get scheduling suggestions
interface GetSchedulingSuggestionsQuery {
  task: string
  preferredTimes?: string[]
  duration?: number
  priority?: string
  startDate?: string
  endDate?: string
}
```

---

## Implementation Plan

### Phase 1: Core NLP Framework (2 hours)
1. **Set up NLP infrastructure**:
   - Configure OpenAI for intent detection
   - Create basic entity extraction
   - Implement date/time pattern matching
   - Set up context management

2. **Build intent detection system**:
   - Define intent types and confidence scoring
   - Implement OpenAI-powered intent classification
   - Create intent validation and fallback

### Phase 2: Date/Time Processing (2 hours)
1. **Implement date/time parsing**:
   - Handle relative dates ("tomorrow", "next week")
   - Parse absolute dates and times
   - Handle timezone conversion
   - Implement ambiguity detection

2. **Add recurrence pattern support**:
   - Parse recurring schedule requests
   - Generate RRULE format strings
   - Handle complex patterns ("every other Tuesday")

### Phase 3: Context-Aware Processing (2 hours)
1. **Build context integration**:
   - Use chat history for disambiguation
   - Integrate with current video context
   - Apply user preferences and patterns
   - Implement reference resolution

2. **Add conflict detection**:
   - Check against existing schedule
   - Generate alternative suggestions
   - Handle scheduling constraints

### Phase 4: API Integration and Testing (2 hours)
1. **Integrate with existing systems**:
   - Extend chat API with scheduling
   - Create dedicated scheduling endpoints
   - Integrate with calendar service
   - Connect with todo management

2. **Testing and refinement**:
   - Test with various scheduling scenarios
   - Refine intent detection accuracy
   - Optimize parsing performance
   - Handle edge cases

---

## Testing Strategy

### Unit Tests

```typescript
describe('NaturalLanguageScheduler', () => {
  describe('parseSchedulingRequest', () => {
    it('parses simple scheduling request', async () => {
      const result = await scheduler.parseSchedulingRequest(
        "Schedule this video for tomorrow at 3pm",
        mockContext
      )
      
      expect(result.intent.type).toBe('schedule_single')
      expect(result.proposedActions).toHaveLength(1)
      expect(result.proposedActions[0].scheduleEntry?.scheduledDate).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0.8)
    })
    
    it('handles recurring schedule requests', async () => {
      const result = await scheduler.parseSchedulingRequest(
        "Remind me to practice scripting every Tuesday and Thursday at 2pm",
        mockContext
      )
      
      expect(result.intent.type).toBe('schedule_recurring')
      expect(result.proposedActions[0].recurrenceRule).toContain('WEEKLY')
      expect(result.proposedActions[0].recurrenceRule).toContain('BYDAY=TU,TH')
    })
    
    it('detects scheduling conflicts', async () => {
      const contextWithConflict = {
        ...mockContext,
        existingSchedule: [{
          scheduledDate: new Date('2024-01-15T15:00:00Z'),
          durationMinutes: 60
        }]
      }
      
      const result = await scheduler.parseSchedulingRequest(
        "Schedule video review for tomorrow at 3pm for 90 minutes",
        contextWithConflict
      )
      
      expect(result.conflicts).toHaveLength(1)
      expect(result.alternatives).toBeDefined()
    })
  })
  
  describe('parseDateTime', () => {
    it('parses relative dates correctly', async () => {
      const result = await scheduler.parseDateTime(
        "tomorrow afternoon",
        { currentDate: new Date('2024-01-15T10:00:00Z'), userTimezone: 'America/New_York' }
      )
      
      expect(result.selectedInterpretation.date.getDate()).toBe(16)
      expect(result.selectedInterpretation.timeRange.start).toBe('12:00')
    })
    
    it('handles ambiguous time references', async () => {
      const result = await scheduler.parseDateTime(
        "Friday at 3", // Could be 3am or 3pm
        mockContext
      )
      
      expect(result.ambiguityLevel).toBe('high')
      expect(result.interpretations.length).toBe(2)
    })
  })
})
```

### Integration Tests

```typescript
describe('Scheduling API', () => {
  describe('POST /api/scheduling/parse', () => {
    it('processes complex scheduling request', async () => {
      const requestData = {
        text: "I need to finish the door scripting project by Friday, can you help me plan it?",
        context: {
          currentDate: '2024-01-15T10:00:00Z',
          timezone: 'America/New_York',
          recentMessages: ["I'm learning about door scripting", "Show me videos about Roblox doors"]
        }
      }
      
      const response = await request(app)
        .post('/api/scheduling/parse')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestData)
        .expect(200)
      
      expect(response.body.intent.type).toBe('deadline_planning')
      expect(response.body.proposedActions.length).toBeGreaterThan(1)
      expect(response.body.proposedActions.some(a => a.actionType === 'create_schedule')).toBe(true)
    })
  })
})
```

---

## Success Criteria

### Functional Requirements
- [ ] Parse 90%+ of common scheduling requests correctly
- [ ] Handle relative and absolute date/time references
- [ ] Detect and resolve scheduling conflicts
- [ ] Support recurring schedule patterns
- [ ] Integrate seamlessly with chat system
- [ ] Provide clear clarification when needed

### AI Quality Requirements
- [ ] Intent detection accuracy > 85%
- [ ] Date/time extraction accuracy > 90%
- [ ] Appropriate confidence scoring
- [ ] Context-aware disambiguation
- [ ] Natural language generation for responses

### Performance Requirements
- [ ] Request processing < 2s for simple requests
- [ ] OpenAI API calls < 3s
- [ ] Handle 100+ concurrent parsing requests
- [ ] Efficient context management
- [ ] Minimal memory usage for long conversations

---

## Dependencies

### Required Before Starting
- [ ] Task 03A-01 (Todo Management) for todo creation
- [ ] Task 03A-02 (Calendar Service) for schedule creation  
- [ ] OpenAI API configured and accessible
- [ ] Chat system architecture understood

### Integration Dependencies
- [ ] Chat API structure agreed with video search team
- [ ] Calendar service interfaces completed
- [ ] Todo management service interfaces completed
- [ ] User timezone and preference data available

---

**This enables natural conversation-based scheduling** - transforming the chat interface into a powerful scheduling assistant.

---

*Task created by: Senior Developer*  
*Estimated completion: 6-8 hours*  
*Next task: 03A-05 Progress Sync Service*