// Todo API Endpoints
// Part of: Phase 3A Calendar/Todo Implementation

import { NextRequest, NextResponse } from 'next/server';
import { todoManagerService } from '@/services/todo-manager';
import { currentUser } from '@clerk/nextjs/server';
import type { 
  CreateTodoRequest, 
  UpdateTodoRequest, 
  TodoFilters, 
  TodoSortOptions, 
  PaginationOptions 
} from '@/types/todo';

// GET /api/todos - List todos with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    const url = new URL(request.url);
    
    // Parse filters
    const filters: TodoFilters = {
      status: url.searchParams.get('status')?.split(',') as any,
      priority: url.searchParams.get('priority')?.split(',') as any,
      category: url.searchParams.get('category')?.split(','),
      tags: url.searchParams.get('tags')?.split(','),
      dueDateFrom: url.searchParams.get('dueDateFrom') || undefined,
      dueDateTo: url.searchParams.get('dueDateTo') || undefined,
      hasVideoReferences: url.searchParams.get('hasVideoReferences') === 'true' ? true : 
                         url.searchParams.get('hasVideoReferences') === 'false' ? false : undefined,
      parentTodoId: url.searchParams.get('parentTodoId') || undefined,
      journeyId: url.searchParams.get('journeyId') || undefined,
      search: url.searchParams.get('search') || undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof TodoFilters] === undefined) {
        delete filters[key as keyof TodoFilters];
      }
    });

    // Parse sorting
    const sort: TodoSortOptions = {
      field: (url.searchParams.get('sortField') as any) || 'createdAt',
      direction: (url.searchParams.get('sortDirection') as any) || 'desc'
    };

    // Parse pagination
    const pagination: PaginationOptions = {
      limit: parseInt(url.searchParams.get('limit') || '20'),
      offset: parseInt(url.searchParams.get('offset') || '0')
    };

    const result = await todoManagerService.getTodos(userId, filters, sort, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching todos:', error);
    
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as any).statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/todos - Create a new todo
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    const body = await request.json();
    const todoData: CreateTodoRequest = body;

    const todo = await todoManagerService.createTodo(userId, todoData);

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as any).statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}