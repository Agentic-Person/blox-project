'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Plus, Search, Brain, PenTool } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import WhiteboardPage to avoid SSR issues
const WhiteboardPage = dynamic(
  () => import('@/components/whiteboard/WhiteboardPage'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-blox-off-white">Loading whiteboard...</div>
      </div>
    )
  }
)

export default function NotesPage() {
  const [activeTab, setActiveTab] = useState('whiteboard')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blox-white mb-2">Learning Notes & Mind Maps</h1>
          <p className="text-blox-off-white">Visualize your learning journey and capture insights</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-blox-glass-teal border border-blox-glass-border">
          <TabsTrigger value="whiteboard" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Mind Maps
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Text Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whiteboard" className="mt-4">
          <Card className="overflow-hidden h-[calc(100vh-280px)]">
            <CardContent className="p-0 h-full">
              <WhiteboardPage />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-blox-teal" />
                Text Notes
              </CardTitle>
              <CardDescription>
                Create and organize your written notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-blox-medium-blue-gray mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-blox-white mb-2">Text notes coming soon</h3>
                <p className="text-blox-off-white mb-4">
                  Use the Mind Maps tab to create visual notes for now
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}