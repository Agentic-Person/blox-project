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

    // Get the existing event first to verify ownership
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
    const { id, user_id, created_at, ...updateData } = body

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

    // Update the event
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

    // First check if event exists and belongs to user
    const { data: existingEvent, error: fetchError } = await supabase
      .from('calendar_events')
      .select('id, title')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Delete the event
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting event:', error)
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Event deleted successfully',
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
