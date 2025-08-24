'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  MessageCircle, 
  Users, 
  FileText, 
  Brain,
  Info,
  Construction,
  X
} from 'lucide-react'
import TeamChat from '@/components/teams/TeamChat'
import TeamInfo from '@/components/teams/TeamInfo'
import TeamWhiteboard from '@/components/teams/TeamWhiteboard'
import TeamNotes from '@/components/teams/TeamNotes'

// Mock team data - in production this would come from Supabase
const mockTeam = {
  id: 'team-1',
  name: 'GameDev Squad',
  description: 'Building the next generation of Roblox experiences together',
  memberCount: 4,
  maxMembers: 6,
  isRecruiting: true,
  skills: ['Building', 'Scripting', 'UI Design'],
  leader: 'ScriptMaster',
  avatar: '/images/team-logos/gamedev-squad.png',
  projects: 2,
  founded: '2 weeks ago',
  rank: 3,
  points: 2450,
  badges: ['First Project', 'Team Player'],
  recruitmentStatus: 'open' as const,
  teamType: 'competitive' as const,
  activeProjects: [
    { id: 'p1', name: 'Tower Defense Game', status: 'in-progress' as const, progress: 65, deadline: 'Dec 15' },
    { id: 'p2', name: 'UI Overhaul', status: 'testing' as const, progress: 85 }
  ],
  members: [
    { 
      id: 'm1', 
      name: 'ScriptMaster', 
      role: 'leader' as const, 
      joinedAt: '2 weeks ago', 
      contributions: 45, 
      online: true,
      avatar: 'SM',
      bio: 'Experienced Lua developer with 3+ years in Roblox development'
    },
    { 
      id: 'm2', 
      name: 'BuilderPro', 
      role: 'builder' as const, 
      joinedAt: '1 week ago', 
      contributions: 23, 
      online: false,
      avatar: 'BP',
      bio: 'Expert in creating detailed environments and optimized builds'
    },
    { 
      id: 'm3', 
      name: 'UIWizard', 
      role: 'designer' as const, 
      joinedAt: '3 days ago', 
      contributions: 12, 
      online: true,
      avatar: 'UW',
      bio: 'UI/UX specialist focused on creating intuitive game interfaces'
    },
    { 
      id: 'm4', 
      name: 'GameDev123', 
      role: 'developer' as const, 
      joinedAt: '5 days ago', 
      contributions: 18,
      online: false,
      avatar: 'GD',
      bio: 'Jack of all trades, master of game mechanics'
    }
  ]
}

export default function TeamDashboardPage({ params }: { params: { teamId: string } }) {
  const [activeTab, setActiveTab] = useState('info')
  const [showComingSoonModal, setShowComingSoonModal] = useState(true)

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Coming Soon Modal */}
      <Dialog open={showComingSoonModal} onOpenChange={setShowComingSoonModal}>
        <DialogContent className="max-w-md glass-card border-blox-purple/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blox-white">
              <Construction className="h-5 w-5 text-yellow-500" />
              Team Features Under Construction
            </DialogTitle>
            <DialogDescription className="text-blox-off-white space-y-3 pt-4">
              <p>
                Welcome to the team management preview! This feature is currently in development 
                and will be fully functional soon.
              </p>
              <p className="text-sm">
                Feel free to explore the interface and get a feel for what's coming:
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Real-time team chat with image sharing</li>
                <li>• Collaborative whiteboard for planning</li>
                <li>• Shared notes and documentation</li>
                <li>• Team member management</li>
              </ul>
              <p className="text-xs text-blox-medium-blue-gray mt-4">
                Expected launch: March 2024
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button 
              onClick={() => setShowComingSoonModal(false)}
              className="bg-blox-teal hover:bg-blox-teal-dark"
            >
              Explore Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Header */}
      <div className="p-6 border-b border-blox-glass-border bg-blox-black-blue/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-blox-teal to-blox-teal-dark flex items-center justify-center">
              <span className="text-white font-bold text-2xl">GS</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blox-white flex items-center gap-2">
                {mockTeam.name}
                <span className="text-sm px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-md">
                  Rank #{mockTeam.rank}
                </span>
              </h1>
              <p className="text-blox-off-white">{mockTeam.description}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowComingSoonModal(true)}
            className="text-blox-medium-blue-gray hover:text-blox-white"
          >
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-6 pt-4">
            <TabsList className="bg-blox-second-dark-blue/50 border border-blox-glass-border">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Info
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Team Chat
              </TabsTrigger>
              <TabsTrigger value="whiteboard" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Whiteboard
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden px-6 pb-6">
            <TabsContent value="info" className="h-full mt-4 overflow-y-auto">
              <TeamInfo team={mockTeam} />
            </TabsContent>

            <TabsContent value="chat" className="h-full mt-4">
              <TeamChat team={mockTeam} />
            </TabsContent>

            <TabsContent value="whiteboard" className="h-full mt-4">
              <TeamWhiteboard teamId={mockTeam.id} />
            </TabsContent>

            <TabsContent value="notes" className="h-full mt-4">
              <TeamNotes teamId={mockTeam.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}