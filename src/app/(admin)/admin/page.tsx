/**
 * Admin Dashboard Home Page
 * Main dashboard showing system overview, statistics, and quick actions
 */

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Video, 
  PlaySquare, 
  Activity, 
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  BarChart3,
  Download,
  RefreshCw,
  Settings
} from 'lucide-react'

import { useAuth } from '@/lib/providers/auth-provider'
import { StatsCards } from '@/components/admin/StatsCards'
import { RecentActivity } from '@/components/admin/RecentActivity'

interface QuickAction {
  name: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  permission?: string
}

const quickActions: QuickAction[] = [
  {
    name: 'Add Video',
    description: 'Add a single YouTube video',
    href: '/admin/videos/add',
    icon: Video,
    color: 'bg-blue-500 hover:bg-blue-600',
    permission: 'videos.create'
  },
  {
    name: 'Add Playlist',
    description: 'Import entire YouTube playlist',
    href: '/admin/playlists/add',
    icon: PlaySquare,
    color: 'bg-green-500 hover:bg-green-600',
    permission: 'playlists.create'
  },
  {
    name: 'Monitor Queue',
    description: 'View processing queue status',
    href: '/admin/queue',
    icon: Activity,
    color: 'bg-purple-500 hover:bg-purple-600',
    permission: 'queue.view'
  },
  {
    name: 'View Analytics',
    description: 'System performance metrics',
    href: '/admin/analytics',
    icon: BarChart3,
    color: 'bg-orange-500 hover:bg-orange-600',
    permission: 'analytics.view'
  }
]

export default function AdminDashboard() {
  const { user, adminRole } = useAuth()
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'error'>('healthy')
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Mock system health check
  useEffect(() => {
    const healthCheck = () => {
      // In production, this would check real system metrics
      const statuses = ['healthy', 'healthy', 'healthy', 'warning'] // Mostly healthy
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
      setSystemStatus(randomStatus as typeof systemStatus)
      setLastUpdate(new Date())
    }

    // Initial check
    healthCheck()

    // Check every 30 seconds
    const interval = setInterval(healthCheck, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (systemStatus) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = () => {
    switch (systemStatus) {
      case 'healthy': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return AlertTriangle
      default: return Activity
    }
  }

  const StatusIcon = getStatusIcon()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900"
          >
            Welcome back, {user?.username}!
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-1 text-gray-600"
          >
            Here&apos;s what&apos;s happening with your content management system today.
          </motion.p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* System status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}
          >
            <StatusIcon className="h-4 w-4 mr-2" />
            System {systemStatus}
          </motion.div>
          
          {/* Last update */}
          <div className="text-sm text-gray-500 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Updated {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <StatsCards />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-600">Common admin tasks and shortcuts</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <motion.a
                      key={action.name}
                      href={action.href}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="group relative bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${action.color} transition-colors`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 group-hover:text-gray-700">
                            {action.name}
                          </h4>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                      </div>
                    </motion.a>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <RecentActivity />
        </motion.div>
      </div>

      {/* System Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Processing Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Processing Overview</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Queue Status</span>
              <span className="text-sm font-medium text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Workers Running</span>
              <span className="text-sm font-medium text-gray-900">3 / 3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Processing Time</span>
              <span className="text-sm font-medium text-gray-900">2.3 min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Success Rate (24h)</span>
              <span className="text-sm font-medium text-green-600">97.2%</span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <a
                href="/admin/queue"
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Activity className="h-4 w-4 mr-2" />
                View Queue Details
              </a>
            </div>
          </div>
        </div>

        {/* Content Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Content Overview</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Videos</span>
              <span className="text-sm font-medium text-gray-900">1,247</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">With Transcripts</span>
              <span className="text-sm font-medium text-gray-900">1,201</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Searchable Content</span>
              <span className="text-sm font-medium text-gray-900">1,187</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Playlists</span>
              <span className="text-sm font-medium text-gray-900">23</span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <a
                href="/admin/videos"
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Video className="h-4 w-4 mr-2" />
                Manage Videos
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Admin Tools */}
      {(adminRole === 'super_admin' || adminRole === 'admin') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Admin Tools</h3>
            <p className="text-sm text-gray-600">Advanced system management and maintenance</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button className="flex items-center px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <RefreshCw className="h-5 w-5 mr-3 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Rebuild Index</span>
              </button>
              <button className="flex items-center px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <Download className="h-5 w-5 mr-3 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Export Data</span>
              </button>
              <button className="flex items-center px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <Settings className="h-5 w-5 mr-3 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">System Config</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}