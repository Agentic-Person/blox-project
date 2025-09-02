// Todo Templates API Endpoints
// Part of: Phase 3A Calendar/Todo Implementation

import { NextRequest, NextResponse } from 'next/server';
import { todoManagerService } from '@/services/todo-manager';
import { auth } from '@clerk/nextjs';
import type { CreateTodoRequest } from '@/types/todo';

// GET /api/todos/templates - Get all available todo templates
export async function GET() {
  try {
    const templates = await todoManagerService.getTodoTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching todo templates:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/todos/templates/[templateId] - Create todo from template
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId, customizations } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const todo = await todoManagerService.createTodoFromTemplate(
      userId, 
      templateId, 
      customizations
    );

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo from template:', error);
    
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