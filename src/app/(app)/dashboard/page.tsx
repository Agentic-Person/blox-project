'use client'

import { useEffect, Suspense } from 'react'

// Force dynamic rendering to avoid SSG issues with useSearchParams
export const dynamic = 'force-dynamic'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Zap } from 'lucide-react'
import { ContinueLearning } from '@/components/dashboard/ContinueLearning'
import { LearningProgress } from '@/components/dashboard/LearningProgress'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { TodaySchedule } from '@/components/dashboard/TodaySchedule'
import { BloxTokenCard } from '@/components/dashboard/BloxTokenCard'
import { BloxWizardHeroCard } from '@/components/dashboard/BloxWizardHeroCard'
import { AIWelcomeOverlay } from '@/components/dashboard/AIWelcomeOverlay'
import { useAIJourney } from '@/hooks/useAIJourney'

function DashboardContent() {
  const searchParams = useSearchParams()
  const { forceShowWelcomeOverlay } = useAIJourney()

  // Check if this is a first visit from landing page
  const isFirstVisit = searchParams?.get('firstVisit') === 'true'

  useEffect(() => {
    if (isFirstVisit) {
      // Force show overlay for first-time users
      forceShowWelcomeOverlay()
    }
  }, [isFirstVisit, forceShowWelcomeOverlay])

  // Mock data for continue learning
  const currentModule = {
    id: 'module-3',
    title: 'Module 3: Advanced Building Techniques',
    description: 'Creating Dynamic Lighting Systems',
    progress: 67,
    timeRemaining: '18:45 remaining',
    xpToEarn: 450,
    week: 10
  }

  return (
    <div className="pt-3 px-6 pb-6 space-y-4 max-w-7xl mx-auto">
      {/* Welcome Overlay for first-time users */}
      <AIWelcomeOverlay onComplete={() => console.log('AI Journey started!')} />
      
      {/* Temporary test button - remove in production */}
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => {
            localStorage.removeItem('blox-buddy-visited')
            localStorage.removeItem('ai-journey-storage')
            window.location.href = '/'
          }}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white text-xs"
        >
          Reset First Visit
        </button>
      </div>
      

      {/* Blox Wizard Hero Card - Prominent introduction */}
      <BloxWizardHeroCard />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left Column - Continue Learning */}
        <div className="xl:col-span-2">
          <ContinueLearning currentModule={currentModule} />
        </div>

        {/* Right Column - Recent Activity */}
        <div>
          <RecentActivity />
        </div>
      </div>

      {/* Learning Progress Section */}
      <LearningProgress modules={[]} overallProgress={44} />

      {/* Bottom Grid - Activities and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <QuickActions />
        
        {/* Today's Schedule */}
        <TodaySchedule />
      </div>

      {/* BLOX Token Section and Community Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BLOX Token Card */}
        <BloxTokenCard />
        
        {/* Community Highlights */}
        <Card className="card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blox-teal" />
                <CardTitle className="text-lg font-semibold text-blox-white">
                  Community Highlights
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-blox-second-dark-blue/30">
                <div className="w-8 h-8 bg-blox-purple rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blox-white">
                    AlexBuilder just completed Module 4!
                  </h4>
                  <p className="text-xs text-blox-off-white">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-blox-second-dark-blue/30">
                <div className="w-8 h-8 bg-blox-teal rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blox-white">
                    TeamRocket earned 500 BLOX today!
                  </h4>
                  <p className="text-xs text-blox-off-white">5 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-blox-second-dark-blue/30">
                <div className="w-8 h-8 bg-blox-success rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blox-white">
                    New weekly challenge available!
                  </h4>
                  <p className="text-xs text-blox-off-white">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="pt-3 px-6 pb-6 space-y-4 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-blox-second-dark-blue rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 h-48 bg-blox-second-dark-blue rounded"></div>
            <div className="h-48 bg-blox-second-dark-blue rounded"></div>
          </div>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}