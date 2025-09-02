// Calendar Smart Scheduling API Endpoints
// Part of: Phase 3A Calendar/Todo Implementation

import { NextRequest, NextResponse } from 'next/server';
import { calendarIntegrationService } from '@/services/calendar-integration';
import { auth } from '@clerk/nextjs';

// POST /api/calendar/suggestions/optimal-slots - Find optimal time slots
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
    const { duration, dateRange, count } = body;

    if (!duration || !dateRange) {
      return NextResponse.json(
        { error: 'Duration and dateRange are required' },
        { status: 400 }
      );
    }

    const slots = await calendarIntegrationService.findOptimalTimeSlots(
      userId, 
      duration, 
      dateRange, 
      count
    );

    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error finding optimal slots:', error);
    
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

// GET /api/calendar/suggestions/todo/[todoId] - Get schedule suggestions for a todo
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
    const todoId = url.pathname.split('/').pop();

    if (!todoId) {
      return NextResponse.json(
        { error: 'Todo ID is required' },
        { status: 400 }
      );
    }

    const suggestion = await calendarIntegrationService.suggestScheduleForTodo(userId, todoId);

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('Error getting todo schedule suggestion:', error);
    
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