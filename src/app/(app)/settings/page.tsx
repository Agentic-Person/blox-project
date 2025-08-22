import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Bell, Lock, Palette } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-blox-white mb-8">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5 text-blox-teal" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-blox-white">Email notifications</span>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blox-white">Discord notifications</span>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blox-white">Achievement alerts</span>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="mr-2 h-5 w-5 text-blox-teal" />
              Privacy
            </CardTitle>
            <CardDescription>
              Control your privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-blox-white">Profile visibility</span>
              <Button variant="outline" size="sm">Public</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blox-white">Show progress</span>
              <Button variant="outline" size="sm">Yes</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blox-white">Show teams</span>
              <Button variant="outline" size="sm">Yes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}