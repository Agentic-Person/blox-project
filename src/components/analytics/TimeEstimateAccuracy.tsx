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
import { Clock, Target, TrendingUp, AlertTriangle } from 'lucide-react'

interface TimeAccuracyData {
  date: string
  estimated: number
  actual: number
  accuracy: number
}

interface TimeEstimateAccuracyProps {
  data: TimeAccuracyData[]
  averageAccuracy: number
}

export function TimeEstimateAccuracy({ data, averageAccuracy }: TimeEstimateAccuracyProps) {
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-blox-very-dark-blue border border-blox-glass-border rounded-lg p-3 shadow-lg">
          <p className="text-blox-white text-sm font-medium">{label}</p>
          <p className="text-xs text-blue-400">
            Estimated: {data.estimated}m
          </p>
          <p className="text-xs text-orange-400">
            Actual: {data.actual}m
          </p>
          <p className="text-xs text-green-400">
            Accuracy: {data.accuracy}%
          </p>
        </div>
      )
    }
    return null
  }

  const getAccuracyLevel = (accuracy: number) => {
    if (accuracy >= 90) return { level: 'Excellent', color: 'text-green-500', bg: 'bg-green-500/20' }
    if (accuracy >= 75) return { level: 'Good', color: 'text-blue-500', bg: 'bg-blue-500/20' }
    if (accuracy >= 60) return { level: 'Fair', color: 'text-yellow-500', bg: 'bg-yellow-500/20' }
    return { level: 'Needs Work', color: 'text-red-500', bg: 'bg-red-500/20' }
  }

  const accuracyLevel = getAccuracyLevel(averageAccuracy || 0)
  
  const totalEstimated = data.reduce((sum, item) => sum + item.estimated, 0)
  const totalActual = data.reduce((sum, item) => sum + item.actual, 0)
  const overallDifference = totalActual - totalEstimated
  const overallDifferencePercent = totalEstimated > 0 ? (overallDifference / totalEstimated) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Accuracy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${accuracyLevel.bg}`}>
                <Target className={`h-5 w-5 ${accuracyLevel.color}`} />
              </div>
              <div>
                <p className="text-sm text-blox-off-white/60">Accuracy</p>
                <p className={`text-2xl font-bold ${accuracyLevel.color}`}>
                  {(averageAccuracy || 0).toFixed(0)}%
                </p>
                <p className={`text-xs ${accuracyLevel.color}`}>
                  {accuracyLevel.level}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-blue-500/20">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-blox-off-white/60">Est. Total</p>
                <p className="text-2xl font-bold text-blox-white">
                  {Math.round(totalEstimated / 60)}h
                </p>
                <p className="text-xs text-blox-off-white/60">
                  {totalEstimated}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-orange-500/20">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-blox-off-white/60">Actual Total</p>
                <p className="text-2xl font-bold text-blox-white">
                  {Math.round(totalActual / 60)}h
                </p>
                <p className="text-xs text-blox-off-white/60">
                  {totalActual}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${overallDifference > 0 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                <TrendingUp className={`h-5 w-5 ${overallDifference > 0 ? 'text-red-500' : 'text-green-500'}`} />
              </div>
              <div>
                <p className="text-sm text-blox-off-white/60">Variance</p>
                <p className={`text-2xl font-bold ${overallDifference > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {overallDifference > 0 ? '+' : ''}{overallDifferencePercent.toFixed(0)}%
                </p>
                <p className={`text-xs ${overallDifference > 0 ? 'text-red-400/60' : 'text-green-400/60'}`}>
                  {overallDifference > 0 ? 'Over' : 'Under'} estimate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Comparison Chart */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blox-white flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Estimated vs Actual Time</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
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
                label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={customTooltip} />
              <Legend 
                wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
              />
              <Bar 
                dataKey="estimated" 
                fill="#3b82f6" 
                name="Estimated"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="actual" 
                fill="#f97316" 
                name="Actual"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Accuracy Trend */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blox-white flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Accuracy Trend</span>
          </CardTitle>
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
                domain={[0, 100]}
                label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-blox-very-dark-blue border border-blox-glass-border rounded-lg p-2 shadow-lg">
                        <p className="text-blox-white text-xs">{label}</p>
                        <p className="text-xs text-green-400">
                          Accuracy: {data.accuracy}%
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 4, stroke: '#22c55e', strokeWidth: 2 }}
              />
              {/* Reference line at 80% accuracy */}
              <Line 
                type="monotone" 
                dataKey={() => 80} 
                stroke="#64748b" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights */}
      {data.length > 0 && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-blox-white flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Insights & Tips</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {averageAccuracy < 60 && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 font-medium">💡 Estimation Improvement Needed</p>
                  <p className="text-blox-off-white/70 text-xs mt-1">
                    Your time estimates are off by more than 40%. Try breaking tasks into smaller chunks and track your actual time more carefully.
                  </p>
                </div>
              )}
              
              {overallDifferencePercent > 20 && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-yellow-400 font-medium">⚠️ Consistent Overruns</p>
                  <p className="text-blox-off-white/70 text-xs mt-1">
                    You're consistently taking longer than estimated. Consider adding buffer time or breaking tasks into smaller pieces.
                  </p>
                </div>
              )}
              
              {averageAccuracy >= 80 && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-green-400 font-medium">🎉 Great Estimation Skills!</p>
                  <p className="text-blox-off-white/70 text-xs mt-1">
                    You're doing well with time estimation. This helps with better planning and scheduling.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}