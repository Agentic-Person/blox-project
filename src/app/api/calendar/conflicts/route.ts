// Calendar Conflicts API Endpoints
// Part of: Phase 3A Calendar/Todo Implementation

import { NextRequest, NextResponse } from 'next/server';
import { calendarIntegrationService } from '@/services/calendar-integration';
import { auth } from '@clerk/nextjs';
import type { CreateScheduleRequest } from '@/types/calendar';

// GET /api/calendar/conflicts - Get active schedule conflicts
export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const conflicts = await calendarIntegrationService.getActiveConflicts(userId);

    return NextResponse.json(conflicts);
  } catch (error) {
    console.error('Error fetching conflicts:', error);
    
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

// POST /api/calendar/conflicts/detect - Detect conflicts for a potential schedule
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
    const scheduleData: CreateScheduleRequest = body;

    const conflicts = await calendarIntegrationService.detectConflicts(userId, scheduleData);

    return NextResponse.json(conflicts);
  } catch (error) {
    console.error('Error detecting conflicts:', error);
    
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