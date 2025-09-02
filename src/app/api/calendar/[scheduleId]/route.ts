// Individual Schedule API Endpoints
// Part of: Phase 3A Calendar/Todo Implementation

import { NextRequest, NextResponse } from 'next/server';
import { calendarIntegrationService } from '@/services/calendar-integration';
import { auth } from '@clerk/nextjs';
import type { UpdateScheduleRequest } from '@/types/calendar';

interface RouteParams {
  params: {
    scheduleId: string;
  };
}

// GET /api/calendar/[scheduleId] - Get a specific schedule
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const schedule = await calendarIntegrationService.getSchedule(userId, params.scheduleId);

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    
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

// PUT /api/calendar/[scheduleId] - Update a specific schedule
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updateData: UpdateScheduleRequest = body;

    const schedule = await calendarIntegrationService.updateSchedule(userId, params.scheduleId, updateData);

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    
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

// DELETE /api/calendar/[scheduleId] - Delete a specific schedule
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await calendarIntegrationService.deleteSchedule(userId, params.scheduleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    
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