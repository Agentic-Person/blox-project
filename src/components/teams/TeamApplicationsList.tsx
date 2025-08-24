'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { 
  UserPlus, 
  UserX, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Users,
  Sparkles
} from 'lucide-react'
import { useTeamStore, TeamApplication } from '@/store/teamStore'

interface TeamApplicationsListProps {
  teamId: string
  isLeader: boolean
}

export default function TeamApplicationsList({ teamId, isLeader }: TeamApplicationsListProps) {
  const { getTeamApplications, reviewApplication, currentUserId } = useTeamStore()
  const [selectedApplication, setSelectedApplication] = useState<TeamApplication | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  
  const applications = getTeamApplications(teamId)
  const pendingApplications = applications.filter(app => app.status === 'pending')

  const handleReview = async (applicationId: string, status: 'accepted' | 'rejected') => {
    setIsReviewing(true)
    try {
      reviewApplication(applicationId, status, currentUserId)
      setSelectedApplication(null)
    } catch (error) {
      console.error('Error reviewing application:', error)
    } finally {
      setIsReviewing(false)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return '1 day ago'
    return `${diffInDays} days ago`
  }

  if (!isLeader) {
    return null
  }

  if (pendingApplications.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blox-teal" />
            Team Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 text-blox-medium-blue-gray mx-auto mb-3" />
            <p className="text-blox-off-white">No pending applications</p>
            <p className="text-sm text-blox-medium-blue-gray mt-1">
              Applications will appear here when players apply to join
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blox-teal" />
              Team Applications
            </span>
            <span className="text-sm bg-blox-teal/20 text-blox-teal px-2 py-1 rounded-full">
              {pendingApplications.length} pending
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingApplications.map((application) => (
            <div
              key={application.id}
              className="p-4 rounded-lg bg-blox-second-dark-blue/30 border border-blox-glass-border hover:border-blox-teal/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-blox-white">{application.username}</p>
                    <span className="text-xs text-blox-medium-blue-gray flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getTimeAgo(application.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-blox-off-white line-clamp-2 mb-2">
                    {application.message}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {application.skills.map(skill => (
                      <span key={skill} className="px-2 py-0.5 bg-blox-teal/20 text-blox-teal text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedApplication(application)}
                  className="ml-4"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Review
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Application Review Modal */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blox-teal" />
              Review Application
            </DialogTitle>
            <DialogDescription>
              Review this player's application to join your team
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4 py-4">
              {/* Applicant Info */}
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blox-teal to-blox-teal-dark rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {selectedApplication.username.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-blox-white">{selectedApplication.username}</p>
                        <p className="text-xs text-blox-medium-blue-gray">
                          Applied {getTimeAgo(selectedApplication.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Application Message */}
              <div>
                <label className="text-sm font-medium text-blox-white mb-2 block">
                  Application Message
                </label>
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <p className="text-blox-off-white whitespace-pre-wrap">
                      {selectedApplication.message}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Skills */}
              <div>
                <label className="text-sm font-medium text-blox-white mb-2 block">
                  Skills & Experience
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedApplication.skills.map(skill => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-blox-teal/20 text-blox-teal rounded-md flex items-center gap-1"
                    >
                      {skill}
                      <Sparkles className="h-3 w-3" />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setSelectedApplication(null)}
              disabled={isReviewing}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => selectedApplication && handleReview(selectedApplication.id, 'rejected')}
              disabled={isReviewing}
              className="border-red-500/50 hover:bg-red-500/10"
            >
              {isReviewing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                  Rejecting...
                </span>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-1 text-red-500" />
                  Reject
                </>
              )}
            </Button>
            <Button
              onClick={() => selectedApplication && handleReview(selectedApplication.id, 'accepted')}
              disabled={isReviewing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isReviewing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Accepting...
                </span>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}