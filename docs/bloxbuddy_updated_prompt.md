# **BLOX BUDDY - COMPLETE MASTER SETUP PROMPT**
*Production-Ready Next.js 14 Application for Roblox Learning Platform*

## **🎯 PROJECT OVERVIEW**

BLOX BUDDY is a comprehensive Roblox learning platform featuring:
- **Web2 → Web3 onboarding** with Solana integration
- **Video-based learning** with structured curriculum
- **AI assistance** for premium users
- **Discord integration** for community
- **Mind mapping notes** with canvas workspace
- **Token economy** with BLOX rewards

---

## **📦 COMPLETE TECH STACK & DEPENDENCIES**

```json
{
  "name": "blox-buddy",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    // Core Framework
    "next": "14.2.x",
    "react": "^18",
    "react-dom": "^18",
    
    // Authentication & User Management
    "@clerk/nextjs": "^5.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/auth-helpers-nextjs": "^0.10.x",
    
    // Web3 & Blockchain
    "@solana/wallet-adapter-base": "^0.9.x",
    "@solana/wallet-adapter-react": "^0.15.x",
    "@solana/wallet-adapter-react-ui": "^0.9.x",
    "@solana/wallet-adapter-wallets": "^0.19.x",
    "@solana/web3.js": "^1.91.x",
    
    // State Management
    "zustand": "^4.5.x",
    
    // UI & Styling
    "tailwindcss": "^3.4.x",
    "framer-motion": "^11.x",
    "lucide-react": "^0.400.x",
    "@radix-ui/react-accordion": "^1.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-dropdown-menu": "^2.x",
    "@radix-ui/react-progress": "^1.x",
    "@radix-ui/react-tabs": "^1.x",
    "@radix-ui/react-tooltip": "^1.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    
    // Payments
    "@stripe/stripe-js": "^4.x",
    "stripe": "^16.x",
    
    // Video & Media
    "react-youtube": "^10.x",
    
    // Mind Mapping / Canvas
    "@tldraw/tldraw": "^2.x",
    "konva": "^9.x",
    "react-konva": "^18.x",
    "react-flow-renderer": "^10.x",
    
    // File handling
    "react-dropzone": "^14.x",
    "file-saver": "^2.x",
    "html-to-image": "^1.x",
    
    // Discord
    "discord.js": "^14.x",
    
    // Utilities
    "axios": "^1.7.x",
    "date-fns": "^3.x",
    "react-hot-toast": "^2.x",
    "react-intersection-observer": "^9.x"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/fabric": "^5",
    "typescript": "^5",
    "eslint": "^8",
    "eslint-config-next": "14.2.x",
    "prettier": "^3.x",
    "prettier-plugin-tailwindcss": "^0.6.x"
  }
}
```

---

## **🗂️ COMPLETE FILE STRUCTURE**

```
blox-buddy/
├── .env.local                    # Environment variables
├── .env.example                  # Template for env vars
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── README.md
│
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── avatars/
│   │   └── thumbnails/
│   └── fonts/
│
├── src/
│   ├── app/                     # Next.js 14 App Router
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Landing page
│   │   ├── globals.css          # Global styles
│   │   ├── providers.tsx        # All providers wrapper
│   │   │
│   │   ├── (auth)/              # Auth group route
│   │   │   ├── sign-in/
│   │   │   │   └── page.tsx
│   │   │   ├── sign-up/
│   │   │   │   └── page.tsx
│   │   │   └── onboarding/
│   │   │       └── page.tsx     # Web2 → Web3 onboarding flow
│   │   │
│   │   ├── (marketing)/         # Public pages group
│   │   │   ├── layout.tsx
│   │   │   ├── about/
│   │   │   ├── pricing/
│   │   │   └── features/
│   │   │
│   │   └── (app)/               # Protected app group
│   │       ├── layout.tsx       # App layout with sidebar
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── learning/
│   │       │   ├── page.tsx     # Learning hub overview
│   │       │   └── [moduleId]/
│   │       │       └── [weekId]/
│   │       │           └── [dayId]/
│   │       │               └── page.tsx
│   │       ├── notes/           # Mind mapping workspace
│   │       │   ├── page.tsx     # All mind maps gallery
│   │       │   └── [mapId]/
│   │       │       └── page.tsx # Individual mind map editor
│   │       ├── discord/
│   │       │   └── page.tsx     # Discord integration
│   │       ├── profile/
│   │       │   └── page.tsx
│   │       ├── wallet/
│   │       │   └── page.tsx     # Solana wallet & BLOX tokens
│   │       ├── ai-assistant/
│   │       │   └── page.tsx     # Premium AI feature
│   │       └── settings/
│   │           └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── accordion.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── SidebarNav.tsx
│   │   │   │   ├── SidebarResizer.tsx
│   │   │   │   └── LearningPathTree.tsx
│   │   │   ├── Header/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── UserMenu.tsx
│   │   │   │   └── NotificationBell.tsx
│   │   │   └── Footer/
│   │   │       └── Footer.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StatsBar.tsx
│   │   │   ├── ContinueLearning.tsx
│   │   │   ├── NextGoal.tsx
│   │   │   ├── LearningPathOverview.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   └── QuickActions.tsx
│   │   │
│   │   ├── learning/
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── VideoComments.tsx
│   │   │   ├── ProgressTracker.tsx
│   │   │   ├── WeekOverview.tsx
│   │   │   └── DayCard.tsx
│   │   │
│   │   ├── mindmap/
│   │   │   ├── MindMapCanvas.tsx      # Main canvas component
│   │   │   ├── MindMapToolbar.tsx     # Tools for shapes, arrows, etc
│   │   │   ├── MindMapNode.tsx        # Individual node component
│   │   │   ├── MindMapSidebar.tsx     # Asset library/screenshots
│   │   │   ├── ImageUploader.tsx      # Handle image drops/paste
│   │   │   └── MindMapExport.tsx      # Export functionality
│   │   │
│   │   ├── discord/
│   │   │   ├── DiscordEmbed.tsx       # Embedded Discord widget
│   │   │   └── DiscordConnect.tsx     # OAuth connection
│   │   │
│   │   ├── wallet/
│   │   │   ├── WalletConnect.tsx
│   │   │   ├── BloxBalance.tsx
│   │   │   ├── TransactionHistory.tsx
│   │   │   └── EarnBlox.tsx
│   │   │
│   │   ├── ai/
│   │   │   ├── AIChatWidget.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   └── UpgradePrompt.tsx
│   │   │
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── Toast.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Supabase client setup
│   │   │   ├── auth.ts          # Auth helpers
│   │   │   └── database.types.ts # Generated types
│   │   │
│   │   ├── solana/
│   │   │   ├── wallet.ts        # Wallet configuration
│   │   │   ├── tokens.ts        # BLOX token functions
│   │   │   └── transactions.ts  # Transaction helpers
│   │   │
│   │   ├── discord/
│   │   │   └── client.ts        # Discord API setup
│   │   │
│   │   ├── storage/
│   │   │   ├── imageUpload.ts   # Handle image uploads to Supabase
│   │   │   └── mindMapStorage.ts # Save/load mind maps
│   │   │
│   │   ├── stripe/
│   │   │   ├── client.ts
│   │   │   └── checkout.ts
│   │   │
│   │   ├── api/
│   │   │   ├── youtube.ts       # YouTube API helpers
│   │   │   └── n8n.ts          # n8n workflow integration
│   │   │
│   │   └── utils/
│   │       ├── cn.ts            # Classname utility
│   │       ├── constants.ts     # App constants
│   │       └── helpers.ts       # General helpers
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWallet.ts
│   │   ├── useProgress.ts
│   │   ├── useBloxBalance.ts
│   │   ├── useWindowResize.ts
│   │   ├── useLocalStorage.ts
│   │   └── useMindMap.ts       # Mind map specific hooks
│   │
│   ├── store/
│   │   ├── authStore.ts         # Zustand store for auth
│   │   ├── learningStore.ts     # Learning progress state
│   │   ├── walletStore.ts       # Wallet & BLOX state
│   │   ├── uiStore.ts          # UI state (sidebar, modals)
│   │   └── mindMapStore.ts     # Mind map state
│   │
│   ├── types/
│   │   ├── index.ts             # Shared types
│   │   ├── learning.ts          # Learning module types
│   │   ├── wallet.ts            # Web3 types
│   │   ├── database.ts         # Database schema types
│   │   └── mindmap.ts          # Mind map types
│   │
│   ├── data/
│   │   └── curriculum.json      # Learning path structure
│   │
│   └── styles/
│       └── animations.ts        # Framer motion variants
│
├── supabase/
│   ├── migrations/              # Database migrations
│   │   ├── 001_users.sql
│   │   ├── 002_learning_progress.sql
│   │   └── 003_mind_maps.sql
│   ├── functions/              # Edge functions
│   └── seed.sql               # Seed data
│
└── scripts/
    ├── setup-db.js            # Database setup script
    └── generate-types.js      # Type generation script
```

---

## **🎨 BRAND COLORS & STYLING**

**Updated Tailwind Configuration:**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'blox': {
          teal: {
            light: '#4AC4E8',
            DEFAULT: '#36B0D9',
            dark: '#2A8CB0'
          },
          'black-blue': '#001C38',
          'very-dark-blue': '#001D39',
          'second-dark-blue': '#002246',
          white: '#FFFFFF',
          'off-white': '#DDDDDD',
          'light-blue-gray': '#9AB6E0',
          'medium-blue-gray': '#596D8C',
          success: {
            light: '#34D399',
            DEFAULT: '#10B981',
            dark: '#059669'
          },
          glass: {
            teal: 'rgba(54, 176, 217, 0.1)',
            light: 'rgba(54, 176, 217, 0.05)',
            border: 'rgba(54, 176, 217, 0.2)'
          }
        }
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #1782AC 0%, #053A56 100%)',
        'teal-gradient': 'linear-gradient(135deg, #36B0D9 0%, #1782AC 100%)',
        'dark-gradient': 'linear-gradient(135deg, #001D39 0%, #002246 100%)'
      }
    }
  },
  plugins: [],
}

export default config
```

---

## **🔧 ENVIRONMENT VARIABLES**

**Create `.env.local`:**

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=BLOX BUDDY

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=mindmap-assets

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Discord Integration
NEXT_PUBLIC_DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
NEXT_PUBLIC_DISCORD_SERVER_ID=
NEXT_PUBLIC_DISCORD_INVITE_LINK=
DISCORD_BOT_TOKEN=

# Stripe Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Solana Blockchain
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=

# External APIs
YOUTUBE_API_KEY=
N8N_WEBHOOK_URL=
```

---

## **⚙️ CONFIGURATION FILES**

**next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['i.ytimg.com', 'img.clerk.com', 'cdn.discordapp.com'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## **🗄️ DATABASE SCHEMA**

**supabase/migrations/003_mind_maps.sql:**
```sql
-- Mind Maps table
CREATE TABLE mind_maps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  canvas_data JSONB NOT NULL, -- Stores the entire canvas state
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_public BOOLEAN DEFAULT false,
  module_id TEXT, -- Link to learning module if applicable
  week_id TEXT,   -- Link to specific week
  day_id TEXT     -- Link to specific day
);

-- Mind Map Assets table (for uploaded images)
CREATE TABLE mind_map_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mind_map_id UUID REFERENCES mind_maps(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  asset_type VARCHAR(50), -- 'image', 'screenshot', etc.
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_mind_maps_user_id ON mind_maps(user_id);
CREATE INDEX idx_mind_map_assets_map_id ON mind_map_assets(mind_map_id);

-- RLS Policies
ALTER TABLE mind_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_map_assets ENABLE ROW LEVEL SECURITY;

-- Users can only see their own mind maps
CREATE POLICY "Users can view own mind maps" ON mind_maps
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own mind maps" ON mind_maps
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own mind maps" ON mind_maps
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own mind maps" ON mind_maps
  FOR DELETE USING (auth.uid()::text = user_id);
```

---

## **📚 LEARNING PATH STRUCTURE**

**src/data/curriculum.json:**
```json
{
  "modules": [
    {
      "id": "module-1",
      "title": "Modern Foundations & 3D Introduction",
      "description": "Master Roblox Studio 2024, Blender 4.1+, and AI tools for 3D creation",
      "totalHours": 50,
      "totalXP": 750,
      "weeks": [
        {
          "id": "week-1",
          "title": "Roblox Studio 2024 Basics",
          "description": "Navigate the new Creator Hub and master the modern Studio interface",
          "days": [
            {
              "id": "day-1",
              "title": "New Creator Hub & Studio Interface Part 1",
              "videos": [
                {
                  "id": "video-1-1-1",
                  "title": "Introduction to Creator Hub",
                  "youtubeId": "xxxxx",
                  "duration": "25:00",
                  "xpReward": 50
                }
              ],
              "practiceTask": "Navigate and customize your workspace",
              "estimatedTime": "2.5h"
            },
            {
              "id": "day-2",
              "title": "New Creator Hub & Studio Interface Part 2",
              "videos": [],
              "practiceTask": "Deep dive into Creator Hub features",
              "estimatedTime": "2.5h"
            },
            {
              "id": "day-3",
              "title": "Building Fundamentals",
              "videos": [],
              "practiceTask": "Create your first structure",
              "estimatedTime": "2.5h"
            },
            {
              "id": "day-4",
              "title": "Materials and Textures",
              "videos": [],
              "practiceTask": "Apply and customize materials",
              "estimatedTime": "2.5h"
            },
            {
              "id": "day-5",
              "title": "Week 1 Project",
              "videos": [],
              "practiceTask": "Complete week 1 project",
              "estimatedTime": "3h"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## **🚀 SETUP COMMANDS**

Run these commands in order:

```bash
# 1. Create Next.js project
npx create-next-app@latest blox-buddy --typescript --tailwind --app
cd blox-buddy

# 2. Install ALL dependencies (one command)
npm install @clerk/nextjs @supabase/supabase-js @supabase/auth-helpers-nextjs @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/web3.js zustand framer-motion lucide-react @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-progress @radix-ui/react-tabs @radix-ui/react-tooltip class-variance-authority clsx tailwind-merge @stripe/stripe-js stripe react-youtube axios date-fns react-hot-toast react-intersection-observer @tldraw/tldraw konva react-konva react-flow-renderer react-dropzone file-saver html-to-image discord.js

# 3. Create the complete directory structure
mkdir -p src/{app/{auth,marketing,app},components/{ui,layout,dashboard,learning,wallet,ai,shared,mindmap,discord},lib/{supabase,solana,stripe,api,utils,discord,storage},hooks,store,types,data,styles} public/{images/{avatars,thumbnails},fonts} supabase/{migrations,functions} scripts

# 4. Create subdirectories for app routes
mkdir -p src/app/auth/{sign-in,sign-up,onboarding}
mkdir -p src/app/app/{dashboard,learning,notes,discord,profile,wallet,ai-assistant,settings}
mkdir -p src/app/marketing/{about,pricing,features}

# 5. Initialize Git
git init
git add .
git commit -m "Initial project structure with complete tech stack"
```

---

## **📋 SIDEBAR NAVIGATION**

The sidebar navigation items should include:
- **Dashboard** - Main overview and stats
- **Learning Path** - Expandable with module/week/day tree
- **Notes** - Mind mapping workspace
- **Progress** - Detailed breakdown and tracker with graphs
- **Discord** - Discord integration/embed
- **Settings** - User preferences
- **Help** - Support and documentation

---

## **🎯 CRITICAL PRINCIPLES**

1. **NEVER nest package.json files** - Only one at root
2. **All imports use @/ alias** - Configured in tsconfig.json
3. **Components are modular** - Each component in its own file
4. **State is centralized** - Use Zustand stores, not prop drilling
5. **Database types are generated** - Don't manually create Supabase types
6. **Environment variables are typed** - Create env.d.ts
7. **Use route groups** - (auth), (app), (marketing) for organization
8. **Server/Client components are explicit** - Use 'use client' directive
9. **Error boundaries everywhere** - Wrap major sections
10. **Loading states are required** - Every async operation needs loading UI

---

**This complete setup creates a bulletproof foundation that handles Discord integration and mind mapping features from the start, preventing any file structure issues as the project scales.**