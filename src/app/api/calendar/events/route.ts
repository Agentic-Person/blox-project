import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const startTime = searchParams.get('start_time')
    const endTime = searchParams.get('end_time')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeRecurring = searchParams.get('include_recurring') !== 'false'

    // Build query
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time')
      .range(offset, offset + limit - 1)

    // Apply time range filter
    if (startTime) {
      query = query.gte('start_time', startTime)
    }
    if (endTime) {
      query = query.lte('start_time', endTime)
    }

    // Apply other filters
    if (type) {
      const types = type.split(',') as ('video' | 'practice' | 'project' | 'review' | 'meeting' | 'break' | 'custom')[]
      query = query.in('type', types)
    }

    if (status) {
      query = query.eq('status', status)
    } else {
      // Default to confirmed events only
      query = query.eq('status', 'confirmed')
    }

    if (!includeRecurring) {
      query = query.is('parent_event_id', null)
    }

    const { data: events, error, count } = await query

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    return NextResponse.json({
      events: events || [],
      total: count || events?.length || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('GET /api/calendar/events error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!body.start_time) {
      return NextResponse.json({ error: 'Start time is required' }, { status: 400 })
    }
    if (!body.end_time) {
      return NextResponse.json({ error: 'End time is required' }, { status: 400 })
    }

    // Validate time range
    const startTime = new Date(body.start_time)
    const endTime = new Date(body.end_time)

    if (startTime >= endTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    // Prepare event data
    const eventData = {
      user_id: userId,
      title: body.title,
      description: body.description || null,
      type: body.type || 'custom',
      start_time: body.start_time,
      end_time: body.end_time,
      all_day: body.all_day || false,
      timezone: body.timezone || 'UTC',
      color: body.color || '#3b82f6',
      location: body.location || null,
      url: body.url || null,
      recurring_config: body.recurring_config || null,
      parent_event_id: body.parent_event_id || null,
      recurrence_exception: body.recurrence_exception || false,
      reminder_minutes: body.reminder_minutes || [15],
      related_todo_ids: body.related_todo_ids || [],
      video_reference: body.video_reference || null,
      status: body.status || 'confirmed',
      visibility: body.visibility || 'private',
      created_by: userId
    }

    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert([eventData])
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    // Handle recurring events
    if (body.recurring_config && body.recurring_config.frequency) {
      try {
        const recurringEvents = generateRecurringEvents(event, body.recurring_config)

        if (recurringEvents.length > 0) {
          const { data: createdRecurringEvents, error: recurringError } = await supabase
            .from('calendar_events')
            .insert(recurringEvents)
            .select()

          if (recurringError) {
            console.error('Error creating recurring events:', recurringError)
            // Don't fail the main event creation, just log the error
          }
        }
      } catch (recurringError) {
        console.error('Error generating recurring events:', recurringError)
      }
    }

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('POST /api/calendar/events error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to generate recurring events
function generateRecurringEvents(baseEvent: any, recurringConfig: any) {
  const events = []
  const startDate = new Date(baseEvent.start_time)
  const endDate = new Date(baseEvent.end_time)
  const duration = endDate.getTime() - startDate.getTime()

  const { frequency, interval = 1, endDate: recurringEndDate, maxOccurrences = 52 } = recurringConfig

  let currentDate = new Date(startDate)
  let occurrenceCount = 0

  // Generate up to maxOccurrences or until endDate
  while (occurrenceCount < maxOccurrences) {
    // Move to next occurrence
    switch (frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + interval)
        break
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (7 * interval))
        break
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + interval)
        break
      default:
        return events // Invalid frequency
    }

    // Check if we've exceeded the end date
    if (recurringEndDate && currentDate > new Date(recurringEndDate)) {
      break
    }

    // Create recurring event
    const recurringEvent = {
      ...baseEvent,
      id: undefined, // Let database generate new ID
      start_time: currentDate.toISOString(),
      end_time: new Date(currentDate.getTime() + duration).toISOString(),
      parent_event_id: baseEvent.id,
      created_at: undefined,
      updated_at: undefined
    }

    events.push(recurringEvent)
    occurrenceCount++

    // Don't generate too many events in one request
    if (events.length >= 50) {
      break
    }
  }

  return events
}