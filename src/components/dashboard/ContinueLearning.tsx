'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Clock, Zap } from 'lucide-react'
import * as Progress from '@radix-ui/react-progress'

interface ContinueLearningProps {
  currentModule: {
    id: string
    title: string
    description: string
    progress: number
    timeRemaining: string
    xpToEarn: number
    week: number
  }
}

export function ContinueLearning({ currentModule }: ContinueLearningProps) {
  return (
    <Card className="card-hover border-blox-teal/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <Play className="h-5 w-5 text-blox-teal" />
          <CardTitle className="text-lg font-semibold text-blox-white">
            Continue Learning
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Module Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-blox-white text-base">
            {currentModule.title}
          </h3>
          <p className="text-sm text-blox-off-white">
            {currentModule.description} • Week {currentModule.week}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-blox-off-white">
            <Clock className="h-4 w-4" />
            <span>{currentModule.timeRemaining} remaining</span>
          </div>
          
          <div className="flex items-center space-x-1 text-blox-teal">
            <Zap className="h-4 w-4" />
            <span>+{currentModule.xpToEarn} XP</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blox-off-white">Module Progress</span>
            <span className="text-blox-white font-medium">{currentModule.progress}%</span>
          </div>
          
          <Progress.Root 
            className="relative overflow-hidden bg-blox-second-dark-blue rounded-full w-full h-2"
            value={currentModule.progress}
          >
            <Progress.Indicator
              className="bg-gradient-to-r from-blox-teal to-blox-teal-light h-full w-full flex-1 transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${100 - currentModule.progress}%)` }}
            />
          </Progress.Root>
        </div>

        {/* Resume Button */}
        <Button 
          className="w-full bg-blox-teal hover:bg-blox-teal-light text-white font-medium transition-all duration-200 shadow-lg shadow-blox-teal/20"
          size="lg"
        >
          <Play className="mr-2 h-4 w-4" />
          Resume
        </Button>
      </CardContent>
    </Card>
  )
}