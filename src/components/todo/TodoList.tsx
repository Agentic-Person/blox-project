'use client'

import React, { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, GripVertical, Loader2 } from 'lucide-react'
import { DraggableTodoItem } from './DraggableTodoItem'
import { TodoBulkActions } from './TodoBulkActions'
import { useTodoCalendar } from '@/hooks/useTodoCalendar'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import type { Todo } from '@/types/todo'

interface TodoListProps {
  title?: string
  filter?: 'all' | 'pending' | 'in_progress' | 'completed'
  showBulkActions?: boolean
  maxHeight?: string
  onCreateTodo?: () => void
}

export function TodoList({ 
  title = "My Tasks", 
  filter = 'all',
  showBulkActions = true,
  maxHeight = "600px",
  onCreateTodo
}: TodoListProps) {
  const { 
    todos, 
    loadingTodos, 
    error, 
    updateTodo, 
    deleteTodo, 
    markTodoCompleted,
    refreshTodos 
  } = useTodoCalendar()
  
  const {
    selectedItems,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    hasSelection
  } = useBulkSelection<Todo>()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  // Filter todos based on filter prop
  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true
    return todo.status === filter
  })

  // Sort todos by display_order (from metadata) or created_at
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    const orderA = a.metadata?.display_order ?? 0
    const orderB = b.metadata?.display_order ?? 0
    return orderA - orderB || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      setActiveId(null)
      return
    }

    const oldIndex = sortedTodos.findIndex(todo => todo.id === active.id)
    const newIndex = sortedTodos.findIndex(todo => todo.id === over.id)
    
    if (oldIndex === -1 || newIndex === -1) {
      setActiveId(null)
      return
    }

    // Optimistic update
    const newTodos = arrayMove(sortedTodos, oldIndex, newIndex)
    
    try {
      setReordering(true)
      
      // Update display orders
      const updates = newTodos.map((todo, index) => ({
        id: todo.id,
        metadata: {
          ...todo.metadata,
          display_order: index
        }
      }))

      // Batch update all positions
      await Promise.all(
        updates.map(update => 
          updateTodo(update.id, { metadata: update.metadata })
        )
      )

    } catch (error) {
      console.error('Failed to reorder todos:', error)
      // Refresh to get correct order from server
      refreshTodos()
    } finally {
      setReordering(false)
      setActiveId(null)
    }
  }, [sortedTodos, updateTodo, refreshTodos])

  const handleBulkComplete = useCallback(async () => {
    try {
      await Promise.all(
        selectedItems.map(todo => markTodoCompleted(todo.id))
      )
      clearSelection()
    } catch (error) {
      console.error('Failed to complete todos:', error)
    }
  }, [selectedItems, markTodoCompleted, clearSelection])

  const handleBulkDelete = useCallback(async () => {
    if (!window.confirm(`Delete ${selectedItems.length} selected todos?`)) {
      return
    }
    
    try {
      await Promise.all(
        selectedItems.map(todo => deleteTodo(todo.id))
      )
      clearSelection()
    } catch (error) {
      console.error('Failed to delete todos:', error)
    }
  }, [selectedItems, deleteTodo, clearSelection])

  const activeTodo = activeId ? sortedTodos.find(todo => todo.id === activeId) : null

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GripVertical className="h-5 w-5 text-blox-teal" />
            <CardTitle className="text-lg font-semibold text-blox-white">
              {title}
            </CardTitle>
            {reordering && (
              <Loader2 className="h-4 w-4 animate-spin text-blox-teal" />
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-blox-off-white">
              {filteredTodos.length} tasks
            </span>
            <Button
              size="sm"
              onClick={onCreateTodo}
              className="bg-blox-teal hover:bg-blox-teal/80"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && hasSelection && (
          <TodoBulkActions
            selectedCount={selectedItems.length}
            onComplete={handleBulkComplete}
            onDelete={handleBulkDelete}
            onSelectAll={() => selectAll(filteredTodos)}
            onClearSelection={clearSelection}
          />
        )}
      </CardHeader>
      
      <CardContent>
        {loadingTodos ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blox-teal" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={refreshTodos}
              className="text-xs"
            >
              Retry
            </Button>
          </div>
        ) : sortedTodos.length === 0 ? (
          <div className="text-center py-8 text-blox-off-white/60">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-sm mb-2">No {filter !== 'all' ? filter.replace('_', ' ') : ''} tasks</p>
            <p className="text-xs">Create your first task to get started!</p>
          </div>
        ) : (
          <div 
            className="space-y-2 overflow-y-auto pr-1"
            style={{ maxHeight }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedTodos.map(todo => todo.id)}
                strategy={verticalListSortingStrategy}
              >
                {sortedTodos.map((todo) => (
                  <DraggableTodoItem
                    key={todo.id}
                    todo={todo}
                    selected={isSelected(todo)}
                    onSelect={() => toggleSelection(todo)}
                    onUpdate={(data) => updateTodo(todo.id, data)}
                    onDelete={() => deleteTodo(todo.id)}
                    onComplete={() => markTodoCompleted(todo.id)}
                    showBulkCheckbox={showBulkActions}
                  />
                ))}
              </SortableContext>

              <DragOverlay>
                {activeTodo ? (
                  <DraggableTodoItem
                    todo={activeTodo}
                    selected={false}
                    onSelect={() => {}}
                    onUpdate={() => {}}
                    onDelete={() => {}}
                    onComplete={() => {}}
                    showBulkCheckbox={false}
                    isDragOverlay
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </CardContent>
    </Card>
  )
}