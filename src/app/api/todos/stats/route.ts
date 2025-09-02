// Todo Stats and Analytics API Endpoints
// Part of: Phase 3A Calendar/Todo Implementation

import { NextRequest, NextResponse } from 'next/server';
import { todoManagerService } from '@/services/todo-manager';
import { auth } from '@clerk/nextjs';
import type { TodoFilters } from '@/types/todo';

// GET /api/todos/stats - Get todo statistics
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    
    // Parse optional filters for stats
    const filters: Partial<TodoFilters> = {
      status: url.searchParams.get('status')?.split(',') as any,
      category: url.searchParams.get('category')?.split(','),
      journeyId: url.searchParams.get('journeyId') || undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof TodoFilters] === undefined) {
        delete filters[key as keyof TodoFilters];
      }
    });

    const stats = await todoManagerService.getTodoStats(userId, filters);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching todo stats:', error);
    
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