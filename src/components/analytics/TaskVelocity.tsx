'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts'
import { Zap, TrendingUp, BarChart3 } from 'lucide-react'

interface VelocityData {
  date: string
  completed: number
  created: number
  net: number
}

interface TaskVelocityProps {
  data: VelocityData[]
  averageVelocity: number
}

export function TaskVelocity({ data, averageVelocity }: TaskVelocityProps) {
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-blox-very-dark-blue border border-blox-glass-border rounded-lg p-3 shadow-lg">
          <p className="text-blox-white text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const totalCompleted = data.reduce((sum, day) => sum + day.completed, 0)
  const totalCreated = data.reduce((sum, day) => sum + day.created, 0)
  const netProgress = totalCompleted - totalCreated
  
  const bestDay = data.reduce((best, current) => 
    current.completed > best.completed ? current : best
  , data[0] || { completed: 0, date: '' })

  return (
    <div className="space-y-6">
      {/* Velocity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-blue-500/20">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-blox-off-white/60">Avg Daily</p>
                <p className="text-2xl font-bold text-blox-white">
                  {averageVelocity.toFixed(1)}
                </p>
                <p className="text-xs text-blox-off-white/60">tasks/day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <BarChart3 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-blox-off-white/60">Total Done</p>
                <p className="text-2xl font-bold text-green-400">
                  {totalCompleted}
                </p>
                <p className="text-xs text-blox-off-white/60">14 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-orange-500/20">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-blox-off-white/60">Best Day</p>
                <p className="text-2xl font-bold text-orange-400">
                  {bestDay?.completed || 0}
                </p>
                <p className="text-xs text-blox-off-white/60">
                  {bestDay?.date || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${netProgress >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <TrendingUp className={`h-5 w-5 ${netProgress >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="text-sm text-blox-off-white/60">Net Progress</p>
                <p className={`text-2xl font-bold ${netProgress >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {netProgress >= 0 ? '+' : ''}{netProgress}
                </p>
                <p className={`text-xs ${netProgress >= 0 ? 'text-green-400/60' : 'text-red-400/60'}`}>
                  {netProgress >= 0 ? 'Reducing backlog' : 'Growing backlog'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Velocity Trend */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blox-white flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Task Completion Velocity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                fontSize={10}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={10}
                label={{ value: 'Tasks', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={customTooltip} />
              <Area 
                type="monotone" 
                dataKey="completed" 
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#completedGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Task Balance */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blox-white flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Task Creation vs Completion</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                fontSize={10}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={10}
              />
              <Tooltip content={customTooltip} />
              <Legend 
                wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
              />
              <Bar 
                dataKey="created" 
                fill="#f97316" 
                name="Created"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="completed" 
                fill="#22c55e" 
                name="Completed"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}