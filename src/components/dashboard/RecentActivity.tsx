'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, CheckCircle, Play, Trophy, Zap } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'completed' | 'started' | 'earned' | 'unlocked'
  title: string
  description?: string
  xp?: number
  timeAgo: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const recentActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'completed',
    title: 'Completed: Day/Night Cycles',
    description: '2 hours ago',
    xp: 50,
    timeAgo: '2 hours ago',
    icon: CheckCircle,
    color: 'text-blox-success'
  },
  {
    id: '2',
    type: 'started',
    title: 'Started: Dynamic Lighting Systems',
    description: '1 day ago',
    xp: 45,
    timeAgo: '1 day ago',
    icon: Play,
    color: 'text-blox-teal'
  },
  {
    id: '3',
    type: 'earned',
    title: 'Earned: Particle Master Achievement',
    description: '2 days ago',
    xp: 100,
    timeAgo: '2 days ago',
    icon: Trophy,
    color: 'text-blox-yellow'
  },
  {
    id: '4',
    type: 'completed',
    title: 'Completed: Magic & Fantasy Effects',
    description: '3 days ago',
    xp: 50,
    timeAgo: '3 days ago',
    icon: CheckCircle,
    color: 'text-blox-success'
  }
]

export function RecentActivity() {
  return (
    <Card className="card-hover p-2">
      <CardHeader className="pb-1 pt-1 px-0">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-blox-teal" />
          <CardTitle className="text-sm font-semibold text-blox-white">
            Recent Activity
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-1 pb-1 px-0">
        {recentActivities.map((activity) => {
          const Icon = activity.icon
          
          return (
            <div 
              key={activity.id}
              className="flex items-center space-x-2 py-0.5 px-1 rounded-lg bg-blox-second-dark-blue/30 hover:bg-blox-second-dark-blue/50 transition-all duration-200 group"
            >
              {/* Activity Icon */}
              <div className={`p-0.5 rounded-lg bg-blox-very-dark-blue ${activity.color}`}>
                <Icon className="h-3 w-3" />
              </div>
              
              {/* Activity Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-blox-white truncate">
                      {activity.title}
                    </h4>
                    <p className="text-xs text-blox-off-white mt-0.5">
                      {activity.timeAgo}
                    </p>
                  </div>
                  
                  {/* XP Badge */}
                  {activity.xp && (
                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                      <Zap className="h-2.5 w-2.5 text-blox-teal" />
                      <span className="text-xs font-medium text-blox-teal">
                        +{activity.xp}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}