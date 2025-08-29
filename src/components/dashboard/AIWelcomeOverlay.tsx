'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHydration } from '@/hooks/useHydration'
import { 
  Palette,
  Brush,
  Move3d,
  PenTool,
  Rocket,
  Sparkles, 
  ArrowRight, 
  Loader2,
  Bot,
  Gamepad2,
  Search,
  Video,
  MessageSquare,
  FolderOpen,
  Code,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAIJourney } from '@/hooks/useAIJourney'
import type { GameType } from '@/store/aiJourneyStore'

interface SkillAreaOption {
  type: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  gradient: string
  examples: string[]
}

const skillAreas: SkillAreaOption[] = [
  {
    type: 'scripting',
    title: 'Scripting & Code',
    description: 'Writing game scripts, debugging code, and optimization techniques',
    icon: Code,
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-indigo-600/20',
    examples: ['Script Writing', 'Debug Assistance', 'Code Optimization']
  },
  {
    type: 'modeling',
    title: '3D Modeling',
    description: 'Creating 3D assets, meshes, environments, and game objects',
    icon: Move3d,
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-pink-600/20',
    examples: ['Asset Creation', 'Mesh Building', 'Environment Design']
  },
  {
    type: 'texturing',
    title: 'Texturing & Materials',
    description: 'Applying textures, creating materials, and shader techniques',
    icon: Palette,
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-yellow-600/20',
    examples: ['Texture Application', 'Material Creation', 'Shader Effects']
  },
  {
    type: 'rigging',
    title: 'Rigging & Animation',
    description: 'Character rigging, animation systems, and motion design',
    icon: Brush,
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-600/20',
    examples: ['Character Rigging', 'Animation Systems', 'Motion Design']
  },
  {
    type: 'design',
    title: 'Concept & Design',
    description: 'Game design principles, level layout, and conceptual art creation',
    icon: PenTool,
    color: 'text-teal-400',
    gradient: 'from-teal-500/20 to-cyan-600/20',
    examples: ['Game Design', 'Level Layout', 'Concept Art']
  },
  {
    type: 'explore',
    title: 'Explore Everything',
    description: 'Not sure where to start? Get AI assistance with all skill areas',
    icon: Rocket,
    color: 'text-gray-400',
    gradient: 'from-gray-500/20 to-gray-600/20',
    examples: ['All Areas', 'Mixed Learning', 'Discovery Mode']
  }
]

interface SkillAreaCardProps {
  option: SkillAreaOption
  isSelected: boolean
  onSelect: () => void
}

function SkillAreaCard({ option, isSelected, onSelect }: SkillAreaCardProps) {
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
  const hydrated = useHydration()
  const { showWelcomeOverlay, hideWelcomeOverlay, initializeJourney, isGenerating } = useAIJourney()
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [customGoal, setCustomGoal] = useState('')
  const [step, setStep] = useState<'welcome' | 'select' | 'custom' | 'generating'>('select')


  // Don't render until hydrated to prevent SSR mismatch
  if (!hydrated) return null
  if (!showWelcomeOverlay) return null

  const handleSkillSelect = (skillType: string) => {
    setSelectedSkill(skillType)
    if (skillType === 'explore') {
      // "Explore Everything" option - immediately close overlay
      hideWelcomeOverlay()
      if (typeof onComplete === 'function') {
        onComplete()
      }
    }
    // For other skill types, stay on select step to show start button
  }

  const handleStartJourney = () => {
    if (!selectedSkill) return
    
    setStep('generating')
    
    // Initialize the journey with skill focus
    initializeJourney(selectedSkill as GameType, customGoal || undefined)
    
    // After generation completes, hide overlay
    setTimeout(() => {
      hideWelcomeOverlay()
      if (typeof onComplete === 'function') {
        onComplete()
      }
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
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        {/* Content */}
        <motion.div
          variants={contentVariants}
          className="relative max-w-4xl w-full max-h-[85vh] overflow-y-auto"
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
                    animate={{ 
                      scale: 1,
                      boxShadow: [
                        '0 0 0 0 rgba(20, 184, 166, 0.4)',
                        '0 0 0 20px rgba(20, 184, 166, 0)',
                        '0 0 0 0 rgba(20, 184, 166, 0)'
                      ]
                    }}
                    transition={{ 
                      delay: 0.2, 
                      type: 'spring', 
                      stiffness: 200,
                      boxShadow: {
                        duration: 2,
                        repeat: Infinity,
                        delay: 1
                      }
                    }}
                    className="inline-flex p-6 bg-gradient-to-br from-blox-teal/20 to-blox-purple/20 
                      rounded-full mb-6"
                  >
                    <Bot className="h-16 w-16 text-blox-teal" />
                  </motion.div>
                  
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-bold text-blox-white mb-6"
                  >
                    Welcome Game Devs!
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl text-blox-off-white/80 mb-8 max-w-2xl mx-auto leading-relaxed"
                  >
                    I'm Blox Wizard, your super-powered AI assistant for game development. I'll help you stay 
                    organized, find resources, and master every aspect of building amazing Roblox games.
                  </motion.p>

                  {/* Feature List */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 max-w-4xl mx-auto"
                  >
                    {[
                      { icon: FolderOpen, title: 'Workflow Organization', desc: 'Keep your projects and tasks perfectly organized' },
                      { icon: Search, title: 'Tutorial Discovery', desc: 'Find the exact tutorials you need, when you need them' },
                      { icon: Video, title: 'Video Search', desc: 'Search through our entire curated YouTube library instantly' },
                      { icon: MessageSquare, title: 'Interactive Learning', desc: 'Chat with any video to get timestamps and explanations' },
                      { icon: Code, title: 'Code Assistant', desc: 'Get help with scripts, debug issues, and learn best practices' }
                    ].map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-start gap-3 p-4 bg-blox-second-dark-blue/30 rounded-xl border border-blox-glass-border/30"
                      >
                        <div className="p-2 bg-gradient-to-br from-blox-teal/20 to-blox-purple/20 rounded-lg flex-shrink-0">
                          <feature.icon className="h-5 w-5 text-blox-teal" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blox-white text-sm mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-xs text-blox-off-white/70 leading-relaxed">
                            {feature.desc}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
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
                  {/* Feature List for context */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-center gap-6 mb-6 text-sm text-blox-off-white/70"
                  >
                    {[
                      { icon: FolderOpen, text: 'Workflow Organization' },
                      { icon: Search, text: 'Tutorial Discovery' },
                      { icon: Video, text: 'Video Search' },
                      { icon: MessageSquare, text: 'Interactive Learning' }
                    ].map((feature, index) => (
                      <div key={feature.text} className="flex items-center gap-2">
                        <feature.icon className="h-4 w-4 text-blox-teal" />
                        <span className="hidden sm:inline">{feature.text}</span>
                      </div>
                    ))}
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold text-blox-white mb-4">
                    What can AI assist you with today?
                  </h2>
                  <p className="text-blox-off-white/80">
                    Choose a skill area for personalized AI assistance and learning
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {skillAreas.map((option) => (
                    <SkillAreaCard
                      key={option.type}
                      option={option}
                      isSelected={selectedSkill === option.type}
                      onSelect={() => handleSkillSelect(option.type)}
                    />
                  ))}
                </div>

                {selectedSkill && selectedSkill !== 'explore' && (
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
                      Get AI Assistance with {skillAreas.find(s => s.type === selectedSkill)?.title}
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
                  Setting Up Your AI Assistant...
                </h2>
                
                <div className="space-y-2 text-blox-off-white/80">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    🤖 Configuring AI assistance for your skill area...
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                  >
                    📚 Loading relevant tutorials and resources...
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    🎯 Personalizing your learning experience...
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