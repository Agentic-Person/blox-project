/**
 * SmartTodoSuggestion Component
 * 
 * AI-generated todo suggestion card with acceptance/rejection handling
 * Part of the AI-Powered Learning System integration
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  X,
  Clock,
  Target,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { TodoSuggestion, UnifiedVideoReference } from '@/types/shared'

interface SmartTodoSuggestionProps {
  suggestion: TodoSuggestion
  onAccept?: (suggestion: TodoSuggestion) => void
  onReject?: (suggestion: TodoSuggestion) => void
  onCustomize?: (suggestion: TodoSuggestion) => void
  isProcessing?: boolean
  className?: string
}

export const SmartTodoSuggestion: React.FC<SmartTodoSuggestionProps> = ({
  suggestion,
  onAccept,
  onReject,
  onCustomize,
  isProcessing = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAccepted, setIsAccepted] = useState(false)
  const [isRejected, setIsRejected] = useState(false)

  const handleAccept = async () => {
    if (isProcessing) return
    
    setIsAccepted(true)
    try {
      await onAccept?.(suggestion)
      // Keep accepted state
    } catch (error) {
      setIsAccepted(false)
      console.error('Failed to accept suggestion:', error)
    }
  }

  const handleReject = async () => {
    if (isProcessing) return
    
    setIsRejected(true)
    try {
      await onReject?.(suggestion)
      // Component will likely be removed from parent
    } catch (error) {
      setIsRejected(false)
      console.error('Failed to reject suggestion:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'practice':
        return <Target className="w-4 h-4" />
      case 'learn':
        return <BookOpen className="w-4 h-4" />
      case 'build':
        return <Plus className="w-4 h-4" />
      case 'review':
        return <CheckCircle2 className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'practice':
        return 'text-purple-600 bg-purple-50'
      case 'learn':
        return 'text-blue-600 bg-blue-50'
      case 'build':
        return 'text-green-600 bg-green-50'
      case 'review':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (isRejected) {
    return (
      <motion.div
        initial={{ opacity: 1, height: 'auto' }}
        animate={{ opacity: 0, height: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 ${
        isAccepted ? 'border-green-500 bg-green-50' : 'border-gray-200'
      } ${className}`}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* AI Badge */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {suggestion.title}
                </h3>
                <span className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityColor(suggestion.priority)}`}>
                  {suggestion.priority}
                </span>
              </div>

              <div className="flex items-center space-x-3 text-xs text-gray-600">
                <div className={`flex items-center px-2 py-0.5 rounded-full ${getCategoryColor(suggestion.category)}`}>
                  {getCategoryIcon(suggestion.category)}
                  <span className="ml-1 capitalize">{suggestion.category}</span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {suggestion.estimatedMinutes}min
                </div>
                
                {suggestion.confidence && (
                  <div className="flex items-center">
                    <Target className="w-3 h-3 mr-1" />
                    {Math.round(suggestion.confidence * 100)}% match
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isAccepted && (
            <div className="flex items-center space-x-1 ml-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAccept}
                disabled={isProcessing}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                title="Accept suggestion"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleReject}
                disabled={isProcessing}
                className="p-1.5 text-gray-400 hover:bg-gray-50 hover:text-red-600 rounded transition-colors disabled:opacity-50"
                title="Reject suggestion"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>

        {/* Description */}
        {suggestion.description && (
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
            {suggestion.description}
          </p>
        )}

        {/* Accepted State */}
        {isAccepted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center p-2 bg-green-100 text-green-700 rounded-lg text-sm"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Added to your todo list!
          </motion.div>
        )}

        {/* Quick Actions */}
        {!isAccepted && (
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAccept}
              disabled={isProcessing}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <Plus className="w-3 h-3 mr-1" />
              {isProcessing ? 'Adding...' : 'Add Task'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCustomize?.(suggestion)}
              className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Customize
            </motion.button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center"
            >
              Details
              {isExpanded ? (
                <ChevronUp className="w-3 h-3 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {/* Learning Objectives */}
              {suggestion.learningObjectives && suggestion.learningObjectives.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                    <Target className="w-3 h-3 mr-1" />
                    Learning Objectives
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {suggestion.learningObjectives.map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prerequisites */}
              {suggestion.prerequisites && suggestion.prerequisites.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Prerequisites
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {suggestion.prerequisites.map((prereq, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                        {prereq}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Videos */}
              {suggestion.videoReferences.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Related Videos
                  </h4>
                  <div className="space-y-2">
                    {suggestion.videoReferences.slice(0, 2).map((video, index) => (
                      <div key={index} className="flex items-center p-2 bg-gray-50 rounded text-xs">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-8 h-6 rounded object-cover mr-2"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{video.title}</p>
                          {video.timestamp && (
                            <p className="text-gray-500">Start at {video.timestamp}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {suggestion.videoReferences.length > 2 && (
                      <p className="text-xs text-gray-500 px-2">
                        +{suggestion.videoReferences.length - 2} more videos
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Suggested Due Date */}
              {suggestion.suggestedDueDate && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Suggested due date:</span>{' '}
                  {new Date(suggestion.suggestedDueDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              )}

              {/* AI Confidence */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                <span>Auto-generated suggestion</span>
                <div className="flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Confidence: {Math.round(suggestion.confidence * 100)}%
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}