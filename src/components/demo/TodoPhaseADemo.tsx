'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TodoList } from '@/components/todo/TodoList'
import { CalendarView } from '@/components/calendar/CalendarView'
import { TodoAnalytics } from '@/components/analytics/TodoAnalytics'
import { 
  List, 
  Calendar, 
  BarChart3, 
  Sparkles, 
  CheckCircle,
  ArrowRight,
  GripVertical,
  Users,
  Eye
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function TodoPhaseADemo() {
  const [activeTab, setActiveTab] = useState('todos')
  
  const features = [
    {
      id: 'drag-drop',
      title: 'Drag & Drop Reordering',
      icon: GripVertical,
      description: 'Reorder todos with smooth drag-and-drop interactions',
      implemented: true
    },
    {
      id: 'bulk-ops',
      title: 'Bulk Operations',
      icon: Users,
      description: 'Select multiple todos for batch complete, delete, or edit',
      implemented: true
    },
    {
      id: 'calendar-views',
      title: 'Calendar Views',
      icon: Calendar,
      description: 'Day, week, month, and agenda views with todo integration',
      implemented: true
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      icon: BarChart3,
      description: 'Comprehensive productivity metrics and insights',
      implemented: true
    },
    {
      id: 'smart-features',
      title: 'Smart Features',
      icon: Sparkles,
      description: 'Time estimation accuracy, streaks, and AI suggestions',
      implemented: true
    }
  ]

  return (
    <div className="space-y-6">
      {/* Phase A Header */}
      <Card className="card-hover border-blox-teal/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-blox-teal/20">
                <CheckCircle className="h-6 w-6 text-blox-teal" />
              </div>
              <div>
                <CardTitle className="text-xl text-blox-white">
                  🎉 Phase A: Todo Enhancement - COMPLETE!
                </CardTitle>
                <p className="text-sm text-blox-off-white/70 mt-1">
                  Advanced todo management with drag-and-drop, bulk operations, calendar views, and analytics
                </p>
              </div>
            </div>
            <Badge className="bg-blox-teal text-white">
              Production Ready
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.id}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-blox-second-dark-blue/20"
                >
                  <div className={`p-2 rounded-full ${feature.implemented ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    <Icon className={`h-4 w-4 ${feature.implemented ? 'text-green-400' : 'text-gray-400'}`} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-blox-white truncate">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-blox-off-white/60 line-clamp-2">
                      {feature.description}
                    </p>
                    {feature.implemented && (
                      <Badge variant="outline" className="text-xs mt-1 px-1.5 py-0.5">
                        ✓ Ready
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Feature Showcase */}
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-blox-white flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Feature Showcase</span>
            </CardTitle>
            <div className="text-sm text-blox-off-white/60">
              Interactive demo with live data
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger 
                value="todos" 
                className="flex items-center space-x-2"
              >
                <List className="h-4 w-4" />
                <span>Smart Todo List</span>
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="flex items-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Calendar Views</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todos" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TodoList 
                    title="🚀 Smart Todo List"
                    showBulkActions={true}
                    onCreateTodo={() => console.log('Create todo clicked')}
                  />
                </div>
                <div className="space-y-4">
                  <Card className="card-hover">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-medium text-blox-white mb-3">
                        ✨ New Features
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div className="flex items-start space-x-2">
                          <GripVertical className="h-3 w-3 text-blox-teal mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-blox-white font-medium">Drag & Drop</p>
                            <p className="text-blox-off-white/60">Reorder tasks with visual feedback</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Users className="h-3 w-3 text-blox-teal mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-blox-white font-medium">Bulk Actions</p>
                            <p className="text-blox-off-white/60">Select & operate on multiple todos</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Sparkles className="h-3 w-3 text-blox-teal mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-blox-white font-medium">Smart Features</p>
                            <p className="text-blox-off-white/60">Video refs, time estimates, categories</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="card-hover">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-medium text-blox-white mb-2">
                        🎯 Quick Actions
                      </h4>
                      <div className="space-y-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full text-xs"
                          onClick={() => console.log('Demo bulk select')}
                        >
                          Try Bulk Selection
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full text-xs"
                          onClick={() => console.log('Demo drag drop')}
                        >
                          Test Drag & Drop
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4">
              <CalendarView 
                defaultView="week"
                onTodoClick={(todo) => console.log('Todo clicked:', todo)}
                onDateClick={(date) => console.log('Date clicked:', date)}
              />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                {['Day', 'Week', 'Month', 'Agenda'].map((view) => (
                  <Card key={view} className="card-hover">
                    <CardContent className="p-3 text-center">
                      <Calendar className="h-6 w-6 mx-auto mb-2 text-blox-teal" />
                      <p className="text-sm font-medium text-blox-white">{view} View</p>
                      <p className="text-xs text-blox-off-white/60 mt-1">
                        {view === 'Day' && 'Hourly schedule with time blocks'}
                        {view === 'Week' && '7-day overview with task distribution'}
                        {view === 'Month' && 'Monthly calendar with task counts'}
                        {view === 'Agenda' && 'Chronological task list view'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <TodoAnalytics />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="card-hover">
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-3 text-blox-teal" />
                    <h4 className="text-sm font-medium text-blox-white mb-2">Productivity Tracking</h4>
                    <p className="text-xs text-blox-off-white/60">
                      Daily completion trends, velocity metrics, and performance insights
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="card-hover">
                  <CardContent className="p-4 text-center">
                    <Sparkles className="h-8 w-8 mx-auto mb-3 text-orange-500" />
                    <h4 className="text-sm font-medium text-blox-white mb-2">Time Accuracy</h4>
                    <p className="text-xs text-blox-off-white/60">
                      Compare estimated vs actual time to improve planning accuracy
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="card-hover">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-8 w-8 mx-auto mb-3 text-green-500" />
                    <h4 className="text-sm font-medium text-blox-white mb-2">Streak Tracking</h4>
                    <p className="text-xs text-blox-off-white/60">
                      Maintain consistency with daily completion streaks and achievements
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="card-hover border-orange-500/30">
        <CardHeader>
          <CardTitle className="text-lg text-blox-white flex items-center space-x-2">
            <ArrowRight className="h-5 w-5 text-orange-500" />
            <span>Ready for Phase B: Integration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blox-off-white/70 mb-4">
            Phase A is complete! The todo/calendar system is production-ready and can now be integrated with Team A's video processing work.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <h4 className="text-sm font-medium text-orange-400 mb-2">🔗 Phase B: Video Integration</h4>
              <ul className="text-xs text-blox-off-white/70 space-y-1">
                <li>• Connect video transcripts to todo references</li>
                <li>• Sync learning progress with schedule</li>
                <li>• AI-powered todo suggestions from videos</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <h4 className="text-sm font-medium text-purple-400 mb-2">🚀 Phase C: Advanced Features</h4>
              <ul className="text-xs text-blox-off-white/70 space-y-1">
                <li>• Team collaboration on todos</li>
                <li>• Advanced analytics & reporting</li>
                <li>• Smart scheduling & notifications</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}