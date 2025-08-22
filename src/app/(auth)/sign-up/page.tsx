import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl gradient-text">Join Blox Buddy</CardTitle>
        <CardDescription>Start your Roblox development journey today</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full" size="lg">
          <MessageCircle className="mr-2 h-5 w-5" />
          Sign up with Discord
        </Button>
        <div className="text-center text-sm text-blox-off-white">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-blox-teal hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}