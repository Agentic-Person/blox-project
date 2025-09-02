'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VelocityData {
  date: string
  completed: number
  created: number
  net: number
}

interface ProductivityChartProps {
  data: VelocityData[]
  completionRate: number
  weeklyTrend: number
}

export function ProductivityChart({ data, completionRate, weeklyTrend }: ProductivityChartProps) {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Completion Trend */}
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-blox-white">
              Daily Completions
            </CardTitle>
            <div className={cn(
              "flex items-center space-x-1 text-xs",
              weeklyTrend >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {weeklyTrend >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(weeklyTrend).toFixed(1)}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
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
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#06b6d4" 
                strokeWidth={2}
                dot={{ fill: '#06b6d4', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 4, stroke: '#06b6d4', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Task Balance */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blox-white">
            Task Balance (Created vs Completed)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
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

      {/* Completion Rate Display */}
      <Card className="card-hover lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blox-white">
            Overall Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Completion Rate Circle */}
            <div className="flex items-center justify-center">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#334155"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#06b6d4"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${251.2 * completionRate} 251.2`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-blox-white">
                    {Math.round(completionRate * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-blox-off-white/60">Total Tasks</p>
                <p className="text-2xl font-bold text-blox-white">
                  {data.reduce((sum, day) => sum + day.created, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-blox-off-white/60">Completed</p>
                <p className="text-2xl font-bold text-green-400">
                  {data.reduce((sum, day) => sum + day.completed, 0)}
                </p>
              </div>
            </div>

            {/* Velocity Stats */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-blox-off-white/60">Daily Average</p>
                <p className="text-2xl font-bold text-blox-white">
                  {(data.reduce((sum, day) => sum + day.completed, 0) / data.length).toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-blox-off-white/60">Best Day</p>
                <p className="text-2xl font-bold text-blox-teal">
                  {Math.max(...data.map(day => day.completed))}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}