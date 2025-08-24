'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings, 
  Shield, 
  UserX, 
  ChevronUp,
  ChevronDown,
  Trash2,
  Save,
  X,
  Users,
  Edit,
  AlertTriangle
} from 'lucide-react'
import { useTeamStore, Team, TeamMember } from '@/store/teamStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface TeamManagementProps {
  team: Team
  currentUserRole: 'leader' | 'moderator' | 'member'
}

export default function TeamManagement({ team, currentUserRole }: TeamManagementProps) {
  const { 
    updateTeam, 
    kickMember, 
    promoteMember, 
    demoteMember,
    deleteTeam,
    currentUserId 
  } = useTeamStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: team.name,
    description: team.description,
    maxMembers: team.maxMembers,
    recruitmentStatus: team.recruitmentStatus
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [memberToKick, setMemberToKick] = useState<TeamMember | null>(null)

  const canManageTeam = currentUserRole === 'leader'
  const canManageMembers = currentUserRole === 'leader' || currentUserRole === 'moderator'

  const handleSaveChanges = () => {
    updateTeam(team.id, editForm)
    setIsEditing(false)
  }

  const handlePromote = (member: TeamMember) => {
    const newRole = member.role === 'member' ? 'moderator' : 'leader'
    promoteMember(team.id, member.userId, newRole)
  }

  const handleDemote = (member: TeamMember) => {
    demoteMember(team.id, member.userId)
  }

  const handleKick = (member: TeamMember) => {
    kickMember(team.id, member.userId, currentUserId)
    setMemberToKick(null)
  }

  const handleDeleteTeam = () => {
    deleteTeam(team.id)
    setShowDeleteConfirm(false)
    // In production, redirect to teams page
  }

  if (!canManageMembers && !canManageTeam) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Team Settings */}
      {canManageTeam && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blox-teal" />
                Team Settings
              </span>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      setEditForm({
                        name: team.name,
                        description: team.description,
                        maxMembers: team.maxMembers,
                        recruitmentStatus: team.recruitmentStatus
                      })
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveChanges}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Manage your team's profile and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2 block">
                    Team Name
                  </label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={30}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2 block">
                    Max Members: {editForm.maxMembers}
                  </label>
                  <input
                    type="range"
                    min={team.members.length}
                    max="10"
                    value={editForm.maxMembers}
                    onChange={(e) => setEditForm(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2 block">
                    Recruitment Status
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['open', 'selective', 'closed'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setEditForm(prev => ({ ...prev, recruitmentStatus: status }))}
                        className={`p-2 rounded-lg border capitalize transition-all ${
                          editForm.recruitmentStatus === status
                            ? 'border-blox-teal bg-blox-teal/10'
                            : 'border-blox-glass-border hover:border-blox-teal/50'
                        }`}
                      >
                        <p className={`text-sm ${
                          editForm.recruitmentStatus === status ? 'text-blox-white' : 'text-blox-off-white'
                        }`}>
                          {status}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-blox-medium-blue-gray">Team Name</span>
                  <span className="text-sm text-blox-white">{team.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blox-medium-blue-gray">Type</span>
                  <span className="text-sm text-blox-white capitalize">{team.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blox-medium-blue-gray">Members</span>
                  <span className="text-sm text-blox-white">{team.members.length}/{team.maxMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blox-medium-blue-gray">Recruitment</span>
                  <span className={`text-sm capitalize ${
                    team.recruitmentStatus === 'open' ? 'text-green-500' :
                    team.recruitmentStatus === 'selective' ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {team.recruitmentStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blox-medium-blue-gray">Points</span>
                  <span className="text-sm text-blox-white">{team.points}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Member Management */}
      {canManageMembers && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blox-teal" />
              Member Management
            </CardTitle>
            <CardDescription>
              Manage roles and permissions for team members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.members.map((member) => {
              const isCurrentUser = member.userId === currentUserId
              const canManageMember = !isCurrentUser && (
                currentUserRole === 'leader' || 
                (currentUserRole === 'moderator' && member.role === 'member')
              )

              return (
                <div
                  key={member.userId}
                  className="p-3 rounded-lg bg-blox-second-dark-blue/30 border border-blox-glass-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blox-teal to-blox-teal-dark rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {member.avatar || member.username.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-blox-white flex items-center gap-2">
                          {member.username}
                          {isCurrentUser && (
                            <span className="text-xs bg-blox-teal/20 text-blox-teal px-2 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            member.role === 'leader' ? 'bg-yellow-500/20 text-yellow-500' :
                            member.role === 'moderator' ? 'bg-blox-purple/20 text-blox-purple' :
                            'bg-blox-teal/20 text-blox-teal'
                          }`}>
                            {member.role === 'leader' ? '👑 Leader' :
                             member.role === 'moderator' ? '🛡️ Moderator' :
                             'Member'}
                          </span>
                          <span className="text-xs text-blox-medium-blue-gray">
                            {member.contributions} contributions
                          </span>
                        </div>
                      </div>
                    </div>

                    {canManageMember && (
                      <div className="flex items-center gap-2">
                        {member.role !== 'leader' && currentUserRole === 'leader' && (
                          <>
                            {member.role === 'member' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePromote(member)}
                                title="Promote to Moderator"
                              >
                                <ChevronUp className="h-4 w-4 text-green-500" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDemote(member)}
                                title="Demote to Member"
                              >
                                <ChevronDown className="h-4 w-4 text-yellow-500" />
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMemberToKick(member)}
                          title="Remove from Team"
                        >
                          <UserX className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      {canManageTeam && (
        <Card className="glass-card border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your entire team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Team
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Kick Member Confirmation */}
      <Dialog open={!!memberToKick} onOpenChange={() => setMemberToKick(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <UserX className="h-5 w-5" />
              Remove Member
            </DialogTitle>
          </DialogHeader>
          <p className="text-blox-off-white">
            Are you sure you want to remove <strong>{memberToKick?.username}</strong> from the team?
            They will need to reapply to join again.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMemberToKick(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => memberToKick && handleKick(memberToKick)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" />
              Delete Team
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-blox-off-white">
              Are you sure you want to delete <strong>{team.name}</strong>?
            </p>
            <Card className="glass-card border-red-500/30 bg-red-500/5">
              <CardContent className="p-3">
                <p className="text-sm text-red-500">
                  ⚠️ This action cannot be undone. All team data, projects, and chat history will be permanently deleted.
                </p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleDeleteTeam}>
              Delete Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}