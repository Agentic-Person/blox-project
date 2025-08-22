import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl gradient-text">Welcome Back</CardTitle>
        <CardDescription>Sign in to continue your learning journey</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full" size="lg">
          <MessageCircle className="mr-2 h-5 w-5" />
          Continue with Discord
        </Button>
        <div className="text-center text-sm text-blox-off-white">
          Don't have an account?{' '}
          <Link href="/sign-up" className="text-blox-teal hover:underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}