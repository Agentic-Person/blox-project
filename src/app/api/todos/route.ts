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
    const priority = searchParams.get('priority')
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (!includeCompleted) {
      query = query.eq('completed', false)
    }

    if (priority) {
      const priorities = priority.split(',')
      query = query.in('priority', priorities)
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

    // Prepare todo data - only fields that exist in the schema
    const todoData = {
      user_id: userId,
      title: body.title,
      description: body.description || null,
      priority: body.priority || 'medium',
      due_date: body.due_date || null,
      completed: body.completed || false,
      auto_bump: body.auto_bump || false
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
