# Admin Dashboard Implementation Guide
> **For Junior Developers**: Complete step-by-step guide to implement the Blox Wizard Admin System

## 📋 Table of Contents
1. [Overview & Architecture](#overview--architecture)
2. [Prerequisites & Setup](#prerequisites--setup)
3. [Phase 1: Authentication & Authorization](#phase-1-authentication--authorization)
4. [Phase 2: Admin Dashboard UI](#phase-2-admin-dashboard-ui)
5. [Phase 3: YouTube Video Management](#phase-3-youtube-video-management)
6. [Phase 4: Transcript Processing Pipeline](#phase-4-transcript-processing-pipeline)
7. [Phase 5: Monitoring & Analytics](#phase-5-monitoring--analytics)
8. [Testing & Deployment](#testing--deployment)
9. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview & Architecture

### System Components
```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                          │
├─────────────────────────────────────────────────────────────┤
│  Authentication │ Video Manager │ Transcript │ Analytics    │
│     Layer       │    CRUD UI    │  Processor │  Dashboard   │
├─────────────────────────────────────────────────────────────┤
│                    Supabase Backend                          │
│  Auth Service │ Database │ Vector Store │ Edge Functions    │
├─────────────────────────────────────────────────────────────┤
│                  Processing Pipeline                         │
│  yt-dlp │ OpenAI Embeddings │ Queue System │ n8n Webhooks  │
└─────────────────────────────────────────────────────────────┘
```

### Key Features
- 🔐 **Secure Admin Access**: Role-based authentication
- 📹 **Video Management**: Add/edit/delete YouTube videos
- 🤖 **Automated Processing**: Transcript extraction & embedding generation
- 📊 **Analytics Dashboard**: Usage stats & system health
- 🔄 **Batch Operations**: Bulk import/export capabilities
- 🚨 **Error Recovery**: Automatic retry & fallback systems

---

## Prerequisites & Setup

### Required Knowledge
- Next.js 14 App Router
- TypeScript basics
- Supabase Auth & Database
- React hooks (useState, useEffect)
- Basic SQL

### Environment Setup
```bash
# 1. Install required packages
npm install @supabase/auth-helpers-nextjs
npm install recharts  # For analytics charts
npm install react-hot-toast  # For notifications
npm install @tanstack/react-table  # For data tables
npm install zod  # For validation
npm install date-fns  # For date formatting

# 2. Python dependencies (for transcript extraction)
pip install yt-dlp
pip install openai
```

### Environment Variables
Add to `.env.local`:
```env
# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAIL=admin@bloxbuddy.com
ADMIN_SECRET_KEY=your-admin-secret-key
TRANSCRIPT_QUEUE_SECRET=your-queue-secret

# Rate Limiting
YOUTUBE_EXTRACTION_DELAY_MS=5000
MAX_EXTRACTION_RETRIES=3
```

---

## Phase 1: Authentication & Authorization

### Step 1.1: Database Schema
Create file: `supabase/migrations/admin_system.sql`

```sql
-- Admin users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('super_admin', 'admin', 'moderator')) DEFAULT 'moderator',
  permissions JSONB DEFAULT '{}',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video management queue
CREATE TABLE video_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL,
  title TEXT,
  creator TEXT,
  module_id TEXT,
  week_id TEXT,
  day_id TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retry')) DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt TIMESTAMPTZ,
  error_message TEXT,
  error_details JSONB,
  added_by UUID REFERENCES admin_users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(youtube_id)
);

-- Extraction logs for debugging
CREATE TABLE extraction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_queue_id UUID REFERENCES video_queue(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'extract', 'embed', 'chunk', 'store'
  status TEXT NOT NULL, -- 'started', 'success', 'failed'
  method TEXT, -- 'yt-dlp', 'api', 'manual'
  duration_ms INTEGER,
  metadata JSONB,
  error_message TEXT,
  error_stack TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin activity logs
CREATE TABLE admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_video_queue_status ON video_queue(status);
CREATE INDEX idx_video_queue_youtube_id ON video_queue(youtube_id);
CREATE INDEX idx_extraction_logs_video_queue_id ON extraction_logs(video_queue_id);
CREATE INDEX idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX idx_admin_activity_logs_created_at ON admin_activity_logs(created_at DESC);

-- RLS Policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read admin tables
CREATE POLICY "Admins can read admin_users" ON admin_users
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ));

-- Super admins can manage admin users
CREATE POLICY "Super admins can manage admin_users" ON admin_users
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ));
```

### Step 1.2: Auth Middleware
Create file: `src/middleware/admin.ts`

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function adminMiddleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user is authenticated
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check if user is admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  // Log admin activity
  await supabase.from('admin_activity_logs').insert({
    admin_id: user.id,
    action: 'page_view',
    resource_type: 'admin_page',
    resource_id: request.nextUrl.pathname,
    details: {
      method: request.method,
      url: request.url,
    },
    ip_address: request.ip || request.headers.get('x-forwarded-for'),
    user_agent: request.headers.get('user-agent'),
  })

  return res
}

export const config = {
  matcher: '/admin/:path*',
}
```

### Step 1.3: Admin Auth Hook
Create file: `src/hooks/useAdminAuth.ts`

```typescript
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface AdminUser {
  id: string
  email: string
  role: 'super_admin' | 'admin' | 'moderator'
  permissions: Record<string, boolean>
}

export function useAdminAuth() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkAdminAuth()
  }, [])

  async function checkAdminAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error || !adminUser) {
        router.push('/unauthorized')
        return
      }

      setAdmin(adminUser)
    } catch (error) {
      console.error('Admin auth error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!admin) return false
    if (admin.role === 'super_admin') return true
    return admin.permissions[permission] === true
  }

  return { admin, loading, hasPermission }
}
```

---

## Phase 2: Admin Dashboard UI

### Step 2.1: Layout Component
Create file: `src/app/admin/layout.tsx`

```typescript
'use client'

import { useAdminAuth } from '@/hooks/useAdminAuth'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/videos', label: 'Videos', icon: '📹' },
  { href: '/admin/transcripts', label: 'Transcripts', icon: '📝' },
  { href: '/admin/queue', label: 'Queue', icon: '⏳' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { admin, loading } = useAdminAuth()
  const pathname = usePathname()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!admin) {
    return null // Redirect handled by hook
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Blox Admin</h1>
          <p className="text-sm text-gray-600">{admin.email}</p>
          <span className="inline-block px-2 py-1 mt-2 text-xs bg-blue-100 rounded">
            {admin.role}
          </span>
        </div>
        
        <nav className="p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 mb-2 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
```

### Step 2.2: Dashboard Page
Create file: `src/app/admin/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardStats {
  totalVideos: number
  processedVideos: number
  failedVideos: number
  pendingVideos: number
  totalTranscripts: number
  totalChunks: number
  avgProcessingTime: number
  successRate: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    // Fetch video statistics
    const { data: videoStats } = await supabase
      .from('video_queue')
      .select('status')
    
    const { data: transcriptStats } = await supabase
      .from('video_transcripts')
      .select('id')
    
    const { data: chunkStats } = await supabase
      .from('transcript_chunks')
      .select('id')
    
    // Calculate stats
    const stats: DashboardStats = {
      totalVideos: videoStats?.length || 0,
      processedVideos: videoStats?.filter(v => v.status === 'completed').length || 0,
      failedVideos: videoStats?.filter(v => v.status === 'failed').length || 0,
      pendingVideos: videoStats?.filter(v => v.status === 'pending').length || 0,
      totalTranscripts: transcriptStats?.length || 0,
      totalChunks: chunkStats?.length || 0,
      avgProcessingTime: 0, // Calculate from logs
      successRate: 0, // Calculate from stats
    }
    
    if (stats.totalVideos > 0) {
      stats.successRate = (stats.processedVideos / stats.totalVideos) * 100
    }
    
    setStats(stats)
    
    // Fetch recent activity
    const { data: activities } = await supabase
      .from('admin_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    setRecentActivity(activities || [])
  }

  if (!stats) return <div>Loading...</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVideos}</div>
            <p className="text-xs text-gray-500">
              {stats.processedVideos} processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">
              {stats.failedVideos} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Transcripts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTranscripts}</div>
            <p className="text-xs text-gray-500">
              {stats.totalChunks} chunks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Queue Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVideos}</div>
            <p className="text-xs text-gray-500">
              pending extraction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div>
                  <span className="font-medium">{activity.action}</span>
                  <span className="ml-2 text-sm text-gray-600">
                    {activity.resource_type}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(activity.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Phase 3: YouTube Video Management

### Step 3.1: Video Management Page
Create file: `src/app/admin/videos/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { VideoTable } from '@/components/admin/VideoTable'
import { AddVideoModal } from '@/components/admin/AddVideoModal'
import { Button } from '@/components/ui/button'

export default function VideosPage() {
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Video Management</h1>
        <div className="flex gap-4">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Video
          </Button>
          <Button variant="outline">
            Import Curriculum
          </Button>
          <Button variant="outline">
            Export Data
          </Button>
        </div>
      </div>

      <VideoTable />
      
      {showAddModal && (
        <AddVideoModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  )
}
```

### Step 3.2: Add Video Modal
Create file: `src/components/admin/AddVideoModal.tsx`

```typescript
'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { z } from 'zod'
import toast from 'react-hot-toast'

const videoSchema = z.object({
  youtubeUrl: z.string().url().includes('youtube.com', 'youtu.be'),
  title: z.string().min(1),
  creator: z.string().optional(),
  moduleId: z.string().optional(),
  weekId: z.string().optional(),
  dayId: z.string().optional(),
  priority: z.number().min(0).max(10).default(0),
  autoExtract: z.boolean().default(true),
})

export function AddVideoModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    youtubeUrl: '',
    title: '',
    creator: '',
    moduleId: '',
    weekId: '',
    dayId: '',
    priority: 0,
    autoExtract: true,
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form data
      const validated = videoSchema.parse(formData)
      
      // Extract YouTube ID from URL
      const youtubeId = extractYouTubeId(validated.youtubeUrl)
      if (!youtubeId) {
        throw new Error('Invalid YouTube URL')
      }

      // Add to video queue
      const { error } = await supabase
        .from('video_queue')
        .insert({
          youtube_id: youtubeId,
          title: validated.title,
          creator: validated.creator,
          module_id: validated.moduleId,
          week_id: validated.weekId,
          day_id: validated.dayId,
          priority: validated.priority,
          status: validated.autoExtract ? 'pending' : 'manual',
        })

      if (error) throw error

      // Trigger extraction if auto-extract is enabled
      if (validated.autoExtract) {
        await triggerExtraction(youtubeId)
      }

      toast.success('Video added successfully!')
      onClose()
    } catch (error) {
      console.error('Error adding video:', error)
      toast.error('Failed to add video')
    } finally {
      setLoading(false)
    }
  }

  async function triggerExtraction(youtubeId: string) {
    // Call API endpoint to trigger extraction
    const response = await fetch('/api/admin/extract-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtubeId }),
    })

    if (!response.ok) {
      console.error('Failed to trigger extraction')
    }
  }

  function extractYouTubeId(url: string): string | null {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Add YouTube Video</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              YouTube URL *
            </label>
            <input
              type="url"
              value={formData.youtubeUrl}
              onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="https://youtube.com/watch?v=..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Video Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Creator
            </label>
            <input
              type="text"
              value={formData.creator}
              onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Module
              </label>
              <select
                value={formData.moduleId}
                onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select...</option>
                <option value="module-1">Module 1</option>
                <option value="module-2">Module 2</option>
                <option value="module-3">Module 3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Week
              </label>
              <select
                value={formData.weekId}
                onChange={(e) => setFormData({ ...formData, weekId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select...</option>
                <option value="week-1">Week 1</option>
                <option value="week-2">Week 2</option>
                <option value="week-3">Week 3</option>
                <option value="week-4">Week 4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Day
              </label>
              <select
                value={formData.dayId}
                onChange={(e) => setFormData({ ...formData, dayId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select...</option>
                <option value="day-1">Day 1</option>
                <option value="day-2">Day 2</option>
                <option value="day-3">Day 3</option>
                <option value="day-4">Day 4</option>
                <option value="day-5">Day 5</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Priority (0-10)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoExtract"
              checked={formData.autoExtract}
              onChange={(e) => setFormData({ ...formData, autoExtract: e.target.checked })}
            />
            <label htmlFor="autoExtract" className="text-sm">
              Automatically extract transcript after adding
            </label>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Adding...' : 'Add Video'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

---

## Phase 4: Transcript Processing Pipeline

### Step 4.1: API Endpoint for Extraction
Create file: `src/app/api/admin/extract-transcript/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { spawn } from 'child_process'
import path from 'path'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { youtubeId } = await request.json()

    if (!youtubeId) {
      return NextResponse.json({ error: 'YouTube ID required' }, { status: 400 })
    }

    // Check if video is already in queue
    const { data: existingVideo } = await supabaseAdmin
      .from('video_queue')
      .select('id, status')
      .eq('youtube_id', youtubeId)
      .single()

    if (existingVideo && existingVideo.status === 'processing') {
      return NextResponse.json({ 
        message: 'Video is already being processed' 
      }, { status: 200 })
    }

    // Update status to processing
    await supabaseAdmin
      .from('video_queue')
      .update({ 
        status: 'processing',
        last_attempt: new Date().toISOString()
      })
      .eq('youtube_id', youtubeId)

    // Log extraction start
    await supabaseAdmin
      .from('extraction_logs')
      .insert({
        youtube_id: youtubeId,
        action: 'extract',
        status: 'started',
        method: 'yt-dlp',
      })

    // Extract transcript using Python script
    const transcript = await extractTranscript(youtubeId)

    if (!transcript.success) {
      throw new Error(transcript.error || 'Extraction failed')
    }

    // Process and store transcript
    await processTranscript(youtubeId, transcript)

    // Update status to completed
    await supabaseAdmin
      .from('video_queue')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('youtube_id', youtubeId)

    return NextResponse.json({ 
      success: true,
      message: 'Transcript extracted successfully' 
    })

  } catch (error: any) {
    console.error('Extraction error:', error)

    // Log error
    await supabaseAdmin
      .from('extraction_logs')
      .insert({
        youtube_id: request.body.youtubeId,
        action: 'extract',
        status: 'failed',
        error_message: error.message,
        error_stack: error.stack,
      })

    // Update video queue with error
    await supabaseAdmin
      .from('video_queue')
      .update({ 
        status: 'failed',
        error_message: error.message,
        attempts: supabaseAdmin.sql`attempts + 1`
      })
      .eq('youtube_id', request.body.youtubeId)

    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}

async function extractTranscript(youtubeId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'scripts', 'extract-transcripts.py')
    const python = spawn('python', [pythonScript, youtubeId])
    
    let stdout = ''
    let stderr = ''
    
    python.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    python.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout)
          resolve(result)
        } catch (error) {
          reject(new Error('Failed to parse extraction result'))
        }
      } else {
        reject(new Error(stderr || 'Extraction failed'))
      }
    })
  })
}

async function processTranscript(youtubeId: string, transcriptData: any) {
  // Implementation from import-real-transcripts.js
  // ... (chunking, embedding generation, database storage)
}
```

### Step 4.2: Background Queue Processor
Create file: `src/lib/queue-processor.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

class QueueProcessor {
  private isProcessing = false
  private processInterval: NodeJS.Timeout | null = null

  start() {
    if (this.processInterval) return
    
    // Process queue every 30 seconds
    this.processInterval = setInterval(() => {
      this.processQueue()
    }, 30000)
    
    // Process immediately on start
    this.processQueue()
  }

  stop() {
    if (this.processInterval) {
      clearInterval(this.processInterval)
      this.processInterval = null
    }
  }

  async processQueue() {
    if (this.isProcessing) return
    
    this.isProcessing = true
    
    try {
      // Get next pending video
      const { data: nextVideo } = await supabaseAdmin
        .from('video_queue')
        .select('*')
        .eq('status', 'pending')
        .lt('attempts', 3)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (!nextVideo) {
        // Check for retry videos
        const { data: retryVideo } = await supabaseAdmin
          .from('video_queue')
          .select('*')
          .eq('status', 'retry')
          .lt('attempts', 'max_attempts')
          .order('priority', { ascending: false })
          .limit(1)
          .single()

        if (!retryVideo) {
          return // No videos to process
        }

        await this.processVideo(retryVideo)
      } else {
        await this.processVideo(nextVideo)
      }
    } catch (error) {
      console.error('Queue processing error:', error)
    } finally {
      this.isProcessing = false
    }
  }

  async processVideo(video: any) {
    console.log(`Processing video: ${video.youtube_id}`)
    
    try {
      // Call extraction API
      const response = await fetch('/api/admin/extract-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ADMIN_SECRET_KEY}`,
        },
        body: JSON.stringify({ youtubeId: video.youtube_id }),
      })

      if (!response.ok) {
        throw new Error(`Extraction failed: ${response.statusText}`)
      }

      console.log(`Successfully processed: ${video.youtube_id}`)
    } catch (error: any) {
      console.error(`Failed to process ${video.youtube_id}:`, error)
      
      // Update retry status
      await supabaseAdmin
        .from('video_queue')
        .update({
          status: 'retry',
          attempts: video.attempts + 1,
          error_message: error.message,
          last_attempt: new Date().toISOString(),
        })
        .eq('id', video.id)
    }
  }
}

export const queueProcessor = new QueueProcessor()
```

### Step 4.3: Bulk Import Handler
Create file: `src/app/api/admin/bulk-import/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { videos } = await request.json()
    
    if (!Array.isArray(videos) || videos.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid videos array' 
      }, { status: 400 })
    }

    const results = {
      added: 0,
      skipped: 0,
      errors: 0,
    }

    for (const video of videos) {
      try {
        // Extract YouTube ID
        const youtubeId = extractYouTubeId(video.youtubeId || video.url)
        
        if (!youtubeId) {
          results.errors++
          continue
        }

        // Check if already exists
        const { data: existing } = await supabaseAdmin
          .from('video_queue')
          .select('id')
          .eq('youtube_id', youtubeId)
          .single()

        if (existing) {
          results.skipped++
          continue
        }

        // Add to queue
        const { error } = await supabaseAdmin
          .from('video_queue')
          .insert({
            youtube_id: youtubeId,
            title: video.title,
            creator: video.creator,
            module_id: video.moduleId,
            week_id: video.weekId,
            day_id: video.dayId,
            priority: video.priority || 0,
            status: 'pending',
          })

        if (error) throw error
        results.added++

      } catch (error) {
        console.error(`Failed to import video:`, error)
        results.errors++
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Added ${results.added} videos, skipped ${results.skipped}, errors: ${results.errors}`
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null
  
  // If already an ID
  if (url.length === 11 && !url.includes('/')) {
    return url
  }
  
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}
```

---

## Phase 5: Monitoring & Analytics

### Step 5.1: Analytics Dashboard
Create file: `src/app/admin/analytics/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function AnalyticsPage() {
  const [extractionData, setExtractionData] = useState<any[]>([])
  const [usageData, setUsageData] = useState<any[]>([])
  const [statusData, setStatusData] = useState<any[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    // Fetch extraction success rate over time
    const { data: logs } = await supabase
      .from('extraction_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    // Process data for charts
    // ... (implement data processing)

    setExtractionData(processedData)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      {/* Extraction Success Rate */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Extraction Success Rate</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={extractionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="successRate" stroke="#10b981" />
            <Line type="monotone" dataKey="failureRate" stroke="#ef4444" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Video Status Distribution */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Video Status Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Usage Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Chat Usage Statistics</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={usageData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="queries" fill="#3b82f6" />
            <Bar dataKey="uniqueUsers" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

---

## Testing & Deployment

### Unit Tests
Create file: `__tests__/admin/extraction.test.ts`

```typescript
import { extractYouTubeId } from '@/lib/youtube-utils'

describe('YouTube ID Extraction', () => {
  test('extracts ID from watch URL', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ')
  })

  test('extracts ID from short URL', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ'
    expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ')
  })

  test('returns null for invalid URL', () => {
    const url = 'https://example.com/video'
    expect(extractYouTubeId(url)).toBeNull()
  })
})
```

### E2E Tests
Create file: `__tests__/admin/e2e.test.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[name="email"]', process.env.TEST_ADMIN_EMAIL!)
    await page.fill('[name="password"]', process.env.TEST_ADMIN_PASSWORD!)
    await page.click('[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('can add a video', async ({ page }) => {
    await page.goto('/admin/videos')
    await page.click('text=Add Video')
    
    await page.fill('[name="youtubeUrl"]', 'https://youtube.com/watch?v=test123')
    await page.fill('[name="title"]', 'Test Video')
    await page.click('text=Add Video')
    
    await expect(page.locator('text=Video added successfully')).toBeVisible()
  })

  test('can view extraction queue', async ({ page }) => {
    await page.goto('/admin/queue')
    await expect(page.locator('h1')).toContainText('Extraction Queue')
  })
})
```

---

## Troubleshooting Guide

### Common Issues & Solutions

#### 1. YouTube Rate Limiting (HTTP 429)
**Problem**: Getting blocked after ~20 videos
**Solutions**:
- Increase delay between extractions (5-10 seconds)
- Use proxy rotation service
- Implement exponential backoff
- Process in smaller batches

#### 2. Extraction Failures
**Problem**: yt-dlp fails to extract transcript
**Solutions**:
- Update yt-dlp: `pip install --upgrade yt-dlp`
- Check if video has captions enabled
- Try fallback to audio transcription with Whisper
- Manual transcript upload option

#### 3. Database Connection Issues
**Problem**: Supabase connection timeouts
**Solutions**:
- Check service role key validity
- Verify RLS policies
- Use connection pooling
- Implement retry logic

#### 4. Memory Issues with Large Transcripts
**Problem**: Out of memory when processing long videos
**Solutions**:
- Stream processing for large files
- Increase Node.js memory limit
- Process chunks sequentially
- Use worker threads

### Performance Optimization

1. **Database Indexes**: Ensure all foreign keys and frequently queried columns have indexes
2. **Caching**: Implement Redis for frequently accessed data
3. **CDN**: Use Cloudflare for static assets
4. **Queue Processing**: Use Bull or BullMQ for robust queue management
5. **Monitoring**: Set up Sentry for error tracking

### Security Checklist

- [ ] Admin routes protected by middleware
- [ ] CSRF protection enabled
- [ ] Rate limiting on API endpoints
- [ ] Input validation with Zod
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Secure session management
- [ ] Regular security audits
- [ ] Backup strategy in place
- [ ] Disaster recovery plan documented

---

## Next Steps

1. **Implement Phase 1**: Set up authentication and database
2. **Build Admin UI**: Create dashboard and video management pages
3. **Test Extraction Pipeline**: Verify yt-dlp integration works
4. **Deploy to Staging**: Test with real data
5. **Monitor & Iterate**: Gather feedback and improve

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Recharts Examples](https://recharts.org/en-US/examples)
- [Shadcn/ui Components](https://ui.shadcn.com)

---

**Remember**: Start small, test often, and iterate based on real usage. The admin dashboard is a living system that will evolve with your needs!