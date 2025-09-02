/**
 * EnhancedChatMessage Component
 * 
 * Enhanced chat message component with integrated todo creation and video linking
 * Part of the AI-Powered Learning System integration
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Plus, 
  Calendar, 
  BookOpen, 
  Clock, 
  ExternalLink,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { 
  UnifiedChatResponse, 
  TodoSuggestion, 
  CalendarAction,
  ActionButton 
} from '@/types/shared'

interface EnhancedChatMessageProps {
  message: UnifiedChatResponse
  onCreateTodo?: (suggestion: TodoSuggestion) => void
  onScheduleVideo?: (action: CalendarAction) => void
  onStartLearningPath?: (pathId: string) => void
  onWatchVideo?: (videoId: string, timestamp?: string) => void
  className?: string
}

export const EnhancedChatMessage: React.FC<EnhancedChatMessageProps> = ({
  message,
  onCreateTodo,
  onScheduleVideo,
  onStartLearningPath,
  onWatchVideo,
  className = ''
}) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null)
  const [creatingTodos, setCreatingTodos] = useState<Set<string>>(new Set())

  const handleCreateTodo = async (suggestion: TodoSuggestion, index: number) => {
    const suggestionKey = `${index}-${suggestion.title}`
    setCreatingTodos(prev => new Set([...prev, suggestionKey]))

    try {
      await onCreateTodo?.(suggestion)
      // Show success feedback
      setTimeout(() => {
        setCreatingTodos(prev => {
          const newSet = new Set(prev)
          newSet.delete(suggestionKey)
          return newSet
        })
      }, 2000)
    } catch (error) {
      setCreatingTodos(prev => {
        const newSet = new Set(prev)
        newSet.delete(suggestionKey)
        return newSet
      })
    }
  }

  const handleScheduleAction = async (action: CalendarAction) => {
    try {
      await onScheduleVideo?.(action)
    } catch (error) {
      console.error('Failed to schedule:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-blue-600 bg-blue-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'practice': return <Play className="w-4 h-4" />
      case 'learn': return <BookOpen className="w-4 h-4" />
      case 'build': return <Plus className="w-4 h-4" />
      case 'review': return <CheckCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Main Answer */}
      <div className="p-4">
        <div className="prose prose-sm max-w-none text-gray-800">
          {message.answer}
        </div>

        {/* Video References */}
        {message.videoReferences.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Play className="w-4 h-4 mr-1" />
              Related Videos
            </h4>
            <div className="grid gap-2">
              {message.videoReferences.map((video, index) => (
                <motion.div
                  key={`${video.youtubeId}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => onWatchVideo?.(video.videoId, video.timestamp)}
                >
                  <div className="flex-shrink-0">
                    <div className="w-16 h-12 bg-gray-300 rounded overflow-hidden">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {video.title}
                    </p>
                    {video.creatorName && (
                      <p className="text-xs text-gray-500">{video.creatorName}</p>
                    )}
                    {video.timestamp && (
                      <div className="flex items-center mt-1">
                        <Clock className="w-3 h-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">{video.timestamp}</span>
                      </div>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Response Time and Metadata */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>Response time: {message.responseTime}ms</span>
          <div className="flex items-center space-x-2">
            {message.metadata.cacheHit && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Cached</span>
            )}
            <span>{message.metadata.searchResultsCount} results</span>
            <span>{Math.round(message.metadata.confidence * 100)}% confidence</span>
          </div>
        </div>
      </div>

      {/* Todo Suggestions */}
      {message.suggestedTodos && message.suggestedTodos.length > 0 && (
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <Sparkles className="w-4 h-4 mr-1 text-purple-500" />
              AI Suggested Tasks
            </h4>
            <span className="text-xs text-gray-500">
              {message.suggestedTodos.length} suggestions
            </span>
          </div>

          <div className="space-y-2">
            {message.suggestedTodos.map((suggestion, index) => {
              const suggestionKey = `${index}-${suggestion.title}`
              const isCreating = creatingTodos.has(suggestionKey)
              const isExpanded = expandedSuggestion === suggestionKey

              return (
                <motion.div
                  key={suggestionKey}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getCategoryIcon(suggestion.category)}
                        <h5 className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.title}
                        </h5>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority}
                        </span>
                      </div>

                      {suggestion.description && (
                        <p className="text-xs text-gray-600 mb-2">
                          {isExpanded 
                            ? suggestion.description 
                            : `${suggestion.description.slice(0, 80)}${suggestion.description.length > 80 ? '...' : ''}`
                          }
                          {suggestion.description.length > 80 && (
                            <button
                              onClick={() => setExpandedSuggestion(isExpanded ? null : suggestionKey)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {suggestion.estimatedMinutes}min
                        </div>
                        {suggestion.confidence && (
                          <span>{Math.round(suggestion.confidence * 100)}% match</span>
                        )}
                        {suggestion.learningObjectives && suggestion.learningObjectives.length > 0 && (
                          <span>{suggestion.learningObjectives.length} objectives</span>
                        )}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCreateTodo(suggestion, index)}
                      disabled={isCreating}
                      className={`ml-2 px-3 py-1 text-xs rounded-md transition-colors ${
                        isCreating
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {isCreating ? (
                        <div className="flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Added
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Plus className="w-3 h-3 mr-1" />
                          Add Task
                        </div>
                      )}
                    </motion.button>
                  </div>

                  {/* Learning Objectives */}
                  <AnimatePresence>
                    {isExpanded && suggestion.learningObjectives && suggestion.learningObjectives.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 pt-2 border-t border-gray-100"
                      >
                        <p className="text-xs text-gray-600 mb-1">Learning Objectives:</p>
                        <ul className="text-xs text-gray-500 space-y-0.5">
                          {suggestion.learningObjectives.map((objective, objIndex) => (
                            <li key={objIndex} className="flex items-center">
                              <div className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                              {objective}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Scheduling Actions */}
      {message.schedulingActions && message.schedulingActions.length > 0 && (
        <div className="border-t border-gray-100 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-1 text-green-500" />
            Quick Schedule
          </h4>

          <div className="grid gap-2">
            {message.schedulingActions.map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleScheduleAction(action)}
                className="flex items-center p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
              >
                <Calendar className="w-4 h-4 text-green-600 mr-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{action.title}</p>
                  {action.description && (
                    <p className="text-xs text-gray-600">{action.description}</p>
                  )}
                  <p className="text-xs text-gray-500">{action.duration}min session</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {message.actionButtons && message.actionButtons.length > 0 && (
        <div className="border-t border-gray-100 p-4">
          <div className="flex flex-wrap gap-2">
            {message.actionButtons.map((button) => (
              <motion.button
                key={button.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  button.variant === 'primary'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : button.variant === 'secondary'
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                disabled={button.disabled}
                title={button.tooltip}
              >
                {button.label}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Questions */}
      {message.suggestedQuestions.length > 0 && (
        <div className="border-t border-gray-100 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Continue Learning</h4>
          <div className="flex flex-wrap gap-2">
            {message.suggestedQuestions.slice(0, 3).map((question, index) => (
              <button
                key={index}
                className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}