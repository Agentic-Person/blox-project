# Navigation Implementation Documentation

## Overview
The Blox Buddy learning platform uses a hierarchical navigation system with three levels:
1. **Module Level** - 6 main learning modules (months)
2. **Week Level** - 4 weeks per module
3. **Day Level** - 5-7 days per week with video content

## Navigation Flow Architecture

### URL Structure
```
/learning                           → Learning home (shows all modules)
/learning/[moduleId]               → Module overview with week list
/learning/[moduleId]/[weekId]      → Week overview with day list
/learning/[moduleId]/[weekId]/[dayId] → Day view with video content
/learning/[moduleId]/[weekId]/[dayId]/[videoId] → Video player view
```

## Key Components

### 1. EnhancedLearningNav Component (NEW - Replaces LearningPathTree in sidebar)
**Location:** `src/components/layout/Sidebar/EnhancedLearningNav.tsx`
**Purpose:** Rich, card-based navigation in the sidebar with WeekOverview design
**Created:** 2025-08-25

**Key Features:**
- Beautiful card-based design matching WeekOverview panel
- Module header with stats grid (Hours, XP, Weeks, Progress)
- Week cards with day number indicators
- Expandable day sections with continuous numbering
- Progress tracking with visual feedback
- Smooth animations with Framer Motion

**Navigation Functions (KISS Principle):**
```typescript
handleModuleClick() → router.push('/learning/[moduleId]')
handleWeekClick(weekId) → router.push('/learning/[moduleId]/[weekId]')
handleDayClick(weekId, dayId) → router.push('/learning/[moduleId]/[weekId]/[dayId]')
```

**Important:** Simple navigation only - no callbacks or complex state management. The page handles viewport updates based on URL changes.

**Supporting Components:**
- `ModuleHeader.tsx` - Stats grid and module info
- `WeekCard.tsx` - Week cards with day indicators
- Both located in `src/components/layout/Sidebar/`

### 1a. LearningPathTree Component (LEGACY - Still available but not used in sidebar)
**Location:** `src/components/learning/LearningPathTree.tsx`
**Purpose:** Original tree navigation (replaced by EnhancedLearningNav)
**Status:** Kept for reference/fallback but not actively used

**Key Features:**
- Simple expandable/collapsible tree structure
- Progress indicators at each level
- LocalStorage persistence for expanded state
- Auto-scroll to active item
- Visual indicators for current location

**Navigation Functions:**
```typescript
navigateToModule(moduleId: string) → /learning/[moduleId]
navigateToWeek(moduleId: string, weekId: string) → /learning/[moduleId]/[weekId]
navigateToLesson(moduleId: string, weekId: string, dayId: string) → /learning/[moduleId]/[weekId]/[dayId]
```

**State Management:**
- Uses `expandedModules` and `expandedWeeks` arrays
- Persists to localStorage with keys:
  - `learning-expanded-modules`
  - `learning-expanded-weeks`
- SSR-safe implementation with useEffect for localStorage access

### 2. WeekOverview Component (DEPRECATED - No longer used)
**Location:** `src/components/learning/WeekOverview.tsx`
**Purpose:** Previously used as left panel showing module info and week list
**Status:** Removed from all pages in favor of full viewport implementation
**Replaced By:** EnhancedLearningNav in sidebar provides all navigation

**Previous Features (for reference):**
- Module statistics display
- Week selector with navigation controls
- Expandable week details with day list
- Progress tracking integration

**Props Interface (historical):**
```typescript
{
  module: { id, title, description, totalVideos }
  weeks: WeekItem[]
  currentWeek: string
  currentDay?: string
  onWeekChange: (weekId: string) => void
  onVideoSelect: (videoId: string, dayId: string) => void
}
```

**Note:** Component file still exists but is no longer imported or used. All navigation functionality has been moved to EnhancedLearningNav in the sidebar, allowing for full viewport content display.

### 3. Page Components (Updated: Full Viewport Implementation)

#### Module Page
**Location:** `src/app/(app)/learning/[moduleId]/page.tsx`
**Behavior (NEW):**
- Renders WeekPreview or ModuleOverview in full viewport (100%)
- No split panel - navigation handled by EnhancedLearningNav in sidebar
- Smooth Framer Motion transitions
- Handles week selection without forced day navigation

#### Week Page
**Location:** `src/app/(app)/learning/[moduleId]/[weekId]/page.tsx`
**Behavior (NEW):**
- Renders WeekPreview in full viewport (100%)
- Direct content display without split panels
- Allows day selection from week view
- Full-width for better content visibility

#### Day Page
**Location:** `src/app/(app)/learning/[moduleId]/[weekId]/[dayId]/page.tsx`
**Behavior (NEW):**
- Renders DayView with video content in full viewport (100%)
- Includes Breadcrumb component for context
- Back button navigates to week view (not module)
- Maximum space for learning content

#### Video Page
**Location:** `src/app/(app)/learning/[moduleId]/[weekId]/[dayId]/[videoId]/page.tsx`
**Behavior (NEW):**
- Renders VideoPlayer in full viewport (100%)
- Immersive video experience without distractions
- Navigation controls within video player
- Full-width for optimal viewing

### 4. Supporting Components

#### Breadcrumb Component
**Location:** `src/components/learning/Breadcrumb.tsx`
**Features:**
- Shows navigation hierarchy
- Progress indicators for each level
- Color-coded progress (green=complete, yellow=in-progress, gray=not started)
- Click navigation to any parent level

#### SplitView Component (DEPRECATED - No longer used)
**Location:** `src/components/learning/SplitView.tsx`
**Purpose:** Previously provided resizable split panel layout
**Status:** Removed from all pages in favor of full viewport implementation

**Previous Features (for reference):**
- Default split: 30% left, 70% right
- Configurable min/max sizes
- Smooth resize handling

**Note:** Component file still exists but is no longer imported or used. All pages now render content at 100% viewport width for better user experience.

## Critical Navigation Fixes

### 1. Hydration Error Fix
**Problem:** localStorage access during SSR caused hydration mismatch
**Solution:** Move localStorage access to useEffect after mount

```typescript
// BAD - Causes hydration error
const [expandedModules] = useState(() => {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem('expanded') || '[]')
  }
  return []
})

// GOOD - SSR safe
const [expandedModules, setExpandedModules] = useState([])
useEffect(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('expanded')
    if (saved) setExpandedModules(JSON.parse(saved))
  }
}, [])
```

### 2. Week Navigation Fix
**Problem:** Clicking weeks always navigated to first day
**Solution:** Remove automatic day selection in navigation handlers

```typescript
// BAD - Forces day selection
const navigateToWeek = (moduleId, weekId) => {
  const week = findWeek(weekId)
  router.push(`/learning/${moduleId}/${weekId}/${week.days[0].id}`)
}

// GOOD - Shows week overview
const navigateToWeek = (moduleId, weekId) => {
  router.push(`/learning/${moduleId}/${weekId}`)
}
```

### 3. Week Change Handler Fix
**Problem:** Changing weeks from day view auto-selected first day
**Location:** `[dayId]/page.tsx` line 82-85
**Solution:** Navigate to week overview instead

```typescript
// BAD
onWeekChange={(weekId) => {
  const newWeek = currentModule.weeks.find(w => w.id === weekId)
  if (newWeek) {
    router.push(`/learning/${moduleId}/${weekId}/${newWeek.days[0].id}`)
  }
}}

// GOOD
onWeekChange={(weekId) => {
  router.push(`/learning/${params.moduleId}/${weekId}`)
}}
```

## State Management

### Zustand Store
**Location:** `src/store/learningStore.ts`
**Navigation-related functions:**
- `isVideoCompleted(videoId: string): boolean`
- `isDayCompleted(dayId: string): boolean`
- `getDayProgress(dayId: string): { completionPercentage: number }`
- `getWeekProgress(weekId: string): number`
- `getModuleProgress(moduleId: string): number`

### Data Source
**Location:** `src/data/curriculum.json`
**Structure:**
```json
{
  "modules": [
    {
      "id": "module-1",
      "title": "Module Title",
      "weeks": [
        {
          "id": "week-1",
          "title": "Week Title",
          "days": [
            {
              "id": "day-1",
              "title": "Day Title",
              "videos": [...]
            }
          ]
        }
      ]
    }
  ]
}
```

## Navigation Best Practices

### 1. URL-First Navigation
- Always use Next.js router for navigation
- URLs should be the source of truth for current location
- Components read from URL params, not internal state

### 2. Progressive Disclosure
- Start at high level (module/week overview)
- Let users drill down as needed
- Don't force navigation to specific levels

### 3. Bidirectional Sync
- Tree selection updates URL
- URL changes update tree selection
- Both stay in sync via useEffect hooks

### 4. Performance Optimizations
- Use `AnimatePresence` for smooth transitions
- Implement auto-scroll with small delay for DOM updates
- Cache expanded state in localStorage
- Use proper React keys for list items

## Common Navigation Patterns

### Navigate to Module
```typescript
router.push(`/learning/${moduleId}`)
```

### Navigate to Week
```typescript
router.push(`/learning/${moduleId}/${weekId}`)
```

### Navigate to Day
```typescript
router.push(`/learning/${moduleId}/${weekId}/${dayId}`)
```

### Navigate to Video
```typescript
router.push(`/learning/${moduleId}/${weekId}/${dayId}/${videoId}`)
```

### Handle Back Navigation
```typescript
const handleBack = () => {
  router.push(`/learning/${moduleId}`)
}
```

## Visual Indicators

### Color Scheme
- **Active Module:** `bg-blox-teal/20 border-l-2 border-blox-teal`
- **Active Week:** `bg-blox-purple/20 border-l-2 border-blox-purple`
- **Active Day:** `bg-blox-warning/20 border-l-2 border-blox-warning`
- **Completed:** `text-blox-success` (green)
- **In Progress:** `text-blox-warning` (yellow)
- **Not Started:** `text-blox-off-white` (gray)

### Icons
- **Expanded:** ChevronDown
- **Collapsed:** ChevronRight
- **Completed:** CheckCircle
- **In Progress:** PlayCircle
- **Locked:** Lock

## Testing Checklist

- [ ] Module navigation shows module overview
- [ ] Week navigation shows week overview (not first day)
- [ ] Day navigation shows day content
- [ ] Back navigation works at all levels
- [ ] Tree expansion state persists on refresh
- [ ] Active item highlights correctly
- [ ] Progress indicators update properly
- [ ] No hydration errors on page load
- [ ] Auto-scroll to active item works
- [ ] Week selector dropdown functions correctly

## Recent Implementation Changes (2025-08-25)

### Phase 1: Card-Based Navigation Design
**Branch:** `full-viewport-test` (created from `rebuild-version-001`)
**Status:** Successfully implemented and tested
**Time:** Morning session

#### What Changed:
1. **Created EnhancedLearningNav** to replace LearningPathTree in sidebar
2. **Added rich visual components:**
   - ModuleHeader with stats grid
   - WeekCard with day indicators
   - Beautiful animations and hover effects
3. **Fixed navigation communication** between sidebar and viewport panels

#### Key Implementation Details:

**Initial Problem:** 
- Navigation was working but looked too simple
- Wanted to bring WeekOverview's beautiful card design to the sidebar

**First Attempt (Overcomplicated):**
- Tried to implement complex callbacks and state management
- Broke communication between sidebar and viewport
- Navigation stopped updating the right panels
- User feedback: "we've completely lost our connection to the viewport"

**Final Solution (KISS Principle):**
```typescript
// Simple navigation - let the page handle viewport updates
handleWeekClick = (weekId) => {
  router.push(`/learning/${activeModuleId}/${weekId}`)
}

// Separate expand/collapse from navigation
<div onClick={onWeekClick}>Week Content</div>
<button onClick={onToggle}>Expand Icon</button>
```

**Lesson Learned:** Keep navigation simple. The existing page logic already handles URL changes perfectly. Don't add complexity where it's not needed. User emphasized: "KISS - Keep It Simple, Stupid."

### Phase 2: Full Viewport Implementation
**Branch:** `full-viewport-test` (same branch)
**Status:** Successfully implemented and tested
**Time:** Afternoon session
**Server:** Running on port 3001 (after cache issues)

#### Motivation:
- WeekOverview panel was redundant with EnhancedLearningNav in sidebar
- Users needed more viewport space for actual content
- "Remove the Overview panel so that we have more room for the viewport"

#### What Changed:
1. **Removed SplitView component** from all learning pages
2. **Removed WeekOverview component** from all learning pages
3. **Made viewport full-width** for better content experience

#### Files Modified:
1. **Module Page** (`src/app/(app)/learning/[moduleId]/page.tsx`):
   - Removed: `SplitView`, `WeekOverview` imports
   - Added: Direct rendering with Framer Motion
   - Result: Full-width WeekPreview or ModuleOverview

2. **Week Page** (`src/app/(app)/learning/[moduleId]/[weekId]/page.tsx`):
   - Removed: `SplitView`, `WeekOverview` imports  
   - Added: Direct WeekPreview rendering
   - Result: Full viewport for week content

3. **Day Page** (`src/app/(app)/learning/[moduleId]/[weekId]/[dayId]/page.tsx`):
   - Removed: `SplitView`, `WeekOverview` imports
   - Added: Full-width DayView with Breadcrumb
   - Result: Maximum space for day content

4. **Video Page** (`src/app/(app)/learning/[moduleId]/[weekId]/[dayId]/[videoId]/page.tsx`):
   - Removed: `SplitView`, `WeekOverview` imports
   - Added: Full-width VideoPlayer
   - Result: Immersive video experience

#### Before vs After Structure:
```typescript
// BEFORE - Split panel layout
return (
  <SplitView
    leftPanel={<WeekOverview />}  // 30% width
    rightPanel={content}           // 70% width
  />
)

// AFTER - Full viewport
return (
  <motion.div className="h-full w-full">
    {content}  // 100% width
  </motion.div>
)
```

#### Benefits Achieved:
- **50% more viewport space** (from 70% to 100%)
- **Cleaner interface** without duplicate navigation
- **Better mobile experience** with full-width content
- **Consistent navigation** through sidebar only
- **Reduced complexity** in page components

### Phase 3: Full Directory Navigation Wizard
**Branch:** `full-viewport-test` (same branch)
**Status:** Successfully implemented and tested
**Time:** Evening session
**Server:** Running on port 3002 (after port 3001 issues)

#### What Changed:
1. **Created AllModulesNav Component** (`src/components/layout/Sidebar/AllModulesNav.tsx`):
   - Shows all 6 modules as beautiful expandable cards
   - Each module has unique gradient colors (Teal → Purple → Gold progression)
   - Modules expand to show weeks, weeks expand to show days
   - All sections can remain open simultaneously
   - Removed module locking - all content is accessible

2. **Updated SidebarNav** to toggle navigation display:
   - Learning Path is now a clickable button (not a link)
   - Clicking toggles the full directory view
   - Shows chevron indicator for expand/collapse state

3. **Enhanced Navigation Features**:
   - No internal scrollbar - uses main sidebar scroll
   - Smooth Framer Motion animations throughout
   - Progress tracking at every level
   - Continuous day numbering across all modules
   - LocalStorage persistence for expanded states

4. **Removed Sidebar Auto-Collapse** (2025-08-25 Update):
   - Previously sidebar would auto-collapse on learning pages
   - **Removed this behavior** - sidebar stays open for navigation
   - Users can still manually collapse with Cmd/Ctrl + B if needed
   - Location: `src/app/(app)/layout.tsx` lines 47-48

#### Benefits:
- Full 6-month journey visible at a glance
- Easy navigation to any video from any page
- Beautiful visual hierarchy for young users
- No redundant UI elements
- Maximum flexibility for users

### Enhancement: Collapsible Sidebar with Drag Handle
**Status:** Implemented (Auto-collapse removed)
- ~~Auto-collapses on learning pages~~ (Removed - stays open)
- Drag handle to manually resize sidebar
- "Back to Dashboard" button in header
- Keyboard shortcut (Cmd/Ctrl + B) for manual toggle

## Known Issues & Solutions

### Issue: Duplicate Navigation Components
**Solution:** Deleted unused `NavigationTree.tsx`, kept only `LearningPathTree.tsx`

### Issue: Fast Refresh Full Reload
**Solution:** Ensure proper React component structure and avoid inline functions in render

### Issue: Image 404s for Placeholder Videos
**Expected:** Placeholder YouTube IDs will 404, replace with real video IDs in production

### Issue: Navigation Breaking After Visual Enhancement
**Problem:** EnhancedLearningNav wasn't communicating with viewport panels
**Solution:** Keep navigation simple - just use router.push(), don't try to manage complex state
**Principle:** KISS - Keep It Simple, Stupid

## File Structure Summary
```
src/
├── app/(app)/learning/
│   ├── [moduleId]/
│   │   ├── page.tsx                 # Module overview
│   │   ├── [weekId]/
│   │   │   ├── page.tsx             # Week overview
│   │   │   └── [dayId]/
│   │   │       ├── page.tsx         # Day view
│   │   │       └── [videoId]/
│   │   │           └── page.tsx     # Video player
├── components/
│   ├── learning/
│   │   ├── LearningPathTree.tsx     # Legacy tree navigation (not used)
│   │   ├── WeekOverview.tsx         # Week list component
│   │   ├── WeekPreview.tsx          # Week details view
│   │   ├── DayView.tsx              # Day content view
│   │   ├── Breadcrumb.tsx           # Breadcrumb navigation
│   │   ├── SplitView.tsx            # Split panel layout
│   │   └── ModuleOverview.tsx       # Module introduction
│   └── layout/
│       └── Sidebar/
│           ├── EnhancedLearningNav.tsx  # NEW: Rich card-based navigation
│           ├── AllModulesNav.tsx        # NEW: Full directory with all 6 modules
│           ├── ModuleHeader.tsx         # NEW: Module stats header
│           ├── WeekCard.tsx             # NEW: Week card with day indicators
│           ├── SidebarNav.tsx           # Main sidebar navigation (updated with toggle)
│           └── Sidebar.tsx              # Sidebar container
└── store/
    └── learningStore.ts              # Learning progress state
```

## Deployment Notes

1. Ensure environment variables are set for production
2. Test navigation on mobile devices
3. Verify localStorage persistence across sessions
4. Monitor for hydration errors in production logs
5. Check navigation performance metrics

## Future Enhancements

1. **Keyboard Navigation** (if needed)
   - Arrow keys for tree navigation
   - Enter to select
   - Escape to go back

2. **Search Within Tree**
   - Quick filter for modules/weeks/days
   - Highlight search results

3. **Progress Analytics**
   - Time spent per module/week/day
   - Completion rate tracking
   - Learning streak indicators

4. **Mobile Optimization**
   - Collapsible sidebar on mobile
   - Swipe gestures for navigation
   - Bottom navigation for key actions