// Todo System Types
// Part of: Phase 3A Calendar/Todo Implementation

export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';
export type DependencyType = 'blocks' | 'enables' | 'suggests';

export interface VideoReference {
  videoId: string;
  youtubeId: string;
  title: string;
  timestamp: string;
  thumbnailUrl: string;
  duration?: number;
}

export interface Todo {
  id: string;
  userId: string;
  journeyId?: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  category?: string;
  dueDate?: string;
  completedAt?: string;
  videoReferences: VideoReference[];
  tags: string[];
  estimatedMinutes?: number;
  actualMinutes?: number;
  parentTodoId?: string;
  templateId?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority?: TodoPriority;
  category?: string;
  dueDate?: string;
  videoReferences?: VideoReference[];
  tags?: string[];
  estimatedMinutes?: number;
  parentTodoId?: string;
  templateId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  category?: string;
  dueDate?: string;
  videoReferences?: VideoReference[];
  tags?: string[];
  estimatedMinutes?: number;
  actualMinutes?: number;
  metadata?: Record<string, any>;
}

export interface TodoTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  estimatedMinutes?: number;
  priority: TodoPriority;
  tags: string[];
  templateData: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TodoDependency {
  id: string;
  todoId: string;
  dependsOnTodoId: string;
  dependencyType: DependencyType;
  createdAt: string;
}

export interface TodoFilters {
  status?: TodoStatus[];
  priority?: TodoPriority[];
  category?: string[];
  tags?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  hasVideoReferences?: boolean;
  parentTodoId?: string;
  journeyId?: string;
  search?: string;
}

export interface TodoSortOptions {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface TodoListResponse {
  todos: Todo[];
  totalCount: number;
  hasMore: boolean;
}

export interface TodoStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  blocked: number;
  overdue: number;
  completedThisWeek: number;
  averageCompletionTime: number; // in minutes
}

export interface TodoSuggestion {
  type: 'template' | 'ai_generated' | 'based_on_progress';
  title: string;
  description: string;
  estimatedMinutes?: number;
  priority: TodoPriority;
  category?: string;
  tags: string[];
  confidence: number; // 0-1 scale
  reasoning: string;
  templateId?: string;
  metadata?: Record<string, any>;
}

export interface SmartTodoAnalytics {
  productivityScore: number; // 0-100
  completionRate: number; // percentage
  averageTaskDuration: number; // minutes
  mostProductiveTimeOfDay: string;
  categoryBreakdown: Record<string, number>;
  weeklyTrend: {
    week: string;
    completed: number;
    created: number;
  }[];
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate?: string;
  };
}

// Error types
export class TodoError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'TodoError';
  }
}

export class TodoNotFoundError extends TodoError {
  constructor(todoId: string) {
    super(`Todo with ID ${todoId} not found`, 'TODO_NOT_FOUND', 404);
  }
}

export class TodoValidationError extends TodoError {
  constructor(message: string) {
    super(message, 'TODO_VALIDATION_ERROR', 400);
  }
}

export class TodoPermissionError extends TodoError {
  constructor(message: string = 'Permission denied') {
    super(message, 'TODO_PERMISSION_ERROR', 403);
  }
}

// Service interface
export interface TodoManagerService {
  // CRUD Operations
  createTodo(userId: string, data: CreateTodoRequest): Promise<Todo>;
  getTodo(userId: string, todoId: string): Promise<Todo>;
  updateTodo(userId: string, todoId: string, data: UpdateTodoRequest): Promise<Todo>;
  deleteTodo(userId: string, todoId: string): Promise<void>;
  
  // List and filtering
  getTodos(userId: string, filters?: TodoFilters, sort?: TodoSortOptions, pagination?: PaginationOptions): Promise<TodoListResponse>;
  getTodosByJourney(userId: string, journeyId: string, filters?: TodoFilters): Promise<Todo[]>;
  
  // Status management
  updateTodoStatus(userId: string, todoId: string, status: TodoStatus): Promise<Todo>;
  markCompleted(userId: string, todoId: string, actualMinutes?: number): Promise<Todo>;
  bulkUpdateStatus(userId: string, todoIds: string[], status: TodoStatus): Promise<Todo[]>;
  
  // Dependencies
  addDependency(userId: string, todoId: string, dependsOnTodoId: string, type: DependencyType): Promise<TodoDependency>;
  removeDependency(userId: string, dependencyId: string): Promise<void>;
  getDependencies(userId: string, todoId: string): Promise<TodoDependency[]>;
  
  // Templates
  getTodoTemplates(): Promise<TodoTemplate[]>;
  createTodoFromTemplate(userId: string, templateId: string, customizations?: Partial<CreateTodoRequest>): Promise<Todo>;
  
  // Analytics and suggestions
  getTodoStats(userId: string, filters?: Partial<TodoFilters>): Promise<TodoStats>;
  getSmartSuggestions(userId: string, limit?: number): Promise<TodoSuggestion[]>;
  getAnalytics(userId: string, timeRange?: string): Promise<SmartTodoAnalytics>;
  
  // Bulk operations
  bulkCreateTodos(userId: string, todos: CreateTodoRequest[]): Promise<Todo[]>;
  bulkDeleteTodos(userId: string, todoIds: string[]): Promise<void>;
  
  // Search
  searchTodos(userId: string, query: string, filters?: TodoFilters): Promise<Todo[]>;
}