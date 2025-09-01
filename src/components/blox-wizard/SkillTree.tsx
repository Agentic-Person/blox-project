'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GitBranch, 
  Lock, 
  CheckCircle, 
  Circle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  Trophy,
  Star,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAIJourney } from '@/hooks/useAIJourney'
import type { Skill } from '@/store/aiJourneyStore'

interface SkillNode {
  id: string
  skill: Skill
  x: number
  y: number
  prerequisites: string[]
  unlocks: string[]
  tier: number
}

interface SkillTreeProps {
  className?: string
  onSkillSelect?: (skill: Skill) => void
}

// Define skill tree layout
const generateSkillTree = (skills: Skill[]): SkillNode[] => {
  const tiers = [
    { y: 400, skills: 1 }, // Tier 0 - Foundation
    { y: 300, skills: 2 }, // Tier 1 - Basics
    { y: 200, skills: 2 }, // Tier 2 - Intermediate
    { y: 100, skills: 3 }, // Tier 3 - Advanced
    { y: 0, skills: 1 }    // Tier 4 - Master
  ]
  
  const nodes: SkillNode[] = []
  let skillIndex = 0
  
  tiers.forEach((tier, tierIndex) => {
    const tierSkills = skills.slice(skillIndex, skillIndex + tier.skills)
    const spacing = 800 / (tier.skills + 1)
    
    tierSkills.forEach((skill, index) => {
      const x = spacing * (index + 1)
      
      // Define prerequisites based on tier
      const prerequisites: string[] = []
      if (tierIndex > 0) {
        // Connect to previous tier skills
        const prevTierStart = Math.max(0, skillIndex - tiers[tierIndex - 1].skills)
        const prevTierEnd = skillIndex
        if (prevTierEnd > prevTierStart) {
          prerequisites.push(skills[prevTierStart].id)
        }
      }
      
      // Define what this skill unlocks
      const unlocks: string[] = []
      if (tierIndex < tiers.length - 1) {
        const nextTierStart = skillIndex + tier.skills
        const nextTierEnd = Math.min(skills.length, nextTierStart + tiers[tierIndex + 1].skills)
        if (nextTierEnd > nextTierStart && skills[nextTierStart]) {
          unlocks.push(skills[nextTierStart].id)
        }
      }
      
      nodes.push({
        id: skill.id,
        skill,
        x,
        y: tier.y,
        prerequisites,
        unlocks,
        tier: tierIndex
      })
    })
    
    skillIndex += tier.skills
  })
  
  return nodes
}

function SkillNodeComponent({ 
  node, 
  isSelected,
  onSelect,
  connections 
}: { 
  node: SkillNode
  isSelected: boolean
  onSelect: () => void
  connections: { from: SkillNode; to: SkillNode }[]
}) {
  const getNodeStyle = () => {
    switch (node.skill.status) {
      case 'completed':
        return {
          bg: 'bg-gradient-to-br from-blox-success/30 to-blox-success/10',
          border: 'border-blox-success',
          glow: 'shadow-blox-success/50'
        }
      case 'current':
        return {
          bg: 'bg-gradient-to-br from-blox-teal/30 to-blox-teal/10',
          border: 'border-blox-teal',
          glow: 'shadow-blox-teal/50'
        }
      default:
        return {
          bg: 'bg-blox-off-white/5',
          border: 'border-blox-off-white/30',
          glow: ''
        }
    }
  }
  
  const style = getNodeStyle()
  const isLocked = node.skill.status === 'locked'
  
  return (
    <>
      {/* Connections */}
      {connections.map((conn, idx) => {
        const isActive = conn.from.skill.status === 'completed' && 
                        (conn.to.skill.status === 'current' || conn.to.skill.status === 'completed')
        
        return (
          <motion.line
            key={`${conn.from.id}-${conn.to.id}-${idx}`}
            x1={conn.from.x}
            y1={conn.from.y}
            x2={conn.to.x}
            y2={conn.to.y}
            stroke={isActive ? '#36B0D9' : '#596D8C'}
            strokeWidth={isActive ? 3 : 2}
            strokeDasharray={isActive ? '0' : '5 5'}
            opacity={isActive ? 0.8 : 0.3}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: idx * 0.1 }}
          />
        )
      })}
      
      {/* Node */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: 'spring',
          stiffness: 200,
          delay: node.tier * 0.1
        }}
      >
        <motion.foreignObject
          x={node.x - 60}
          y={node.y - 40}
          width={120}
          height={80}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSelect}
          className="cursor-pointer"
        >
          <div className={`
            w-full h-full rounded-xl border-2 ${style.border} ${style.bg}
            ${style.glow ? `shadow-lg ${style.glow}` : ''}
            ${isSelected ? 'ring-2 ring-blox-teal ring-offset-2 ring-offset-blox-very-dark-blue' : ''}
            flex flex-col items-center justify-center p-2
            transition-all duration-300
          `}>
            {/* Status Icon */}
            <div className="mb-1">
              {node.skill.status === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-blox-success" />
              ) : node.skill.status === 'current' ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Circle className="h-5 w-5 text-blox-teal" />
                </motion.div>
              ) : (
                <Lock className="h-4 w-4 text-blox-off-white/50" />
              )}
            </div>
            
            {/* Icon & Name */}
            <div className="text-center">
              <div className="text-lg mb-0.5">{node.skill.icon}</div>
              <p className={`text-xs font-medium ${
                isLocked ? 'text-blox-off-white/50' : 'text-blox-white'
              } line-clamp-2`}>
                {node.skill.name}
              </p>
            </div>
          </div>
        </motion.foreignObject>
        
        {/* Pulse animation for current node */}
        {node.skill.status === 'current' && (
          <motion.circle
            cx={node.x}
            cy={node.y}
            r={50}
            fill="none"
            stroke="#36B0D9"
            strokeWidth={2}
            opacity={0.5}
            initial={{ r: 40, opacity: 0.8 }}
            animate={{ 
              r: [40, 60, 40],
              opacity: [0.8, 0, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
      </motion.g>
    </>
  )
}

export function SkillTree({ className = '', onSkillSelect }: SkillTreeProps) {
  const { journey, progress } = useAIJourney()
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const svgRef = useRef<SVGSVGElement>(null)
  
  // Generate skill nodes from journey
  const skillNodes = journey?.skills ? generateSkillTree(journey.skills) : []
  
  // Generate connections between nodes
  const connections = skillNodes.flatMap(node => 
    node.unlocks.map(unlockId => ({
      from: node,
      to: skillNodes.find(n => n.id === unlockId)!
    })).filter(conn => conn.to)
  )
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5))
  const handleZoomReset = () => setZoom(1)
  
  const handleNodeSelect = (node: SkillNode) => {
    setSelectedNode(node)
    if (onSkillSelect) {
      onSkillSelect(node.skill)
    }
  }
  
  // Calculate stats
  const totalNodes = skillNodes.length
  const completedNodes = skillNodes.filter(n => n.skill.status === 'completed').length
  const currentTier = skillNodes.find(n => n.skill.status === 'current')?.tier || 0
  
  return (
    <div className={`${className}`}>
      <Card className="glass-card-teal h-[600px] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-blox-teal" />
                Skill Progression Tree
              </CardTitle>
              <p className="text-sm text-blox-off-white/70 mt-1">
                Visual representation of your learning journey
              </p>
            </div>
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleZoomOut}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-blox-off-white/60 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleZoomIn}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleZoomReset}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {/* Stats Bar */}
          <div className="mb-4 p-3 bg-blox-second-dark-blue/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-blox-xp" />
                  <span className="text-sm text-blox-white">
                    Tier {currentTier + 1}/5
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-blox-white">
                    {completedNodes}/{totalNodes} Skills
                  </span>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-blox-teal to-blox-purple">
                {progress.percentComplete}% Complete
              </Badge>
            </div>
            <Progress value={progress.percentComplete} className="h-2" />
          </div>
          
          {/* Tree Visualization */}
          <div className="flex-1 bg-blox-second-dark-blue/20 rounded-lg overflow-hidden relative">
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox="0 0 800 450"
              className="w-full h-full"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
            >
              {/* Background Grid */}
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path 
                    d="M 50 0 L 0 0 0 50" 
                    fill="none" 
                    stroke="#596D8C" 
                    strokeWidth="0.5" 
                    opacity="0.1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Render skill nodes and connections */}
              {skillNodes.map(node => (
                <SkillNodeComponent
                  key={node.id}
                  node={node}
                  isSelected={selectedNode?.id === node.id}
                  onSelect={() => handleNodeSelect(node)}
                  connections={connections.filter(c => c.from.id === node.id)}
                />
              ))}
            </svg>
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 p-3 bg-blox-black-blue/80 backdrop-blur-sm rounded-lg">
              <p className="text-xs font-semibold text-blox-white mb-2">Legend</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-blox-success" />
                  <span className="text-xs text-blox-off-white/70">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3 text-blox-teal" />
                  <span className="text-xs text-blox-off-white/70">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-3 w-3 text-blox-off-white/50" />
                  <span className="text-xs text-blox-off-white/70">Locked</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Selected Skill Details */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-4 p-4 bg-blox-second-dark-blue/50 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{selectedNode.skill.icon}</div>
                    <div>
                      <h4 className="font-semibold text-blox-white mb-1">
                        {selectedNode.skill.name}
                      </h4>
                      <p className="text-sm text-blox-off-white/70 mb-2">
                        {selectedNode.skill.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-blox-off-white/60">
                        <span>{selectedNode.skill.videos} videos</span>
                        <span>•</span>
                        <span>{selectedNode.skill.estimatedHours} hours</span>
                        <span>•</span>
                        <span>Tier {selectedNode.tier + 1}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    className={selectedNode.skill.status === 'current' ? 
                      'bg-blox-teal hover:bg-blox-teal-dark' : 
                      ''}
                    disabled={selectedNode.skill.status === 'locked'}
                  >
                    {selectedNode.skill.status === 'completed' ? 'Review' :
                     selectedNode.skill.status === 'current' ? 'Continue' :
                     'Locked'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}