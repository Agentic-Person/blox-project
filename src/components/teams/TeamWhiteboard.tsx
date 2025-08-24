'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Download, 
  Share2, 
  Maximize2,
  Users,
  Brain
} from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import WhiteboardPage to avoid SSR issues
const WhiteboardPage = dynamic(
  () => import('@/components/whiteboard/WhiteboardPage'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-blox-off-white">Loading team whiteboard...</div>
      </div>
    )
  }
)

interface TeamWhiteboardProps {
  teamId: string
}

export default function TeamWhiteboard({ teamId }: TeamWhiteboardProps) {
  const handleShareToChat = () => {
    // In production, this would export the whiteboard and send it to the team chat
    console.log('Sharing whiteboard to team chat...')
  }

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Brain className="h-5 w-5 text-blox-purple" />
            Team Whiteboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-blox-black-blue rounded-md border border-blox-glass-border">
              <Users className="h-3 w-3 text-blox-medium-blue-gray" />
              <span className="text-xs text-blox-off-white">3 collaborating</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleShareToChat}
              className="text-blox-medium-blue-gray hover:text-blox-white"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share to Chat
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="h-full">
          <WhiteboardPage />
        </div>
      </CardContent>
    </Card>
  )
}