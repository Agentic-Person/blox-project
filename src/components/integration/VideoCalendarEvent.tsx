/**
 * VideoCalendarEvent Component
 * 
 * Calendar event component for video learning sessions
 * Part of the AI-Powered Learning System integration
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Clock, 
  User, 
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { CalendarAction } from '@/types/shared'

interface VideoCalendarEventProps {
  action: CalendarAction
  onJoinSession?: (action: CalendarAction) => void
  onReschedule?: (action: CalendarAction) => void
  onCancel?: (actionId: string) => void
  isUpcoming?: boolean
  className?: string
}

export const VideoCalendarEvent: React.FC<VideoCalendarEventProps> = ({
  action,
  onJoinSession,
  onReschedule,
  onCancel,
  isUpcoming = false,
  className = ''
}) => {
  const startTime = action.startTime ? new Date(action.startTime) : null
  const endTime = action.endTime ? new Date(action.endTime) : null
  const isToday = startTime ? startTime.toDateString() === new Date().toDateString() : false
  const isPast = startTime ? startTime < new Date() : false

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'schedule_video':
        return <Play className="w-4 h-4" />
      case 'schedule_practice':
        return <CheckCircle2 className="w-4 h-4" />
      case 'schedule_review':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'schedule_video':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'schedule_practice':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'schedule_review':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'schedule_video':
        return 'Video Session'
      case 'schedule_practice':
        return 'Practice Time'
      case 'schedule_review':
        return 'Review Session'
      case 'block_time':
        return 'Study Block'
      default:
        return 'Learning Session'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
        isToday ? 'ring-2 ring-blue-500' : ''
      } ${className}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg border ${getEventTypeColor(action.type)}`}>
              {getEventTypeIcon(action.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {action.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {getEventTypeLabel(action.type)}
              </p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-2">
            {isToday && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                Today
              </span>
            )}
            {isPast && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                Past
              </span>
            )}
            {isUpcoming && !isToday && (
              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                Upcoming
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {action.description && (
          <p className="text-sm text-gray-600 mb-3">{action.description}</p>
        )}

        {/* Time and Duration */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          {startTime && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>
                {formatDate(startTime)} at {formatTime(startTime)}
                {endTime && ` - ${formatTime(endTime)}`}
              </span>
            </div>
          )}
          
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{action.duration}min</span>
          </div>
        </div>

        {/* Video Information */}
        {action.videoReference && (
          <div className="flex items-center p-3 bg-gray-50 rounded-lg mb-3">
            <div className="flex-shrink-0">
              <img
                src={action.videoReference.thumbnailUrl}
                alt={action.videoReference.title}
                className="w-12 h-9 rounded object-cover"
              />
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {action.videoReference.title}
              </p>
              {action.videoReference.creatorName && (
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <User className="w-3 h-3 mr-1" />
                  {action.videoReference.creatorName}
                </div>
              )}
              {action.videoReference.timestamp && (
                <div className="flex items-center mt-1 text-xs text-blue-600">
                  <Play className="w-3 h-3 mr-1" />
                  Start at {action.videoReference.timestamp}
                </div>
              )}
            </div>

            {action.videoReference.videoUrl && (
              <a
                href={action.videoReference.timestampUrl || action.videoReference.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        {/* Related Todos */}
        {action.relatedTodos && action.relatedTodos.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Related Tasks:</p>
            <div className="space-y-1">
              {action.relatedTodos.slice(0, 2).map((todoId, index) => (
                <div key={index} className="text-xs text-gray-600 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Task #{todoId.slice(-6)}
                </div>
              ))}
              {action.relatedTodos.length > 2 && (
                <p className="text-xs text-gray-500">
                  +{action.relatedTodos.length - 2} more tasks
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recurring Information */}
        {action.recurring && (
          <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Repeats {action.recurring.frequency}
              {action.recurring.interval > 1 && ` every ${action.recurring.interval}`}
              {action.recurring.daysOfWeek && action.recurring.daysOfWeek.length > 0 && (
                <span className="ml-1">
                  on {action.recurring.daysOfWeek.map(day => 
                    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
                  ).join(', ')}
                </span>
              )}
            </div>
            {action.recurring.endDate && (
              <div className="mt-1">
                Until {new Date(action.recurring.endDate).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
          {!isPast && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onJoinSession?.(action)}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
            >
              <Play className="w-3 h-3 mr-1" />
              {isToday ? 'Start Session' : 'Preview'}
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onReschedule?.(action)}
            className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Reschedule
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCancel?.(action.type)} // Using type as id for demo
            className="px-3 py-1.5 text-xs text-red-600 hover:text-red-800 transition-colors"
          >
            Cancel
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}