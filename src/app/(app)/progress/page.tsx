import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Trophy, Clock, Target } from 'lucide-react'

export default function ProgressPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-blox-white mb-2">Progress Tracking</h1>
      <p className="text-blox-off-white mb-8">Monitor your learning journey and achievements</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-blox-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blox-white">23%</div>
            <p className="text-xs text-blox-off-white">
              1 of 6 modules completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Invested</CardTitle>
            <Clock className="h-4 w-4 text-blox-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blox-white">21h</div>
            <p className="text-xs text-blox-off-white">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blox-white">8</div>
            <p className="text-xs text-blox-off-white">
              2 new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Goal</CardTitle>
            <Target className="h-4 w-4 text-blox-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blox-white">15</div>
            <p className="text-xs text-blox-off-white">
              days to complete Module 1
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}