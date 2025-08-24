# Teams Section Implementation Plan

## Overview
Transform the teams section from "Coming Soon" preview to fully functional collaboration platform while maintaining existing design language and component structure.

## Current State Analysis
### ✅ Already Implemented
- Teams listing page with filtering and search
- TeamCard component with compact/detailed views  
- Team detail page with tabs (Info, Chat, Whiteboard, Notes)
- TeamChat component with message system
- TeamInfo component showing members, projects, achievements
- Mock data structure in place
- Glass morphism styling and animations
- Beta badges and "Coming Soon" components

### 📁 Existing Files
- `/teams/page.tsx` - Main teams listing
- `/teams/[teamId]/page.tsx` - Team detail page
- `/teams/create/page.tsx` - Currently "Coming Soon"
- Components in `src/components/teams/`

---

## Phase 1: Core Team Functionality ✅ COMPLETED (2024-08-24)

### 1. Team State Management ✅
**File:** `src/store/teamStore.ts`
- [x] Create Zustand store for team state
- [x] Current user's teams array
- [x] Team invitations (received/sent) - ready for Phase 2
- [x] Team applications tracking
- [x] Team notifications queue
- [x] Active team selection
- [x] Mock data persistence in localStorage
- **Implementation Notes:**
  - Created comprehensive TypeScript interfaces for Team, TeamMember, TeamProject, TeamApplication, TeamNotification
  - Implemented all CRUD operations for teams
  - Added 3 mock teams with realistic data
  - Persistence using Zustand persist middleware with localStorage

### 2. Team Creation Workflow ✅
**File:** `src/app/(app)/teams/create/page.tsx`
- [x] Replace "Coming Soon" with functional form
- [x] Team name input with validation
- [x] Description textarea
- [x] Team type selector (casual/competitive/learning)
- [x] Skills requirement multi-select
- [x] Member capacity slider (2-10)
- [x] Recruitment settings (open/selective/closed)
- [x] Team avatar upload (base64 storage)
- [x] Create team button with store integration
- [x] Success redirect to team page
- **Implementation Notes:**
  - Full form validation with error messages
  - Skills list includes: Building, Scripting, UI/UX, Modeling, Animation, etc.
  - Avatar preview before upload
  - Maintains glass morphism design throughout

### 3. Team Join/Leave System ✅
**Components created:**
- [x] `TeamApplicationModal.tsx` - Apply to join form
  - Application message
  - Skill showcase
  - Submit to team store
- [x] `TeamApplicationsList.tsx` - For team leaders
  - List pending applications
  - Accept/reject buttons
  - Application details view
- [x] `LeaveTeamDialog.tsx` - Confirmation dialog
  - Warning message
  - Transfer leadership option
  - Confirm leave action

**Integration points:**
- [x] Add "Apply to Join" button to TeamCard
- [x] Add "Leave Team" to TeamInfo settings (via TeamManagement)
- [x] Update team member count on join/leave
- **Implementation Notes:**
  - TeamCard shows appropriate buttons based on membership status
  - Application modal validates required fields
  - Leave dialog warns about consequences

### 4. Enhanced Team Management ✅
**File:** `src/components/teams/TeamManagement.tsx`
- [x] Edit team profile form (leader only)
  - Update name/description
  - Change team type
  - Modify skills
  - Adjust capacity
- [x] Member management panel
  - [x] Promote to leader
  - [x] Demote from roles
  - [x] Kick member (with confirmation)
  - [x] View member contributions
- [x] Recruitment toggle switch
- [x] Team deletion (leader only)
- **Implementation Notes:**
  - Tab-based interface for Settings/Members/Applications/Danger Zone
  - Role-based permissions (leader vs member views)
  - Confirmation dialogs for destructive actions
  - Real-time updates to team store

---

## Phase 2: Collaboration Features

### 5. Real-time Team Chat Enhancement ⬜
**File:** `src/components/teams/TeamChat.tsx`
- [ ] Connect to mock WebSocket service
- [ ] Message persistence in localStorage
- [ ] Typing indicators
- [ ] Message reactions (emoji picker)
- [ ] @mentions with notification
- [ ] Message editing (own messages)
- [ ] Message deletion (own messages)
- [ ] Unread message counter
- [ ] Scroll to latest message

### 6. Team Projects Management ⬜
**New component:** `src/components/teams/TeamProjects.tsx`
- [ ] Create project card
  - Project name
  - Description
  - Deadline picker
  - Assigned members
- [ ] Project status workflow
  - Planning → In Progress → Testing → Completed
- [ ] Progress percentage slider
- [ ] Task checklist within projects
- [ ] Project activity timeline
- [ ] Archive completed projects

### 7. Team Resources Hub ⬜
**Enhance existing components:**
- [ ] TeamNotes.tsx improvements
  - Categories/folders
  - Search functionality
  - Version history
- [ ] TeamWhiteboard.tsx improvements
  - Save named boards
  - Board templates
  - Export options
- [ ] New: TeamFiles.tsx
  - File upload (base64)
  - File categories
  - Download links

---

## Phase 3: Gamification & Social

### 8. Team Achievements System ⬜
**New component:** `src/components/teams/TeamAchievements.tsx`
- [ ] Achievement categories
  - First Project
  - Team Player
  - Elite Team
  - Project Master
  - Community Leader
- [ ] Progress tracking
- [ ] Badge display grid
- [ ] Unlock notifications
- [ ] Team points calculation
- [ ] Leaderboard integration

### 9. Team Discovery Enhancement ⬜
**Update:** `src/app/(app)/teams/page.tsx`
- [ ] Recommended teams algorithm
  - Based on user skills
  - Based on interests
  - Based on experience level
- [ ] Team showcases section
- [ ] Featured teams carousel
- [ ] Success stories
- [ ] Team search improvements
  - Search by project type
  - Search by achievement
  - Search by member count

### 10. Notifications System ⬜
**New component:** `src/components/teams/TeamNotifications.tsx`
- [ ] Notification types
  - Team invites
  - Application updates
  - New messages
  - Project updates
  - Achievement unlocks
- [ ] Notification bell in header
- [ ] Notification dropdown
- [ ] Mark as read functionality
- [ ] Clear all button
- [ ] Settings for notification preferences

---

## Technical Implementation Details

### Data Models

```typescript
interface Team {
  id: string
  name: string
  description: string
  type: 'casual' | 'competitive' | 'learning'
  avatar?: string
  banner?: string
  leader: string
  members: TeamMember[]
  maxMembers: number
  skills: string[]
  projects: TeamProject[]
  achievements: Achievement[]
  points: number
  rank?: number
  recruitmentStatus: 'open' | 'selective' | 'closed'
  createdAt: Date
  settings: TeamSettings
}

interface TeamMember {
  userId: string
  role: 'leader' | 'moderator' | 'member'
  joinedAt: Date
  contributions: number
  permissions: string[]
}

interface TeamProject {
  id: string
  name: string
  description: string
  status: 'planning' | 'in-progress' | 'testing' | 'completed'
  progress: number
  deadline?: Date
  assignedMembers: string[]
  tasks: ProjectTask[]
  createdAt: Date
  completedAt?: Date
}

interface TeamApplication {
  id: string
  teamId: string
  userId: string
  message: string
  skills: string[]
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Date
  reviewedAt?: Date
  reviewedBy?: string
}
```

### Storage Strategy
- Use Zustand for state management
- Persist all data in localStorage
- Prepare interfaces for future Supabase integration
- Mock WebSocket connections for real-time features
- Use base64 for image storage temporarily

### Component Architecture
- Keep components modular and reusable
- Use existing UI components from `/components/ui/`
- Maintain consistent styling with glass morphism
- Follow existing animation patterns
- Keep "Beta" badges on new features

---

## Implementation Schedule

### Week 1: Foundation
1. **Day 1-2**: Team Store setup
2. **Day 3-4**: Create Team form
3. **Day 5-7**: Join/Leave functionality

### Week 2: Management & Collaboration
1. **Day 8-9**: Team Management panel
2. **Day 10-11**: Enhanced Chat features
3. **Day 12-14**: Project Management

### Week 3: Polish & Features
1. **Day 15-16**: Achievements system
2. **Day 17-18**: Discovery improvements
3. **Day 19-20**: Notifications
4. **Day 21**: Testing & bug fixes

---

## Success Metrics
- [ ] Users can create and customize teams
- [ ] Team members can collaborate via chat
- [ ] Projects can be tracked and managed
- [ ] Achievements provide engagement
- [ ] Discovery helps users find teams
- [ ] All features work with mock data
- [ ] UI remains consistent with design system
- [ ] Performance remains smooth
- [ ] Mobile responsive

---

## Future Considerations
- Discord integration webhooks
- Real-time collaboration with Supabase
- GitHub repository connections
- Video chat integration
- Team analytics dashboard
- Automated team matching
- Tournament system
- Team monetization features

---

## Notes
- Keep all functionality client-side for now
- Maintain "Coming Soon" badges for future features
- Focus on user experience over complex features
- Test thoroughly on mobile devices
- Document all mock data structures
- Prepare for easy Supabase migration

---

## Build Issues Resolved (2024-08-24)

### TypeScript/Build Errors Fixed
The following issues were encountered and resolved to get the build working:

#### 1. **Button Component - `asChild` prop**
- **Issue**: Button component doesn't support `asChild` prop
- **Location**: `src/app/(app)/teams/create/page.tsx:265`
- **Fix**: Replaced Button with styled div for file upload labels
```tsx
// OLD (broken)
<Button type="button" variant="outline" size="sm" asChild>
  <span>Upload Image</span>
</Button>

// NEW (fixed)
<div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
  Upload Image
</div>
```

#### 2. **Button Component - `destructive` variant**
- **Issue**: Button component doesn't have a "destructive" variant
- **Locations**: 
  - `src/components/teams/LeaveTeamDialog.tsx:202`
  - `src/components/teams/TeamManagement.tsx:342, 370, 404`
- **Fix**: Replaced variant with red color classes
```tsx
// OLD (broken)
<Button variant="destructive">Delete</Button>

// NEW (fixed)
<Button className="bg-red-500 hover:bg-red-600 text-white">Delete</Button>
```

#### 3. **WeekOverview Component - Missing Types**
- **Issue**: `description` property doesn't exist on WeekItem interface
- **Location**: `src/components/learning/WeekOverview.tsx:254`
- **Fix**: Removed description reference, used day/video counts instead
```tsx
// OLD (broken)
{week.description || 'Explore the content for this week...'}

// NEW (fixed)
{week.days.length} days • {week.days.reduce((acc, day) => acc + day.videos.length, 0)} videos
```

#### 4. **DayItem Interface - Missing practiceTask**
- **Issue**: `practiceTask` property missing from DayItem interface
- **Location**: `src/components/learning/WeekOverview.tsx:20-27`
- **Fix**: Added optional practiceTask property
```tsx
interface DayItem {
  id: string
  title: string
  videos: VideoItem[]
  completed: boolean
  estimatedTime: string
  practiceTask?: string  // Added this
}
```

#### 5. **TeamChat Component - TypeScript null checks**
- **Issue**: `e.target` possibly null in FileReader callbacks
- **Location**: `src/components/teams/TeamChat.tsx:115, 133`
- **Fix**: Store result in variable before using
```tsx
// OLD (broken)
setSelectedImages(prev => [...prev, e.target.result as string])

// NEW (fixed)
const result = e.target.result as string
setSelectedImages(prev => [...prev, result])
```

#### 6. **Cleanup - Backup Files**
- **Issue**: TeamChat-BU.tsx backup file had syntax errors
- **Fix**: Deleted backup file that was causing build issues

### Development Server Issues
- **Cache corruption**: Cleared `.next` folder when webpack cache errors occurred
- **Port change**: Dev server moved from port 3003 to 3004 after restart

### Important Notes for Team Development
1. **Always check Button variant support** - Our Button component only supports: "default", "outline", "secondary", "ghost"
2. **TypeScript strict mode** - Ensure all interfaces are complete before using
3. **File cleanup** - Remove backup files (-BU.tsx) to avoid build errors
4. **Cache issues** - If you see webpack cache errors, run: `rm -rf .next && npm run dev`

### Navigation Enhancement Completed
- Added gold/yellow gradient highlighting for selected day in navigation tree
- Color scheme: `bg-gradient-to-r from-yellow-400 to-amber-500`
- Enhanced with shadow and border for better visibility
- Successfully synced all three panels (Navigation, WeekOverview, DayView/VideoPlayer)

---

## Phase 1 Implementation Details (2024-08-24)

### Files Created
1. **`src/store/teamStore.ts`** - Complete Zustand store with:
   - Team CRUD operations
   - Application management
   - Member management
   - Notification system
   - Mock data with 3 teams

2. **`src/components/teams/TeamApplicationModal.tsx`**
   - Modal for applying to join teams
   - Skills selection
   - Application message
   - Form validation

3. **`src/components/teams/TeamApplicationsList.tsx`**
   - Display pending applications
   - Accept/reject functionality
   - Only visible to team leaders

4. **`src/components/teams/LeaveTeamDialog.tsx`**
   - Confirmation dialog for leaving teams
   - Leadership transfer option
   - Warning messages

5. **`src/components/teams/TeamManagement.tsx`**
   - Comprehensive team management panel
   - Tab-based interface
   - Settings, Members, Applications, Danger Zone tabs

### Files Modified
1. **`src/app/(app)/teams/create/page.tsx`**
   - Transformed from "Coming Soon" to fully functional
   - Complete team creation form
   - Avatar upload with preview
   - Store integration

2. **`src/components/teams/TeamCard.tsx`**
   - Integrated with teamStore
   - Dynamic button display (Apply/Manage)
   - Fixed Fragment wrapping issue

3. **`src/app/(app)/teams/page.tsx`**
   - Replaced mock data with store data
   - Updated filtering to work with store
   - My Teams section shows user's teams

4. **`src/components/teams/TeamChat.tsx`**
   - Fixed syntax error with corrupted SVG data
   - Replaced with cleaner mock messages
   - Maintained all chat functionality

### Integration Points Completed
- Teams page now shows real data from store
- Create team form saves to store and redirects
- Team cards show appropriate actions based on membership
- Applications flow from modal to store to management panel
- Member count updates automatically on join/leave
- All components maintain glass morphism design
- LocalStorage persistence working across page refreshes

### Known Issues Fixed
- TeamChat.tsx had corrupted SVG base64 data causing syntax errors
- Replaced with placeholder data to fix build
- All TypeScript errors resolved
- Build compiles successfully