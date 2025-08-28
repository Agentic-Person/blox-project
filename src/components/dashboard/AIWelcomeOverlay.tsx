'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Skull, 
  Sword, 
  Car, 
  Target, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  Bot,
  Gamepad2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAIJourney } from '@/hooks/useAIJourney'
import type { GameType } from '@/store/aiJourneyStore'

interface GameTypeOption {
  type: GameType
  title: string
  description: string
  icon: React.ElementType
  color: string
  gradient: string
  examples: string[]
}

const gameTypes: GameTypeOption[] = [
  {
    type: 'horror',
    title: 'Horror Game',
    description: 'Spooky atmospheres, jump scares, and psychological thriller mechanics',
    icon: Skull,
    color: 'text-red-400',
    gradient: 'from-red-500/20 to-purple-600/20',
    examples: ['Atmospheric Lighting', 'Jump Scare Systems', 'Horror AI']
  },
  {
    type: 'rpg',
    title: 'RPG Adventure',
    description: 'Character progression, inventory systems, and epic quests',
    icon: Sword,
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-blue-600/20',
    examples: ['Level Systems', 'Inventory Management', 'Quest Mechanics']
  },
  {
    type: 'racing',
    title: 'Racing Game',
    description: 'High-speed vehicles, dynamic tracks, and competitive multiplayer',
    icon: Car,
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-red-600/20',
    examples: ['Vehicle Physics', 'Track Building', 'Race Systems']
  },
  {
    type: 'battle-royale',
    title: 'Battle Royale',
    description: 'Last player standing, shrinking zones, and intense combat',
    icon: Target,
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-teal-600/20',
    examples: ['Safe Zone Mechanics', 'Weapon Systems', 'Multiplayer Lobbies']
  },
  {
    type: 'custom',
    title: 'Custom Game',
    description: 'Your unique vision - we\'ll help you bring any game idea to life',
    icon: Sparkles,
    color: 'text-blox-teal',
    gradient: 'from-blox-teal/20 to-blox-purple/20',
    examples: ['Your Ideas', 'Unique Mechanics', 'Creative Freedom']
  }
]

interface GameTypeCardProps {
  option: GameTypeOption
  isSelected: boolean
  onSelect: () => void
}

function GameTypeCard({ option, isSelected, onSelect }: GameTypeCardProps) {
  const Icon = option.icon

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        relative p-6 rounded-2xl cursor-pointer transition-all duration-300
        bg-gradient-to-br ${option.gradient} 
        border-2 ${isSelected ? 'border-blox-teal' : 'border-blox-glass-border'}
        hover:border-blox-teal/50 hover:shadow-xl
        ${isSelected ? 'shadow-2xl shadow-blox-teal/20' : ''}
      `}
    >
      {/* Selection indicator */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-blox-teal rounded-full 
              flex items-center justify-center border-2 border-blox-very-dark-blue"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="w-2 h-2 bg-white rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon */}
      <div className={`${option.color} mb-4`}>
        <Icon className="h-12 w-12" />
      </div>

      {/* Content */}
      <div>
        <h3 className="text-xl font-bold text-blox-white mb-2">
          {option.title}
        </h3>
        <p className="text-sm text-blox-off-white/80 mb-4 leading-relaxed">
          {option.description}
        </p>

        {/* Examples */}
        <div className="space-y-2">
          <p className="text-xs text-blox-off-white/60 uppercase tracking-wider">
            You'll Learn:
          </p>
          <div className="flex flex-wrap gap-1">
            {option.examples.map((example, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-blox-white/10 rounded-full text-blox-off-white/80"
              >
                {example}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface AIWelcomeOverlayProps {
  onComplete: () => void
}

export function AIWelcomeOverlay({ onComplete }: AIWelcomeOverlayProps) {
  const { showWelcomeOverlay, hideWelcomeOverlay, initializeJourney, isGenerating } = useAIJourney()
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null)
  const [customGoal, setCustomGoal] = useState('')
  const [step, setStep] = useState<'welcome' | 'select' | 'custom' | 'generating'>('welcome')

  if (!showWelcomeOverlay) return null

  const handleGameSelect = (gameType: GameType) => {
    setSelectedGame(gameType)
    if (gameType === 'custom') {
      setStep('custom')
    } else {
      setStep('select')
    }
  }

  const handleStartJourney = () => {
    if (!selectedGame) return
    
    setStep('generating')
    
    // Initialize the journey
    initializeJourney(selectedGame, customGoal || undefined)
    
    // After generation completes, hide overlay
    setTimeout(() => {
      hideWelcomeOverlay()
      onComplete()
    }, 2500)
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { 
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3 }
    }
  }

  const contentVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.5,
        ease: 'easeOut'
      }
    },
    exit: { 
      opacity: 0,
      y: -20,
      scale: 1.05,
      transition: { duration: 0.3 }
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-blox-very-dark-blue/95 backdrop-blur-xl" />
        
        {/* Content */}
        <motion.div
          variants={contentVariants}
          className="relative max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="bg-blox-black-blue/80 backdrop-blur-lg border border-blox-glass-border 
            rounded-3xl p-8 shadow-2xl">
            
            {/* Welcome Step */}
            {step === 'welcome' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="inline-flex p-6 bg-gradient-to-br from-blox-teal/20 to-blox-purple/20 
                      rounded-full mb-6"
                  >
                    <Bot className="h-16 w-16 text-blox-teal" />
                  </motion.div>
                  
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-bold text-blox-white mb-4"
                  >
                    Welcome to Your AI Journey!
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl text-blox-off-white/80 mb-8 max-w-2xl mx-auto leading-relaxed"
                  >
                    I'm Blox Wizard, your personal AI learning companion. I'll create a custom 
                    learning path based on your game development goals and guide you every step of the way.
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    onClick={() => setStep('select')}
                    className="bg-gradient-to-r from-blox-teal to-blox-teal-dark px-8 py-3 text-lg
                      hover:scale-105 transition-transform"
                  >
                    Let's Begin
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* Game Selection Step */}
            {step === 'select' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-blox-white mb-4">
                    What type of game do you want to create?
                  </h2>
                  <p className="text-blox-off-white/80">
                    Choose your adventure and I'll craft a personalized learning path
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {gameTypes.map((option) => (
                    <GameTypeCard
                      key={option.type}
                      option={option}
                      isSelected={selectedGame === option.type}
                      onSelect={() => handleGameSelect(option.type)}
                    />
                  ))}
                </div>

                {selectedGame && selectedGame !== 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <Button
                      onClick={handleStartJourney}
                      className="bg-gradient-to-r from-blox-teal to-blox-teal-dark px-8 py-3 text-lg
                        hover:scale-105 transition-transform"
                    >
                      Start My {gameTypes.find(g => g.type === selectedGame)?.title} Journey
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Custom Game Step */}
            {step === 'custom' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <Gamepad2 className="h-16 w-16 text-blox-teal mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-blox-white mb-4">
                    Tell me about your dream game
                  </h2>
                  <p className="text-blox-off-white/80">
                    Describe your unique game idea and I'll create a custom learning path
                  </p>
                </div>

                <div className="max-w-2xl mx-auto mb-8">
                  <Input
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="e.g., 'A space exploration game with crafting mechanics' or 'A puzzle platformer with time manipulation'"
                    className="h-12 text-lg bg-blox-second-dark-blue/50 border-blox-glass-border 
                      text-blox-white placeholder-blox-off-white/50"
                  />
                  <p className="text-sm text-blox-off-white/60 mt-2">
                    The more specific you are, the better I can tailor your learning journey!
                  </p>
                </div>

                <div className="text-center">
                  <Button
                    onClick={handleStartJourney}
                    disabled={!customGoal.trim()}
                    className="bg-gradient-to-r from-blox-teal to-blox-teal-dark px-8 py-3 text-lg
                      hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed
                      disabled:hover:scale-100"
                  >
                    Create My Custom Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Generating Step */}
            {step === 'generating' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="inline-block mb-6"
                >
                  <Loader2 className="h-16 w-16 text-blox-teal" />
                </motion.div>

                <h2 className="text-3xl font-bold text-blox-white mb-4">
                  Crafting Your AI Journey...
                </h2>
                
                <div className="space-y-2 text-blox-off-white/80">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    🧠 Analyzing your goals and preferences...
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                  >
                    📚 Curating personalized learning modules...
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    🎯 Creating your custom roadmap...
                  </motion.p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}