/**
 * Stats Cards Component
 * Displays key metrics and statistics for the admin dashboard
 */

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Video,
  PlaySquare,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Users,
  Database
} from 'lucide-react'

interface Stat {
  name: string
  value: string
  change: string
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
}

interface StatsData {
  totalVideos: number
  videosProcessed24h: number
  activeQueue: number
  averageProcessingTime: string
  successRate: number
  failureRate: number
  transcriptsExtracted: number
  embeddingsGenerated: number
}

export function StatsCards() {
  const [stats, setStats] = useState<StatsData>({
    totalVideos: 0,
    videosProcessed24h: 0,
    activeQueue: 0,
    averageProcessingTime: '0s',
    successRate: 0,
    failureRate: 0,
    transcriptsExtracted: 0,
    embeddingsGenerated: 0
  })
  const [loading, setLoading] = useState(true)

  // Mock data fetching - in production this would call real APIs
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data - in production this would come from Supabase
      const mockStats: StatsData = {
        totalVideos: 1247,
        videosProcessed24h: 23,
        activeQueue: 7,
        averageProcessingTime: '2.3min',
        successRate: 97.2,
        failureRate: 2.8,
        transcriptsExtracted: 1201,
        embeddingsGenerated: 1187
      }
      
      setStats(mockStats)
      setLoading(false)
    }

    fetchStats()

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatChange = (current: number, previous: number): { value: string, type: 'increase' | 'decrease' | 'neutral' } => {
    const change = ((current - previous) / previous) * 100
    if (change > 0) return { value: `+${change.toFixed(1)}%`, type: 'increase' }
    if (change < 0) return { value: `${change.toFixed(1)}%`, type: 'decrease' }
    return { value: '0%', type: 'neutral' }
  }

  const mainStats: Stat[] = [
    {
      name: 'Total Videos',
      value: stats.totalVideos.toLocaleString(),
      change: '+12.3%',
      changeType: 'increase',
      icon: Video,
      color: 'bg-blue-500',
      description: 'Videos in the system'
    },
    {
      name: 'Processed (24h)',
      value: stats.videosProcessed24h.toString(),
      change: '+8.2%',
      changeType: 'increase',
      icon: CheckCircle,
      color: 'bg-green-500',
      description: 'Videos processed today'
    },
    {
      name: 'Queue Size',
      value: stats.activeQueue.toString(),
      change: '-15.4%',
      changeType: 'decrease',
      icon: Activity,
      color: 'bg-purple-500',
      description: 'Videos awaiting processing'
    },
    {
      name: 'Processing Time',
      value: stats.averageProcessingTime,
      change: '-5.1%',
      changeType: 'decrease',
      icon: Clock,
      color: 'bg-orange-500',
      description: 'Average time per video'
    }
  ]

  const detailStats: Stat[] = [
    {
      name: 'Success Rate',
      value: `${stats.successRate}%`,
      change: '+1.2%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'bg-green-600',
      description: '24h processing success rate'
    },
    {
      name: 'With Transcripts',
      value: stats.transcriptsExtracted.toLocaleString(),
      change: '+3.4%',
      changeType: 'increase',
      icon: Database,
      color: 'bg-blue-600',
      description: 'Videos with extracted transcripts'
    },
    {
      name: 'Searchable',
      value: stats.embeddingsGenerated.toLocaleString(),
      change: '+2.8%',
      changeType: 'increase',
      icon: PlaySquare,
      color: 'bg-indigo-600',
      description: 'Videos with vector embeddings'
    },
    {
      name: 'Error Rate',
      value: `${stats.failureRate}%`,
      change: '-0.3%',
      changeType: 'decrease',
      icon: AlertTriangle,
      color: 'bg-red-500',
      description: '24h processing error rate'
    }
  ]

  const getChangeIcon = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase': return TrendingUp
      case 'decrease': return TrendingDown
      default: return null
    }
  }

  const getChangeColor = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase': return 'text-green-600'
      case 'decrease': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
        {[...Array(4)].map((_, index) => (
          <div key={index} className=\"bg-white rounded-lg shadow-sm border border-gray-200 p-6\">
            <div className=\"animate-pulse\">
              <div className=\"flex items-center justify-between mb-4\">
                <div className=\"h-8 w-8 bg-gray-200 rounded-lg\"></div>
                <div className=\"h-4 w-16 bg-gray-200 rounded\"></div>
              </div>
              <div className=\"h-8 w-20 bg-gray-200 rounded mb-2\"></div>
              <div className=\"h-4 w-32 bg-gray-200 rounded\"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className=\"space-y-6\">
      {/* Main Stats */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon
          const ChangeIcon = getChangeIcon(stat.changeType)
          
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className=\"bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow\"
            >
              <div className=\"flex items-center justify-between mb-4\">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className=\"h-5 w-5 text-white\" />
                </div>
                <div className={`flex items-center text-sm font-medium ${getChangeColor(stat.changeType)}`}>
                  {ChangeIcon && <ChangeIcon className=\"h-4 w-4 mr-1\" />}
                  {stat.change}
                </div>
              </div>
              
              <div className=\"mb-2\">
                <p className=\"text-2xl font-bold text-gray-900\">{stat.value}</p>
              </div>
              
              <div>
                <p className=\"text-sm font-medium text-gray-900\">{stat.name}</p>
                <p className=\"text-xs text-gray-500\">{stat.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Detail Stats */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
        {detailStats.map((stat, index) => {
          const Icon = stat.icon
          const ChangeIcon = getChangeIcon(stat.changeType)
          
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className=\"bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow\"
            >
              <div className=\"flex items-center justify-between mb-4\">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className=\"h-5 w-5 text-white\" />
                </div>
                <div className={`flex items-center text-sm font-medium ${getChangeColor(stat.changeType)}`}>
                  {ChangeIcon && <ChangeIcon className=\"h-4 w-4 mr-1\" />}
                  {stat.change}
                </div>
              </div>
              
              <div className=\"mb-2\">
                <p className=\"text-2xl font-bold text-gray-900\">{stat.value}</p>
              </div>
              
              <div>
                <p className=\"text-sm font-medium text-gray-900\">{stat.name}</p>
                <p className=\"text-xs text-gray-500\">{stat.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}