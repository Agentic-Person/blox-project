'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, LogOut, Shield, Users } from 'lucide-react'
import { useTeamStore } from '@/store/teamStore'

interface LeaveTeamDialogProps {
  isOpen: boolean
  onClose: () => void
  team: {
    id: string
    name: string
    leader: string
    members: Array<{
      userId: string
      username: string
      role: 'leader' | 'moderator' | 'member'
    }>
  }
  currentUserRole: 'leader' | 'moderator' | 'member'
}

export default function LeaveTeamDialog({ isOpen, onClose, team, currentUserRole }: LeaveTeamDialogProps) {
  const router = useRouter()
  const { leaveTeam, promoteMember, currentUserId } = useTeamStore()
  const [isLeaving, setIsLeaving] = useState(false)
  const [selectedNewLeader, setSelectedNewLeader] = useState<string | null>(null)
  const [error, setError] = useState('')

  const isLeader = currentUserRole === 'leader'
  const otherMembers = team.members.filter(m => m.userId !== currentUserId)
  const eligibleLeaders = otherMembers.filter(m => m.role === 'moderator' || m.role === 'member')

  const handleLeave = async () => {
    setIsLeaving(true)
    setError('')

    try {
      // If leader and there are other members, must transfer leadership
      if (isLeader && otherMembers.length > 0) {
        if (!selectedNewLeader) {
          setError('Please select a new team leader')
          setIsLeaving(false)
          return
        }
        
        // Promote new leader
        promoteMember(team.id, selectedNewLeader, 'leader')
      }

      // Leave the team
      const success = leaveTeam(team.id, currentUserId)
      
      if (success) {
        onClose()
        router.push('/teams')
      } else {
        setError('Unable to leave team. You may be the only leader.')
      }
    } catch (err) {
      setError('Failed to leave team. Please try again.')
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Leave Team
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to leave {team.name}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Card */}
          <Card className="glass-card border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-sm text-yellow-500 font-medium">
                  ⚠️ This action cannot be undone
                </p>
                <p className="text-xs text-blox-off-white">
                  You'll lose access to team chat, projects, and resources. 
                  You'll need to reapply if you want to rejoin later.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Leadership Transfer (if leader) */}
          {isLeader && otherMembers.length > 0 && (
            <div>
              <label className="text-sm font-medium text-blox-white mb-2 block flex items-center gap-2">
                <Shield className="h-4 w-4 text-blox-teal" />
                Transfer Leadership To
              </label>
              <div className="space-y-2">
                {eligibleLeaders.map((member) => (
                  <button
                    key={member.userId}
                    onClick={() => setSelectedNewLeader(member.userId)}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      selectedNewLeader === member.userId
                        ? 'border-blox-teal bg-blox-teal/10'
                        : 'border-blox-glass-border hover:border-blox-teal/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blox-second-dark-blue rounded-full flex items-center justify-center">
                          <span className="text-xs text-blox-white font-medium">
                            {member.username.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blox-white">
                            {member.username}
                          </p>
                          <p className="text-xs text-blox-medium-blue-gray">
                            {member.role === 'moderator' ? 'Moderator' : 'Member'}
                          </p>
                        </div>
                      </div>
                      {selectedNewLeader === member.userId && (
                        <div className="w-5 h-5 bg-blox-teal rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {!selectedNewLeader && error && (
                <p className="text-xs text-red-500 mt-2">{error}</p>
              )}
            </div>
          )}

          {/* Solo Leader Warning */}
          {isLeader && otherMembers.length === 0 && (
            <Card className="glass-card border-red-500/30 bg-red-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-500 font-medium mb-1">
                      Team will be deleted
                    </p>
                    <p className="text-xs text-blox-off-white">
                      You're the only member. Leaving will permanently delete this team and all its data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Impact */}
          <div>
            <label className="text-sm font-medium text-blox-white mb-2 block flex items-center gap-2">
              <Users className="h-4 w-4 text-blox-teal" />
              Impact on Team
            </label>
            <Card className="glass-card">
              <CardContent className="p-3">
                <ul className="space-y-1 text-xs text-blox-off-white">
                  <li>• Your contributions and projects will remain with the team</li>
                  <li>• Team member count will decrease by 1</li>
                  {isLeader && otherMembers.length > 0 && (
                    <li>• New leader will have full control of the team</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* General Error */}
          {error && !isLeader && (
            <Card className="glass-card border-red-500/30 bg-red-500/5">
              <CardContent className="p-3">
                <p className="text-sm text-red-500">{error}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLeaving}>
            Cancel
          </Button>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={handleLeave}
            disabled={isLeaving || (isLeader && otherMembers.length > 0 && !selectedNewLeader)}
          >
            {isLeaving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Leaving...
              </span>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-1" />
                Leave Team
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}