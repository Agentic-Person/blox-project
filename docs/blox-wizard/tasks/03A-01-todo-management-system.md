# Task 03A-01: Todo Management System
**Phase 3A - Calendar/Todo Foundation** | **Priority**: 🔴 Critical | **Time**: 6-8 hours

---

## Overview

Build the core todo/task management system that serves as the foundation for learning organization and progress tracking. This system will integrate with the AI Journey tables and provide CRUD operations for user tasks and todos.

## Business Requirements

### User Stories
- **As a student**, I want to create todos from my learning goals so I can track what I need to accomplish
- **As a student**, I want to organize my tasks by priority and category so I can focus on what's important
- **As a student**, I want to mark tasks as complete so I can see my progress
- **As a student**, I want the AI to suggest relevant tasks based on my current learning path

### Key Features
1. **Task Creation**: Create todos manually or from chat interactions
2. **Task Organization**: Categories, priorities, due dates, and tags
3. **Task Completion**: Mark tasks complete with timestamps
4. **Smart Suggestions**: AI-powered task recommendations
5. **Progress Tracking**: Integration with learning progress system

---

## Technical Requirements

### Database Schema

```sql
-- Core todos table
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  journey_id UUID REFERENCES ai_journeys(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category VARCHAR(50), -- 'learning', 'practice', 'project', 'review', 'custom'
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  video_references JSONB DEFAULT '[]'::jsonb, -- Links to relevant videos
  tags TEXT[] DEFAULT '{}', -- Flexible tagging system
  estimated_minutes INT, -- Time estimation
  actual_minutes INT, -- Time tracking when completed
  metadata JSONB DEFAULT '{}'::jsonb, -- Flexible additional data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Todo templates for common learning tasks
CREATE TABLE todo_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  default_category VARCHAR(50),
  default_priority VARCHAR(10),
  estimated_minutes INT,
  template_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task dependencies (optional advanced feature)
CREATE TABLE todo_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  depends_on_todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  dependency_type VARCHAR(20) DEFAULT 'prerequisite' CHECK (dependency_type IN ('prerequisite', 'related', 'blocks')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(todo_id, depends_on_todo_id)
);

-- Indexes for performance
CREATE INDEX todos_user_id_idx ON todos(user_id);
CREATE INDEX todos_status_idx ON todos(status);
CREATE INDEX todos_due_date_idx ON todos(due_date);
CREATE INDEX todos_priority_idx ON todos(priority);
CREATE INDEX todos_category_idx ON todos(category);
CREATE INDEX todos_journey_id_idx ON todos(journey_id);
CREATE INDEX todos_user_status_idx ON todos(user_id, status);
CREATE INDEX todos_user_due_date_idx ON todos(user_id, due_date) WHERE due_date IS NOT NULL;

-- Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own todos" ON todos
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Public read access to templates" ON todo_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their todo dependencies" ON todo_dependencies
  FOR ALL USING (
    todo_id IN (SELECT id FROM todos WHERE user_id = auth.uid()::text)
  );
```

### Service Architecture

**File**: `src/services/todo-manager.ts`

```typescript
export interface Todo {
  id: string
  userId: string
  journeyId?: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category?: string
  dueDate?: Date
  completedAt?: Date
  videoReferences: VideoReference[]
  tags: string[]
  estimatedMinutes?: number
  actualMinutes?: number
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface TodoTemplate {
  id: string
  name: string
  description?: string
  defaultCategory?: string
  defaultPriority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedMinutes?: number
  templateData: Record<string, any>
  isActive: boolean
}

export interface CreateTodoInput {
  title: string
  description?: string
  priority?: Todo['priority']
  category?: string
  dueDate?: Date
  videoReferences?: VideoReference[]
  tags?: string[]
  estimatedMinutes?: number
  journeyId?: string
}

export interface TodoFilters {
  status?: Todo['status'][]
  priority?: Todo['priority'][]
  category?: string[]
  tags?: string[]
  dueBefore?: Date
  dueAfter?: Date
  hasVideos?: boolean
  journeyId?: string
  search?: string
}

export class TodoManagerService {
  // Core CRUD operations
  async createTodo(userId: string, todo: CreateTodoInput): Promise<Todo>
  async updateTodo(todoId: string, updates: Partial<Todo>): Promise<Todo>
  async deleteTodo(todoId: string): Promise<boolean>
  async getTodo(todoId: string): Promise<Todo | null>
  
  // Querying and filtering
  async getTodos(userId: string, filters?: TodoFilters): Promise<Todo[]>
  async getTodosWithPagination(
    userId: string, 
    filters?: TodoFilters,
    offset?: number,
    limit?: number
  ): Promise<{ todos: Todo[], total: number, hasMore: boolean }>
  
  // Status management
  async markComplete(todoId: string, actualMinutes?: number): Promise<Todo>
  async markInProgress(todoId: string): Promise<Todo>
  async markPending(todoId: string): Promise<Todo>
  
  // Smart features
  async createFromChatContext(
    userId: string, 
    message: string, 
    context: ChatContext
  ): Promise<Todo[]>
  async suggestTodos(
    userId: string, 
    learningGoal: string, 
    currentProgress?: any
  ): Promise<TodoSuggestion[]>
  async getRecommendedTemplates(
    userId: string, 
    category?: string
  ): Promise<TodoTemplate[]>
  
  // Analytics and insights
  async getTodoStats(userId: string, dateRange?: DateRange): Promise<TodoStats>
  async getCompletionRate(userId: string, period: 'week' | 'month'): Promise<number>
  async getProductivityInsights(userId: string): Promise<ProductivityInsights>
  
  // Integration helpers
  async linkToVideo(todoId: string, videoReference: VideoReference): Promise<Todo>
  async createFromLearningPath(userId: string, path: LearningPath): Promise<Todo[]>
  async syncWithAIJourney(userId: string): Promise<void>
}
```

### API Endpoints

**Base Route**: `/api/todos`

```typescript
// GET /api/todos - Get user's todos with filtering
interface GetTodosQuery {
  status?: string[]
  priority?: string[]
  category?: string[]
  tags?: string[]
  dueBefore?: string // ISO date
  dueAfter?: string // ISO date
  hasVideos?: boolean
  journeyId?: string
  search?: string
  offset?: number
  limit?: number
}

// POST /api/todos - Create new todo
interface CreateTodoBody {
  title: string
  description?: string
  priority?: string
  category?: string
  dueDate?: string // ISO date
  videoReferences?: VideoReference[]
  tags?: string[]
  estimatedMinutes?: number
  journeyId?: string
}

// PUT /api/todos/[id] - Update todo
interface UpdateTodoBody {
  title?: string
  description?: string
  status?: string
  priority?: string
  category?: string
  dueDate?: string // ISO date
  tags?: string[]
  estimatedMinutes?: number
}

// POST /api/todos/[id]/complete - Mark todo complete
interface CompleteTodoBody {
  actualMinutes?: number
}

// POST /api/todos/suggest - Get AI-powered todo suggestions
interface SuggestTodosBody {
  learningGoal: string
  currentProgress?: any
  category?: string
}

// GET /api/todos/templates - Get available todo templates
interface GetTemplatesQuery {
  category?: string
  isActive?: boolean
}

// GET /api/todos/stats - Get user's todo statistics
interface GetStatsQuery {
  startDate?: string // ISO date
  endDate?: string // ISO date
  period?: 'week' | 'month' | 'year'
}
```

---

## Integration Points

### 1. AI Journey System Integration
- Link todos to existing `ai_journeys` table via `journey_id`
- Sync task completion with AI Journey progress
- Use AI Journey goals to suggest relevant todos
- Update AI Journey milestones when major todos complete

### 2. Chat System Integration
- Parse todo creation requests from chat messages
- Create todos from video recommendations in chat
- Natural language processing for todo details (title, priority, due date)
- Suggest todos based on chat conversation context

### 3. Video System Integration
- Store video references in todos for learning tasks
- Create todos automatically when videos are recommended
- Track video watch completion as todo progress
- Link practice tasks to specific video timestamps

### 4. Calendar System Integration
- Convert todos with due dates to calendar events
- Schedule todos based on available time slots
- Handle todo rescheduling and calendar updates
- Sync todo completion status with calendar

---

## Implementation Plan

### Phase 1: Database Foundation (2 hours)
1. **Create database migration**:
   - Add todos table with all required fields
   - Add todo_templates table for reusable patterns
   - Add todo_dependencies table for advanced relationships
   - Create indexes for query performance
   - Set up Row Level Security policies

2. **Test database schema**:
   - Verify all constraints work correctly
   - Test RLS policies with sample data
   - Validate index performance with sample queries

### Phase 2: Core Service (3 hours)
1. **Implement TodoManagerService**:
   - Basic CRUD operations (create, read, update, delete)
   - Status management methods
   - Filtering and querying with TodoFilters
   - Error handling for all operations

2. **Add TypeScript types**:
   - Update `src/types/blox-wizard.ts` with todo interfaces
   - Add database types for todos
   - Create filter and query interfaces

3. **Write unit tests**:
   - Test all CRUD operations
   - Test filtering and sorting logic
   - Test status transitions
   - Test error conditions

### Phase 3: API Implementation (2 hours)
1. **Create API routes**:
   - Implement all CRUD endpoints
   - Add filtering and pagination support
   - Add suggestion endpoint
   - Add stats endpoint

2. **Add request validation**:
   - Validate all input parameters
   - Sanitize user input
   - Add rate limiting for suggestion endpoint

3. **Test API endpoints**:
   - Integration tests for all routes
   - Test authentication and authorization
   - Test error handling and edge cases

### Phase 4: Smart Features (1 hour)
1. **Implement AI suggestions**:
   - Basic todo template matching
   - Learning goal to todo conversion
   - Integration with existing AI systems

2. **Add analytics**:
   - Todo completion statistics
   - Productivity insights
   - Time tracking analysis

---

## Testing Strategy

### Unit Tests
```typescript
describe('TodoManagerService', () => {
  describe('createTodo', () => {
    it('creates todo with required fields', async () => {
      const todo = await todoService.createTodo('user123', {
        title: 'Watch scripting basics video',
        category: 'learning',
        priority: 'high'
      })
      
      expect(todo.title).toBe('Watch scripting basics video')
      expect(todo.category).toBe('learning')
      expect(todo.priority).toBe('high')
      expect(todo.status).toBe('pending')
    })
    
    it('validates required fields', async () => {
      await expect(todoService.createTodo('user123', { title: '' }))
        .rejects.toThrow('Title is required')
    })
  })
  
  describe('getTodos', () => {
    it('filters todos by status', async () => {
      const todos = await todoService.getTodos('user123', { 
        status: ['pending', 'in_progress'] 
      })
      todos.forEach(todo => {
        expect(['pending', 'in_progress']).toContain(todo.status)
      })
    })
    
    it('filters todos by priority', async () => {
      const todos = await todoService.getTodos('user123', { 
        priority: ['high', 'urgent'] 
      })
      todos.forEach(todo => {
        expect(['high', 'urgent']).toContain(todo.priority)
      })
    })
  })
})
```

### Integration Tests
```typescript
describe('Todo API Endpoints', () => {
  describe('GET /api/todos', () => {
    it('returns user todos with authentication', async () => {
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        
      expect(response.body.todos).toBeInstanceOf(Array)
      expect(response.body.total).toBeGreaterThanOrEqual(0)
    })
    
    it('requires authentication', async () => {
      await request(app)
        .get('/api/todos')
        .expect(401)
    })
  })
  
  describe('POST /api/todos', () => {
    it('creates new todo', async () => {
      const todoData = {
        title: 'Learn door scripting',
        priority: 'high',
        category: 'learning'
      }
      
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${userToken}`)
        .send(todoData)
        .expect(201)
        
      expect(response.body.title).toBe(todoData.title)
      expect(response.body.id).toBeDefined()
    })
  })
})
```

---

## Performance Considerations

### Database Optimization
- **Composite Indexes**: Create compound indexes for common filter combinations
- **Query Optimization**: Use prepared statements and query optimization
- **Connection Pooling**: Implement proper database connection management
- **Pagination**: Always paginate large result sets

### Caching Strategy
- **Query Caching**: Cache frequently accessed todo lists
- **Template Caching**: Cache todo templates in memory
- **User Stats Caching**: Cache productivity statistics with TTL
- **Invalidation**: Clear cache on todo updates

### API Performance
- **Rate Limiting**: Prevent abuse of suggestion endpoints
- **Request Batching**: Allow bulk operations for efficiency
- **Response Compression**: Enable gzip for API responses
- **Monitoring**: Track API response times and errors

---

## Security Considerations

### Data Protection
- **Row Level Security**: Enforce user data isolation
- **Input Validation**: Sanitize all user inputs
- **SQL Injection Prevention**: Use parameterized queries
- **Data Encryption**: Encrypt sensitive todo content

### Access Control
- **Authentication Required**: All endpoints require valid auth
- **User Isolation**: Users can only access their own todos
- **Permission Checks**: Validate user permissions on all operations
- **Rate Limiting**: Prevent excessive API usage

---

## Success Criteria

### Functional Requirements
- [ ] Users can create, read, update, and delete todos
- [ ] Todos can be filtered by status, priority, category, and tags
- [ ] Todos support due dates and time tracking
- [ ] System integrates with AI Journey system
- [ ] AI suggestions provide relevant todo recommendations
- [ ] API handles authentication and authorization correctly

### Performance Requirements
- [ ] API response time < 200ms for CRUD operations
- [ ] Database queries use appropriate indexes
- [ ] System handles 100+ todos per user efficiently
- [ ] Pagination works correctly for large todo lists
- [ ] Cache hit rate > 80% for repeated queries

### Quality Requirements
- [ ] Unit test coverage > 85%
- [ ] Integration tests cover all API endpoints
- [ ] Error handling provides clear user feedback
- [ ] Input validation prevents invalid data
- [ ] System logs important events for debugging

---

## Dependencies

### Required Before Starting
- [ ] Supabase database connection configured
- [ ] Authentication system working
- [ ] Basic TypeScript types defined
- [ ] Testing framework setup

### Integration Dependencies
- [ ] AI Journey tables exist and are accessible
- [ ] Video reference system defined
- [ ] Chat system architecture planned (coordinate with Team A)
- [ ] Calendar system interfaces planned (next task)

---

## Deliverables

### Code Deliverables
- [ ] Database migration file: `supabase/migrations/005_todos_system.sql`
- [ ] Service implementation: `src/services/todo-manager.ts`
- [ ] Type definitions: Updates to `src/types/blox-wizard.ts`
- [ ] API routes: `src/app/api/todos/` directory structure
- [ ] Unit tests: `src/__tests__/services/todo-manager.test.ts`
- [ ] Integration tests: `src/__tests__/api/todos.test.ts`

### Documentation Deliverables
- [ ] API documentation with examples
- [ ] Database schema documentation
- [ ] Service usage guide
- [ ] Integration guide for other systems

---

## Risk Mitigation

### High Risk Areas
1. **Database Performance**: Todo queries could be slow with many users
   - *Mitigation*: Proper indexing, query optimization, pagination
2. **Integration Complexity**: Multiple system integration points
   - *Mitigation*: Clear interfaces, incremental integration, thorough testing

### Medium Risk Areas
1. **AI Suggestion Quality**: Suggested todos might not be relevant
   - *Mitigation*: Start simple, gather user feedback, iterate
2. **User Experience**: Complex todo management might overwhelm users
   - *Mitigation*: Simple default views, progressive disclosure, user testing

---

**Ready for Implementation**: This task provides the foundation for all learning organization features. Complete this first before moving to calendar integration.

---

*Task created by: Senior Developer*  
*Estimated completion: 6-8 hours*  
*Next task: 03A-02 Calendar Service Architecture*