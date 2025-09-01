'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Clock, 
  Lock, 
  Unlock,
  Edit3,
  Save,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAIJourney } from '@/hooks/useAIJourney'
import type { Skill } from '@/store/aiJourneyStore'

interface SkillNode {
  skill: Skill
  isOptional?: boolean
  prerequisites?: string[]
  estimatedWeeks?: number
}

interface JourneyBuilderProps {
  className?: string
  onPathUpdate?: (skills: Skill[]) => void
}

function SkillCard({ 
  skill, 
  index, 
  isEditing, 
  onRemove,
  onToggleLock 
}: { 
  skill: SkillNode
  index: number
  isEditing: boolean
  onRemove?: () => void
  onToggleLock?: () => void
}) {
  const statusColors = {
    completed: 'border-blox-success bg-blox-success/10',
    current: 'border-blox-teal bg-blox-teal/10',
    locked: 'border-blox-off-white/30 bg-blox-off-white/5'
  }

  return (
    <Reorder.Item value={skill} id={skill.skill.id}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: index * 0.05 }}
        className={`relative p-4 rounded-xl border-2 ${statusColors[skill.skill.status]} 
          ${isEditing ? 'cursor-move' : 'cursor-pointer'} transition-all duration-300
          hover:shadow-lg hover:scale-[1.02] group`}
      >
        {/* Drag Handle */}
        {isEditing && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-5 w-5 text-blox-off-white/50" />
          </div>
        )}

        {/* Content */}
        <div className={isEditing ? 'ml-8' : ''}>
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{skill.skill.icon}</span>
              <div>
                <h4 className="font-semibold text-blox-white">
                  {skill.skill.name}
                </h4>
                {skill.isOptional && (
                  <Badge variant="outline" className="text-xs mt-1">
                    Optional
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Actions */}
            {isEditing && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onToggleLock}
                  className="h-8 w-8 p-0"
                >
                  {skill.skill.status === 'locked' ? 
                    <Lock className="h-4 w-4" /> : 
                    <Unlock className="h-4 w-4" />
                  }
                </Button>
                {skill.isOptional && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onRemove}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-blox-off-white/70 mb-3">
            {skill.skill.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blox-off-white/50" />
              <span className="text-blox-off-white/70">
                {skill.skill.estimatedHours}h
              </span>
            </div>
            <div className="text-blox-off-white/70">
              {skill.skill.videos} videos
            </div>
            {skill.estimatedWeeks && (
              <div className="text-blox-off-white/70">
                ~{skill.estimatedWeeks} weeks
              </div>
            )}
          </div>

          {/* Prerequisites */}
          {skill.prerequisites && skill.prerequisites.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blox-off-white/10">
              <p className="text-xs text-blox-off-white/50 mb-1">
                Prerequisites:
              </p>
              <div className="flex flex-wrap gap-1">
                {skill.prerequisites.map(prereq => (
                  <Badge 
                    key={prereq}
                    variant="outline" 
                    className="text-xs bg-blox-off-white/5"
                  >
                    {prereq}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Connection Line */}
        {index < 4 && (
          <div className="absolute -right-8 top-1/2 w-8 h-0.5 bg-gradient-to-r from-blox-teal/50 to-transparent" />
        )}
      </motion.div>
    </Reorder.Item>
  )
}

export function JourneyBuilder({ className = '', onPathUpdate }: JourneyBuilderProps) {
  const { journey, updateProgress } = useAIJourney()
  const [isEditing, setIsEditing] = useState(false)
  const [skills, setSkills] = useState<SkillNode[]>([])
  const [showOptionalSkills, setShowOptionalSkills] = useState(false)

  // Initialize skills from journey
  useState(() => {
    if (journey?.skills) {
      setSkills(journey.skills.map(skill => ({
        skill,
        isOptional: false,
        estimatedWeeks: Math.ceil(skill.estimatedHours / 10)
      })))
    }
  })

  // Optional skills that can be added
  const optionalSkills: SkillNode[] = [
    {
      skill: {
        id: 'networking',
        name: 'Multiplayer Networking',
        status: 'locked',
        videos: 12,
        estimatedHours: 20,
        description: 'Add online multiplayer capabilities',
        icon: '🌐'
      },
      isOptional: true
    },
    {
      skill: {
        id: 'monetization',
        name: 'Game Monetization',
        status: 'locked',
        videos: 8,
        estimatedHours: 12,
        description: 'Implement in-game purchases and ads',
        icon: '💰'
      },
      isOptional: true
    },
    {
      skill: {
        id: 'analytics',
        name: 'Analytics & Metrics',
        status: 'locked',
        videos: 6,
        estimatedHours: 8,
        description: 'Track player behavior and game performance',
        icon: '📊'
      },
      isOptional: true
    }
  ]

  const handleReorder = (newOrder: SkillNode[]) => {
    setSkills(newOrder)
    if (onPathUpdate) {
      onPathUpdate(newOrder.map(node => node.skill))
    }
  }

  const handleAddSkill = (skillNode: SkillNode) => {
    setSkills([...skills, skillNode])
    setShowOptionalSkills(false)
  }

  const handleRemoveSkill = (skillId: string) => {
    setSkills(skills.filter(s => s.skill.id !== skillId))
  }

  const handleToggleLock = (skillId: string) => {
    setSkills(skills.map(s => {
      if (s.skill.id === skillId) {
        return {
          ...s,
          skill: {
            ...s.skill,
            status: s.skill.status === 'locked' ? 'current' : 'locked'
          }
        }
      }
      return s
    }))
  }

  const calculateTotalTime = () => {
    const totalHours = skills.reduce((sum, node) => sum + node.skill.estimatedHours, 0)
    const weeks = Math.ceil(totalHours / 15) // Assuming 15 hours per week
    return { hours: totalHours, weeks }
  }

  const { hours: totalHours, weeks: totalWeeks } = calculateTotalTime()

  return (
    <div className={`${className}`}>
      <Card className="glass-card-teal">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blox-teal" />
                Journey Path Builder
              </CardTitle>
              <p className="text-sm text-blox-off-white/70 mt-1">
                Customize your learning path by reordering skills or adding optional modules
              </p>
            </div>

            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? 'default' : 'outline'}
              className={isEditing ? 
                'bg-blox-teal hover:bg-blox-teal-dark' : 
                'border-blox-teal/30 hover:bg-blox-teal/10'
              }
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Path
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Time Estimation */}
          <div className="mb-6 p-4 bg-blox-second-dark-blue/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blox-teal" />
                <span className="font-semibold text-blox-white">
                  Estimated Completion Time
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blox-teal">
                  {totalWeeks} weeks
                </p>
                <p className="text-sm text-blox-off-white/70">
                  ~{totalHours} hours total
                </p>
              </div>
            </div>
          </div>

          {/* Edit Mode Notice */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-blox-teal/10 border border-blox-teal/30 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blox-teal" />
                <p className="text-sm text-blox-white">
                  Drag skills to reorder • Click + to add optional skills • Changes auto-save
                </p>
              </div>
            </motion.div>
          )}

          {/* Skills Path */}
          <Reorder.Group 
            axis="x" 
            values={skills} 
            onReorder={handleReorder}
            className="flex gap-4 overflow-x-auto pb-4"
          >
            <AnimatePresence>
              {skills.map((skillNode, index) => (
                <SkillCard
                  key={skillNode.skill.id}
                  skill={skillNode}
                  index={index}
                  isEditing={isEditing}
                  onRemove={() => handleRemoveSkill(skillNode.skill.id)}
                  onToggleLock={() => handleToggleLock(skillNode.skill.id)}
                />
              ))}
            </AnimatePresence>

            {/* Add Skill Button */}
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="min-w-[200px]"
              >
                <Button
                  onClick={() => setShowOptionalSkills(!showOptionalSkills)}
                  variant="outline"
                  className="h-full w-full min-h-[150px] border-2 border-dashed border-blox-teal/30 
                    hover:border-blox-teal hover:bg-blox-teal/5 transition-all"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Plus className="h-8 w-8 text-blox-teal" />
                    <span className="text-sm text-blox-off-white/70">
                      Add Optional Skill
                    </span>
                  </div>
                </Button>
              </motion.div>
            )}
          </Reorder.Group>

          {/* Optional Skills Selector */}
          <AnimatePresence>
            {showOptionalSkills && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-4 bg-blox-second-dark-blue/30 rounded-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-blox-white">
                    Available Optional Skills
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowOptionalSkills(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {optionalSkills.map(skillNode => (
                    <motion.div
                      key={skillNode.skill.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAddSkill(skillNode)}
                      className="p-3 bg-blox-off-white/5 rounded-lg border border-blox-off-white/10 
                        hover:border-blox-teal/50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{skillNode.skill.icon}</span>
                        <h5 className="font-medium text-sm text-blox-white">
                          {skillNode.skill.name}
                        </h5>
                      </div>
                      <p className="text-xs text-blox-off-white/60 mb-2">
                        {skillNode.skill.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-blox-off-white/50">
                        <span>{skillNode.skill.videos} videos</span>
                        <span>•</span>
                        <span>{skillNode.skill.estimatedHours}h</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Recommendation */}
          {journey && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blox-teal/10 to-blox-purple/10 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blox-teal/20 rounded-lg">
                  <Sparkles className="h-4 w-4 text-blox-teal" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-blox-white mb-1">
                    AI Recommendation
                  </h4>
                  <p className="text-sm text-blox-off-white/70">
                    Based on your goal to create a {journey.gameTitle}, this path covers all essential 
                    skills. Consider adding Multiplayer Networking if you want online features.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}