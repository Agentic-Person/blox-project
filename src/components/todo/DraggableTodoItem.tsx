'use client'

import React, { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  GripVertical,
  Clock,
  Play,
  CheckCircle,
  MoreVertical,
  Edit3,
  Trash2,
  Calendar,
  Tag,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Todo, UpdateTodoRequest } from '@/types/todo'

interface DraggableTodoItemProps {
  todo: Todo
  selected: boolean
  onSelect: () => void
  onUpdate: (data: UpdateTodoRequest) => Promise<void>
  onDelete: () => Promise<void>
  onComplete: () => Promise<void>
  showBulkCheckbox?: boolean
  isDragOverlay?: boolean
}

const priorityColors = {
  low: 'bg-gray-500/20 text-gray-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  urgent: 'bg-red-500/20 text-red-400'
}

const statusColors = {
  pending: 'bg-gray-500/20 text-gray-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  blocked: 'bg-yellow-500/20 text-yellow-400'
}

export function DraggableTodoItem({
  todo,
  selected,
  onSelect,
  onUpdate,
  onDelete,
  onComplete,
  showBulkCheckbox = true,
  isDragOverlay = false
}: DraggableTodoItemProps) {
  const [updating, setUpdating] = useState(false)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleStatusChange = async (status: Todo['status']) => {
    if (updating) return
    
    try {
      setUpdating(true)
      await onUpdate({ status })
    } catch (error) {
      console.error('Failed to update todo status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handlePriorityChange = async (priority: Todo['priority']) => {
    if (updating) return
    
    try {
      setUpdating(true)
      await onUpdate({ priority })
    } catch (error) {
      console.error('Failed to update todo priority:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleComplete = async () => {
    if (updating) return
    
    try {
      setUpdating(true)
      await onComplete()
    } catch (error) {
      console.error('Failed to complete todo:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this todo?')) return
    
    if (updating) return
    
    try {
      setUpdating(true)
      await onDelete()
    } catch (error) {
      console.error('Failed to delete todo:', error)
      setUpdating(false)
    }
  }

  const isCompleted = todo.status === 'completed'
  const isBlocked = todo.status === 'blocked'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200",
        isDragOverlay && "shadow-lg ring-2 ring-blox-teal/50",
        isDragging && "opacity-50",
        selected && "ring-2 ring-blox-teal/50 bg-blox-teal/5",
        isCompleted && "opacity-75",
        isBlocked && "border-yellow-500/30",
        !isDragOverlay && !isDragging && "hover:bg-blox-second-dark-blue/30",
        "bg-blox-second-dark-blue/20 border-blox-second-dark-blue/30"
      )}
    >
      {/* Bulk Selection Checkbox */}
      {showBulkCheckbox && (
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          className="flex-shrink-0"
        />
      )}

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "flex-shrink-0 p-1 rounded cursor-grab hover:bg-blox-second-dark-blue/50",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          isDragging && "cursor-grabbing"
        )}
      >
        <GripVertical className="h-4 w-4 text-blox-off-white/60" />
      </div>

      {/* Status Indicator */}
      <div className="flex-shrink-0">
        {isCompleted ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <button
            onClick={handleComplete}
            disabled={updating}
            className={cn(
              "w-5 h-5 rounded-full border-2 transition-colors",
              isBlocked 
                ? "border-yellow-500 bg-yellow-500/10" 
                : "border-blox-teal hover:bg-blox-teal/10 cursor-pointer"
            )}
          />
        )}
      </div>

      {/* Todo Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 space-y-1">
            {/* Title */}
            <h4 className={cn(
              "text-sm font-medium truncate",
              isCompleted ? "text-green-400 line-through" : "text-blox-white"
            )}>
              {todo.title}
            </h4>

            {/* Description */}
            {todo.description && (
              <p className="text-xs text-blox-off-white/70 line-clamp-2">
                {todo.description}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center space-x-2 text-xs">
              {/* Duration */}
              {todo.estimatedMinutes && (
                <div className="flex items-center space-x-1 text-blox-off-white/60">
                  <Clock className="h-3 w-3" />
                  <span>{todo.estimatedMinutes}m</span>
                </div>
              )}

              {/* Due Date */}
              {todo.dueDate && (
                <>
                  <span className="text-blox-off-white/30">•</span>
                  <div className="flex items-center space-x-1 text-blox-off-white/60">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(todo.dueDate).toLocaleDateString()}</span>
                  </div>
                </>
              )}

              {/* Priority */}
              <Badge className={cn("text-xs px-2 py-0.5", priorityColors[todo.priority])}>
                {todo.priority}
              </Badge>

              {/* Status */}
              {todo.status !== 'pending' && (
                <Badge className={cn("text-xs px-2 py-0.5", statusColors[todo.status])}>
                  {todo.status.replace('_', ' ')}
                </Badge>
              )}

              {/* Category */}
              {todo.category && (
                <>
                  <span className="text-blox-off-white/30">•</span>
                  <div className="flex items-center space-x-1 text-blox-off-white/60">
                    <Tag className="h-3 w-3" />
                    <span>{todo.category}</span>
                  </div>
                </>
              )}
            </div>

            {/* Tags */}
            {todo.tags && todo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {todo.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className="text-xs px-1.5 py-0.5 text-blox-off-white/60 border-blox-off-white/20"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Video References */}
            {todo.videoReferences && todo.videoReferences.length > 0 && (
              <div className="flex items-center space-x-1 text-xs text-blue-400">
                <Play className="h-3 w-3" />
                <span>{todo.videoReferences.length} video{todo.videoReferences.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Actions Menu */}
          {!isDragOverlay && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Status Changes */}
                <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Working
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('blocked')}>
                  <Minus className="h-4 w-4 mr-2" />
                  Mark Blocked
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Priority Changes */}
                <DropdownMenuItem onClick={() => handlePriorityChange('high')}>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  High Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePriorityChange('low')}>
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Low Priority
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Edit & Delete */}
                <DropdownMenuItem>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-400 focus:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}