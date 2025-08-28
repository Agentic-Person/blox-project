'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronUp, 
  Bot, 
  Calendar, 
  Target, 
  Brain,
  MessageSquare,
  ExternalLink,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAIJourney } from '@/hooks/useAIJourney'
import { AIJourneyPath } from './AIJourneyPath'
import Link from 'next/link'

interface InfoCardProps {
  icon: React.ElementType
  title: string
  value: string
  subtitle?: string
  color?: string
  action?: {
    label: string
    onClick: () => void
  }
}

function InfoCard({ icon: Icon, title, value, subtitle, color = 'blox-teal', action }: InfoCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="glass-card-teal p-4 rounded-xl"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 bg-${color}/10 rounded-lg`}>
          <Icon className={`h-4 w-4 text-${color}`} />
        </div>
        {action && (
          <Button
            size="sm"
            variant="ghost"
            onClick={action.onClick}
            className="text-xs h-auto p-1 text-blox-off-white/70 hover:text-blox-white"
          >
            {action.label}
          </Button>
        )}
      </div>
      
      <div>
        <p className="text-xs text-blox-off-white/60 uppercase tracking-wider mb-1">
          {title}
        </p>
        <p className="text-lg font-bold text-blox-white mb-1">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-blox-off-white/70">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  )
}

interface AIJourneyWidgetProps {
  className?: string
}

export function AIJourneyWidget({ className = '' }: AIJourneyWidgetProps) {
  const { 
    journey, 
    isExpanded, 
    progress, 
    todayFocus, 
    weekOverview,
    setExpanded,
    markTaskComplete,
    getNextAction,
    getStreak
  } = useAIJourney()

  const [showFullPath, setShowFullPath] = useState(false)

  if (!journey) {
    return (
      <div className={`${className} mb-6`}>
        <Card className="glass-card-teal">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-blox-teal/10 rounded-full">
                <Bot className="h-8 w-8 text-blox-teal" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blox-white mb-2">
                  AI Journey Awaits
                </h3>
                <p className="text-blox-off-white/70 mb-4">
                  Start your personalized Roblox learning journey with AI guidance
                </p>
                <Link href="/ai-assistant">
                  <Button className="bg-gradient-to-r from-blox-teal to-blox-teal-dark">
                    Start Journey
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleToggleExpanded = () => {
    setExpanded(!isExpanded)
  }

  return (
    <div className={`${className} mb-6`}>
      <Card className="glass-card-teal overflow-hidden">
        <CardHeader 
          className="pb-3 cursor-pointer" 
          onClick={handleToggleExpanded}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blox-teal/20 rounded-lg">
                <Bot className="h-5 w-5 text-blox-teal" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-blox-white">
                  AI Journey: {journey.gameTitle}
                </CardTitle>
                <p className="text-sm text-blox-off-white/70">
                  {progress.percentComplete}% complete • {getStreak()} day streak 🔥
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-blox-success/50 text-blox-success bg-blox-success/10">
                <TrendingUp className="h-3 w-3 mr-1" />
                On Track
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-blox-white hover:bg-blox-teal/10"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0 pb-6">
                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                  <InfoCard
                    icon={Target}
                    title="Today's Focus"
                    value={todayFocus.primaryTask?.title || todayFocus.skillInProgress}
                    subtitle={todayFocus.primaryTask ? 
                      `${todayFocus.primaryTask.duration} minutes • ${todayFocus.tasksRemaining} tasks remaining` :
                      `${todayFocus.progressToday}% daily progress`
                    }
                    color="blox-teal"
                    action={todayFocus.primaryTask ? {
                      label: 'Start',
                      onClick: () => {
                        // Would navigate to specific task or mark as started
                        console.log('Starting task:', todayFocus.primaryTask?.title)
                      }
                    } : undefined}
                  />

                  <InfoCard
                    icon={Calendar}
                    title="This Week"
                    value={`Week ${weekOverview.currentWeek}`}
                    subtitle={`${weekOverview.weeklyGoal} • ${weekOverview.daysRemaining} days left`}
                    color="blox-purple"
                  />

                  <InfoCard
                    icon={Zap}
                    title="Current Skill"
                    value={journey.currentSkill}
                    subtitle={`Module ${journey.currentModule} • ${progress.estimatedTimeRemaining}h remaining`}
                    color="blox-xp"
                  />

                  <InfoCard
                    icon={Brain}
                    title="AI Insight"
                    value={journey.aiInsights.pace === 'on-track' ? 'Great Pace!' : journey.aiInsights.pace}
                    subtitle={journey.aiInsights.motivationalTip}
                    color="blox-success"
                  />
                </div>

                {/* Learning Path Preview */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-blox-white">
                      Learning Path Progress
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullPath(!showFullPath)}
                      className="text-blox-teal hover:text-blox-white hover:bg-blox-teal/10 text-sm"
                    >
                      {showFullPath ? 'Hide Path' : 'Show Full Path'}
                    </Button>
                  </div>

                  {showFullPath ? (
                    <AIJourneyPath className="bg-blox-second-dark-blue/30 p-4 rounded-lg" />
                  ) : (
                    <div className="bg-blox-second-dark-blue/30 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-blox-off-white/70">
                          {progress.completedSkills} of {progress.totalSkills} skills
                        </span>
                        <span className="text-sm font-medium text-blox-white">
                          {progress.percentComplete}%
                        </span>
                      </div>
                      <div className="w-full bg-blox-off-white/10 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.percentComplete}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-blox-teal to-blox-success rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                  <Link href="/ai-assistant">
                    <Button 
                      className="bg-gradient-to-r from-blox-teal to-blox-teal-dark hover:scale-105 transition-transform"
                      size="sm"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chat with Wizard
                    </Button>
                  </Link>

                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-blox-teal/30 text-blox-teal hover:bg-blox-teal/10"
                    onClick={() => setShowFullPath(true)}
                  >
                    <Target className="mr-2 h-4 w-4" />
                    View Full Journey
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-blox-off-white/70 hover:text-blox-white hover:bg-blox-second-dark-blue/50"
                    onClick={() => {
                      if (todayFocus.primaryTask) {
                        markTaskComplete(0) // Mark first incomplete task as complete
                      }
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {getNextAction()}
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-blox-off-white/70 hover:text-blox-white hover:bg-blox-second-dark-blue/50"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                </div>

                {/* AI Suggestion */}
                {journey.aiInsights.suggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 p-3 bg-blox-teal/10 border border-blox-teal/30 rounded-lg"
                  >
                    <div className="flex items-start space-x-2">
                      <Brain className="h-4 w-4 text-blox-teal mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-blox-teal mb-1">AI Suggestion</p>
                        <p className="text-sm text-blox-white">
                          {journey.aiInsights.suggestion}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}