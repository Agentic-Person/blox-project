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
    const { data: todo, error } = await supabase
      .from('todos')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
      }
      console.error('Error fetching todo:', error)
      return NextResponse.json({ error: 'Failed to fetch todo' }, { status: 500 })
    }

    return NextResponse.json({ todo })
  } catch (error) {
    console.error('GET /api/todos/[id] error:', error)
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

    // Remove fields that shouldn't be updated
    const { id, user_id, created_at, created_by, ...updateData } = body

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Handle completion
    if (updateData.status === 'completed' && !updateData.completed_at) {
      updateData.completed_at = new Date().toISOString()
    } else if (updateData.status !== 'completed') {
      updateData.completed_at = null
    }

    const { data: todo, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
      }
      console.error('Error updating todo:', error)
      return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 })
    }

    return NextResponse.json({ todo })
  } catch (error) {
    console.error('PUT /api/todos/[id] error:', error)
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

    // First check if todo exists and belongs to user
    const { data: existingTodo } = await supabase
      .from('todos')
      .select('id, title')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()

    if (!existingTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    // Delete the todo (cascading will handle related records)
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting todo:', error)
      return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Todo deleted successfully',
      deletedTodo: existingTodo
    })
  } catch (error) {
    console.error('DELETE /api/todos/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}