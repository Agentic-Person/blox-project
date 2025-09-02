'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import { AlertTriangle, ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface PriorityStat {
  priority: string
  count: number
  completed: number
  percentage: number
  color: string
}

interface PriorityDistributionProps {
  data: PriorityStat[]
  totalTasks: number
}

const PRIORITY_CONFIG = {
  urgent: { 
    icon: AlertTriangle, 
    label: 'Urgent', 
    color: '#ef4444',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400'
  },
  high: { 
    icon: ArrowUp, 
    label: 'High', 
    color: '#f97316',
    bgColor: 'bg-orange-500/20',
    textColor: 'text-orange-400'
  },
  medium: { 
    icon: Minus, 
    label: 'Medium', 
    color: '#3b82f6',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400'
  },
  low: { 
    icon: ArrowDown, 
    label: 'Low', 
    color: '#6b7280',
    bgColor: 'bg-gray-500/20',
    textColor: 'text-gray-400'
  }
}

export function PriorityDistribution({ data, totalTasks }: PriorityDistributionProps) {
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-blox-very-dark-blue border border-blox-glass-border rounded-lg p-3 shadow-lg">
          <p className="text-blox-white text-sm font-medium">{data.priority} Priority</p>
          <p className="text-xs text-blox-off-white/60">
            {data.count} tasks ({((data.count / totalTasks) * 100).toFixed(1)}%)
          </p>
          <p className="text-xs text-green-400">
            {data.completed} completed ({data.percentage.toFixed(0)}% done)
          </p>
        </div>
      )
    }
    return null
  }

  // Prepare data for charts
  const chartData = data.map(item => ({
    ...item,
    distributionPercentage: totalTasks > 0 ? (item.count / totalTasks) * 100 : 0
  }))

  if (data.length === 0) {
    return (
      <Card className="card-hover">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-blox-off-white/40 mx-auto mb-4" />
            <p className="text-blox-off-white/60">No priority data to analyze</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Priority Distribution Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => {
          const stat = data.find(item => item.priority === priority)
          const Icon = config.icon
          
          return (
            <Card key={priority} className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${config.bgColor}`}>
                    <Icon className={`h-4 w-4 ${config.textColor}`} />
                  </div>
                  <div>
                    <p className="text-sm text-blox-off-white/60">{config.label}</p>
                    <p className="text-xl font-bold text-blox-white">
                      {stat?.count || 0}
                    </p>
                    {stat && stat.count > 0 && (
                      <p className={`text-xs ${config.textColor}`}>
                        {stat.percentage.toFixed(0)}% done
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution Pie Chart */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-blox-white flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Priority Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ priority, distributionPercentage }) => 
                    distributionPercentage > 8 ? `${priority} (${distributionPercentage.toFixed(0)}%)` : ''
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.priority}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={customTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion Rate by Priority */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-blox-white flex items-center space-x-2">
              <ArrowUp className="h-4 w-4" />
              <span>Completion Rate by Priority</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="priority" 
                  stroke="#64748b"
                  fontSize={10}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={10}
                  domain={[0, 100]}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-blox-very-dark-blue border border-blox-glass-border rounded-lg p-2 shadow-lg">
                          <p className="text-blox-white text-xs">{data.priority} Priority</p>
                          <p className="text-xs text-green-400">
                            {data.percentage.toFixed(1)}% complete
                          </p>
                          <p className="text-xs text-blox-off-white/60">
                            {data.completed}/{data.count} tasks
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  dataKey="percentage" 
                  fill={(entry: any) => entry.color}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Priority Analysis Details */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blox-white flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Priority Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data
              .sort((a, b) => {
                const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
                return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                       (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
              })
              .map((priority) => {
                const config = PRIORITY_CONFIG[priority.priority as keyof typeof PRIORITY_CONFIG]
                const Icon = config?.icon || Minus
                
                return (
                  <div 
                    key={priority.priority}
                    className="flex items-center justify-between p-3 rounded-lg bg-blox-second-dark-blue/20 hover:bg-blox-second-dark-blue/30 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${config?.bgColor || 'bg-gray-500/20'}`}>
                        <Icon className={`h-4 w-4 ${config?.textColor || 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blox-white">
                          {config?.label || priority.priority} Priority
                        </h4>
                        <p className="text-xs text-blox-off-white/60">
                          {priority.count} tasks • {priority.completed} completed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-blox-white">
                          {((priority.count / totalTasks) * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-blox-off-white/60">of total</p>
                      </div>
                      
                      <Badge 
                        variant={priority.percentage >= 80 ? "default" : priority.percentage >= 50 ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {priority.percentage.toFixed(0)}% done
                      </Badge>
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Insights */}
          <div className="mt-6 space-y-3 text-sm">
            {data.find(p => p.priority === 'urgent' && p.percentage < 80) && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 font-medium">⚠️ Urgent Tasks Need Attention</p>
                <p className="text-blox-off-white/70 text-xs mt-1">
                  You have urgent tasks with low completion rates. Consider prioritizing these first.
                </p>
              </div>
            )}
            
            {data.find(p => p.priority === 'low' && p.count > totalTasks * 0.4) && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-yellow-400 font-medium">💡 Too Many Low Priority Tasks</p>
                <p className="text-blox-off-white/70 text-xs mt-1">
                  Consider whether some low priority tasks can be eliminated or delegated.
                </p>
              </div>
            )}
            
            {data.every(p => p.percentage >= 70) && data.length > 0 && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-green-400 font-medium">🎉 Great Priority Management!</p>
                <p className="text-blox-off-white/70 text-xs mt-1">
                  You're maintaining good completion rates across all priority levels.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}