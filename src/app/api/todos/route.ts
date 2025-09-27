import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { autoBumpService } from '@/services/autoBumpService'

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
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')
    const scheduledDate = searchParams.get('scheduled_date')
    const dueBefore = searchParams.get('due_before')
    const dueAfter = searchParams.get('due_after')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeCompleted = searchParams.get('include_completed') === 'true'
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('order_index')
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status && !includeCompleted) {
      const statuses = status.split(',') as ('pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled' | 'archived')[]
      query = query.in('status', statuses)
    } else if (!includeCompleted) {
      query = query.not('status', 'eq', 'completed')
    }

    if (priority) {
      const priorities = priority.split(',') as ('low' | 'medium' | 'high' | 'urgent')[]
      query = query.in('priority', priorities)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (scheduledDate) {
      query = query.eq('scheduled_date', scheduledDate)
    }

    if (dueBefore) {
      query = query.lte('due_date', dueBefore)
    }

    if (dueAfter) {
      query = query.gte('due_date', dueAfter)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: todos, error, count } = await query

    if (error) {
      console.error('Error fetching todos:', error)
      return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 })
    }

    return NextResponse.json({
      todos: todos || [],
      total: count || todos?.length || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('GET /api/todos error:', error)
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

    // Prepare todo data
    const todoData = {
      user_id: userId,
      title: body.title,
      description: body.description || null,
      priority: body.priority || 'medium',
      status: body.status || 'pending',
      estimated_minutes: body.estimated_minutes || null,
      actual_minutes: body.actual_minutes || null,
      due_date: body.due_date || null,
      scheduled_date: body.scheduled_date || null,
      scheduled_time: body.scheduled_time || null,
      category: body.category || null,
      tags: body.tags || [],
      order_index: body.order_index || 0,
      parent_todo_id: body.parent_todo_id || null,
      auto_bumped: body.auto_bumped || false,
      bump_count: body.bump_count || 0,
      last_bumped_at: body.last_bumped_at || null,
      original_due_date: body.original_due_date || null,
      generated_from: body.generated_from || null,
      confidence: body.confidence || null,
      auto_generated: body.auto_generated || false,
      learning_objectives: body.learning_objectives || [],
      prerequisites: body.prerequisites || [],
      video_references: body.video_references || [],
      created_by: userId,
      assigned_to: body.assigned_to || userId
    }

    // If no order_index provided, get the next available index
    if (todoData.order_index === 0) {
      const { data: lastTodo } = await supabase
        .from('todos')
        .select('order_index')
        .eq('user_id', userId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single()

      todoData.order_index = (lastTodo?.order_index || 0) + 1
    }

    const { data: todo, error } = await supabase
      .from('todos')
      .insert([todoData])
      .select()
      .single()

    if (error) {
      console.error('Error creating todo:', error)
      return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 })
    }

    return NextResponse.json({ todo }, { status: 201 })
  } catch (error) {
    console.error('POST /api/todos error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}