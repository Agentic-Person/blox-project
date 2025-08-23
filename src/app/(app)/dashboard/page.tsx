'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, TrendingUp, Zap, Video } from 'lucide-react'
import { fadeInUp, staggerChildren } from '@/styles/animations'
import { ContinueLearning } from '@/components/dashboard/ContinueLearning'
import { LearningProgress } from '@/components/dashboard/LearningProgress'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { TodaySchedule } from '@/components/dashboard/TodaySchedule'
import { BloxTokenCard } from '@/components/dashboard/BloxTokenCard'
import { BloxWizardDashboard } from '@/components/dashboard/BloxWizardDashboard'

export default function DashboardPage() {
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


      {/* Enhanced Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={fadeInUp} className="glass-card p-4 rounded-lg card-hover-glow">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-blox-teal" />
            <div>
              <p className="text-2xl font-bold text-blox-white">39</p>
              <p className="text-xs text-blox-light-blue-gray">Videos Watched</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="glass-card p-4 rounded-lg card-hover-glow">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-blox-teal" />
            <div>
              <p className="text-2xl font-bold text-blox-white">1,140</p>
              <p className="text-xs text-blox-light-blue-gray">XP Earned</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="glass-card p-4 rounded-lg card-hover-glow">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blox-success" />
            <div>
              <p className="text-2xl font-bold text-blox-white">2</p>
              <p className="text-xs text-blox-light-blue-gray">Modules Complete</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="glass-card p-4 rounded-lg card-hover-glow">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blox-success" />
            <div>
              <p className="text-2xl font-bold text-blox-white">7</p>
              <p className="text-xs text-blox-light-blue-gray">Day Streak 🔥</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

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

      {/* Blox Wizard AI Assistant - Above Learning Path */}
      <BloxWizardDashboard />

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