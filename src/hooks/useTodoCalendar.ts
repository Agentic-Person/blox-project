// Todo and Calendar Hook
// Part of: Phase 3A Calendar/Todo Implementation

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import type { 
  Todo, 
  CreateTodoRequest,
  UpdateTodoRequest, 
  TodoFilters,
  TodoStats
} from '@/types/todo';
import type { 
  ScheduleItem, 
  CreateScheduleRequest,
  UpdateScheduleRequest,
  ScheduleFilters
} from '@/types/calendar';

interface UseTodoCalendarOptions {
  autoFetch?: boolean;
  initialFilters?: {
    todos?: TodoFilters;
    schedule?: ScheduleFilters;
  };
}

interface UseTodoCalendarReturn {
  // Todo state
  todos: Todo[];
  todoStats: TodoStats | null;
  loadingTodos: boolean;
  
  // Schedule state
  todaySchedule: ScheduleItem[];
  weekSchedule: ScheduleItem[];
  loadingSchedule: boolean;
  
  // Error state
  error: string | null;
  
  // Todo actions
  createTodo: (data: CreateTodoRequest) => Promise<Todo>;
  updateTodo: (id: string, data: UpdateTodoRequest) => Promise<Todo>;
  deleteTodo: (id: string) => Promise<void>;
  markTodoCompleted: (id: string, actualMinutes?: number) => Promise<Todo>;
  
  // Schedule actions
  createSchedule: (data: CreateScheduleRequest) => Promise<ScheduleItem>;
  updateSchedule: (id: string, data: UpdateScheduleRequest) => Promise<ScheduleItem>;
  deleteSchedule: (id: string) => Promise<void>;
  markScheduleCompleted: (id: string) => Promise<ScheduleItem>;
  
  // Data fetching
  fetchTodos: (filters?: TodoFilters) => Promise<void>;
  fetchTodaySchedule: () => Promise<void>;
  fetchWeekSchedule: () => Promise<void>;
  fetchTodoStats: () => Promise<void>;
  
  // Refresh all data
  refreshAll: () => Promise<void>;
}

export function useTodoCalendar(options: UseTodoCalendarOptions = {}): UseTodoCalendarReturn {
  const { userId, isLoaded } = useAuth();
  const { autoFetch = true, initialFilters = {} } = options;

  // State
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoStats, setTodoStats] = useState<TodoStats | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<ScheduleItem[]>([]);
  const [loadingTodos, setLoadingTodos] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generic API helper
  const apiCall = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const response = await fetch(`/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  };

  // Todo Actions
  const createTodo = useCallback(async (data: CreateTodoRequest): Promise<Todo> => {
    try {
      setError(null);
      const todo = await apiCall<Todo>('/todos', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      setTodos(prev => [todo, ...prev]);
      return todo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create todo';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateTodo = useCallback(async (id: string, data: UpdateTodoRequest): Promise<Todo> => {
    try {
      setError(null);
      const updatedTodo = await apiCall<Todo>(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      setTodos(prev => prev.map(todo => todo.id === id ? updatedTodo : todo));
      return updatedTodo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update todo';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteTodo = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await apiCall(`/todos/${id}`, { method: 'DELETE' });
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete todo';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const markTodoCompleted = useCallback(async (id: string, actualMinutes?: number): Promise<Todo> => {
    return updateTodo(id, { 
      status: 'completed',
      actualMinutes 
    });
  }, [updateTodo]);

  // Schedule Actions
  const createSchedule = useCallback(async (data: CreateScheduleRequest): Promise<ScheduleItem> => {
    try {
      setError(null);
      const schedule = await apiCall<ScheduleItem>('/calendar', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      // Update relevant schedule arrays
      const scheduleDate = new Date(schedule.scheduledDate);
      const today = new Date();
      
      if (scheduleDate.toDateString() === today.toDateString()) {
        setTodaySchedule(prev => [...prev, schedule].sort((a, b) => 
          (a.startTime || '').localeCompare(b.startTime || '')
        ));
      }
      
      // Add to week schedule if within current week
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      if (scheduleDate >= startOfWeek && scheduleDate <= endOfWeek) {
        setWeekSchedule(prev => [...prev, schedule].sort((a, b) => 
          new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        ));
      }
      
      return schedule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create schedule';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateSchedule = useCallback(async (id: string, data: UpdateScheduleRequest): Promise<ScheduleItem> => {
    try {
      setError(null);
      const updatedSchedule = await apiCall<ScheduleItem>(`/calendar/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      // Update in both arrays
      setTodaySchedule(prev => prev.map(item => 
        item.id === id ? updatedSchedule : item
      ));
      setWeekSchedule(prev => prev.map(item => 
        item.id === id ? updatedSchedule : item
      ));
      
      return updatedSchedule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update schedule';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteSchedule = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await apiCall(`/calendar/${id}`, { method: 'DELETE' });
      
      setTodaySchedule(prev => prev.filter(item => item.id !== id));
      setWeekSchedule(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete schedule';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const markScheduleCompleted = useCallback(async (id: string): Promise<ScheduleItem> => {
    return updateSchedule(id, { status: 'completed' });
  }, [updateSchedule]);

  // Data Fetching
  const fetchTodos = useCallback(async (filters?: TodoFilters): Promise<void> => {
    if (!userId) return;
    
    try {
      setLoadingTodos(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (filters?.status?.length) queryParams.set('status', filters.status.join(','));
      if (filters?.priority?.length) queryParams.set('priority', filters.priority.join(','));
      if (filters?.category?.length) queryParams.set('category', filters.category.join(','));
      if (filters?.dueDateFrom) queryParams.set('dueDateFrom', filters.dueDateFrom);
      if (filters?.dueDateTo) queryParams.set('dueDateTo', filters.dueDateTo);
      if (filters?.journeyId) queryParams.set('journeyId', filters.journeyId);
      
      const response = await apiCall<{ todos: Todo[]; totalCount: number; hasMore: boolean }>(
        `/todos?${queryParams.toString()}`
      );
      
      setTodos(response.todos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch todos';
      setError(errorMessage);
    } finally {
      setLoadingTodos(false);
    }
  }, [userId]);

  const fetchTodaySchedule = useCallback(async (): Promise<void> => {
    if (!userId) return;
    
    try {
      setLoadingSchedule(true);
      setError(null);
      
      const schedule = await apiCall<ScheduleItem[]>('/calendar?today=true');
      setTodaySchedule(schedule);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch today schedule';
      setError(errorMessage);
    } finally {
      setLoadingSchedule(false);
    }
  }, [userId]);

  const fetchWeekSchedule = useCallback(async (): Promise<void> => {
    if (!userId) return;
    
    try {
      setLoadingSchedule(true);
      setError(null);
      
      const schedule = await apiCall<ScheduleItem[]>('/calendar?upcoming=7');
      setWeekSchedule(schedule);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch week schedule';
      setError(errorMessage);
    } finally {
      setLoadingSchedule(false);
    }
  }, [userId]);

  const fetchTodoStats = useCallback(async (): Promise<void> => {
    if (!userId) return;
    
    try {
      const stats = await apiCall<TodoStats>('/todos/stats');
      setTodoStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch todo stats';
      setError(errorMessage);
    }
  }, [userId]);

  const refreshAll = useCallback(async (): Promise<void> => {
    await Promise.all([
      fetchTodos(initialFilters.todos),
      fetchTodaySchedule(),
      fetchWeekSchedule(),
      fetchTodoStats()
    ]);
  }, [fetchTodos, fetchTodaySchedule, fetchWeekSchedule, fetchTodoStats, initialFilters.todos]);

  // Auto-fetch on mount and user change
  useEffect(() => {
    if (isLoaded && userId && autoFetch) {
      refreshAll();
    }
  }, [isLoaded, userId, autoFetch, refreshAll]);

  return {
    // State
    todos,
    todoStats,
    todaySchedule,
    weekSchedule,
    loadingTodos,
    loadingSchedule,
    error,
    
    // Actions
    createTodo,
    updateTodo,
    deleteTodo,
    markTodoCompleted,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    markScheduleCompleted,
    
    // Data fetching
    fetchTodos,
    fetchTodaySchedule,
    fetchWeekSchedule,
    fetchTodoStats,
    refreshAll,
  };
}