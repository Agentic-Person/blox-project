# Blox Buddy - Architectural Design & Technical Implementation Document
## For Solo Development with Claude Code

**Document Version:** 1.0  
**Date:** January 11, 2025  
**Developer:** Solo Developer  
**Tech Stack:** Next.js, Tailwind CSS, Supabase, n8n  
**Development Tool:** Claude Code

---

## 1. Executive Technical Summary

This document provides a complete technical blueprint for building Blox Buddy as a solo developer using Claude Code. The architecture prioritizes simplicity, maintainability, and rapid development while ensuring scalability for future growth and integration with Code Buddy.

### Key Technical Decisions
- **Next.js 14 App Router** for modern React with built-in optimizations
- **Tailwind CSS** for rapid UI development without CSS complexity
- **Supabase** for backend-as-a-service (auth, database, real-time, storage)
- **n8n** for automation workflows and content health monitoring
- **Vercel** for deployment with automatic CI/CD
- **Claude Code** as primary development assistant

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│  Landing Page │ Learning App │ Team Hub │ Project Showcase  │
├─────────────────────────────────────────────────────────────┤
│                    API Routes (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│                      Supabase Client                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Backend                         │
├─────────────────────────────────────────────────────────────┤
│   Auth   │   Database   │   Storage   │   Real-time         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     n8n Automation Layer                      │
├─────────────────────────────────────────────────────────────┤
│ Content Health │ Discord Bot │ Analytics │ Email Workflows  │
└─────────────────────────────────────────────────────────────┘
```

## 3. Development Environment Setup

### 3.1 Prerequisites Installation Script
```bash
# Create this setup script: setup-blox-buddy.sh

#!/bin/bash
echo "🚀 Setting up Blox Buddy Development Environment"

# Check Node.js version (need 18+)
node_version=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$node_version" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Please install from nodejs.org"
    exit 1
fi

# Create project
npx create-next-app@latest blox-buddy --typescript --tailwind --app --no-src-dir --import-alias "@/*"

cd blox-buddy

# Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
npm install framer-motion react-hot-toast zustand
npm install react-youtube @types/react-youtube
npm install lucide-react
npm install --save-dev @types/node

# Create environment files
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
N8N_WEBHOOK_URL=your_n8n_webhook_url
EOF

echo "✅ Setup complete! Update .env.local with your credentials"
```

### 3.2 Claude Code Development Workflow
```markdown
## Claude Code Commands Reference

### Project Initialization
"Create a Next.js 14 project with Tailwind CSS and Supabase integration for Blox Buddy"

### Component Generation
"Create a VideoPlayer component that embeds YouTube videos with progress tracking"

### Database Operations
"Generate Supabase migration for the teams and team_members tables"

### API Route Creation
"Create an API route for team formation that validates user skills and creates Discord channel"

### Testing Patterns
"Write tests for the progress tracking functionality using Jest and React Testing Library"
```

## 4. Project Structure

```
blox-buddy/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── learn/
│   │   │   ├── [module]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── teams/
│   │   │   ├── [teamId]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts
│   │   ├── progress/
│   │   │   └── route.ts
│   │   ├── teams/
│   │   │   └── route.ts
│   │   └── webhooks/
│   │       ├── discord/
│   │       │   └── route.ts
│   │       └── n8n/
│   │           └── route.ts
│   ├── layout.tsx
│   ├── page.tsx (landing)
│   └── globals.css
├── components/
│   ├── auth/
│   │   ├── AuthButton.tsx
│   │   └── AuthProvider.tsx
│   ├── learning/
│   │   ├── VideoPlayer.tsx
│   │   ├── ProgressTracker.tsx
│   │   ├── CurriculumNav.tsx
│   │   └── ContentCard.tsx
│   ├── teams/
│   │   ├── TeamCard.tsx
│   │   ├── TeamFinder.tsx
│   │   ├── TeamDashboard.tsx
│   │   └── SkillBadge.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Toast.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Sidebar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── youtube/
│   │   └── api.ts
│   ├── discord/
│   │   └── webhooks.ts
│   ├── constants/
│   │   ├── curriculum.ts
│   │   └── skills.ts
│   └── utils/
│       ├── helpers.ts
│       └── validators.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useProgress.ts
│   ├── useTeam.ts
│   └── useSupabase.ts
├── store/
│   ├── authStore.ts
│   ├── progressStore.ts
│   └── teamStore.ts
├── types/
│   ├── database.ts
│   ├── curriculum.ts
│   └── api.ts
├── public/
│   ├── images/
│   └── icons/
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_teams_tables.sql
│   │   └── 003_content_tables.sql
│   └── seed.sql
└── n8n/
    ├── workflows/
    │   ├── content-health-check.json
    │   ├── discord-bot.json
    │   └── weekly-analytics.json
    └── README.md
```

## 5. Database Implementation

### 5.1 Supabase Setup Script
```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/001_initial_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core users table (shared with Code Buddy)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  discord_id TEXT UNIQUE,
  discord_username TEXT,
  avatar_url TEXT,
  age_range TEXT CHECK (age_range IN ('10-12', '13-15', '16-18', '19-25', '25+')),
  parent_email TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  code_buddy_eligible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- Learning progress table
CREATE TABLE public.learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  module_name TEXT NOT NULL,
  week_number INT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  time_spent_seconds INT DEFAULT 0,
  notes TEXT,
  UNIQUE(user_id, content_id)
);

-- Create indexes for performance
CREATE INDEX idx_users_discord_id ON public.users(discord_id);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_progress_user_id ON public.learning_progress(user_id);
CREATE INDEX idx_progress_module ON public.learning_progress(module_name, week_number);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_last_active
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();
```

### 5.2 Supabase Client Configuration
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

## 6. Core Component Implementation

### 6.1 Video Player Component
```typescript
// components/learning/VideoPlayer.tsx
'use client'

import { useState, useEffect } from 'react'
import YouTube, { YouTubeProps } from 'react-youtube'
import { createClient } from '@/lib/supabase/client'
import { useProgressStore } from '@/store/progressStore'
import { Button } from '@/components/ui/Button'
import { CheckCircle, PlayCircle } from 'lucide-react'

interface VideoPlayerProps {
  videoId: string
  moduleId: string
  weekNumber: number
  onComplete?: () => void
}

export function VideoPlayer({ videoId, moduleId, weekNumber, onComplete }: VideoPlayerProps) {
  const [isCompleted, setIsCompleted] = useState(false)
  const [watchTime, setWatchTime] = useState(0)
  const { updateProgress } = useProgressStore()
  const supabase = createClient()

  useEffect(() => {
    // Check if video is already completed
    checkCompletionStatus()
  }, [videoId])

  const checkCompletionStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('learning_progress')
      .select('completed')
      .eq('user_id', user.id)
      .eq('content_id', videoId)
      .single()

    if (data?.completed) {
      setIsCompleted(true)
    }
  }

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    // Track watch time
    if (event.data === YouTube.PlayerState.PLAYING) {
      const interval = setInterval(() => {
        setWatchTime(prev => prev + 1)
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }

  const onVideoEnd: YouTubeProps['onEnd'] = async () => {
    await markAsComplete()
  }

  const markAsComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('learning_progress')
      .upsert({
        user_id: user.id,
        content_id: videoId,
        content_type: 'video',
        module_name: moduleId,
        week_number: weekNumber,
        completed: true,
        completed_at: new Date().toISOString(),
        time_spent_seconds: watchTime
      })

    if (!error) {
      setIsCompleted(true)
      updateProgress(videoId, true)
      onComplete?.()
    }
  }

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0
    },
  }

  return (
    <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
      <YouTube
        videoId={videoId}
        opts={opts}
        onStateChange={onPlayerStateChange}
        onEnd={onVideoEnd}
        className="absolute inset-0"
        iframeClassName="w-full h-full"
      />
      
      <div className="absolute top-4 right-4 flex gap-2">
        {isCompleted ? (
          <div className="bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Completed</span>
          </div>
        ) : (
          <Button
            onClick={markAsComplete}
            variant="secondary"
            size="sm"
            className="bg-white/90 hover:bg-white"
          >
            Mark Complete
          </Button>
        )}
      </div>
    </div>
  )
}
```

### 6.2 Team Formation Component
```typescript
// components/teams/TeamFinder.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TeamCard } from './TeamCard'
import { Button } from '@/components/ui/Button'
import { Filter, Users, Plus } from 'lucide-react'

interface Team {
  id: string
  team_name: string
  description: string
  skill_needs: string[]
  member_count: number
  max_members: number
}

export function TeamFinder() {
  const [teams, setTeams] = useState<Team[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchTeams()
  }, [filter])

  const fetchTeams = async () => {
    setLoading(true)
    
    let query = supabase
      .from('teams')
      .select(`
        *,
        team_members (count)
      `)
      .eq('is_recruiting', true)

    if (filter !== 'all') {
      query = query.contains('skill_needs', [filter])
    }

    const { data, error } = await query

    if (!error && data) {
      setTeams(data.map(team => ({
        ...team,
        member_count: team.team_members[0]?.count || 0
      })))
    }
    
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All Teams
        </Button>
        {['scripter', 'modeler', 'designer', 'artist'].map(skill => (
          <Button
            key={skill}
            variant={filter === skill ? 'primary' : 'outline'}
            onClick={() => setFilter(skill)}
            size="sm"
          >
            Need {skill}
          </Button>
        ))}
      </div>

      {/* Team Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}

      {/* Create Team CTA */}
      <div className="text-center py-8 border-t">
        <h3 className="text-lg font-semibold mb-2">Can't find the right team?</h3>
        <p className="text-gray-600 mb-4">Start your own and recruit members!</p>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create New Team
        </Button>
      </div>
    </div>
  )
}
```

## 7. API Routes Implementation

### 7.1 Progress Tracking API
```typescript
// app/api/progress/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('learning_progress')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Calculate statistics
  const stats = {
    totalCompleted: data.filter(p => p.completed).length,
    totalTimeSpent: data.reduce((acc, p) => acc + (p.time_spent_seconds || 0), 0),
    currentStreak: calculateStreak(data),
    moduleProgress: calculateModuleProgress(data)
  }

  return NextResponse.json({ progress: data, stats })
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { contentId, contentType, moduleId, weekNumber, timeSpent } = body

  const { data, error } = await supabase
    .from('learning_progress')
    .upsert({
      user_id: user.id,
      content_id: contentId,
      content_type: contentType,
      module_name: moduleId,
      week_number: weekNumber,
      completed: true,
      completed_at: new Date().toISOString(),
      time_spent_seconds: timeSpent
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Trigger n8n webhook for analytics
  if (process.env.N8N_WEBHOOK_URL) {
    fetch(`${process.env.N8N_WEBHOOK_URL}/progress-completed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, contentId, moduleId })
    })
  }

  return NextResponse.json({ success: true, data })
}

function calculateStreak(progress: any[]): number {
  // Implementation for streak calculation
  return 0
}

function calculateModuleProgress(progress: any[]): Record<string, number> {
  // Implementation for module progress calculation
  return {}
}
```

### 7.2 Team Management API
```typescript
// app/api/teams/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { teamName, description, skillNeeds, maxMembers } = body

  // Create team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      team_name: teamName,
      team_slug: teamName.toLowerCase().replace(/\s+/g, '-'),
      description,
      skill_needs: skillNeeds,
      max_members: maxMembers || 5,
      created_by: user.id
    })
    .select()
    .single()

  if (teamError) {
    return NextResponse.json({ error: teamError.message }, { status: 500 })
  }

  // Add creator as team leader
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: 'leader',
      is_active: true
    })

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  // Trigger Discord channel creation via n8n
  if (process.env.N8N_WEBHOOK_URL) {
    const response = await fetch(`${process.env.N8N_WEBHOOK_URL}/create-team-channel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: team.id,
        teamName: team.team_name,
        creatorDiscordId: user.user_metadata?.discord_id
      })
    })

    const { channelId } = await response.json()
    
    // Update team with Discord channel ID
    await supabase
      .from('teams')
      .update({ discord_channel_id: channelId })
      .eq('id', team.id)
  }

  return NextResponse.json({ success: true, team })
}
```

## 8. n8n Automation Workflows

### 8.1 Content Health Check Workflow
```json
{
  "name": "Content Health Check",
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{ "field": "weeks", "weekInterval": 1 }]
        }
      }
    },
    {
      "name": "Get Content Items",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "getAll",
        "table": "content_items",
        "filters": {
          "is_active": { "value": true }
        }
      }
    },
    {
      "name": "Check YouTube Videos",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "GET",
        "url": "https://www.googleapis.com/youtube/v3/videos",
        "qs": {
          "id": "={{$node['Get Content Items'].json['youtube_id']}}",
          "key": "={{$env.YOUTUBE_API_KEY}}",
          "part": "status"
        }
      }
    },
    {
      "name": "Update Health Status",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "update",
        "table": "content_health_logs",
        "updateKey": "content_id"
      }
    },
    {
      "name": "Send Alert if Broken",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "url": "{{$env.DISCORD_WEBHOOK_URL}}",
        "method": "POST",
        "body": {
          "content": "⚠️ Content Health Alert: Video unavailable"
        }
      }
    }
  ]
}
```

### 8.2 Discord Bot Workflow
```json
{
  "name": "Discord Team Bot",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "create-team-channel",
        "method": "POST"
      }
    },
    {
      "name": "Create Discord Channel",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://discord.com/api/v10/guilds/{{GUILD_ID}}/channels",
        "headers": {
          "Authorization": "Bot {{$env.DISCORD_BOT_TOKEN}}"
        },
        "body": {
          "name": "team-{{$json['teamName']}}",
          "type": 0,
          "parent_id": "{{TEAM_CATEGORY_ID}}",
          "permission_overwrites": []
        }
      }
    },
    {
      "name": "Send Welcome Message",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://discord.com/api/v10/channels/{{$json['id']}}/messages",
        "body": {
          "content": "🎉 Welcome to your team channel!"
        }
      }
    }
  ]
}
```

## 9. State Management with Zustand

### 9.1 Auth Store
```typescript
// store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: any | null
  setUser: (user: User | null) => void
  setProfile: (profile: any) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      logout: () => set({ user: null, profile: null })
    }),
    {
      name: 'auth-storage'
    }
  )
)
```

### 9.2 Progress Store
```typescript
// store/progressStore.ts
import { create } from 'zustand'

interface ProgressState {
  completedVideos: Set<string>
  currentModule: string | null
  currentWeek: number
  totalTimeSpent: number
  updateProgress: (videoId: string, completed: boolean) => void
  setCurrentModule: (module: string) => void
  incrementTime: (seconds: number) => void
}

export const useProgressStore = create<ProgressState>((set) => ({
  completedVideos: new Set(),
  currentModule: null,
  currentWeek: 1,
  totalTimeSpent: 0,
  
  updateProgress: (videoId, completed) => 
    set((state) => {
      const videos = new Set(state.completedVideos)
      if (completed) {
        videos.add(videoId)
      } else {
        videos.delete(videoId)
      }
      return { completedVideos: videos }
    }),
    
  setCurrentModule: (module) => set({ currentModule: module }),
  
  incrementTime: (seconds) => 
    set((state) => ({ totalTimeSpent: state.totalTimeSpent + seconds }))
}))
```

## 10. Authentication Flow

### 10.1 Auth Provider Component
```typescript
// components/auth/AuthProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { User } from '@supabase/supabase-js'

const AuthContext = createContext<{
  user: User | null
  loading: boolean
}>({
  user: null,
  loading: true
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const { user, setUser, setProfile } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (data) {
      setProfile(data)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

### 10.2 Discord OAuth Setup
```typescript
// app/(auth)/login/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Discord } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()

  const handleDiscordLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        scopes: 'identify email guilds'
      }
    })

    if (error) {
      console.error('Error logging in:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8">Welcome to Blox Buddy</h1>
        
        <Button
          onClick={handleDiscordLogin}
          className="w-full flex items-center justify-center gap-3"
        >
          <Discord className="w-5 h-5" />
          Continue with Discord
        </Button>
        
        <p className="text-sm text-gray-500 text-center mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
```

## 11. Deployment Configuration

### 11.1 Vercel Deployment
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_key",
    "NEXT_PUBLIC_DISCORD_CLIENT_ID": "@discord_client_id",
    "NEXT_PUBLIC_YOUTUBE_API_KEY": "@youtube_api_key",
    "N8N_WEBHOOK_URL": "@n8n_webhook_url"
  }
}
```

### 11.2 GitHub Actions CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test
        
      - name: Build project
        run: npm run build
        
      - name: Deploy to Vercel
        uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 12. Testing Strategy

### 12.1 Component Testing
```typescript
// __tests__/components/VideoPlayer.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VideoPlayer } from '@/components/learning/VideoPlayer'
import { createClient } from '@/lib/supabase/client'

jest.mock('@/lib/supabase/client')

describe('VideoPlayer', () => {
  it('renders video player with correct video ID', () => {
    render(
      <VideoPlayer 
        videoId="test123" 
        moduleId="basics" 
        weekNumber={1} 
      />
    )
    
    expect(screen.getByTestId('youtube-player')).toBeInTheDocument()
  })

  it('marks video as complete on button click', async () => {
    const mockSupabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user123' } } }) },
      from: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockResolvedValue({ data: {}, error: null })
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    
    render(
      <VideoPlayer 
        videoId="test123" 
        moduleId="basics" 
        weekNumber={1} 
      />
    )
    
    const completeButton = screen.getByText('Mark Complete')
    fireEvent.click(completeButton)
    
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('learning_progress')
    })
  })
})
```

## 13. Claude Code Development Prompts

### 13.1 Initial Setup Prompts
```markdown
1. "Create the initial Next.js 14 project structure for Blox Buddy with TypeScript, Tailwind CSS, and Supabase integration"

2. "Set up the Supabase database schema with all tables, RLS policies, and triggers from the technical document"

3. "Create the authentication flow with Discord OAuth and user profile management"

4. "Build the video player component with YouTube integration and progress tracking"

5. "Implement the team formation system with skill matching and Discord channel creation"
```

### 13.2 Feature Development Prompts
```markdown
1. "Create a responsive curriculum navigation component that shows module progress"

2. "Build the team dashboard with member management and project tracking"

3. "Implement the progress tracking API routes with statistics calculation"

4. "Create the n8n webhook endpoints for Discord bot integration"

5. "Build the project showcase gallery with voting and featured projects"
```

### 13.3 Testing & Optimization Prompts
```markdown
1. "Write comprehensive tests for the authentication flow and protected routes"

2. "Optimize the learning progress queries with proper indexing and caching"

3. "Add error boundaries and loading states to all async components"

4. "Implement proper SEO meta tags and Open Graph data for the landing page"

5. "Create a performance monitoring dashboard using Vercel Analytics"
```

## 14. Development Timeline

### Week 1: Foundation
- Day 1-2: Project setup, Supabase schema, authentication
- Day 3-4: Core components (VideoPlayer, ProgressTracker)
- Day 5-6: Learning module pages and navigation
- Day 7: Testing and bug fixes

### Week 2: Features & Polish
- Day 8-9: Team formation system and Discord integration
- Day 10: n8n automations setup
- Day 11: Project showcase and community features
- Day 12: Mobile optimization and responsive design
- Day 13: Final testing and deployment preparation
- Day 14: Launch!

## 15. Security Considerations

### 15.1 Environment Variables
```bash
# .env.local (never commit this file)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key  # Server-side only
DISCORD_CLIENT_SECRET=your-discord-secret   # Server-side only
N8N_WEBHOOK_SECRET=your-webhook-secret      # Verify webhook authenticity
```

### 15.2 API Security
```typescript
// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check auth for protected routes
  if (request.nextUrl.pathname.startsWith('/learn') ||
      request.nextUrl.pathname.startsWith('/teams') ||
      request.nextUrl.pathname.startsWith('/profile')) {
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/learn/:path*', '/teams/:path*', '/profile/:path*']
}
```

## 16. Monitoring & Analytics

### 16.1 Error Tracking
```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs'

export function initSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    debug: process.env.NODE_ENV === 'development',
  })
}

export function captureError(error: Error, context?: any) {
  Sentry.captureException(error, {
    extra: context
  })
}
```

### 16.2 Analytics Events
```typescript
// lib/analytics/mixpanel.ts
import mixpanel from 'mixpanel-browser'

export function initAnalytics() {
  if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
    mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN)
  }
}

export function trackEvent(event: string, properties?: any) {
  if (typeof window !== 'undefined' && mixpanel) {
    mixpanel.track(event, properties)
  }
}

export function identifyUser(userId: string, traits?: any) {
  if (typeof window !== 'undefined' && mixpanel) {
    mixpanel.identify(userId)
    if (traits) {
      mixpanel.people.set(traits)
    }
  }
}
```

## 17. Code Buddy Integration Points

### 17.1 Shared Database Tables
```sql
-- Tables accessible by both Blox Buddy and Code Buddy
-- users, learning_progress, projects, teams, team_members

-- Code Buddy specific extension
CREATE TABLE code_buddy_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  blox_buddy_progress JSONB, -- Imported progress data
  ai_interactions INT DEFAULT 0,
  code_snippets_generated INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 17.2 Migration Path
```typescript
// lib/migration/codeBuddyMigration.ts
export async function checkCodeBuddyEligibility(userId: string) {
  const supabase = createClient()
  
  // Check completion of key modules
  const { data: progress } = await supabase
    .from('learning_progress')
    .select('module_name, completed')
    .eq('user_id', userId)
    .eq('completed', true)
  
  const completedModules = new Set(progress?.map(p => p.module_name) || [])
  const requiredModules = ['basics', 'scripting-intro', 'first-project']
  
  const eligible = requiredModules.every(mod => completedModules.has(mod))
  
  if (eligible) {
    // Update user eligibility
    await supabase
      .from('users')
      .update({ code_buddy_eligible: true })
      .eq('id', userId)
  }
  
  return eligible
}
```

---

## Conclusion

This technical implementation document provides a complete blueprint for building Blox Buddy as a solo developer using Claude Code. The architecture is designed for rapid development while maintaining scalability and preparing for seamless integration with Code Buddy.

### Key Success Factors:
1. **Simplicity First**: Use Supabase BaaS to avoid backend complexity
2. **Component Reusability**: Build modular components for efficiency
3. **Automation Early**: Set up n8n workflows from the start
4. **Test Critical Paths**: Focus testing on auth and progress tracking
5. **Progressive Enhancement**: Launch MVP, then iterate

### Next Steps:
1. Run the setup script to initialize the project
2. Configure Supabase with the provided schema
3. Use Claude Code to generate components systematically
4. Set up n8n workflows for automation
5. Deploy to Vercel and launch!

Remember: As a solo developer, focus on shipping the MVP first, then iterate based on user feedback. The architecture supports gradual enhancement without major refactoring.