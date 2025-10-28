'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Bot } from 'lucide-react'

export default function LoginPage() {
  const { signIn, user, isLoading } = useAuth()
  const router = useRouter()
  const [signing, setSigning] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // If already authenticated, redirect
    if (user) {
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl')
      router.push(returnUrl || '/dashboard')
    }
  }, [user, router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSigning(true)
    setError('')

    try {
      await signIn(email, password)
      // Redirect will happen automatically via useEffect
    } catch (error: any) {
      console.error('Sign in error:', error)
      setError(error.message || 'Invalid email or password')
      setSigning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blox-dark-blue via-blox-black-blue to-blox-second-dark-blue flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blox-teal mx-auto"></div>
          <p className="mt-4 text-blox-off-white">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blox-dark-blue via-blox-black-blue to-blox-second-dark-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blox-teal to-blox-purple rounded-2xl mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blox-teal to-blox-purple bg-clip-text text-transparent">
            Blox Buddy
          </h1>
          <p className="text-blox-off-white mt-2">Welcome back to your learning journey</p>
        </div>

        <Card className="bg-blox-black-blue/50 border-blox-teal/20 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-blox-white">Sign In</CardTitle>
            <CardDescription className="text-blox-off-white">
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blox-white">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-blox-second-dark-blue border-blox-off-white/20 text-blox-white"
                  disabled={signing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-blox-white">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-blox-second-dark-blue border-blox-off-white/20 text-blox-white"
                  disabled={signing}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blox-teal to-blox-purple hover:opacity-90"
                disabled={signing || !email || !password}
              >
                {signing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="text-center text-sm text-blox-off-white">
                Don't have an account?{' '}
                <Link href="/signup" className="text-blox-teal hover:underline font-medium">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}