'use client'

import { useState } from 'react'
import { useAIJourney } from '@/hooks/useAIJourney'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  User, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react'

export function AIJourneyDatabaseTest() {
  const {
    journey,
    userId,
    syncEnabled,
    isLoading,
    isSubscribed,
    hasActiveSubscription,
    getSyncStatus,
    initializeUser,
    createJourneyInDatabase,
    initializeFromDatabase,
    syncToDatabase,
    enableSync,
    disableSync,
    resetJourney
  } = useAIJourney()

  const [testUserId, setTestUserId] = useState('test-user-123')
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  
  const syncStatus = getSyncStatus()

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setTestResults(prev => ({ ...prev, [testName]: { status: 'running', result: null } }))
    
    try {
      const result = await testFn()
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { status: 'success', result, timestamp: new Date().toISOString() } 
      }))
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { 
          status: 'error', 
          result: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        } 
      }))
    }
  }

  const handleInitializeUser = () => {
    runTest('initializeUser', async () => {
      initializeUser(testUserId)
      return `User initialized: ${testUserId}`
    })
  }

  const handleCreateJourney = () => {
    runTest('createJourney', async () => {
      await createJourneyInDatabase('horror', 'My Awesome Horror Game')
      return 'Journey created successfully'
    })
  }

  const handleLoadFromDatabase = () => {
    runTest('loadFromDatabase', async () => {
      await initializeFromDatabase()
      return 'Data loaded from database'
    })
  }

  const handleSyncToDatabase = () => {
    runTest('syncToDatabase', async () => {
      await syncToDatabase()
      return 'Data synced to database'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="glass-card-blue">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            AI Journey Database Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current State */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blox-black-blue/30 rounded-lg">
              <User className="h-6 w-6 mx-auto mb-2 text-blox-teal" />
              <p className="text-xs text-blox-off-white/70">User ID</p>
              <p className="text-sm font-medium truncate">
                {userId || 'Not set'}
              </p>
            </div>
            
            <div className="text-center p-3 bg-blox-black-blue/30 rounded-lg">
              <Database className="h-6 w-6 mx-auto mb-2 text-blox-purple" />
              <p className="text-xs text-blox-off-white/70">Sync Status</p>
              <Badge 
                variant={syncStatus.status === 'synced' ? 'default' : 'outline'}
                className="text-xs"
              >
                {syncStatus.status}
              </Badge>
            </div>
            
            <div className="text-center p-3 bg-blox-black-blue/30 rounded-lg">
              {hasActiveSubscription ? (
                <Wifi className="h-6 w-6 mx-auto mb-2 text-green-500" />
              ) : (
                <WifiOff className="h-6 w-6 mx-auto mb-2 text-gray-500" />
              )}
              <p className="text-xs text-blox-off-white/70">Realtime</p>
              <p className="text-sm font-medium">
                {hasActiveSubscription ? 'Connected' : 'Offline'}
              </p>
            </div>
            
            <div className="text-center p-3 bg-blox-black-blue/30 rounded-lg">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-blox-teal" />
              <p className="text-xs text-blox-off-white/70">Journey</p>
              <p className="text-sm font-medium">
                {journey ? 'Loaded' : 'None'}
              </p>
            </div>
          </div>

          {/* Test Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                placeholder="Test User ID"
                className="flex-1 px-3 py-2 bg-blox-black-blue/50 border border-blox-teal/30 rounded-md text-blox-white"
              />
              <Button onClick={handleInitializeUser} size="sm">
                Initialize User
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button onClick={handleCreateJourney} disabled={!userId} size="sm">
                Create Journey
              </Button>
              <Button onClick={handleLoadFromDatabase} disabled={!userId} size="sm">
                Load from DB
              </Button>
              <Button onClick={handleSyncToDatabase} disabled={!journey} size="sm">
                Sync to DB
              </Button>
              <Button onClick={resetJourney} variant="outline" size="sm">
                Reset
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={enableSync} 
                disabled={syncEnabled}
                variant="outline" 
                size="sm"
              >
                Enable Sync
              </Button>
              <Button 
                onClick={disableSync} 
                disabled={!syncEnabled}
                variant="outline" 
                size="sm"
              >
                Disable Sync
              </Button>
            </div>
          </div>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-blox-white">Test Results:</h4>
              {Object.entries(testResults).map(([testName, result]) => (
                <div key={testName} className="flex items-center justify-between p-3 bg-blox-second-dark-blue/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{testName}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blox-off-white/70">
                      {typeof result.result === 'string' ? result.result : JSON.stringify(result.result)}
                    </p>
                    {result.timestamp && (
                      <p className="text-xs text-blox-off-white/50">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Current Journey Info */}
          {journey && (
            <div className="p-3 bg-blox-success/10 border border-blox-success/30 rounded-lg">
              <h4 className="font-semibold text-blox-success mb-2">Current Journey:</h4>
              <div className="text-sm space-y-1 text-blox-off-white/80">
                <p><strong>ID:</strong> {journey.id}</p>
                <p><strong>Title:</strong> {journey.gameTitle}</p>
                <p><strong>Type:</strong> {journey.gameType}</p>
                <p><strong>Progress:</strong> {journey.totalProgress}%</p>
                <p><strong>Skills:</strong> {journey.skills.length}</p>
                <p><strong>Created:</strong> {journey.createdAt instanceof Date 
                  ? journey.createdAt.toLocaleString() 
                  : new Date(journey.createdAt).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Sync Status Details */}
          <div className="p-3 bg-blox-purple/10 border border-blox-purple/30 rounded-lg">
            <h4 className="font-semibold text-blox-purple mb-2">Sync Details:</h4>
            <div className="text-sm space-y-1 text-blox-off-white/80">
              <p><strong>Status:</strong> {syncStatus.message}</p>
              <p><strong>Realtime:</strong> {syncStatus.realtime ? 'Active' : 'Inactive'}</p>
              <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
              <p><strong>Subscribed:</strong> {isSubscribed ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}