'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CheckCircle,
  Trash2,
  MoreHorizontal,
  Calendar,
  Tag,
  ArrowUp,
  ArrowDown,
  X,
  Users
} from 'lucide-react'

interface TodoBulkActionsProps {
  selectedCount: number
  onComplete: () => void
  onDelete: () => void
  onSelectAll: () => void
  onClearSelection: () => void
  onBulkSchedule?: () => void
  onBulkTag?: () => void
  onBulkPriority?: (priority: 'low' | 'medium' | 'high' | 'urgent') => void
  onBulkMove?: () => void
}

export function TodoBulkActions({
  selectedCount,
  onComplete,
  onDelete,
  onSelectAll,
  onClearSelection,
  onBulkSchedule,
  onBulkTag,
  onBulkPriority,
  onBulkMove
}: TodoBulkActionsProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between p-3 bg-blox-teal/10 border border-blox-teal/20 rounded-lg"
        >
          {/* Selection Info */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blox-teal" />
              <span className="text-sm font-medium text-blox-white">
                {selectedCount} selected
              </span>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={onSelectAll}
              className="h-7 px-2 text-xs text-blox-off-white hover:text-blox-white hover:bg-blox-second-dark-blue/50"
            >
              Select All
            </Button>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center space-x-2">
            {/* Quick Complete */}
            <Button
              size="sm"
              onClick={onComplete}
              className="h-8 bg-green-600/80 hover:bg-green-600 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete
            </Button>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 border-blox-teal/30 text-blox-white hover:bg-blox-teal/10"
                >
                  <MoreHorizontal className="h-4 w-4 mr-1" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Scheduling */}
                {onBulkSchedule && (
                  <DropdownMenuItem onClick={onBulkSchedule}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Set Due Dates
                  </DropdownMenuItem>
                )}

                {/* Tagging */}
                {onBulkTag && (
                  <DropdownMenuItem onClick={onBulkTag}>
                    <Tag className="h-4 w-4 mr-2" />
                    Add Tags
                  </DropdownMenuItem>
                )}

                {/* Priority Changes */}
                {onBulkPriority && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onBulkPriority('urgent')}>
                      <ArrowUp className="h-4 w-4 mr-2 text-red-500" />
                      Set Urgent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkPriority('high')}>
                      <ArrowUp className="h-4 w-4 mr-2 text-orange-500" />
                      Set High Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkPriority('medium')}>
                      <ArrowDown className="h-4 w-4 mr-2 text-blue-500" />
                      Set Medium Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkPriority('low')}>
                      <ArrowDown className="h-4 w-4 mr-2 text-gray-500" />
                      Set Low Priority
                    </DropdownMenuItem>
                  </>
                )}

                {/* Move */}
                {onBulkMove && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onBulkMove}>
                      <Tag className="h-4 w-4 mr-2" />
                      Move to Category
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick Delete */}
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>

            {/* Clear Selection */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              className="h-8 w-8 p-0 text-blox-off-white hover:text-blox-white hover:bg-blox-second-dark-blue/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}