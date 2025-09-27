import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { autoBumpService } from '@/services/autoBumpService'

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const body = await request.json()
    const { todoIds, targetDate, targetTime, reason = 'manual_reschedule' } = body

    // If specific todos provided, bump them manually
    if (todoIds && Array.isArray(todoIds)) {
      const results = []
      const errors = []

      for (const todoId of todoIds) {
        try {
          await autoBumpService.manualBump(
            todoId,
            userId,
            new Date(targetDate),
            targetTime,
            reason
          )
          results.push({ todoId, status: 'success' })
        } catch (error) {
          console.error(`Failed to bump todo ${todoId}:`, error)
          errors.push({
            todoId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return NextResponse.json({
        success: errors.length === 0,
        results,
        errors,
        message: `Successfully bumped ${results.length} todos`
      })
    }

    // Otherwise, run auto-bump process for all overdue todos
    const result = await autoBumpService.processAutoBump(userId)

    return NextResponse.json({
      success: result.success,
      bumpedCount: result.bumpedCount,
      skippedCount: result.skippedCount,
      errors: result.errors,
      message: result.success
        ? `Auto-bump completed: ${result.bumpedCount} todos bumped, ${result.skippedCount} skipped`
        : 'Auto-bump process failed'
    })
  } catch (error) {
    console.error('POST /api/todos/auto-bump error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const { searchParams } = new URL(request.url)
    const todoId = searchParams.get('todo_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    const bumpHistory = await autoBumpService.getBumpHistory(userId, todoId || undefined, limit)

    return NextResponse.json({
      history: bumpHistory,
      total: bumpHistory.length
    })
  } catch (error) {
    console.error('GET /api/todos/auto-bump error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}