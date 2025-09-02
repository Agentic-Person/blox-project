// Todo Suggestions API Endpoint
// Part of: Phase 3A Calendar/Todo Implementation

import { NextRequest, NextResponse } from 'next/server';
import { todoManagerService } from '@/services/todo-manager';
import { auth } from '@clerk/nextjs';

// GET /api/todos/suggestions - Get smart todo suggestions
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
    const limit = parseInt(url.searchParams.get('limit') || '5');

    const suggestions = await todoManagerService.getSmartSuggestions(userId, limit);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching todo suggestions:', error);
    
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