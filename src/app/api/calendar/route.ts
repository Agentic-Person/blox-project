// Calendar API Endpoints
// Part of: Phase 3A Calendar/Todo Implementation

import { NextRequest, NextResponse } from 'next/server';
import { calendarIntegrationService } from '@/services/calendar-integration';
import { auth } from '@clerk/nextjs';
import type { 
  CreateScheduleRequest, 
  UpdateScheduleRequest, 
  ScheduleFilters
} from '@/types/calendar';

// GET /api/calendar - List schedules with filtering
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
    
    // Parse filters
    const filters: ScheduleFilters = {
      dateFrom: url.searchParams.get('dateFrom') || undefined,
      dateTo: url.searchParams.get('dateTo') || undefined,
      taskTypes: url.searchParams.get('taskTypes')?.split(',') as any,
      status: url.searchParams.get('status')?.split(',') as any,
      priority: url.searchParams.get('priority')?.split(',') as any,
      todoId: url.searchParams.get('todoId') || undefined,
      videoId: url.searchParams.get('videoId') || undefined,
      search: url.searchParams.get('search') || undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof ScheduleFilters] === undefined) {
        delete filters[key as keyof ScheduleFilters];
      }
    });

    // Check for specific date range queries
    const today = url.searchParams.get('today');
    const upcoming = url.searchParams.get('upcoming');
    
    let schedules;
    if (today === 'true') {
      schedules = await calendarIntegrationService.getTodaySchedule(userId);
    } else if (upcoming) {
      const days = parseInt(upcoming) || 7;
      schedules = await calendarIntegrationService.getUpcomingSchedules(userId, days);
    } else {
      schedules = await calendarIntegrationService.getSchedules(userId, filters);
    }

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    
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

// POST /api/calendar - Create a new schedule
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

    const schedule = await calendarIntegrationService.createSchedule(userId, scheduleData);

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    
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