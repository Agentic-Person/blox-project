import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Edit, Trophy, Users, BookOpen } from 'lucide-react'

export default function ProfilePage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-blox-white mb-8">Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-blox-teal" />
                  Profile Information
                </span>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blox-teal to-blox-teal-dark rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">AB</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-blox-white">BloxBuilder123</h2>
                  <p className="text-blox-off-white">Alex Thompson</p>
                  <p className="text-sm text-blox-medium-blue-gray">Joined January 15, 2024</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-blox-white">Bio</label>
                  <p className="text-blox-off-white">
                    Passionate about game development and Roblox scripting. Looking to join an awesome team!
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-blox-white">Skills</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-3 py-1 bg-blox-black-blue text-blox-teal text-sm rounded-md border border-blox-glass-border">
                      Building - Intermediate
                    </span>
                    <span className="px-3 py-1 bg-blox-black-blue text-blox-teal text-sm rounded-md border border-blox-glass-border">
                      Scripting - Beginner
                    </span>
                    <span className="px-3 py-1 bg-blox-black-blue text-blox-teal text-sm rounded-md border border-blox-glass-border">
                      UI Design - Beginner
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 text-blox-teal mr-2" />
                  <span className="text-blox-off-white">Videos Watched</span>
                </div>
                <span className="text-blox-white font-semibold">47</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-blox-off-white">Achievements</span>
                </div>
                <span className="text-blox-white font-semibold">8</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-blox-teal mr-2" />
                  <span className="text-blox-off-white">Teams Joined</span>
                </div>
                <span className="text-blox-white font-semibold">2</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="text-blox-white">Completed video</div>
                  <div className="text-blox-off-white">2 hours ago</div>
                </div>
                <div className="text-sm">
                  <div className="text-blox-white">Joined team</div>
                  <div className="text-blox-off-white">1 day ago</div>
                </div>
                <div className="text-sm">
                  <div className="text-blox-white">Unlocked achievement</div>
                  <div className="text-blox-off-white">2 days ago</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}