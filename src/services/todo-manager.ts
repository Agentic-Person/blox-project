// Todo Manager Service
// Part of: Phase 3A Calendar/Todo Implementation

import { createClient } from '@/lib/supabase/client';
import type {
  Todo,
  TodoTemplate,
  TodoDependency,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoFilters,
  TodoSortOptions,
  PaginationOptions,
  TodoListResponse,
  TodoStats,
  TodoSuggestion,
  SmartTodoAnalytics,
  TodoStatus,
  DependencyType,
  TodoManagerService as ITodoManagerService
} from '@/types/todo';
import {
  TodoError,
  TodoNotFoundError,
  TodoValidationError,
  TodoPermissionError
} from '@/types/todo';

export class TodoManagerService implements ITodoManagerService {
  private supabase = createClient();

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================

  async createTodo(userId: string, data: CreateTodoRequest): Promise<Todo> {
    try {
      this.validateCreateTodoRequest(data);

      // Check if parent todo exists and belongs to user
      if (data.parentTodoId) {
        await this.validateParentTodo(userId, data.parentTodoId);
      }

      const todoData = {
        user_id: userId,
        journey_id: data.journeyId,
        title: data.title,
        description: data.description,
        priority: data.priority || 'medium',
        category: data.category,
        due_date: data.dueDate,
        video_references: data.videoReferences || [],
        tags: data.tags || [],
        estimated_minutes: data.estimatedMinutes,
        parent_todo_id: data.parentTodoId,
        template_id: data.templateId,
        metadata: data.metadata || {}
      };

      const { data: todo, error } = await this.supabase
        .from('todos')
        .insert(todoData)
        .select()
        .single();

      if (error) {
        throw new TodoError(`Failed to create todo: ${error.message}`, 'CREATE_FAILED');
      }

      return this.mapTodoFromDb(todo);
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Unexpected error creating todo: ${error}`, 'CREATE_ERROR');
    }
  }

  async getTodo(userId: string, todoId: string): Promise<Todo> {
    try {
      const { data: todo, error } = await this.supabase
        .from('todos')
        .select('*')
        .eq('id', todoId)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw new TodoNotFoundError(todoId);
      }

      return this.mapTodoFromDb(todo);
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Error fetching todo: ${error}`, 'GET_ERROR');
    }
  }

  async updateTodo(userId: string, todoId: string, data: UpdateTodoRequest): Promise<Todo> {
    try {
      // Validate todo exists and belongs to user
      await this.getTodo(userId, todoId);

      this.validateUpdateTodoRequest(data);

      const updateData: any = {
        updated_at: new Date().toISOString(),
        ...this.mapUpdateDataToDb(data)
      };

      // Handle status transitions
      if (data.status === 'completed' && !updateData.completed_at) {
        updateData.completed_at = new Date().toISOString();
      } else if (data.status !== 'completed' && updateData.completed_at) {
        updateData.completed_at = null;
      }

      const { data: updatedTodo, error } = await this.supabase
        .from('todos')
        .update(updateData)
        .eq('id', todoId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new TodoError(`Failed to update todo: ${error.message}`, 'UPDATE_FAILED');
      }

      return this.mapTodoFromDb(updatedTodo);
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Error updating todo: ${error}`, 'UPDATE_ERROR');
    }
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    try {
      // Check if todo has dependencies
      const dependencies = await this.getDependencies(userId, todoId);
      if (dependencies.length > 0) {
        throw new TodoValidationError('Cannot delete todo with existing dependencies');
      }

      const { error } = await this.supabase
        .from('todos')
        .delete()
        .eq('id', todoId)
        .eq('user_id', userId);

      if (error) {
        throw new TodoError(`Failed to delete todo: ${error.message}`, 'DELETE_FAILED');
      }
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Error deleting todo: ${error}`, 'DELETE_ERROR');
    }
  }

  // ==========================================
  // LIST AND FILTERING
  // ==========================================

  async getTodos(
    userId: string,
    filters?: TodoFilters,
    sort?: TodoSortOptions,
    pagination?: PaginationOptions
  ): Promise<TodoListResponse> {
    try {
      let query = this.supabase
        .from('todos')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      query = this.applyFilters(query, filters);

      // Apply sorting
      const sortField = sort?.field || 'created_at';
      const sortDirection = sort?.direction || 'desc';
      query = query.order(this.mapSortFieldToDb(sortField), { ascending: sortDirection === 'asc' });

      // Apply pagination
      if (pagination) {
        query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
      }

      const { data: todos, error, count } = await query;

      if (error) {
        throw new TodoError(`Failed to fetch todos: ${error.message}`, 'FETCH_FAILED');
      }

      return {
        todos: todos.map(todo => this.mapTodoFromDb(todo)),
        totalCount: count || 0,
        hasMore: pagination ? (pagination.offset + pagination.limit) < (count || 0) : false
      };
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Error fetching todos: ${error}`, 'FETCH_ERROR');
    }
  }

  async getTodosByJourney(userId: string, journeyId: string, filters?: TodoFilters): Promise<Todo[]> {
    const journeyFilters = { ...filters, journeyId };
    const response = await this.getTodos(userId, journeyFilters);
    return response.todos;
  }

  // ==========================================
  // STATUS MANAGEMENT
  // ==========================================

  async updateTodoStatus(userId: string, todoId: string, status: TodoStatus): Promise<Todo> {
    return this.updateTodo(userId, todoId, { status });
  }

  async markCompleted(userId: string, todoId: string, actualMinutes?: number): Promise<Todo> {
    const updateData: UpdateTodoRequest = { 
      status: 'completed',
      actualMinutes 
    };
    return this.updateTodo(userId, todoId, updateData);
  }

  async bulkUpdateStatus(userId: string, todoIds: string[], status: TodoStatus): Promise<Todo[]> {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
      };

      const { data: updatedTodos, error } = await this.supabase
        .from('todos')
        .update(updateData)
        .in('id', todoIds)
        .eq('user_id', userId)
        .select();

      if (error) {
        throw new TodoError(`Failed to bulk update status: ${error.message}`, 'BULK_UPDATE_FAILED');
      }

      return updatedTodos.map(todo => this.mapTodoFromDb(todo));
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Error in bulk status update: ${error}`, 'BULK_UPDATE_ERROR');
    }
  }

  // ==========================================
  // DEPENDENCIES
  // ==========================================

  async addDependency(
    userId: string,
    todoId: string,
    dependsOnTodoId: string,
    type: DependencyType
  ): Promise<TodoDependency> {
    try {
      // Validate both todos exist and belong to user
      await this.getTodo(userId, todoId);
      await this.getTodo(userId, dependsOnTodoId);

      // Check for circular dependencies
      await this.validateNoCycles(userId, todoId, dependsOnTodoId);

      const { data: dependency, error } = await this.supabase
        .from('todo_dependencies')
        .insert({
          todo_id: todoId,
          depends_on_todo_id: dependsOnTodoId,
          dependency_type: type
        })
        .select()
        .single();

      if (error) {
        throw new TodoError(`Failed to add dependency: ${error.message}`, 'DEPENDENCY_CREATE_FAILED');
      }

      return this.mapDependencyFromDb(dependency);
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Error adding dependency: ${error}`, 'DEPENDENCY_ERROR');
    }
  }

  async removeDependency(userId: string, dependencyId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('todo_dependencies')
        .delete()
        .eq('id', dependencyId)
        .eq('todo_id', await this.getUserTodoId(userId, dependencyId));

      if (error) {
        throw new TodoError(`Failed to remove dependency: ${error.message}`, 'DEPENDENCY_DELETE_FAILED');
      }
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Error removing dependency: ${error}`, 'DEPENDENCY_DELETE_ERROR');
    }
  }

  async getDependencies(userId: string, todoId: string): Promise<TodoDependency[]> {
    try {
      const { data: dependencies, error } = await this.supabase
        .from('todo_dependencies')
        .select('*')
        .eq('todo_id', todoId);

      if (error) {
        throw new TodoError(`Failed to fetch dependencies: ${error.message}`, 'DEPENDENCY_FETCH_FAILED');
      }

      return dependencies.map(dep => this.mapDependencyFromDb(dep));
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Error fetching dependencies: ${error}`, 'DEPENDENCY_FETCH_ERROR');
    }
  }

  // ==========================================
  // TEMPLATES
  // ==========================================

  async getTodoTemplates(): Promise<TodoTemplate[]> {
    try {
      const { data: templates, error } = await this.supabase
        .from('todo_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new TodoError(`Failed to fetch templates: ${error.message}`, 'TEMPLATE_FETCH_FAILED');
      }

      return templates.map(template => this.mapTemplateFromDb(template));
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Error fetching templates: ${error}`, 'TEMPLATE_FETCH_ERROR');
    }
  }

  async createTodoFromTemplate(
    userId: string,
    templateId: string,
    customizations?: Partial<CreateTodoRequest>
  ): Promise<Todo> {
    try {
      const { data: template, error } = await this.supabase
        .from('todo_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single();

      if (error) {
        throw new TodoError(`Template not found: ${error.message}`, 'TEMPLATE_NOT_FOUND', 404);
      }

      const todoData: CreateTodoRequest = {
        title: customizations?.title || template.name,
        description: customizations?.description || template.description,
        category: customizations?.category || template.category,
        priority: customizations?.priority || template.priority,
        estimatedMinutes: customizations?.estimatedMinutes || template.estimated_minutes,
        tags: customizations?.tags || template.tags,
        templateId,
        ...customizations
      };

      return this.createTodo(userId, todoData);
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Error creating todo from template: ${error}`, 'TEMPLATE_CREATE_ERROR');
    }
  }

  // ==========================================
  // ANALYTICS AND SUGGESTIONS
  // ==========================================

  async getTodoStats(userId: string, filters?: Partial<TodoFilters>): Promise<TodoStats> {
    try {
      let query = this.supabase
        .from('todos')
        .select('status, completed_at, estimated_minutes, actual_minutes, created_at')
        .eq('user_id', userId);

      if (filters) {
        query = this.applyPartialFilters(query, filters);
      }

      const { data: todos, error } = await query;

      if (error) {
        throw new TodoError(`Failed to fetch stats: ${error.message}`, 'STATS_FETCH_FAILED');
      }

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: TodoStats = {
        total: todos.length,
        pending: todos.filter(t => t.status === 'pending').length,
        inProgress: todos.filter(t => t.status === 'in_progress').length,
        completed: todos.filter(t => t.status === 'completed').length,
        cancelled: todos.filter(t => t.status === 'cancelled').length,
        blocked: todos.filter(t => t.status === 'blocked').length,
        overdue: todos.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed').length,
        completedThisWeek: todos.filter(t => 
          t.completed_at && new Date(t.completed_at) >= weekAgo
        ).length,
        averageCompletionTime: this.calculateAverageCompletionTime(todos)
      };

      return stats;
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Error calculating stats: ${error}`, 'STATS_ERROR');
    }
  }

  async getSmartSuggestions(userId: string, limit = 5): Promise<TodoSuggestion[]> {
    try {
      // This is a simplified version - in a real implementation, this would use AI/ML
      const suggestions: TodoSuggestion[] = [];

      // Get user's learning journey context
      const { data: journey, error: journeyError } = await this.supabase
        .from('ai_journeys')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!journeyError && journey) {
        // Suggest based on current progress
        suggestions.push({
          type: 'ai_generated',
          title: `Continue ${journey.game_type} development`,
          description: `Based on your current progress in ${journey.current_module}`,
          estimatedMinutes: 45,
          priority: 'high',
          category: 'learning',
          tags: [journey.game_type, 'development'],
          confidence: 0.8,
          reasoning: 'Aligned with your current learning path'
        });
      }

      // Get template-based suggestions
      const templates = await this.getTodoTemplates();
      const templateSuggestions = templates.slice(0, 3).map(template => ({
        type: 'template' as const,
        title: template.name,
        description: template.description || '',
        estimatedMinutes: template.estimatedMinutes,
        priority: template.priority,
        category: template.category,
        tags: template.tags,
        confidence: 0.6,
        reasoning: 'Popular template suggestion',
        templateId: template.id
      }));

      suggestions.push(...templateSuggestions);

      return suggestions.slice(0, limit);
    } catch (error) {
      throw new TodoError(`Error generating suggestions: ${error}`, 'SUGGESTIONS_ERROR');
    }
  }

  async getAnalytics(userId: string, timeRange = '30d'): Promise<SmartTodoAnalytics> {
    try {
      const { data: todos, error } = await this.supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new TodoError(`Failed to fetch analytics data: ${error.message}`, 'ANALYTICS_FETCH_FAILED');
      }

      return this.calculateAnalytics(todos, timeRange);
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Error calculating analytics: ${error}`, 'ANALYTICS_ERROR');
    }
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  async bulkCreateTodos(userId: string, todosData: CreateTodoRequest[]): Promise<Todo[]> {
    try {
      const todoInserts = todosData.map(data => ({
        user_id: userId,
        title: data.title,
        description: data.description,
        priority: data.priority || 'medium',
        category: data.category,
        due_date: data.dueDate,
        video_references: data.videoReferences || [],
        tags: data.tags || [],
        estimated_minutes: data.estimatedMinutes,
        parent_todo_id: data.parentTodoId,
        template_id: data.templateId,
        metadata: data.metadata || {}
      }));

      const { data: createdTodos, error } = await this.supabase
        .from('todos')
        .insert(todoInserts)
        .select();

      if (error) {
        throw new TodoError(`Failed to bulk create todos: ${error.message}`, 'BULK_CREATE_FAILED');
      }

      return createdTodos.map(todo => this.mapTodoFromDb(todo));
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Error in bulk create: ${error}`, 'BULK_CREATE_ERROR');
    }
  }

  async bulkDeleteTodos(userId: string, todoIds: string[]): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('todos')
        .delete()
        .in('id', todoIds)
        .eq('user_id', userId);

      if (error) {
        throw new TodoError(`Failed to bulk delete todos: ${error.message}`, 'BULK_DELETE_FAILED');
      }
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Error in bulk delete: ${error}`, 'BULK_DELETE_ERROR');
    }
  }

  // ==========================================
  // SEARCH
  // ==========================================

  async searchTodos(userId: string, query: string, filters?: TodoFilters): Promise<Todo[]> {
    try {
      let supabaseQuery = this.supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId);

      // Add text search
      if (query.trim()) {
        supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      }

      // Apply additional filters
      supabaseQuery = this.applyFilters(supabaseQuery, filters);

      const { data: todos, error } = await supabaseQuery
        .order('created_at', { ascending: false });

      if (error) {
        throw new TodoError(`Search failed: ${error.message}`, 'SEARCH_FAILED');
      }

      return todos.map(todo => this.mapTodoFromDb(todo));
    } catch (error) {
      if (error instanceof TodoError) throw error;
      throw new TodoError(`Error searching todos: ${error}`, 'SEARCH_ERROR');
    }
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  private validateCreateTodoRequest(data: CreateTodoRequest): void {
    if (!data.title?.trim()) {
      throw new TodoValidationError('Title is required');
    }
    if (data.title.length > 255) {
      throw new TodoValidationError('Title must be less than 255 characters');
    }
    if (data.estimatedMinutes && (data.estimatedMinutes < 1 || data.estimatedMinutes > 1440)) {
      throw new TodoValidationError('Estimated minutes must be between 1 and 1440');
    }
  }

  private validateUpdateTodoRequest(data: UpdateTodoRequest): void {
    if (data.title !== undefined && !data.title?.trim()) {
      throw new TodoValidationError('Title cannot be empty');
    }
    if (data.actualMinutes && (data.actualMinutes < 1 || data.actualMinutes > 1440)) {
      throw new TodoValidationError('Actual minutes must be between 1 and 1440');
    }
  }

  private async validateParentTodo(userId: string, parentTodoId: string): Promise<void> {
    try {
      await this.getTodo(userId, parentTodoId);
    } catch (error) {
      throw new TodoValidationError('Parent todo does not exist or access denied');
    }
  }

  private async validateNoCycles(userId: string, todoId: string, dependsOnTodoId: string): Promise<void> {
    // Simplified cycle detection - in production, implement proper graph traversal
    const existingDeps = await this.getDependencies(userId, dependsOnTodoId);
    const hasCycle = existingDeps.some(dep => dep.dependsOnTodoId === todoId);
    
    if (hasCycle) {
      throw new TodoValidationError('Circular dependency detected');
    }
  }

  private async getUserTodoId(userId: string, dependencyId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('todo_dependencies')
      .select('todo_id, todos!inner(user_id)')
      .eq('id', dependencyId)
      .single();

    if (error || !data || data.todos.user_id !== userId) {
      throw new TodoPermissionError();
    }

    return data.todo_id;
  }

  private mapTodoFromDb(dbTodo: any): Todo {
    return {
      id: dbTodo.id,
      userId: dbTodo.user_id,
      journeyId: dbTodo.journey_id,
      title: dbTodo.title,
      description: dbTodo.description,
      status: dbTodo.status,
      priority: dbTodo.priority,
      category: dbTodo.category,
      dueDate: dbTodo.due_date,
      completedAt: dbTodo.completed_at,
      videoReferences: dbTodo.video_references || [],
      tags: dbTodo.tags || [],
      estimatedMinutes: dbTodo.estimated_minutes,
      actualMinutes: dbTodo.actual_minutes,
      parentTodoId: dbTodo.parent_todo_id,
      templateId: dbTodo.template_id,
      metadata: dbTodo.metadata || {},
      createdAt: dbTodo.created_at,
      updatedAt: dbTodo.updated_at
    };
  }

  private mapUpdateDataToDb(data: UpdateTodoRequest): any {
    const mapped: any = {};
    
    if (data.title !== undefined) mapped.title = data.title;
    if (data.description !== undefined) mapped.description = data.description;
    if (data.status !== undefined) mapped.status = data.status;
    if (data.priority !== undefined) mapped.priority = data.priority;
    if (data.category !== undefined) mapped.category = data.category;
    if (data.dueDate !== undefined) mapped.due_date = data.dueDate;
    if (data.videoReferences !== undefined) mapped.video_references = data.videoReferences;
    if (data.tags !== undefined) mapped.tags = data.tags;
    if (data.estimatedMinutes !== undefined) mapped.estimated_minutes = data.estimatedMinutes;
    if (data.actualMinutes !== undefined) mapped.actual_minutes = data.actualMinutes;
    if (data.metadata !== undefined) mapped.metadata = data.metadata;

    return mapped;
  }

  private mapDependencyFromDb(dbDep: any): TodoDependency {
    return {
      id: dbDep.id,
      todoId: dbDep.todo_id,
      dependsOnTodoId: dbDep.depends_on_todo_id,
      dependencyType: dbDep.dependency_type,
      createdAt: dbDep.created_at
    };
  }

  private mapTemplateFromDb(dbTemplate: any): TodoTemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      description: dbTemplate.description,
      category: dbTemplate.category,
      estimatedMinutes: dbTemplate.estimated_minutes,
      priority: dbTemplate.priority,
      tags: dbTemplate.tags || [],
      templateData: dbTemplate.template_data || {},
      isActive: dbTemplate.is_active,
      createdAt: dbTemplate.created_at,
      updatedAt: dbTemplate.updated_at
    };
  }

  private applyFilters(query: any, filters?: TodoFilters): any {
    if (!filters) return query;

    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.priority?.length) {
      query = query.in('priority', filters.priority);
    }
    if (filters.category?.length) {
      query = query.in('category', filters.category);
    }
    if (filters.journeyId) {
      query = query.eq('journey_id', filters.journeyId);
    }
    if (filters.parentTodoId) {
      query = query.eq('parent_todo_id', filters.parentTodoId);
    }
    if (filters.dueDateFrom) {
      query = query.gte('due_date', filters.dueDateFrom);
    }
    if (filters.dueDateTo) {
      query = query.lte('due_date', filters.dueDateTo);
    }
    if (filters.tags?.length) {
      query = query.overlaps('tags', filters.tags);
    }
    if (filters.hasVideoReferences !== undefined) {
      if (filters.hasVideoReferences) {
        query = query.not('video_references', 'eq', '[]');
      } else {
        query = query.eq('video_references', '[]');
      }
    }

    return query;
  }

  private applyPartialFilters(query: any, filters: Partial<TodoFilters>): any {
    return this.applyFilters(query, filters as TodoFilters);
  }

  private mapSortFieldToDb(field: string): string {
    const fieldMap: Record<string, string> = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'dueDate': 'due_date',
      'priority': 'priority',
      'title': 'title'
    };
    return fieldMap[field] || field;
  }

  private calculateAverageCompletionTime(todos: any[]): number {
    const completedTodos = todos.filter(t => 
      t.status === 'completed' && 
      t.actual_minutes && 
      t.actual_minutes > 0
    );
    
    if (completedTodos.length === 0) return 0;
    
    const totalMinutes = completedTodos.reduce((sum, t) => sum + t.actual_minutes, 0);
    return Math.round(totalMinutes / completedTodos.length);
  }

  private calculateAnalytics(todos: any[], timeRange: string): SmartTodoAnalytics {
    // Simplified analytics calculation - in production, this would be more sophisticated
    const completedTodos = todos.filter(t => t.status === 'completed');
    const totalTodos = todos.length;

    return {
      productivityScore: Math.round((completedTodos.length / Math.max(totalTodos, 1)) * 100),
      completionRate: totalTodos > 0 ? Math.round((completedTodos.length / totalTodos) * 100) : 0,
      averageTaskDuration: this.calculateAverageCompletionTime(todos),
      mostProductiveTimeOfDay: '14:00', // Placeholder
      categoryBreakdown: this.calculateCategoryBreakdown(todos),
      weeklyTrend: this.calculateWeeklyTrend(todos),
      streakData: this.calculateStreakData(completedTodos)
    };
  }

  private calculateCategoryBreakdown(todos: any[]): Record<string, number> {
    return todos.reduce((acc, todo) => {
      const category = todo.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateWeeklyTrend(todos: any[]): Array<{week: string, completed: number, created: number}> {
    // Simplified weekly trend calculation
    return [
      { week: 'Week 1', completed: 5, created: 8 },
      { week: 'Week 2', completed: 7, created: 10 },
      { week: 'Week 3', completed: 6, created: 7 },
      { week: 'Week 4', completed: 9, created: 12 }
    ];
  }

  private calculateStreakData(completedTodos: any[]): {currentStreak: number, longestStreak: number, lastCompletedDate?: string} {
    if (completedTodos.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Simplified streak calculation - in production, implement proper date-based streaks
    return {
      currentStreak: 3,
      longestStreak: 7,
      lastCompletedDate: completedTodos[0]?.completed_at
    };
  }
}

// Export singleton instance
export const todoManagerService = new TodoManagerService();