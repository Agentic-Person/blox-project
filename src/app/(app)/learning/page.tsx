import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Clock, Users, CheckCircle, Play } from 'lucide-react'
import Link from 'next/link'

export default function LearningPage() {
  const modules = [
    {
      id: 'module-1',
      title: 'Foundation Building',
      description: 'Learn the fundamentals of Roblox development through hands-on building',
      weeks: 4,
      estimatedHours: 20,
      progress: 60,
      status: 'in-progress',
      thumbnail: '/images/thumbnails/module-1.jpg'
    },
    {
      id: 'module-2',
      title: 'Scripting Basics',
      description: 'Introduction to Lua scripting and game logic',
      weeks: 5,
      estimatedHours: 30,
      progress: 0,
      status: 'locked',
      thumbnail: '/images/thumbnails/module-2.jpg'
    },
    {
      id: 'module-3',
      title: 'Game Mechanics',
      description: 'Implement core game mechanics and systems',
      weeks: 4,
      estimatedHours: 25,
      progress: 0,
      status: 'locked',
      thumbnail: '/images/thumbnails/module-3.jpg'
    },
    {
      id: 'module-4',
      title: 'UI and UX Design',
      description: 'Create engaging user interfaces and experiences',
      weeks: 3,
      estimatedHours: 15,
      progress: 0,
      status: 'locked',
      thumbnail: '/images/thumbnails/module-4.jpg'
    },
    {
      id: 'module-5',
      title: 'Advanced Systems',
      description: 'DataStores, RemoteEvents, and advanced scripting',
      weeks: 6,
      estimatedHours: 35,
      progress: 0,
      status: 'locked',
      thumbnail: '/images/thumbnails/module-5.jpg'
    },
    {
      id: 'module-6',
      title: 'Publishing & Monetization',
      description: 'Launch your game and implement monetization strategies',
      weeks: 3,
      estimatedHours: 20,
      progress: 0,
      status: 'locked',
      thumbnail: '/images/thumbnails/module-6.jpg'
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blox-white mb-2">
          Learning Path
        </h1>
        <p className="text-blox-off-white">
          Master Roblox development through our structured 6-month curriculum
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>Complete overview of your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blox-teal">1/6</div>
              <div className="text-sm text-blox-off-white">Modules Started</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blox-success">47</div>
              <div className="text-sm text-blox-off-white">Videos Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blox-white">21h</div>
              <div className="text-sm text-blox-off-white">Time Invested</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">12</div>
              <div className="text-sm text-blox-off-white">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => (
          <Card 
            key={module.id} 
            className={`card-hover relative ${
              module.status === 'locked' ? 'opacity-60' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blox-teal rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {index + 1}
                  </div>
                  {module.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-blox-success" />
                  )}
                  {module.status === 'in-progress' && (
                    <Play className="h-5 w-5 text-blox-teal" />
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-blox-off-white">{module.weeks} weeks</div>
                  <div className="text-xs text-blox-medium-blue-gray flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {module.estimatedHours}h
                  </div>
                </div>
              </div>
              <CardTitle className="text-lg">{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {module.status !== 'locked' && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blox-off-white">Progress</span>
                    <span className="text-blox-teal">{module.progress}%</span>
                  </div>
                  <div className="w-full bg-blox-medium-blue-gray rounded-full h-2">
                    <div 
                      className="bg-blox-teal h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${module.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {module.status === 'locked' ? (
                <Button disabled className="w-full">
                  Locked
                </Button>
              ) : (
                <Link href={`/learning/${module.id}`}>
                  <Button className="w-full">
                    {module.status === 'in-progress' ? 'Continue' : 'Start Module'}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}