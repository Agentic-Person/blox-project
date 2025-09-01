'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bot, 
  MessageSquare, 
  Calendar, 
  Route, 
  Brain,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Zap,
  Trophy,
  Target,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AIJourneyPath } from '@/components/dashboard/AIJourneyPath'
import { JourneyBuilder } from '@/components/blox-wizard/JourneyBuilder'
import { AIScheduler } from '@/components/blox-wizard/AIScheduler'
import { SkillTree } from '@/components/blox-wizard/SkillTree'
import { AIChat } from '@/components/blox-wizard/AIChat'
import { GamePreview } from '@/components/blox-wizard/GamePreview'
import { AIJourneyDatabaseTest } from '@/components/debug/AIJourneyDatabaseTest'
import { useAIJourney } from '@/hooks/useAIJourney'
import Link from 'next/link'

interface StatCard {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  trend?: string
}

export default function BloxWizardPage() {
  const { journey, progress, todayFocus, weekOverview, getStreak } = useAIJourney()
  const [activeTab, setActiveTab] = useState('chat')
  
  const stats: StatCard[] = [
    {
      icon: Zap,
      label: 'XP Earned',
      value: '2,450',
      color: 'text-blox-xp',
      trend: '+150 today'
    },
    {
      icon: Trophy,
      label: 'Skills Completed',
      value: `${progress.completedSkills}/${progress.totalSkills}`,
      color: 'text-blox-success',
      trend: `${progress.percentComplete}%`
    },
    {
      icon: Target,
      label: 'Current Streak',
      value: `${getStreak()} days`,
      color: 'text-orange-400',
      trend: '🔥'
    },
    {
      icon: TrendingUp,
      label: 'Learning Pace',
      value: 'On Track',
      color: 'text-blox-teal',
      trend: '↗'
    }
  ]
  
  const tabItems = [
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'path', label: 'Path Editor', icon: Route },
    { id: 'tree', label: 'Skill Tree', icon: Brain },
    { id: 'test', label: 'DB Test', icon: Bot }
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blox-very-dark-blue to-blox-black-blue">
      {/* Header */}
      <div className="border-b border-blox-off-white/10 bg-blox-black-blue/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-blox-off-white/70 hover:text-blox-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blox-purple/30 to-blox-teal/30 rounded-lg">
                  <Bot className="h-6 w-6 text-blox-teal" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text">
                    Blox Wizard Command Center
                  </h1>
                  <p className="text-sm text-blox-off-white/60">
                    {journey ? `Building: ${journey.gameTitle}` : 'Your AI Learning Companion'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className="bg-blox-teal/20 text-blox-teal border-blox-teal/30">
                <div className="w-2 h-2 bg-blox-teal rounded-full mr-2 animate-pulse" />
                AI Active
              </Badge>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blox-purple to-blox-teal"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Journey Visualizer Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card-teal overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-blox-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blox-teal" />
                  Your Learning Journey
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blox-off-white/70 hover:text-blox-white"
                >
                  Customize Path
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <AIJourneyPath className="bg-blox-second-dark-blue/20 p-4 rounded-lg" />
            </div>
          </Card>
        </motion.div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Main Content (3 cols) */}
          <div className="xl:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-5 bg-blox-second-dark-blue/50">
                  {tabItems.map(tab => {
                    const Icon = tab.icon
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="data-[state=active]:bg-blox-teal data-[state=active]:text-white"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="min-h-[600px]"
                  >
                    <TabsContent value="chat" className="mt-0">
                      <AIChat />
                    </TabsContent>
                    
                    <TabsContent value="schedule" className="mt-0">
                      <AIScheduler />
                    </TabsContent>
                    
                    <TabsContent value="path" className="mt-0">
                      <JourneyBuilder />
                    </TabsContent>
                    
                    <TabsContent value="tree" className="mt-0">
                      <SkillTree />
                    </TabsContent>
                    
                    <TabsContent value="test" className="mt-0">
                      <AIJourneyDatabaseTest />
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </motion.div>
          </div>
          
          {/* Right Column - Stats & Game Preview (1 col) */}
          <div className="space-y-6">
            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-2 gap-3"
            >
              {stats.map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <Card key={idx} className="glass-card-teal">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                        <span className="text-xs text-blox-off-white/60">
                          {stat.trend}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-blox-white">
                        {stat.value}
                      </p>
                      <p className="text-xs text-blox-off-white/60">
                        {stat.label}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </motion.div>
            
            {/* Game Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <GamePreview />
            </motion.div>
            
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="glass-card-teal">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm text-blox-white mb-3">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <Button 
                      className="w-full justify-start bg-blox-second-dark-blue/50 
                        hover:bg-blox-second-dark-blue/70 text-left"
                      size="sm"
                    >
                      <Zap className="h-4 w-4 mr-2 text-blox-teal" />
                      Continue Learning
                    </Button>
                    <Button 
                      className="w-full justify-start bg-blox-second-dark-blue/50 
                        hover:bg-blox-second-dark-blue/70 text-left"
                      size="sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-2 text-blox-purple" />
                      Ask AI for Help
                    </Button>
                    <Button 
                      className="w-full justify-start bg-blox-second-dark-blue/50 
                        hover:bg-blox-second-dark-blue/70 text-left"
                      size="sm"
                    >
                      <Calendar className="h-4 w-4 mr-2 text-blox-xp" />
                      View Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
        
        {/* AI Insights Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-blox-purple/10 to-blox-teal/10 border-blox-teal/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blox-teal/20 rounded-lg">
                  <Brain className="h-6 w-6 text-blox-teal" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blox-white mb-2">
                    AI Insight of the Day
                  </h3>
                  <p className="text-blox-off-white/80 mb-3">
                    {journey?.aiInsights.suggestion || 
                     'You\'re making excellent progress! Based on your learning pattern, you perform best in the afternoon. Consider scheduling your practice sessions between 2-5 PM for optimal retention.'}
                  </p>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-xs">
                      {journey?.aiInsights.pace || 'On Track'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Next: {journey?.aiInsights.nextMilestone || 'Complete current module'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}