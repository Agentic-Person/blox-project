import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const supabase = createClient()
    const { data: event, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }
      console.error('Error fetching event:', error)
      return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('GET /api/calendar/events/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const supabase = createClient()
    const body = await request.json()

    // Get the existing event first
    const { data: existingEvent, error: fetchError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }
      console.error('Error fetching existing event:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
    }

    // Remove fields that shouldn't be updated
    const { id, user_id, created_at, created_by, ...updateData } = body

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Validate time range if times are being updated
    if (updateData.start_time && updateData.end_time) {
      const startTime = new Date(updateData.start_time)
      const endTime = new Date(updateData.end_time)

      if (startTime >= endTime) {
        return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
      }
    }

    // Handle recurring event updates
    const { searchParams } = new URL(request.url)
    const updateRecurring = searchParams.get('update_recurring')

    if (updateRecurring && existingEvent.parent_event_id) {
      // This is a recurring event instance
      if (updateRecurring === 'this_only') {
        // Update only this instance - mark as exception
        updateData.recurrence_exception = true
      } else if (updateRecurring === 'this_and_future') {
        // Update this and future instances
        // First, update this instance
        const { error: updateError } = await supabase
          .from('calendar_events')
          .update(updateData)
          .eq('id', params.id)

        if (updateError) {
          console.error('Error updating event:', updateError)
          return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
        }

        // Then update future instances
        const { error: futureError } = await supabase
          .from('calendar_events')
          .update(updateData)
          .eq('parent_event_id', existingEvent.parent_event_id)
          .gte('start_time', existingEvent.start_time)

        if (futureError) {
          console.error('Error updating future events:', futureError)
          // Don't fail the request, this event was still updated
        }

        // Return the updated event
        const { data: updatedEvent } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('id', params.id)
          .single()

        return NextResponse.json({ event: updatedEvent })
      } else if (updateRecurring === 'all') {
        // Update all instances in the series
        const parentId = existingEvent.parent_event_id || existingEvent.id

        const { error: allError } = await supabase
          .from('calendar_events')
          .update(updateData)
          .or(`id.eq.${parentId},parent_event_id.eq.${parentId}`)

        if (allError) {
          console.error('Error updating all recurring events:', allError)
          return NextResponse.json({ error: 'Failed to update recurring events' }, { status: 500 })
        }

        // Return the updated event
        const { data: updatedEvent } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('id', params.id)
          .single()

        return NextResponse.json({ event: updatedEvent })
      }
    }

    // Regular single event update
    const { data: event, error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating event:', error)
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('PUT /api/calendar/events/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const deleteRecurring = searchParams.get('delete_recurring')

    // First check if event exists and belongs to user
    const { data: existingEvent } = await supabase
      .from('calendar_events')
      .select('id, title, parent_event_id, start_time')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    let deletedCount = 1

    // Handle recurring event deletion
    if (deleteRecurring && existingEvent.parent_event_id) {
      if (deleteRecurring === 'this_only') {
        // Delete only this instance
        const { error } = await supabase
          .from('calendar_events')
          .delete()
          .eq('id', params.id)
          .eq('user_id', userId)

        if (error) {
          console.error('Error deleting event:', error)
          return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
        }
      } else if (deleteRecurring === 'this_and_future') {
        // Delete this and future instances
        const { error: deleteError, count } = await supabase
          .from('calendar_events')
          .delete()
          .eq('parent_event_id', existingEvent.parent_event_id)
          .gte('start_time', existingEvent.start_time)

        if (deleteError) {
          console.error('Error deleting future events:', deleteError)
          return NextResponse.json({ error: 'Failed to delete future events' }, { status: 500 })
        }

        deletedCount = count || 1
      } else if (deleteRecurring === 'all') {
        // Delete all instances in the series
        const parentId = existingEvent.parent_event_id

        const { error: deleteAllError, count } = await supabase
          .from('calendar_events')
          .delete()
          .or(`id.eq.${parentId},parent_event_id.eq.${parentId}`)

        if (deleteAllError) {
          console.error('Error deleting all recurring events:', deleteAllError)
          return NextResponse.json({ error: 'Failed to delete recurring events' }, { status: 500 })
        }

        deletedCount = count || 1
      }
    } else {
      // Regular single event deletion (or parent of recurring series)
      let deleteQuery = supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', userId)

      if (existingEvent.parent_event_id) {
        // This is a single instance of a recurring series
        deleteQuery = deleteQuery.eq('id', params.id)
      } else {
        // This might be a parent event - delete all related instances too
        deleteQuery = deleteQuery.or(`id.eq.${params.id},parent_event_id.eq.${params.id}`)
      }

      const { error, count } = await deleteQuery

      if (error) {
        console.error('Error deleting event:', error)
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
      }

      deletedCount = count || 1
    }

    return NextResponse.json({
      message: `Successfully deleted ${deletedCount} event(s)`,
      deletedCount,
      deletedEvent: {
        id: existingEvent.id,
        title: existingEvent.title
      }
    })
  } catch (error) {
    console.error('DELETE /api/calendar/events/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}