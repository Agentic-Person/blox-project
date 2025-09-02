/**
 * TodoDetailWithVideo Component
 * 
 * Enhanced todo detail view with integrated video player and learning resources
 * Part of the AI-Powered Learning System integration
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import YouTube from 'react-youtube'
import {
  Play,
  Pause,
  ExternalLink,
  Clock,
  Target,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Unlink,
  Calendar,
  User,
  Tag
} from 'lucide-react'
import { Todo } from '@/types/todo'
import { UnifiedVideoReference, TodoVideoLink } from '@/types/shared'

interface TodoDetailWithVideoProps {
  todo: Todo
  videoLinks?: TodoVideoLink[]
  onUpdateTodo?: (todoId: string, updates: Partial<Todo>) => void
  onLinkVideo?: (todoId: string, videoRef: UnifiedVideoReference) => void
  onUnlinkVideo?: (linkId: string) => void
  onScheduleWork?: (todoId: string, duration: number) => void
  className?: string
}

export const TodoDetailWithVideo: React.FC<TodoDetailWithVideoProps> = ({
  todo,
  videoLinks = [],
  onUpdateTodo,
  onLinkVideo,
  onUnlinkVideo,
  onScheduleWork,
  className = ''
}) => {
  const [activeVideo, setActiveVideo] = useState<UnifiedVideoReference | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [watchTime, setWatchTime] = useState(0)
  const [showVideoSearch, setShowVideoSearch] = useState(false)

  // Auto-select first video if available
  useEffect(() => {
    if (!activeVideo && todo.videoReferences.length > 0) {
      setActiveVideo(todo.videoReferences[0])
    }
  }, [todo.videoReferences, activeVideo])

  const handleVideoReady = (event: any) => {
    setPlayer(event.target)
    
    // Jump to timestamp if specified
    if (activeVideo?.timestampSeconds) {
      event.target.seekTo(activeVideo.timestampSeconds, true)
    }
  }

  const handleVideoStateChange = (event: any) => {
    const playerState = event.data
    setIsPlaying(playerState === 1) // 1 = playing

    if (playerState === 1) {
      // Start tracking watch time
      const interval = setInterval(() => {
        if (player) {
          const currentTime = player.getCurrentTime()
          setWatchTime(currentTime)
          
          // Update watch progress in todo
          if (activeVideo?.duration) {
            const progress = (currentTime / activeVideo.duration) * 100
            if (progress > (activeVideo.watchProgress || 0)) {
              const updatedVideo = { ...activeVideo, watchProgress: progress }
              const updatedTodo = {
                ...todo,
                videoReferences: todo.videoReferences.map(v => 
                  v.youtubeId === activeVideo.youtubeId ? updatedVideo : v
                )
              }
              onUpdateTodo?.(todo.id, { videoReferences: updatedTodo.videoReferences })
            }
          }
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }

  const handleVideoSelect = (video: UnifiedVideoReference) => {
    setActiveVideo(video)
    setWatchTime(0)
  }

  const handleTogglePlayback = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo()
      } else {
        player.playVideo()
      }
    }
  }

  const handleJumpToTimestamp = (seconds: number) => {
    if (player) {
      player.seekTo(seconds, true)
    }
  }

  const handleUnlinkVideo = async (linkId: string) => {
    try {
      await onUnlinkVideo?.(linkId)
      // Remove from local state
      if (activeVideo) {
        const updatedReferences = todo.videoReferences.filter(
          v => v.youtubeId !== activeVideo.youtubeId
        )
        onUpdateTodo?.(todo.id, { videoReferences: updatedReferences })
        
        if (updatedReferences.length > 0) {
          setActiveVideo(updatedReferences[0])
        } else {
          setActiveVideo(null)
        }
      }
    } catch (error) {
      console.error('Failed to unlink video:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'in_progress': return 'text-blue-600 bg-blue-50'
      case 'blocked': return 'text-red-600 bg-red-50'
      case 'cancelled': return 'text-gray-600 bg-gray-50'
      default: return 'text-yellow-600 bg-yellow-50'
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Todo Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">{todo.title}</h1>
            {todo.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{todo.description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <span className={`px-3 py-1 text-xs rounded-full border ${getPriorityColor(todo.priority)}`}>
              {todo.priority}
            </span>
            <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(todo.status)}`}>
              {todo.status}
            </span>
          </div>
        </div>

        {/* Todo Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span>
              {todo.estimatedMinutes ? `${todo.estimatedMinutes}min` : 'No estimate'}
            </span>
          </div>
          
          {todo.category && (
            <div className="flex items-center text-gray-600">
              <Tag className="w-4 h-4 mr-2" />
              <span>{todo.category}</span>
            </div>
          )}
          
          {todo.dueDate && (
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{new Date(todo.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          
          {todo.generatedFrom && (
            <div className="flex items-center text-gray-600">
              <User className="w-4 h-4 mr-2" />
              <span>From {todo.generatedFrom}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {todo.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {todo.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Video Section */}
      {todo.videoReferences.length > 0 && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Play className="w-5 h-5 mr-2 text-blue-600" />
              Learning Resources
            </h2>
            <span className="text-sm text-gray-500">
              {todo.videoReferences.length} video{todo.videoReferences.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              {activeVideo && (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <YouTube
                      videoId={activeVideo.youtubeId}
                      onReady={handleVideoReady}
                      onStateChange={handleVideoStateChange}
                      opts={{
                        width: '100%',
                        height: '400',
                        playerVars: {
                          start: activeVideo.timestampSeconds || 0,
                          rel: 0,
                          modestbranding: 1
                        }
                      }}
                    />
                    
                    {/* Play/Pause Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <AnimatePresence>
                        {!isPlaying && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={handleTogglePlayback}
                            className="pointer-events-auto w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-colors"
                          >
                            <Play className="w-8 h-8 ml-1" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">{activeVideo.title}</h3>
                    {activeVideo.creatorName && (
                      <p className="text-sm text-gray-600 mb-2">by {activeVideo.creatorName}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        {activeVideo.timestamp && (
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-1" />
                            <button
                              onClick={() => handleJumpToTimestamp(activeVideo.timestampSeconds || 0)}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {activeVideo.timestamp}
                            </button>
                          </div>
                        )}
                        
                        {activeVideo.watchProgress !== undefined && (
                          <div className="text-gray-600">
                            Progress: {Math.round(activeVideo.watchProgress)}%
                          </div>
                        )}
                      </div>
                      
                      <a
                        href={activeVideo.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open in YouTube
                      </a>
                    </div>

                    {/* Relevant Segment */}
                    {activeVideo.relevantSegment && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                        <p className="text-sm text-blue-800">
                          <strong>Key Section:</strong> {activeVideo.relevantSegment}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Video List */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Related Videos</h3>
              
              {todo.videoReferences.map((video, index) => {
                const isActive = activeVideo?.youtubeId === video.youtubeId
                const videoLink = videoLinks.find(link => 
                  link.videoReference.youtubeId === video.youtubeId
                )

                return (
                  <motion.div
                    key={video.youtubeId}
                    whileHover={{ scale: 1.02 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleVideoSelect(video)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-16 h-12 rounded object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {video.title}
                        </p>
                        {video.creatorName && (
                          <p className="text-xs text-gray-500">{video.creatorName}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-1">
                          {video.timestamp && (
                            <span className="text-xs text-gray-600">{video.timestamp}</span>
                          )}
                          
                          {videoLink && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUnlinkVideo(videoLink.id)
                              }}
                              className="text-xs text-red-600 hover:text-red-800 flex items-center"
                            >
                              <Unlink className="w-3 h-3 mr-1" />
                              Unlink
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              {/* Add Video Button */}
              <button
                onClick={() => setShowVideoSearch(!showVideoSearch)}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Link Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Learning Objectives */}
      {activeVideo?.learningObjectives && activeVideo.learningObjectives.length > 0 && (
        <div className="px-6 pb-6">
          <h3 className="flex items-center text-sm font-medium text-gray-900 mb-3">
            <Target className="w-4 h-4 mr-2 text-green-600" />
            Learning Objectives
          </h3>
          
          <div className="grid sm:grid-cols-2 gap-2">
            {activeVideo.learningObjectives.map((objective, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                {objective}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-6 pb-6">
        <div className="flex flex-wrap gap-2">
          {todo.estimatedMinutes && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onScheduleWork?.(todo.id, todo.estimatedMinutes!)}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Schedule Work
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onUpdateTodo?.(todo.id, { 
              status: todo.status === 'completed' ? 'pending' : 'completed',
              completedAt: todo.status === 'completed' ? undefined : new Date().toISOString()
            })}
            className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center ${
              todo.status === 'completed'
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            {todo.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}