'use client'

import { Trophy, Zap, Target, Users, BookOpen, Code } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface EarnOpportunity {
  id: string
  title: string
  description: string
  reward: number
  icon: any
  difficulty: 'easy' | 'medium' | 'hard'
  category: 'learning' | 'social' | 'achievement'
  progress?: number
}

const opportunities: EarnOpportunity[] = [
  {
    id: '1',
    title: 'Complete Module 2',
    description: 'Finish all lessons in Module 2: Basic Scripting',
    reward: 75,
    icon: BookOpen,
    difficulty: 'medium',
    category: 'learning',
    progress: 60,
  },
  {
    id: '2',
    title: '7-Day Streak',
    description: 'Log in for 7 consecutive days',
    reward: 30,
    icon: Zap,
    difficulty: 'easy',
    category: 'achievement',
    progress: 5,
  },
  {
    id: '3',
    title: 'Help a Team Member',
    description: 'Answer a question or help with a project',
    reward: 15,
    icon: Users,
    difficulty: 'easy',
    category: 'social',
  },
  {
    id: '4',
    title: 'Build Your First Game',
    description: 'Complete and publish your first Roblox game',
    reward: 150,
    icon: Trophy,
    difficulty: 'hard',
    category: 'achievement',
  },
  {
    id: '5',
    title: 'Code Challenge',
    description: 'Complete this week\'s coding challenge',
    reward: 50,
    icon: Code,
    difficulty: 'medium',
    category: 'learning',
  },
]

export function EarnBlox() {
  const getDifficultyColor = (difficulty: EarnOpportunity['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-500 bg-green-500/10 border-green-500/30'
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
      case 'hard':
        return 'text-red-500 bg-red-500/10 border-red-500/30'
    }
  }

  const getCategoryColor = (category: EarnOpportunity['category']) => {
    switch (category) {
      case 'learning':
        return 'bg-blue-500/10 text-blue-500'
      case 'social':
        return 'bg-purple-500/10 text-purple-500'
      case 'achievement':
        return 'bg-green-500/10 text-green-500'
    }
  }

  return (
    <Card className="bg-blox-black-blue/50 border-blox-teal/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blox-teal" />
          Earn BLOX Tokens
        </CardTitle>
        <CardDescription>Complete tasks to earn rewards</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.map((opportunity) => {
            const Icon = opportunity.icon
            return (
              <div
                key={opportunity.id}
                className="p-4 rounded-lg bg-blox-second-dark-blue/30 hover:bg-blox-second-dark-blue/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(opportunity.category)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{opportunity.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getDifficultyColor(opportunity.difficulty)}`}>
                          {opportunity.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-blox-off-white mb-2">
                        {opportunity.description}
                      </p>
                      {opportunity.progress !== undefined && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-blox-off-white">Progress</span>
                            <span className="text-blox-teal">{opportunity.progress}%</span>
                          </div>
                          <div className="h-2 bg-blox-black-blue rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blox-teal to-blox-teal-dark"
                              style={{ width: `${opportunity.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-blox-teal">
                          +{opportunity.reward} BLOX
                        </p>
                        <Button size="sm" variant="outline" className="border-blox-teal text-blox-teal hover:bg-blox-teal/10">
                          {opportunity.progress ? 'Continue' : 'Start'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}