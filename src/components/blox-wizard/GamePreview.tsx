'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Gamepad2,
  Check,
  Lock,
  Sparkles,
  Share2,
  Download,
  Trophy,
  Users,
  Zap,
  Eye,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAIJourney } from '@/hooks/useAIJourney'

interface GameFeature {
  id: string
  name: string
  description: string
  unlocked: boolean
  skillRequired: string
  icon: React.ElementType
}

interface GamePreviewProps {
  className?: string
  onShare?: () => void
}

const gameFeatures: Record<string, GameFeature[]> = {
  horror: [
    { id: 'movement', name: 'Player Movement', description: 'Basic WASD controls', unlocked: true, skillRequired: 'basics', icon: Zap },
    { id: 'lighting', name: 'Dynamic Lighting', description: 'Spooky atmosphere', unlocked: true, skillRequired: 'lighting', icon: Eye },
    { id: 'sound', name: 'Horror Sounds', description: '3D audio effects', unlocked: false, skillRequired: 'sound', icon: Zap },
    { id: 'ai', name: 'Enemy AI', description: 'Smart NPCs', unlocked: false, skillRequired: 'ai', icon: Users },
    { id: 'jumpscare', name: 'Jump Scares', description: 'Heart-stopping moments', unlocked: false, skillRequired: 'mechanics', icon: Zap }
  ],
  rpg: [
    { id: 'character', name: 'Character System', description: 'Player stats & levels', unlocked: true, skillRequired: 'basics', icon: Users },
    { id: 'inventory', name: 'Inventory', description: 'Item management', unlocked: false, skillRequired: 'inventory', icon: Zap },
    { id: 'stats', name: 'Stat System', description: 'XP and progression', unlocked: false, skillRequired: 'stats', icon: Trophy },
    { id: 'combat', name: 'Combat', description: 'Battle mechanics', unlocked: false, skillRequired: 'combat', icon: Zap },
    { id: 'quests', name: 'Quest System', description: 'Story missions', unlocked: false, skillRequired: 'quests', icon: Check }
  ],
  racing: [
    { id: 'vehicle', name: 'Vehicle Physics', description: 'Realistic car handling', unlocked: true, skillRequired: 'basics', icon: Zap },
    { id: 'tracks', name: 'Race Tracks', description: 'Custom circuits', unlocked: false, skillRequired: 'tracks', icon: Eye },
    { id: 'ui', name: 'Racing UI', description: 'Speedometer & timers', unlocked: false, skillRequired: 'ui', icon: Clock },
    { id: 'multiplayer', name: 'Multiplayer', description: 'Online racing', unlocked: false, skillRequired: 'multiplayer', icon: Users },
    { id: 'tuning', name: 'Car Customization', description: 'Upgrades & tuning', unlocked: false, skillRequired: 'customization', icon: Zap }
  ],
  'battle-royale': [
    { id: 'mechanics', name: 'Core Mechanics', description: 'Basic gameplay loop', unlocked: true, skillRequired: 'basics', icon: Zap },
    { id: 'zone', name: 'Safe Zone', description: 'Shrinking play area', unlocked: false, skillRequired: 'zone', icon: Eye },
    { id: 'weapons', name: 'Weapon System', description: 'Guns and items', unlocked: false, skillRequired: 'weapons', icon: Zap },
    { id: 'lobby', name: 'Match Lobby', description: 'Player matchmaking', unlocked: false, skillRequired: 'lobby', icon: Users },
    { id: 'spectator', name: 'Spectator Mode', description: 'Watch after death', unlocked: false, skillRequired: 'spectator', icon: Eye }
  ],
  custom: [
    { id: 'core', name: 'Core Mechanics', description: 'Your unique gameplay', unlocked: true, skillRequired: 'basics', icon: Zap },
    { id: 'features', name: 'Key Features', description: 'Distinctive elements', unlocked: false, skillRequired: 'mechanics', icon: Sparkles },
    { id: 'ui', name: 'User Interface', description: 'Custom UI design', unlocked: false, skillRequired: 'ui', icon: Eye },
    { id: 'polish', name: 'Polish & Effects', description: 'Professional finish', unlocked: false, skillRequired: 'polish', icon: Trophy },
    { id: 'launch', name: 'Game Launch', description: 'Ready to publish', unlocked: false, skillRequired: 'publishing', icon: Check }
  ]
}

export function GamePreview({ className = '', onShare }: GamePreviewProps) {
  const { journey, progress } = useAIJourney()
  
  const features = useMemo(() => {
    if (!journey) return []
    
    const gameType = journey.gameType
    const baseFeatures = gameFeatures[gameType] || gameFeatures.custom
    
    // Update feature unlock status based on completed skills
    return baseFeatures.map(feature => ({
      ...feature,
      unlocked: journey.skills.some(
        skill => skill.id === feature.skillRequired && 
                (skill.status === 'completed' || skill.status === 'current')
      )
    }))
  }, [journey])
  
  const unlockedCount = features.filter(f => f.unlocked).length
  const totalFeatures = features.length
  const completionPercent = totalFeatures > 0 ? Math.round((unlockedCount / totalFeatures) * 100) : 0
  
  // Calculate estimated completion date
  const estimatedDate = useMemo(() => {
    if (!journey) return 'TBD'
    
    const remainingHours = journey.skills
      .filter(s => s.status !== 'completed')
      .reduce((sum, s) => sum + s.estimatedHours, 0)
    
    const hoursPerWeek = 15 // Assumed learning pace
    const weeksRemaining = Math.ceil(remainingHours / hoursPerWeek)
    
    const completionDate = new Date()
    completionDate.setDate(completionDate.getDate() + (weeksRemaining * 7))
    
    return completionDate.toLocaleDateString('en', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }, [journey])
  
  if (!journey) {
    return (
      <Card className="glass-card-teal">
        <CardContent className="p-8 text-center">
          <Gamepad2 className="h-12 w-12 text-blox-teal mx-auto mb-4" />
          <p className="text-blox-off-white/60">
            Start your journey to see your game preview
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className={`${className}`}>
      <Card className="glass-card-teal">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-blox-teal" />
                Your {journey.gameTitle} Preview
              </CardTitle>
              <p className="text-sm text-blox-off-white/70 mt-1">
                Watch your game come to life as you learn
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={onShare}
                className="text-blox-off-white/70 hover:text-blox-white"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-blox-off-white/70 hover:text-blox-white"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Game Mockup Visualization */}
          <div className="relative mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-blox-purple/20 to-blox-teal/20 p-8">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            
            {/* 3D-style Game Preview */}
            <div className="relative z-10">
              <motion.div
                animate={{ 
                  rotateY: [0, 5, 0, -5, 0],
                  scale: [1, 1.02, 1]
                }}
                transition={{ 
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="w-full h-48 bg-gradient-to-br from-blox-black-blue to-blox-second-dark-blue 
                  rounded-lg shadow-2xl border border-blox-teal/30 flex items-center justify-center"
                style={{
                  perspective: '1000px',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">
                    {journey.gameType === 'horror' ? '👻' :
                     journey.gameType === 'rpg' ? '⚔️' :
                     journey.gameType === 'racing' ? '🏎️' :
                     journey.gameType === 'battle-royale' ? '🎯' :
                     '🎮'}
                  </div>
                  <h3 className="text-xl font-bold text-blox-white mb-1">
                    {journey.gameTitle}
                  </h3>
                  <p className="text-sm text-blox-off-white/70">
                    {completionPercent}% Complete
                  </p>
                </div>
              </motion.div>
              
              {/* Floating Elements */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute -top-4 -right-4 p-2 bg-blox-teal/20 rounded-full"
              >
                <Sparkles className="h-6 w-6 text-blox-teal" />
              </motion.div>
            </div>
          </div>
          
          {/* Features Checklist */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-blox-white">
                Game Features
              </h4>
              <Badge variant="outline" className="text-xs">
                {unlockedCount}/{totalFeatures} Unlocked
              </Badge>
            </div>
            
            <div className="space-y-2">
              {features.map((feature, idx) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center justify-between p-3 rounded-lg 
                      ${feature.unlocked ? 
                        'bg-blox-success/10 border border-blox-success/30' : 
                        'bg-blox-off-white/5 border border-blox-off-white/10'
                      } transition-all`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${
                        feature.unlocked ? 'bg-blox-success/20' : 'bg-blox-off-white/10'
                      }`}>
                        {feature.unlocked ? (
                          <Check className="h-4 w-4 text-blox-success" />
                        ) : (
                          <Lock className="h-4 w-4 text-blox-off-white/50" />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${
                          feature.unlocked ? 'text-blox-white' : 'text-blox-off-white/50'
                        }`}>
                          {feature.name}
                        </p>
                        <p className="text-xs text-blox-off-white/60">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    <Icon className={`h-4 w-4 ${
                      feature.unlocked ? 'text-blox-teal' : 'text-blox-off-white/30'
                    }`} />
                  </motion.div>
                )
              })}
            </div>
          </div>
          
          {/* Completion Timeline */}
          <div className="p-4 bg-blox-second-dark-blue/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-sm text-blox-white">
                  Estimated Completion
                </h4>
                <p className="text-xs text-blox-off-white/60 mt-0.5">
                  Based on current pace
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blox-teal">
                  {estimatedDate}
                </p>
                <p className="text-xs text-blox-off-white/60">
                  {progress.estimatedTimeRemaining}h remaining
                </p>
              </div>
            </div>
            
            <Progress value={completionPercent} className="h-2" />
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-blox-off-white/60">
                Started {journey.createdAt instanceof Date 
                  ? journey.createdAt.toLocaleDateString() 
                  : new Date(journey.createdAt).toLocaleDateString()}
              </span>
              <span className="text-xs text-blox-off-white/60">
                {completionPercent}% Complete
              </span>
            </div>
          </div>
          
          {/* Share Progress */}
          <div className="mt-4 flex gap-2">
            <Button
              className="flex-1 bg-gradient-to-r from-blox-teal to-blox-teal-dark"
              onClick={onShare}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Share Progress
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-blox-teal/30 hover:bg-blox-teal/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Journey
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}