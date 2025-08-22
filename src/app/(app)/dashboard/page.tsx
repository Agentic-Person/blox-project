import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, TrendingUp, Trophy, Play, ChevronRight } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blox-white mb-2">
          Welcome back, BloxBuilder123! 👋
        </h1>
        <p className="text-blox-off-white">
          Ready to continue your Roblox development journey?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos Watched</CardTitle>
            <BookOpen className="h-4 w-4 text-blox-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blox-white">47</div>
            <p className="text-xs text-blox-off-white">
              +3 from last week
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-blox-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blox-white">12 days</div>
            <p className="text-xs text-blox-off-white">
              Keep it up! 🔥
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams Joined</CardTitle>
            <Users className="h-4 w-4 text-blox-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blox-white">2</div>
            <p className="text-xs text-blox-off-white">
              Active in GameDev Squad
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blox-white">8</div>
            <p className="text-xs text-blox-off-white">
              2 new this week!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Play className="mr-2 h-5 w-5 text-blox-teal" />
                Continue Learning
              </CardTitle>
              <CardDescription>
                Pick up where you left off
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 p-4 bg-blox-black-blue rounded-lg">
                <div className="w-16 h-12 bg-blox-teal rounded-lg flex items-center justify-center">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blox-white">Understanding Parts and Properties</h3>
                  <p className="text-sm text-blox-off-white">Module 1: Foundation Building • 8 minutes remaining</p>
                  <div className="w-full bg-blox-medium-blue-gray rounded-full h-2 mt-2">
                    <div className="bg-blox-teal h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <Button size="sm">
                  Continue
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Jump to popular sections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="ghost" className="w-full justify-start">
              <BookOpen className="mr-2 h-4 w-4" />
              Browse Modules
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Find Teams
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Progress
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest learning milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blox-success rounded-full"></div>
              <span className="text-blox-white">Completed "Welcome to Roblox Studio"</span>
              <span className="text-xs text-blox-off-white ml-auto">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blox-teal rounded-full"></div>
              <span className="text-blox-white">Joined team "GameDev Squad"</span>
              <span className="text-xs text-blox-off-white ml-auto">1 day ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-blox-white">Unlocked "First Steps" achievement</span>
              <span className="text-xs text-blox-off-white ml-auto">2 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}