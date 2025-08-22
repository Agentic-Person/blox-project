# BLOX BUDDY - Stage 1 Enhanced (Complete File Structure)
*Foundation with Future-Proof Architecture*

## 🎯 CRITICAL: COMPLETE FILE STRUCTURE FROM DAY 1

This Stage 1 creates EVERY folder and file you'll ever need, preventing any future refactoring.

---

## STAGE 1: COMPLETE FOUNDATION (ENHANCED)
**Goal**: Create the entire file structure with placeholder files where needed

### Complete Prompt for Claude Code:

```
Create a Next.js 14 TypeScript application called "blox-buddy" with this COMPLETE file structure. Create ALL directories and placeholder files even if not immediately used.

## 1. COMPLETE DEPENDENCIES

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
    "next": "14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwindcss": "^3.4.7",
    "framer-motion": "^11.3.19",
    "lucide-react": "^0.408.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.4.0",
    "zustand": "^4.5.4",
    "react-youtube": "^10.1.0",
    "date-fns": "^3.6.0",
    "react-hot-toast": "^2.4.1",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-tooltip": "^1.1.2",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.14",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.4",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.5"
  }
}
```

## 2. COMPLETE FILE STRUCTURE - CREATE ALL OF THESE

```
blox-buddy/
├── .env.local
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── README.md
│
├── public/
│   ├── favicon.ico
│   ├── images/
│   │   ├── logo.svg
│   │   ├── avatar-placeholder.png
│   │   ├── landing/              # Reserved for landing page assets
│   │   │   └── .gitkeep
│   │   ├── avatars/
│   │   │   └── .gitkeep
│   │   ├── thumbnails/
│   │   │   └── .gitkeep
│   │   ├── badges/
│   │   │   └── .gitkeep
│   │   └── team-logos/
│   │       └── .gitkeep
│   └── fonts/
│       └── .gitkeep
│
├── src/
│   ├── app/
│   │   ├── (marketing)/          # Public/marketing pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx          # Placeholder landing (will be replaced)
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx
│   │   │   └── features/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (auth)/               # Authentication pages
│   │   │   ├── layout.tsx
│   │   │   ├── sign-in/
│   │   │   │   └── page.tsx
│   │   │   ├── sign-up/
│   │   │   │   └── page.tsx
│   │   │   └── onboarding/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (app)/                # Protected app pages
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── learning/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [moduleId]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [weekId]/
│   │   │   │           ├── page.tsx
│   │   │   │           └── [dayId]/
│   │   │   │               └── page.tsx
│   │   │   ├── teams/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [teamId]/
│   │   │   │       └── page.tsx
│   │   │   ├── progress/
│   │   │   │   └── page.tsx
│   │   │   ├── discord/
│   │   │   │   └── page.tsx
│   │   │   ├── notes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [noteId]/
│   │   │   │       └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── help/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                  # API routes (create folders only)
│   │   │   ├── auth/
│   │   │   │   └── .gitkeep
│   │   │   ├── progress/
│   │   │   │   └── .gitkeep
│   │   │   ├── teams/
│   │   │   │   └── .gitkeep
│   │   │   └── webhooks/
│   │   │       └── .gitkeep
│   │   │
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css
│   │   ├── providers.tsx
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── accordion.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── select.tsx
│   │   │   └── skeleton.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── SidebarNav.tsx
│   │   │   │   └── SidebarMobile.tsx
│   │   │   ├── Header/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── UserMenu.tsx
│   │   │   │   └── NotificationBell.tsx
│   │   │   └── Footer/
│   │   │       └── Footer.tsx
│   │   │
│   │   ├── landing/              # Reserved for your landing page
│   │   │   └── .gitkeep
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx
│   │   │   ├── ContinueLearning.tsx
│   │   │   ├── WeeklyProgress.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   └── StreakCounter.tsx
│   │   │
│   │   ├── learning/
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── VideoComments.tsx
│   │   │   ├── ProgressTracker.tsx
│   │   │   ├── WeekOverview.tsx
│   │   │   ├── DayCard.tsx
│   │   │   ├── ModuleCard.tsx
│   │   │   ├── LearningPathTree.tsx
│   │   │   ├── PracticeTask.tsx
│   │   │   └── VideoMetadata.tsx
│   │   │
│   │   ├── teams/
│   │   │   ├── TeamCard.tsx
│   │   │   ├── TeamFinder.tsx
│   │   │   ├── TeamDashboard.tsx
│   │   │   ├── SkillBadge.tsx
│   │   │   ├── TeamMembers.tsx
│   │   │   ├── JoinRequest.tsx
│   │   │   └── CreateTeamForm.tsx
│   │   │
│   │   ├── progress/
│   │   │   ├── ProgressChart.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   ├── ActivityHeatmap.tsx
│   │   │   ├── AchievementBadge.tsx
│   │   │   └── StatsOverview.tsx
│   │   │
│   │   ├── discord/
│   │   │   ├── DiscordEmbed.tsx
│   │   │   ├── DiscordConnect.tsx
│   │   │   └── ServerStatus.tsx
│   │   │
│   │   ├── notes/
│   │   │   ├── NoteCard.tsx
│   │   │   ├── NoteEditor.tsx
│   │   │   └── NotesList.tsx
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfileHeader.tsx
│   │   │   ├── SkillsSection.tsx
│   │   │   └── EditProfile.tsx
│   │   │
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── Toast.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── DevControls.tsx
│   │
│   ├── lib/
│   │   ├── config/
│   │   │   ├── features.ts       # Feature flags
│   │   │   ├── constants.ts      # App constants
│   │   │   └── navigation.ts     # Nav configuration
│   │   │
│   │   ├── mockData/
│   │   │   ├── user.ts
│   │   │   ├── progress.ts
│   │   │   ├── teams.ts
│   │   │   ├── curriculum.ts
│   │   │   ├── achievements.ts
│   │   │   └── discord.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── cn.ts             # Class name utility
│   │   │   ├── formatters.ts     # Date, number formatters
│   │   │   ├── validators.ts     # Form validators
│   │   │   └── helpers.ts        # General helpers
│   │   │
│   │   ├── api/                  # Future API integrations
│   │   │   ├── youtube.ts
│   │   │   ├── discord.ts
│   │   │   └── supabase.ts
│   │   │
│   │   └── storage/
│   │       ├── localStorage.ts
│   │       └── sessionStorage.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProgress.ts
│   │   ├── useTeams.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useDebounce.ts
│   │   └── useKeyboardShortcuts.ts
│   │
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── progressStore.ts
│   │   ├── teamStore.ts
│   │   ├── uiStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── learning.ts
│   │   ├── team.ts
│   │   ├── progress.ts
│   │   └── discord.ts
│   │
│   ├── data/
│   │   ├── curriculum.json       # Complete 6-month curriculum
│   │   ├── achievements.json     # Achievement definitions
│   │   └── skills.json          # Skill categories
│   │
│   └── styles/
│       ├── animations.ts         # Framer Motion variants
│       ├── landing/             # Reserved for landing styles
│       │   └── .gitkeep
│       └── themes.ts            # Theme configurations
│
├── supabase/                    # Future Supabase integration
│   ├── migrations/
│   │   └── .gitkeep
│   ├── functions/
│   │   └── .gitkeep
│   └── seed.sql
│
└── scripts/                     # Utility scripts
    ├── setup.js
    └── generate-types.js
```

## 3. KEY CONFIGURATION FILES

### tailwind.config.ts
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
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  },
  plugins: [],
}

export default config
```

### src/lib/config/features.ts
```typescript
// Feature flags for progressive enhancement
export const FEATURES = {
  // Core Features (Always On in Dev)
  USE_MOCK_AUTH: true,
  USE_MOCK_DATA: true,
  SHOW_DEV_CONTROLS: true,
  
  // Features to Enable Progressively
  USE_REAL_AUTH: false,
  USE_REAL_DB: false,
  USE_DISCORD_INTEGRATION: false,
  USE_TEAM_FEATURES: true,
  USE_NOTES_FEATURE: true,
  USE_AI_ASSISTANT: false,
  USE_STRIPE_PAYMENTS: false,
  USE_SOLANA_WALLET: false,
  
  // UI Features
  ENABLE_ANIMATIONS: true,
  ENABLE_KEYBOARD_SHORTCUTS: true,
  ENABLE_MOBILE_GESTURES: false,
  
  // Content Features
  ENABLE_VIDEO_COMMENTS: false,
  ENABLE_ACHIEVEMENTS: true,
  ENABLE_LEADERBOARD: false,
}
```

### .env.local
```env
# Development Mode
NEXT_PUBLIC_DEV_MODE=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="BLOX BUDDY"

# Feature Flags (backup for runtime changes)
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_SHOW_DEV_CONTROLS=true

# Placeholder for future services
NEXT_PUBLIC_YOUTUBE_API_KEY=
NEXT_PUBLIC_DISCORD_SERVER_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 4. CRITICAL FILES TO CREATE

### src/app/(marketing)/page.tsx - Placeholder Landing
```typescript
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blox-black-blue to-blox-very-dark-blue">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-6xl font-bold text-blox-white text-center mb-6">
          BLOX BUDDY
        </h1>
        <p className="text-xl text-blox-off-white text-center mb-12">
          Placeholder - Your landing page will go here
        </p>
        <div className="text-center">
          <a href="/dashboard" className="inline-block px-8 py-4 bg-gradient-to-r from-blox-teal to-blox-teal-dark text-white rounded-lg font-semibold">
            Launch App →
          </a>
        </div>
      </div>
    </div>
  )
}
```

### src/app/(app)/layout.tsx - App Layout
```typescript
import { Sidebar } from '@/components/layout/Sidebar/Sidebar'
import { Header } from '@/components/layout/Header/Header'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-blox-black-blue">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### src/lib/utils/cn.ts - Class utility
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## 5. IMPORTANT INSTRUCTIONS

1. Create EVERY folder and file listed, even if just placeholders
2. Use .gitkeep files to preserve empty directories
3. All TypeScript files should have basic type safety
4. Every page.tsx should return at least a basic component
5. Components should have proper exports
6. Mock data should be realistic and comprehensive

## 6. LANDING PAGE INTEGRATION PREP

The landing folder structure is specifically designed for your landing page:
- src/components/landing/ - Your landing components will go here
- src/styles/landing/ - Your landing styles will go here  
- public/images/landing/ - Your landing assets will go here

This structure is ready to receive your landing page files in Stage 1.5.

CRITICAL: Do not skip creating any folders. The complete structure prevents any future refactoring needs.
```

### 🔍 VERIFICATION AFTER STAGE 1

Run these checks:
```bash
# Check the app runs
npm run dev

# Verify all routes work
- http://localhost:3000 (landing placeholder)
- http://localhost:3000/dashboard
- http://localhost:3000/learning
- http://localhost:3000/teams
- http://localhost:3000/progress
- http://localhost:3000/discord
- http://localhost:3000/settings

# Check folder structure is complete
- All folders from the structure exist
- No "module not found" errors
- All imports use @/ alias
```

---

## STAGE 1.5: LANDING PAGE INTEGRATION
**Time**: 30-45 minutes
**When**: After Stage 1 is fully working

### Integration Steps:

```
1. Copy your landing page files:
   - landing/src/components/* → src/components/landing/
   - landing/src/styles/* → src/styles/landing/
   - landing/public/* → public/images/landing/

2. Update imports in landing components:
   - Change relative imports to use @/ alias
   - Update image paths to /images/landing/

3. Replace placeholder landing:
   - Move placeholder content to src/app/(marketing)/page.backup.tsx
   - Import your main landing component in src/app/(marketing)/page.tsx

4. Test thoroughly:
   - Game hero section works
   - All animations function
   - Navigation to /dashboard works
   - Responsive design intact

5. Commit: "Stage 1.5: Integrated custom landing page"
```

---

## WHY THIS STRUCTURE IS BULLETPROOF

1. **Every possible route is created** - No adding routes later
2. **All component folders exist** - No restructuring needed
3. **API routes scaffolded** - Ready for future endpoints
4. **Landing page has dedicated space** - Clean integration
5. **Feature flags control everything** - Easy feature toggling
6. **Mock data is centralized** - Easy to replace with real data
7. **Types are organized** - Scalable type system
8. **Styles are modular** - Landing styles don't conflict

---

## FINAL NOTES

This enhanced Stage 1 ensures:
- ✅ **Zero refactoring needed** - Complete structure from day 1
- ✅ **Landing page integration is seamless** - Dedicated folders ready
- ✅ **All future features have homes** - Every component has a place
- ✅ **No file conflicts** - Clear separation of concerns
- ✅ **Type safety throughout** - TypeScript properly configured

After this Stage 1, you'll never need to restructure. Everything else is just filling in the implementation!