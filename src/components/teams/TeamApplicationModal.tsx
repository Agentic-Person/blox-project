'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { UserPlus, Info, Sparkles } from 'lucide-react'
import { useTeamStore } from '@/store/teamStore'

interface TeamApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  team: {
    id: string
    name: string
    description: string
    skills: string[]
    leader: string
    memberCount: number
    maxMembers: number
  }
}

const AVAILABLE_SKILLS = [
  'Building',
  'Scripting',
  'UI Design',
  'Game Design',
  'Art',
  'Animation',
  'Sound Design',
  'Leadership',
  'Marketing',
  'Testing'
]

export default function TeamApplicationModal({ isOpen, onClose, team }: TeamApplicationModalProps) {
  const { createApplication, currentUserId } = useTeamStore()
  const [message, setMessage] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please write a message explaining why you want to join')
      return
    }

    if (message.length < 20) {
      setError('Message must be at least 20 characters')
      return
    }

    if (selectedSkills.length === 0) {
      setError('Please select at least one skill you bring to the team')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      createApplication({
        teamId: team.id,
        userId: currentUserId,
        username: 'CurrentUser', // In production, get from auth
        message: message.trim(),
        skills: selectedSkills
      })

      // Close modal and reset
      onClose()
      setMessage('')
      setSelectedSkills([])
    } catch (err) {
      setError('Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blox-teal" />
            Apply to Join {team.name}
          </DialogTitle>
          <DialogDescription>
            Tell the team leader why you'd be a great addition to their team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Team Info Summary */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blox-medium-blue-gray">Team Leader</span>
                  <span className="text-sm text-blox-white">{team.leader}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blox-medium-blue-gray">Team Size</span>
                  <span className="text-sm text-blox-white">{team.memberCount}/{team.maxMembers} members</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blox-medium-blue-gray">Looking For</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {team.skills.map(skill => (
                      <span key={skill} className="px-2 py-0.5 bg-blox-teal/20 text-blox-teal text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Message */}
          <div>
            <label className="text-sm font-medium text-blox-white mb-2 block">
              Why do you want to join this team? *
            </label>
            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                if (error) setError('')
              }}
              placeholder="Explain your interest in the team, what you can contribute, and any relevant experience..."
              rows={4}
              maxLength={500}
              className={error && (!message.trim() || message.length < 20) ? 'border-red-500' : ''}
            />
            <p className="text-xs text-blox-medium-blue-gray mt-1">
              {message.length}/500 characters (min 20)
            </p>
          </div>

          {/* Skills Selection */}
          <div>
            <label className="text-sm font-medium text-blox-white mb-2 block">
              What skills do you bring? *
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SKILLS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    selectedSkills.includes(skill)
                      ? 'bg-blox-teal text-white'
                      : team.skills.includes(skill)
                      ? 'bg-blox-teal/20 text-blox-teal border border-blox-teal hover:bg-blox-teal/30'
                      : 'bg-blox-second-dark-blue text-blox-off-white hover:bg-blox-teal/20'
                  }`}
                >
                  {skill}
                  {team.skills.includes(skill) && (
                    <Sparkles className="inline-block h-3 w-3 ml-1" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-blox-medium-blue-gray mt-2">
              <Info className="inline-block h-3 w-3 mr-1" />
              Skills with sparkles are especially needed by this team
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="glass-card border-red-500/30 bg-red-500/5">
              <CardContent className="p-3">
                <p className="text-sm text-red-500">{error}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit Application'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}