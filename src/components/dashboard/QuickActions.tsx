'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, MessageSquare, Zap } from 'lucide-react'
import Link from 'next/link'

const quickActions = [
  {
    title: 'Browse Learning Path',
    description: 'Explore modules and videos',
    icon: BookOpen,
    href: '/learning',
    color: 'text-blox-teal'
  },
  {
    title: 'Find Team Members',
    description: 'Join or create teams',
    icon: Users,
    href: '/teams',
    color: 'text-blox-purple'
  },
  {
    title: 'Join Discord Community',
    description: 'Connect with other builders',
    icon: MessageSquare,
    href: '/discord',
    color: 'text-blox-blue'
  }
]

export function QuickActions() {
  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-blox-teal" />
          <CardTitle className="text-lg font-semibold text-blox-white">
            Quick Actions
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon
          
          return (
            <Link key={index} href={action.href}>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-4 hover:bg-blox-second-dark-blue/50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className={`p-2 rounded-lg bg-blox-very-dark-blue group-hover:bg-blox-second-dark-blue transition-colors ${action.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-blox-white group-hover:text-blox-teal transition-colors">
                      {action.title}
                    </div>
                    <div className="text-xs text-blox-off-white">
                      {action.description}
                    </div>
                  </div>
                </div>
              </Button>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}