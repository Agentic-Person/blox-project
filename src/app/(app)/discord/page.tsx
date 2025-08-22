import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Users, Volume2 } from 'lucide-react'

export default function DiscordPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-blox-white mb-2">Discord Community</h1>
      <p className="text-blox-off-white mb-8">Connect with other developers and get help</p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="mr-2 h-5 w-5 text-blox-teal" />
            Join Our Discord Server
          </CardTitle>
          <CardDescription>
            Connect with thousands of Roblox developers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blox-white">2,547</div>
              <div className="text-sm text-blox-off-white">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blox-success">892</div>
              <div className="text-sm text-blox-off-white">Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blox-teal">24/7</div>
              <div className="text-sm text-blox-off-white">Support</div>
            </div>
          </div>
          <Button className="w-full md:w-auto">
            Join Discord Server
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}