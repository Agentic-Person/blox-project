import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Search } from 'lucide-react'

export default function NotesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blox-white mb-2">Learning Notes</h1>
          <p className="text-blox-off-white">Keep track of your progress and insights</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-blox-teal" />
            Your Notes
          </CardTitle>
          <CardDescription>
            Create and organize your learning notes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-blox-medium-blue-gray mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blox-white mb-2">No notes yet</h3>
            <p className="text-blox-off-white mb-4">Start taking notes to track your learning progress</p>
            <Button>Create Your First Note</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}