# Blox Buddy - Product Requirements Document v2.0
## Free Learning & Community Platform for Young Roblox Developers

**Document Version:** 2.0  
**Date:** January 11, 2025  
**Product Name:** Blox Buddy  
**Target Release:** September 1, 2025 (2 weeks)

---

## 1. Executive Summary (Revised)

Blox Buddy is the first phase of a two-part ecosystem designed to transform young people (ages 10-25) into competent Roblox game developers. This platform solves the critical "getting started" problem by providing a structured 6-month learning journey through curated YouTube content, while fostering organic team formation to combat developer isolation.

**Phase 1 (Blox Buddy):** Foundation skills in Roblox Studio, Blender 3D, AI tools, and basic scripting
**Phase 2 (Roblox Code Buddy):** Advanced scripting and AI-assisted development [separate app with shared database]

The platform combines three core elements: a vibrant landing page, a progress-tracking web app, and an active Discord community—all designed to make game development accessible, social, and fun.

## 2. Problem Statement (Expanded)

### Primary Problems
1. **Overwhelming Fragmentation:** 1000s of YouTube tutorials with no clear progression path
2. **Developer Isolation:** Young creators working alone without peer support or complementary skills
3. **Outdated Content:** Rapid platform changes (Roblox Creator Hub 2024, Blender 4.1+) make tutorials obsolete quickly
4. **Skill Gap Awareness:** Beginners don't know what they don't know—unclear on the full stack needed

### Secondary Problems
- No bridge between casual playing and serious development
- Parents/educators lack resources to support young developers
- AI tools exist but aren't integrated into learning paths
- Team formation happens randomly in Discord servers without structure

## 3. Solution Architecture

### 3.1 Platform Ecosystem Overview
```
Blox Buddy Ecosystem
├── Marketing Layer
│   ├── Landing Page (bloxbuddy.com)
│   ├── YouTube Channel (tutorials/updates)
│   └── Social Media Presence
├── Application Layer
│   ├── Learning Management System
│   ├── Progress Tracking
│   ├── Team Formation Hub
│   └── Project Showcase
├── Community Layer
│   ├── Discord Server (primary community)
│   ├── Weekly Events
│   └── Peer Support System
└── Data Layer (Shared with Code Buddy)
    ├── User Profiles
    ├── Learning Progress
    ├── Team Data
    └── Project Portfolio
```

### 3.2 Integration with Roblox Code Buddy
**Shared Infrastructure:**
- Unified Supabase database
- Single user authentication system
- Portable progress tracking
- Shared project portfolio

**User Journey Continuity:**
1. Complete Blox Buddy fundamentals (Month 1-6)
2. Unlock "Advanced Developer" badge
3. Seamless transition to Code Buddy for scripting mastery
4. Maintain team connections across both platforms

**Data Synergies:**
- Learning analytics inform Code Buddy AI suggestions
- Team formations carry over for advanced projects
- Portfolio grows across both platforms
- Unified community Discord serves both apps

## 4. Content Management System

### 4.1 Curriculum Architecture
Based on the comprehensive 6-month learning paths provided:

**Month 1-2: Foundations**
- Roblox Studio 2024 basics (Creator Hub navigation)
- Blender 4.1+ introduction
- AI tools primer (Meshy v3, Claude 3, etc.)
- 70-80 hours of curated content

**Month 3-4: Intermediate Skills**
- Texturing and materials
- Basic scripting concepts
- Team project opportunities
- 80-90 hours of content

**Month 5-6: Integration & Publishing**
- Advanced techniques
- Monetization strategies
- Capstone projects
- 60-70 hours of content

### 4.2 Content Curation & Maintenance Protocol

**Monthly Review Process:**
- **Week 1:** Audit existing links for dead/outdated content
- **Week 2:** Review platform updates (Roblox, Blender, AI tools)
- **Week 3:** Add new high-quality content discoveries
- **Week 4:** Update learning paths based on user feedback

**Quality Metrics for Content:**
- Video must be <6 months old OR confirmed still relevant
- Creator must have 10K+ subscribers OR exceptional quality
- Content must align with current platform versions
- Clear audio, good pacing, beginner-friendly

**Automated Monitoring:**
```javascript
// Content Health Check System
- YouTube API integration for video availability
- Weekly automated link checking
- User reporting system for outdated content
- Version tracking for platform updates
```

## 5. Team Formation System (Simplified)

### 5.1 Philosophy: Enable, Don't Orchestrate
Rather than complex matching algorithms, focus on **discovery and connection tools**:

**Team Discovery Features:**
- "Looking for Team" badge on profiles
- Skill tags (Scripter, Modeler, Designer, etc.)
- Availability indicators
- Simple team creation wizard

**Team Enablement Tools:**
- Team chat spaces (Discord integration)
- Shared progress tracking
- Joint project galleries
- Team achievement badges

### 5.2 Organic Team Formation Flow
```
1. User completes Month 1 basics
2. System prompts: "Ready to team up?"
3. User browses active teams OR creates team listing
4. Simple application/invite process
5. Teams get private Discord channel
6. Weekly team challenges encourage collaboration
```

## 6. Technical Specifications (Detailed)

### 6.1 Frontend Architecture
```javascript
// Technology Stack
- Framework: Next.js 14 (SEO + React benefits)
- Styling: Tailwind CSS + Framer Motion
- State: Zustand (lighter than Redux)
- Video: YouTube iframe API
- Auth: Supabase Auth with Discord OAuth

// Component Structure
src/
├── components/
│   ├── learning/
│   │   ├── VideoPlayer.jsx
│   │   ├── ProgressTracker.jsx
│   │   └── CurriculumNav.jsx
│   ├── teams/
│   │   ├── TeamFinder.jsx
│   │   ├── TeamCard.jsx
│   │   └── TeamDashboard.jsx
│   └── community/
│       ├── ProjectGallery.jsx
│       ├── SkillExchange.jsx
│       └── DiscordWidget.jsx
├── pages/
│   ├── index.jsx (landing)
│   ├── learn/
│   ├── teams/
│   └── showcase/
└── lib/
    ├── supabase.js
    ├── youtube.js
    └── discord.js
```

### 6.2 Database Schema (Enhanced)
```sql
-- Core user table (shared with Code Buddy)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  discord_id TEXT UNIQUE,
  discord_username TEXT,
  age_range TEXT CHECK (age_range IN ('10-12', '13-15', '16-18', '19-25', '25+')),
  parent_email TEXT, -- for users under 13
  onboarding_completed BOOLEAN DEFAULT false,
  code_buddy_eligible BOOLEAN DEFAULT false, -- unlocked after completing basics
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Learning progress (shared with Code Buddy)
CREATE TABLE learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'video', 'project', 'challenge'
  content_id TEXT NOT NULL, -- YouTube ID or internal ID
  module_name TEXT NOT NULL,
  week_number INT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  time_spent_seconds INT DEFAULT 0,
  notes TEXT,
  UNIQUE(user_id, content_id)
);

-- Content library (for curation management)
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_id TEXT UNIQUE,
  title TEXT NOT NULL,
  channel_name TEXT,
  module_name TEXT NOT NULL,
  week_number INT,
  order_index INT,
  duration_seconds INT,
  learning_objectives TEXT[],
  prerequisites TEXT[],
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  deprecation_reason TEXT
);

-- Teams (enhanced)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name TEXT NOT NULL,
  team_slug TEXT UNIQUE NOT NULL,
  description TEXT,
  max_members INT DEFAULT 5,
  is_recruiting BOOLEAN DEFAULT true,
  discord_channel_id TEXT,
  primary_language TEXT DEFAULT 'en',
  meeting_schedule TEXT, -- "Saturdays 2pm EST"
  skill_needs TEXT[], -- ['scripter', 'modeler']
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members with roles
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'leader', 'scripter', 'modeler', etc.
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  contribution_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  PRIMARY KEY (team_id, user_id)
);

-- Projects (individual or team)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('individual', 'team')),
  team_id UUID REFERENCES teams(id),
  created_by UUID REFERENCES users(id),
  roblox_game_url TEXT,
  showcase_video_url TEXT,
  thumbnail_url TEXT,
  tags TEXT[],
  likes_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content health monitoring
CREATE TABLE content_health_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES content_items(id),
  check_type TEXT, -- 'availability', 'relevance', 'user_report'
  status TEXT, -- 'healthy', 'warning', 'broken'
  details JSONB,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.3 API Endpoints
```typescript
// Learning endpoints
GET    /api/curriculum/:module
GET    /api/progress/:userId
POST   /api/progress/complete
GET    /api/content/health-check

// Team endpoints  
GET    /api/teams/recruiting
POST   /api/teams/create
POST   /api/teams/:id/join
GET    /api/teams/:id/members

// Community endpoints
GET    /api/projects/featured
POST   /api/projects/submit
GET    /api/skills/exchange
POST   /api/skills/offer
```

## 7. User Experience Flows

### 7.1 Onboarding Flow (Critical First Experience)
```
1. Land on homepage → "Start Your Journey" CTA
2. Discord OAuth (primary) or email signup
3. Quick survey:
   - Age range (for safety/content)
   - Current skill level (none/some/moderate)
   - Primary interest (scripting/modeling/design)
   - Time availability
4. Personalized dashboard with:
   - Recommended starting module
   - 3 suggested teams to explore
   - First week's video playlist
5. Optional: Join Discord server prompt
```

### 7.2 Daily Learning Flow
```
1. Dashboard shows "Continue Learning" button
2. Opens to current video with:
   - YouTube embed
   - Learning objectives
   - Practice challenge
   - "Mark Complete" checkbox
3. After completion:
   - Progress updates visually
   - Suggests next video OR break
   - Shows team members' progress
4. Weekly milestone:
   - Achievement badge
   - Share progress option
   - Team challenge unlock
```

## 8. Community & Engagement Strategy

### 8.1 Discord Integration Architecture
```
Discord Bot Features:
├── Welcome & Onboarding
│   ├── Auto-role assignment
│   ├── Skill verification
│   └── Team interest survey
├── Team Management
│   ├── /create-team command
│   ├── Auto channel creation
│   ├── Team role assignment
│   └── Meeting reminders
├── Progress Tracking
│   ├── /progress command
│   ├── Weekly summaries
│   └── Achievement announcements
└── Community Features
    ├── Project showcases
    ├── Help requests
    └── Event notifications
```

### 8.2 Gamification Elements
- **Individual Achievements:**
  - "First Week Hero" - Complete week 1
  - "Blender Beginner" - First 3D model
  - "Team Player" - Join first team
  - "Helpful Neighbor" - Answer 5 questions

- **Team Achievements:**
  - "Dynamic Duo/Trio" - First team project
  - "Consistency Kings" - Meet weekly for a month
  - "Ship It!" - Publish first game

### 8.3 Weekly Event Calendar
```
Monday:    "Matchmaking Monday" - Team recruitment focus
Tuesday:   "Tutorial Tuesday" - New content highlights
Wednesday: "Workshop Wednesday" - Live skill shares
Thursday:  "Throwback Thursday" - Showcase old projects
Friday:    "Feedback Friday" - Project reviews
Saturday:  "Squad Saturday" - Team challenges
Sunday:    "Showcase Sunday" - Project presentations
```

## 9. Monitoring & Analytics

### 9.1 Key Performance Indicators (KPIs)

**User Acquisition:**
- Daily active users (DAU)
- Weekly active users (WAU)
- Discord server growth rate
- Signup to active user conversion

**Learning Engagement:**
- Average videos completed per week
- Module completion rates
- Time spent learning per session
- Progress streak statistics

**Team Formation Success:**
- Teams created per week
- Average team size
- Team retention (active after 30 days)
- Team project completion rate

**Content Health:**
- Broken link percentage
- Content freshness score
- User satisfaction ratings
- Update frequency adherence

### 9.2 Analytics Implementation
```javascript
// Mixpanel or Amplitude events
track('video_completed', {
  userId,
  videoId,
  moduleName,
  completionTime,
  teamId
});

track('team_formed', {
  teamId,
  memberCount,
  skillComposition
});

track('project_published', {
  projectId,
  teamId,
  developmentTime
});
```

## 10. Risk Mitigation (Enhanced)

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| YouTube videos deleted/made private | High | High | Weekly automated checks, multiple video options per topic, local backup of critical content descriptions |
| Platform updates breaking curriculum | High | Medium | Monthly review process, version-specific tags, "Last verified" dates on content |
| Low team formation rates | Medium | High | Incentivize with team-only challenges, showcase team success stories, lower barrier to entry (2-person teams OK) |
| Discord community toxicity | Medium | High | Clear community guidelines, active moderation team, positive reinforcement systems, age-appropriate channels |
| Transition to Code Buddy confusion | Low | Medium | Clear progression indicators, "graduation" ceremony, maintained team connections |
| Parent concerns about online safety | Medium | Medium | Parent resources page, optional parent emails for <13, transparent safety measures |
| Server costs exceeding budget | Low | Medium | Supabase free tier optimization, YouTube bandwidth offloading, CDN for static assets |

## 11. Success Metrics (Month-by-Month)

### Launch Month (September 2025)
- 100+ signups
- 50+ Discord members
- 10+ teams formed
- 500+ videos watched

### Month 3
- 500+ total users
- 200+ Discord members
- 30% Week 1 completion rate
- 25+ active teams

### Month 6
- 1000+ total users
- 500+ Discord members
- 20% full curriculum completion
- 50+ published projects
- 10+ featured success stories

### Month 12 (Stretch Goals)
- 5000+ total users
- 2000+ Discord members
- 100+ active teams
- 50+ users ready for Code Buddy
- Partnership with 2+ YouTube creators

## 12. Technical Debt & Future Considerations

### Planned Technical Improvements (Post-Launch)
1. **Recommendation Engine** - ML-based content suggestions
2. **Mobile App** - React Native version for on-the-go learning
3. **Offline Mode** - Download curricula for offline viewing
4. **Advanced Analytics** - Learning pattern analysis
5. **API Public** - Allow creators to integrate content

### Code Buddy Integration Points
1. Shared authentication system
2. Unified progress tracking
3. Team persistence
4. Portfolio continuity
5. Skill assessment transfer

## 13. Launch Checklist

### Pre-Launch (Week 1-2)
- [ ] Landing page live with animations
- [ ] Core app functionality tested
- [ ] Discord server structured
- [ ] Bot commands working
- [ ] 100+ videos curated and verified
- [ ] Progress tracking functional
- [ ] Team formation flow complete
- [ ] Mobile responsive design verified
- [ ] Parent resources page created
- [ ] Community guidelines published

### Launch Day (September 1)
- [ ] Social media announcements scheduled
- [ ] Reddit posts prepared (r/robloxgamedev, r/gamedev)
- [ ] YouTube announcement video live
- [ ] Discord invites distributed
- [ ] Monitoring dashboard active
- [ ] Support team briefed

### Post-Launch Week 1
- [ ] Daily user metrics review
- [ ] Community feedback collection
- [ ] Bug fix priorities established
- [ ] First weekly events executed
- [ ] Content health check run

## 14. Budget Considerations

### Monthly Operating Costs (Estimated)
- Supabase: $0-25 (free tier likely sufficient initially)
- Vercel/Netlify: $0-20 (free tier + bandwidth)
- Domain: $15/year (~$1.25/month)
- Discord bot hosting: $5-10
- **Total: $6-56/month**

### Optional Costs
- Custom Discord bot features: $20-50/month
- Email service (SendGrid): $0-15/month
- Analytics (Mixpanel): $0-25/month
- CDN (Cloudflare): $0-20/month

## 15. Conclusion

Blox Buddy represents Phase 1 of a comprehensive ecosystem designed to transform young Roblox enthusiasts into capable game developers. By focusing on three core pillars—curated learning, team enablement, and community support—we create a sustainable platform that naturally feeds into the advanced Code Buddy application.

The key differentiator remains: **While others teach skills in isolation, Blox Buddy builds developer communities.**

### Critical Success Factors:
1. **Content Freshness** - Monthly maintenance keeps curriculum relevant
2. **Seamless Onboarding** - First experience determines retention
3. **Team Magic** - Social connections drive engagement
4. **Clear Progression** - Users know where they're headed (Code Buddy awaits)
5. **Community First** - Discord is the heartbeat, not an afterthought

---

**Document Sign-off**
- Product Owner: [Pending]
- Technical Lead: [Pending]
- Community Manager: [Pending]
- Launch Date Confirmed: September 1, 2025

**Next Immediate Actions:**
1. Finalize landing page design mockups
2. Set up Supabase project with schema
3. Create Discord server with initial structure
4. Begin curating Week 1 content
5. Develop MVP team formation flow

This PRD now comprehensively addresses the full scope of Blox Buddy as Phase 1 of your two-part ecosystem, with clear integration points for Code Buddy and robust systems for content management and team enablement.