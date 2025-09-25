'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/providers'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignInPage() {
  const { signInWithDiscord } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await signInWithDiscord()
      router.push('/dashboard')
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl gradient-text">Welcome Back</CardTitle>
        <CardDescription>Sign in to continue your learning journey</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleSignIn}
          disabled={isLoading}
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          {isLoading ? 'Signing in...' : 'Continue with Discord'}
        </Button>
        {process.env.NEXT_PUBLIC_DEV_MODE === 'true' && (
          <div className="text-center text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded">
            🔧 Mock Auth Active - Click to auto-login
          </div>
        )}
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