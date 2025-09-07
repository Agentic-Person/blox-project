/**
 * Recent Activity Component
 * Shows recent admin activities and system events
 */

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Video,
  PlaySquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Activity,
  Database,
  RefreshCw
} from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'video_added' | 'video_processed' | 'video_failed' | 'playlist_added' | 'user_action' | 'system_event'
  title: string
  description: string
  timestamp: Date
  status: 'success' | 'error' | 'warning' | 'info'
  metadata?: {
    videoId?: string
    playlistId?: string
    userId?: string
    duration?: string
    error?: string
  }
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data fetching - in production this would call real APIs
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Mock activities - in production this would come from admin_activity_logs table
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'video_processed',
          title: 'Video Processing Complete',
          description: 'Advanced Scripting Tutorial #15 processed successfully',
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          status: 'success',
          metadata: {
            videoId: 'dQw4w9WgXcQ',
            duration: '12:34'
          }
        },
        {
          id: '2',
          type: 'playlist_added',
          title: 'New Playlist Added',
          description: 'Roblox Studio Basics playlist (23 videos) added to queue',
          timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          status: 'info',
          metadata: {
            playlistId: 'PLZ1b66Z1KFKhO7R6Q588cdWxdnVxpPmA8'
          }
        },
        {
          id: '3',
          type: 'video_failed',
          title: 'Video Processing Failed',
          description: 'Failed to extract transcript from \"UI Design Tutorial\"',
          timestamp: new Date(Date.now() - 32 * 60 * 1000), // 32 minutes ago
          status: 'error',
          metadata: {
            videoId: 'abc123xyz',
            error: 'Transcript not available'
          }
        },
        {
          id: '4',
          type: 'video_added',
          title: 'Video Added',
          description: 'Game Development Fundamentals added to processing queue',
          timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
          status: 'info',
          metadata: {
            videoId: 'xyz789abc',
            duration: '18:42'
          }
        },
        {
          id: '5',
          type: 'system_event',
          title: 'Queue Worker Restarted',
          description: 'Background processing worker automatically restarted',
          timestamp: new Date(Date.now() - 62 * 60 * 1000), // 1 hour ago
          status: 'warning'
        },
        {
          id: '6',
          type: 'video_processed',
          title: 'Video Processing Complete',
          description: 'Building Your First Game processed successfully',
          timestamp: new Date(Date.now() - 78 * 60 * 1000), // 1.3 hours ago
          status: 'success',
          metadata: {
            videoId: 'def456ghi',
            duration: '25:17'
          }
        }
      ]
      
      setActivities(mockActivities)
      setLoading(false)
    }

    fetchActivities()

    // Refresh activities every 60 seconds
    const interval = setInterval(fetchActivities, 60000)
    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'video_added': return Video
      case 'video_processed': return CheckCircle
      case 'video_failed': return XCircle
      case 'playlist_added': return PlaySquare
      case 'user_action': return User
      case 'system_event': return Activity
      default: return Database
    }
  }

  const getStatusColor = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const handleRefresh = () => {
    setLoading(true)
    // Trigger refresh
    setTimeout(() => {
      setLoading(false)
    }, 800)
  }

  if (loading) {
    return (
      <div className=\"bg-white rounded-lg shadow-sm border border-gray-200\">
        <div className=\"px-6 py-4 border-b border-gray-200\">
          <div className=\"flex items-center justify-between\">
            <h3 className=\"text-lg font-semibold text-gray-900\">Recent Activity</h3>
            <div className=\"animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600\"></div>
          </div>
        </div>
        <div className=\"p-6 space-y-4\">
          {[...Array(6)].map((_, index) => (
            <div key={index} className=\"animate-pulse flex items-start space-x-3\">
              <div className=\"h-8 w-8 bg-gray-200 rounded-full flex-shrink-0\"></div>
              <div className=\"flex-1\">
                <div className=\"h-4 bg-gray-200 rounded w-3/4 mb-2\"></div>
                <div className=\"h-3 bg-gray-200 rounded w-1/2\"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className=\"bg-white rounded-lg shadow-sm border border-gray-200 h-fit\">
      <div className=\"px-6 py-4 border-b border-gray-200\">
        <div className=\"flex items-center justify-between\">
          <h3 className=\"text-lg font-semibold text-gray-900\">Recent Activity</h3>
          <button
            onClick={handleRefresh}
            className=\"p-2 hover:bg-gray-100 rounded-lg transition-colors\"
            title=\"Refresh\"
          >
            <RefreshCw className=\"h-4 w-4 text-gray-600\" />
          </button>
        </div>
        <p className=\"text-sm text-gray-600\">Latest system events and admin actions</p>
      </div>
      
      <div className=\"max-h-96 overflow-y-auto\">
        <div className=\"p-6 space-y-4\">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type)
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className=\"flex items-start space-x-3 group\"
              >
                <div className={`p-2 rounded-full ${getStatusColor(activity.status)} flex-shrink-0`}>
                  <Icon className=\"h-4 w-4\" />
                </div>
                
                <div className=\"flex-1 min-w-0\">
                  <div className=\"flex items-center justify-between\">
                    <p className=\"text-sm font-medium text-gray-900 truncate\">
                      {activity.title}
                    </p>
                    <div className=\"flex items-center text-xs text-gray-500 ml-2\">
                      <Clock className=\"h-3 w-3 mr-1\" />
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                  
                  <p className=\"text-sm text-gray-600 mt-1\">{activity.description}</p>
                  
                  {activity.metadata && (
                    <div className=\"mt-2 flex flex-wrap gap-2\">
                      {activity.metadata.videoId && (
                        <span className=\"inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700\">
                          ID: {activity.metadata.videoId}
                        </span>
                      )}
                      {activity.metadata.duration && (
                        <span className=\"inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700\">
                          {activity.metadata.duration}
                        </span>
                      )}
                      {activity.metadata.error && (
                        <span className=\"inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700\">
                          Error: {activity.metadata.error}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
      
      <div className=\"px-6 py-4 border-t border-gray-200\">
        <a
          href=\"/admin/logs\"
          className=\"w-full flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors\"
        >
          <Activity className=\"h-4 w-4 mr-2\" />
          View All Activity
        </a>
      </div>
    </div>
  )
}