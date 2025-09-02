'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { Tag, Clock, CheckCircle } from 'lucide-react'

interface CategoryStat {
  category: string
  count: number
  completed: number
  percentage: number
  averageTime: number
}

interface CategoryBreakdownProps {
  data: CategoryStat[]
  totalTasks: number
}

const COLORS = [
  '#06b6d4', // Teal
  '#f97316', // Orange  
  '#22c55e', // Green
  '#a855f7', // Purple
  '#ef4444', // Red
  '#eab308', // Yellow
  '#8b5cf6', // Violet
  '#06d6a0', // Mint
]

export function CategoryBreakdown({ data, totalTasks }: CategoryBreakdownProps) {
  // Prepare data for pie chart
  const pieData = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length]
  }))

  // Prepare data for completion rate chart
  const completionData = data.map(item => ({
    ...item,
    completionRate: item.count > 0 ? (item.completed / item.count) * 100 : 0
  }))

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-blox-very-dark-blue border border-blox-glass-border rounded-lg p-3 shadow-lg">
          <p className="text-blox-white text-sm font-medium">{data.category}</p>
          <p className="text-xs text-blox-off-white/60">
            {data.count} tasks ({((data.count / totalTasks) * 100).toFixed(1)}%)
          </p>
          <p className="text-xs text-green-400">
            {data.completed} completed
          </p>
          {data.averageTime > 0 && (
            <p className="text-xs text-blue-400">
              {data.averageTime}m avg time
            </p>
          )}
        </div>
      )
    }
    return null
  }

  if (data.length === 0) {
    return (
      <Card className="card-hover">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Tag className="h-12 w-12 text-blox-off-white/40 mx-auto mb-4" />
            <p className="text-blox-off-white/60">No categories to analyze</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Distribution Pie Chart */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blox-white flex items-center space-x-2">
            <Tag className="h-4 w-4" />
            <span>Category Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, count, percentage }) => 
                  percentage > 5 ? `${category} (${count})` : ''
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Completion Rates by Category */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blox-white flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Completion Rates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={completionData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                type="number" 
                stroke="#64748b"
                fontSize={10}
                domain={[0, 100]}
              />
              <YAxis 
                type="category"
                dataKey="category" 
                stroke="#64748b"
                fontSize={10}
                width={80}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-blox-very-dark-blue border border-blox-glass-border rounded-lg p-2 shadow-lg">
                        <p className="text-blox-white text-xs">{data.category}</p>
                        <p className="text-xs text-green-400">
                          {data.completionRate.toFixed(1)}% complete
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
                dataKey="completionRate" 
                fill="#22c55e"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Details List */}
      <Card className="card-hover lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blox-white flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Category Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((category, index) => (
              <div 
                key={category.category}
                className="flex items-center justify-between p-3 rounded-lg bg-blox-second-dark-blue/20 hover:bg-blox-second-dark-blue/30 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <h4 className="text-sm font-medium text-blox-white">
                      {category.category}
                    </h4>
                    <p className="text-xs text-blox-off-white/60">
                      {category.count} tasks • {category.completed} completed
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <Badge 
                    variant={category.percentage >= 80 ? "default" : category.percentage >= 50 ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {category.percentage.toFixed(0)}%
                  </Badge>
                  
                  {category.averageTime > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-blox-off-white/60">Avg Time</p>
                      <p className="text-sm font-medium text-blox-white">
                        {category.averageTime}m
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}