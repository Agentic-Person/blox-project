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

### 1. LearningPathTree Component
**Location:** `src/components/learning/LearningPathTree.tsx`
**Purpose:** Main navigation tree in the sidebar

**Key Features:**
- Expandable/collapsible tree structure
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

### 2. WeekOverview Component
**Location:** `src/components/learning/WeekOverview.tsx`
**Purpose:** Left panel showing module info and week list

**Key Features:**
- Module statistics display
- Week selector with navigation controls
- Expandable week details with day list
- Progress tracking integration

**Props Interface:**
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

### 3. Page Components

#### Module Page
**Location:** `src/app/(app)/learning/[moduleId]/page.tsx`
**Behavior:**
- Shows WeekOverview in left panel (30%)
- Shows WeekPreview or ModuleOverview in right panel (70%)
- Handles week selection without forced day navigation

#### Week Page
**Location:** `src/app/(app)/learning/[moduleId]/[weekId]/page.tsx`
**Behavior:**
- Shows WeekOverview in left panel
- Shows WeekPreview in right panel
- Allows day selection from week view

#### Day Page
**Location:** `src/app/(app)/learning/[moduleId]/[weekId]/[dayId]/page.tsx`
**Behavior:**
- Shows WeekOverview in left panel
- Shows DayView with video content in right panel
- Includes Breadcrumb component
- **CRITICAL FIX:** Week change navigates to week overview, not first day

```typescript
// Fixed implementation - navigates to week overview
onWeekChange={(weekId) => {
  router.push(`/learning/${params.moduleId}/${weekId}`)
}}
```

### 4. Supporting Components

#### Breadcrumb Component
**Location:** `src/components/learning/Breadcrumb.tsx`
**Features:**
- Shows navigation hierarchy
- Progress indicators for each level
- Color-coded progress (green=complete, yellow=in-progress, gray=not started)
- Click navigation to any parent level

#### SplitView Component
**Location:** `src/components/learning/SplitView.tsx`
**Purpose:** Resizable split panel layout
- Default split: 30% left, 70% right
- Configurable min/max sizes
- Smooth resize handling

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

## Known Issues & Solutions

### Issue: Duplicate Navigation Components
**Solution:** Deleted unused `NavigationTree.tsx`, kept only `LearningPathTree.tsx`

### Issue: Fast Refresh Full Reload
**Solution:** Ensure proper React component structure and avoid inline functions in render

### Issue: Image 404s for Placeholder Videos
**Expected:** Placeholder YouTube IDs will 404, replace with real video IDs in production

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
├── components/learning/
│   ├── LearningPathTree.tsx         # Main navigation tree
│   ├── WeekOverview.tsx             # Week list component
│   ├── WeekPreview.tsx              # Week details view
│   ├── DayView.tsx                  # Day content view
│   ├── Breadcrumb.tsx               # Breadcrumb navigation
│   ├── SplitView.tsx                # Split panel layout
│   └── ModuleOverview.tsx           # Module introduction
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