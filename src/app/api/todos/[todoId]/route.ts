// Individual Todo API Endpoints
// Part of: Phase 3A Calendar/Todo Implementation

import { NextRequest, NextResponse } from 'next/server';
import { todoManagerService } from '@/services/todo-manager';
import { currentUser } from '@clerk/nextjs/server';
import type { UpdateTodoRequest } from '@/types/todo';

interface RouteParams {
  params: {
    todoId: string;
  };
}

// GET /api/todos/[todoId] - Get a specific todo
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const userId = user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const todo = await todoManagerService.getTodo(userId, params.todoId);

    return NextResponse.json(todo);
  } catch (error) {
    console.error('Error fetching todo:', error);
    
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

// PUT /api/todos/[todoId] - Update a specific todo
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const userId = user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updateData: UpdateTodoRequest = body;

    const todo = await todoManagerService.updateTodo(userId, params.todoId, updateData);

    return NextResponse.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    
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

// DELETE /api/todos/[todoId] - Delete a specific todo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const userId = user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await todoManagerService.deleteTodo(userId, params.todoId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting todo:', error);
    
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