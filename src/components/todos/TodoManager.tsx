'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Sparkles,
  BookOpen,
  Code,
  Video,
  TrendingUp,
  Timer,
  Flag,
  Tag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCalendarTodoStore, Todo } from '@/store/calendarTodoStore'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  closestCenter
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useUser } from '@clerk/nextjs'
import { format } from 'date-fns'

interface TodoManagerProps {
  className?: string
  viewMode?: 'list' | 'board' | 'timeline'
  onTodoClick?: (todo: Todo) => void
}

interface CreateTodoFormData {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  estimatedMinutes: number
  dueDate: string
  scheduledDate: string
  scheduledTime: string
  tags: string[]
}

const priorityColors = {
  urgent: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#10b981'
}

const categoryIcons = {
  practice: Code,
  learn: BookOpen,
  build: Target,
  review: TrendingUp,
  video: Video,
  other: AlertCircle
}

function SortableTodoCard({
  todo,
  onClick,
  onEdit,
  onDelete,
  onComplete,
  onSchedule
}: {
  todo: Todo
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onComplete?: () => void
  onSchedule?: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: todo.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const Icon = categoryIcons[todo.category as keyof typeof categoryIcons] || AlertCircle

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981'
      case 'in_progress': return '#3b82f6'
      case 'blocked': return '#ef4444'
      case 'cancelled': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && todo.status !== 'completed'

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className={`
        group p-4 rounded-lg border bg-blox-second-dark-blue/30
        hover:bg-blox-second-dark-blue/50 transition-all duration-200
        cursor-pointer ${isDragging ? 'z-50' : 'z-10'}
        ${isOverdue ? 'border-red-500/50' : 'border-blox-off-white/10'}
      `}
      onClick={() => onClick?.()}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${priorityColors[todo.priority]}20` }}>
            <Icon className="h-4 w-4" style={{ color: priorityColors[todo.priority] }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold text-blox-white truncate ${
                todo.status === 'completed' ? 'line-through opacity-60' : ''
              }`}>
                {todo.title}
              </h3>

              {todo.auto_generated && (
                <Badge variant="outline" className="text-xs px-1 py-0 text-blox-teal border-blox-teal/50">
                  <Sparkles className="h-2 w-2 mr-1" />
                  AI
                </Badge>
              )}

              {todo.auto_bumped && (
                <Badge variant="outline" className="text-xs px-1 py-0 text-orange-400 border-orange-400/50">
                  Bumped {todo.bump_count}x
                </Badge>
              )}

              {isOverdue && (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  Overdue
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-blox-off-white/60">
              <div className="flex items-center gap-1">
                <Flag className="h-3 w-3" style={{ color: priorityColors[todo.priority] }} />
                <span className="capitalize">{todo.priority}</span>
              </div>

              {todo.estimated_minutes && (
                <div className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  <span>{todo.estimated_minutes}min</span>
                </div>
              )}

              {todo.category && (
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span className="capitalize">{todo.category}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getStatusColor(todo.status) }}
                />
                <span className="capitalize">{todo.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {todo.status !== 'completed' && (
              <>
                <DropdownMenuItem onClick={() => onComplete?.()}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSchedule?.()}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => onEdit?.()}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Todo
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.()}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {todo.description && (
        <p className="text-sm text-blox-off-white/70 mb-3 line-clamp-2">
          {todo.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {todo.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs px-2 py-0 text-blox-off-white/60 border-blox-off-white/20"
            >
              {tag}
            </Badge>
          ))}
          {todo.tags.length > 3 && (
            <span className="text-xs text-blox-off-white/60">
              +{todo.tags.length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-blox-off-white/60">
          {todo.scheduled_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(todo.scheduled_date), 'MMM d')}</span>
              {todo.scheduled_time && (
                <span>at {todo.scheduled_time}</span>
              )}
            </div>
          )}

          {todo.due_date && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Due {format(new Date(todo.due_date), 'MMM d')}</span>
            </div>
          )}
        </div>
      </div>

      {(todo.learning_objectives.length > 0 || todo.video_references.length > 0) && (
        <div className="mt-3 pt-3 border-t border-blox-off-white/10">
          <div className="flex items-center gap-2 text-xs">
            {todo.video_references.length > 0 && (
              <div className="flex items-center gap-1 text-blox-teal">
                <Video className="h-3 w-3" />
                <span>{todo.video_references.length} video(s)</span>
              </div>
            )}

            {todo.learning_objectives.length > 0 && (
              <div className="flex items-center gap-1 text-blox-purple">
                <Target className="h-3 w-3" />
                <span>{todo.learning_objectives.length} objective(s)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function CreateTodoDialog({
  open,
  onOpenChange,
  onSubmit
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTodoFormData) => void
}) {
  const [formData, setFormData] = useState<CreateTodoFormData>({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    estimatedMinutes: 30,
    dueDate: '',
    scheduledDate: '',
    scheduledTime: '',
    tags: []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      category: '',
      estimatedMinutes: 30,
      dueDate: '',
      scheduledDate: '',
      scheduledTime: '',
      tags: []
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Todo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Todo title..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <Textarea
              placeholder="Description (optional)..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="learn">Learn</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
                  <SelectItem value="build">Build</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                type="number"
                placeholder="Estimated minutes"
                value={formData.estimatedMinutes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedMinutes: parseInt(e.target.value) || 0 }))}
                min="5"
                step="5"
              />
            </div>

            <div>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                type="date"
                placeholder="Schedule for..."
                value={formData.scheduledDate}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
              />
            </div>

            <div>
              <Input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blox-teal hover:bg-blox-teal/80">
              Create Todo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TodoManager({
  className = '',
  viewMode = 'list',
  onTodoClick
}: TodoManagerProps) {
  const { user } = useUser()
  const {
    todos,
    todoFilters,
    searchQuery,
    todosLoading,
    loadTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    completeTodo,
    reorderTodos,
    setTodoFilters,
    setSearchQuery
  } = useCalendarTodoStore()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTodos, setSelectedTodos] = useState<string[]>([])

  // Load todos when component mounts
  useEffect(() => {
    if (user?.id) {
      loadTodos(user.id)
    }
  }, [user?.id, loadTodos])

  // Filtered and sorted todos
  const filteredTodos = useMemo(() => {
    let filtered = [...todos]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(todo =>
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        todo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        todo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Apply status filters
    if (todoFilters.status.length > 0) {
      filtered = filtered.filter(todo => todoFilters.status.includes(todo.status))
    }

    // Apply priority filters
    if (todoFilters.priority.length > 0) {
      filtered = filtered.filter(todo => todoFilters.priority.includes(todo.priority))
    }

    // Apply category filters
    if (todoFilters.category.length > 0) {
      filtered = filtered.filter(todo => todo.category && todoFilters.category.includes(todo.category))
    }

    // Sort by order_index, then by created_at
    filtered.sort((a, b) => {
      if (a.order_index !== b.order_index) {
        return a.order_index - b.order_index
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return filtered
  }, [todos, searchQuery, todoFilters])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = filteredTodos.findIndex(todo => todo.id === active.id)
    const newIndex = filteredTodos.findIndex(todo => todo.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedTodos = arrayMove(filteredTodos, oldIndex, newIndex)
      await reorderTodos(reorderedTodos)
    }
  }

  const handleCreateTodo = async (formData: CreateTodoFormData) => {
    if (!user?.id) return

    const todoData = {
      user_id: user.id,
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      category: formData.category || undefined,
      estimated_minutes: formData.estimatedMinutes || undefined,
      due_date: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      scheduled_date: formData.scheduledDate || undefined,
      scheduled_time: formData.scheduledTime || undefined,
      tags: formData.tags,
      status: 'pending' as const,
      order_index: todos.length,
      auto_bumped: false,
      bump_count: 0,
      auto_generated: false,
      learning_objectives: [],
      prerequisites: [],
      video_references: [],
      created_by: user.id
    }

    await createTodo(todoData)
  }

  const handleTodoComplete = async (todoId: string) => {
    await completeTodo(todoId)
  }

  const handleTodoDelete = async (todoId: string) => {
    await deleteTodo(todoId)
  }

  const getFilterCounts = () => {
    const total = todos.length
    const completed = todos.filter(t => t.status === 'completed').length
    const pending = todos.filter(t => t.status === 'pending').length
    const inProgress = todos.filter(t => t.status === 'in_progress').length
    const overdue = todos.filter(t =>
      t.due_date &&
      new Date(t.due_date) < new Date() &&
      t.status !== 'completed'
    ).length

    return { total, completed, pending, inProgress, overdue }
  }

  const filterCounts = getFilterCounts()

  return (
    <div className={`${className}`}>
      <Card className="glass-card-teal">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blox-teal" />
              Todo Manager
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-blox-teal hover:bg-blox-teal/80"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Todo
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blox-off-white/50" />
              <Input
                placeholder="Search todos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={todoFilters.status.includes('pending')}
                  onCheckedChange={(checked) => {
                    const newStatuses = checked
                      ? [...todoFilters.status, 'pending']
                      : todoFilters.status.filter(s => s !== 'pending')
                    setTodoFilters({ status: newStatuses })
                  }}
                >
                  Pending ({filterCounts.pending})
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={todoFilters.status.includes('in_progress')}
                  onCheckedChange={(checked) => {
                    const newStatuses = checked
                      ? [...todoFilters.status, 'in_progress']
                      : todoFilters.status.filter(s => s !== 'in_progress')
                    setTodoFilters({ status: newStatuses })
                  }}
                >
                  In Progress ({filterCounts.inProgress})
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={todoFilters.status.includes('completed')}
                  onCheckedChange={(checked) => {
                    const newStatuses = checked
                      ? [...todoFilters.status, 'completed']
                      : todoFilters.status.filter(s => s !== 'completed')
                    setTodoFilters({ status: newStatuses })
                  }}
                >
                  Completed ({filterCounts.completed})
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Priority</DropdownMenuLabel>
                {['urgent', 'high', 'medium', 'low'].map((priority) => (
                  <DropdownMenuCheckboxItem
                    key={priority}
                    checked={todoFilters.priority.includes(priority)}
                    onCheckedChange={(checked) => {
                      const newPriorities = checked
                        ? [...todoFilters.priority, priority]
                        : todoFilters.priority.filter(p => p !== priority)
                      setTodoFilters({ priority: newPriorities })
                    }}
                  >
                    <span className="capitalize">{priority}</span>
                    <div
                      className="w-2 h-2 rounded-full ml-2"
                      style={{ backgroundColor: priorityColors[priority as keyof typeof priorityColors] }}
                    />
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4">
            <div className="text-sm text-blox-off-white/70">
              {filteredTodos.length} of {todos.length} todos
            </div>
            {filterCounts.overdue > 0 && (
              <Badge variant="destructive" className="text-xs">
                {filterCounts.overdue} overdue
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {todosLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blox-teal"></div>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-blox-off-white/50 mb-4" />
              <h3 className="text-lg font-medium text-blox-white mb-2">
                {todos.length === 0 ? 'No todos yet' : 'No todos match your filters'}
              </h3>
              <p className="text-blox-off-white/70 mb-4">
                {todos.length === 0
                  ? 'Create your first todo to get started with task management'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {todos.length === 0 && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-blox-teal hover:bg-blox-teal/80"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Todo
                </Button>
              )}
            </div>
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredTodos.map(todo => todo.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredTodos.map((todo) => (
                      <SortableTodoCard
                        key={todo.id}
                        todo={todo}
                        onClick={() => onTodoClick?.(todo)}
                        onComplete={() => handleTodoComplete(todo.id)}
                        onDelete={() => handleTodoDelete(todo.id)}
                        onEdit={() => {}}
                        onSchedule={() => {}}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <CreateTodoDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateTodo}
      />
    </div>
  )
}