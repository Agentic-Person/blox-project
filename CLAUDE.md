# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL IMPLEMENTATION RULES

**IMPORTANT: Follow these rules for ALL work in this repository:**

1. **NEVER install dependencies unless explicitly told to**
2. **NEVER create duplicate directories**
3. **ALWAYS check if files/folders exist before creating, Do NOT create duplicate folders**
4. **ASK before making assumptions about project structure**
5. **ONLY work with exactly what is specified in each prompt**
6. **If you think something needs to be installed, ASK first**
   - Do NOT install packages beyond what is listed
   - Do NOT assume project structure
   - Ask before making changes not explicitly requested

**CONFLICT RESOLUTION PROTOCOL:**
- If the user requests something that breaks these rules, STOP and DISCUSS before implementing
- Explain why the request conflicts with best practices
- Suggest alternatives that follow proper conventions
- Example: If user wants to create a duplicate folder, explain the issue and suggest renaming or using the existing folder
- Always prioritize discussion and understanding over blind implementation

## Project Overview

Blox Buddy is a free learning and community platform for young Roblox developers (ages 10-25) 

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + Framer Motion for animations  
- **Database**: Supabase (PostgreSQL with real-time capabilities)
- **Authentication**: Clerk (primary) with Supabase Auth backup
- **State Management**: Zustand
- **Video Integration**: YouTube iframe API
- **Web3**: Solana blockchain integration for token economy
- **Mind Mapping**: TLDraw/Konva for canvas workspace
- **Automation**: n8n for content health checks and Discord bot
- **Deployment**: Vercel

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production  
npm run build

# Run production build locally
npm run start

# Run linting
npm run lint

# Type check
npm run typecheck
```


### API Routes Pattern
```typescript
GET    /api/curriculum/:module     # Get module content
POST   /api/progress/complete      # Mark content complete
GET    /api/teams/recruiting       # Get recruiting teams
POST   /api/teams/create          # Create new team
POST   /api/webhooks/discord      # Discord bot webhooks
POST   /api/webhooks/n8n          # n8n automation webhooks
```

## Git Best Practices and Commit Standards

### Branch Strategy
- **Main Branches:**
  - `main`: Production-ready code only
  - `develop`: Integration branch for features
  - `rebuild-version-001`: Current active development branch

- **Feature Branches:** Use `feature/descriptive-name` format
  - Examples: `feature/blox-wizard-ui`, `feature/video-transcript-system`, `feature/premium-subscription`
- **Hotfix Branches:** Use `hotfix/issue-description`
- **Release Branches:** Use `release/v1.0.0`

### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Commit Types
- **feat**: New feature implementation
- **fix**: Bug fixes
- **docs**: Documentation updates
- **style**: Code formatting, no logic changes
- **refactor**: Code restructuring without feature changes
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, tooling
- **perf**: Performance improvements
- **ui**: UI/UX improvements and styling
- **db**: Database schema or migration changes

### Good Commit Examples
```bash
feat(wizard): add video reference cards with timestamps
fix(auth): resolve Discord OAuth redirect issue
ui(dashboard): implement glass morphism effects
docs(api): update Blox Wizard implementation guide
chore(deps): update OpenAI SDK to v4.0.0
```

### Bad Commit Examples (AVOID)
```bash
fix bug
update files
working on chat
WIP
```

### Stage-Based Commits
Reference the current stage when applicable:
```bash
feat(stage-8): implement transcript extraction service
ui(stage-8): add premium upgrade modal
fix(stage-5): resolve TLDraw integration issue
```

### Files to NEVER Commit
- Environment variables (`.env*.local`)
- API keys or secrets
- `.private/` folder contents
- Large media files in `/snips/`
- Personal configuration files
- `node_modules/` directory
- `.next/` build directory

### Always Include in Commits
- Documentation updates for new features
- Type definitions for new components
- Migration files for database changes
- Test files for new functionality

### Blox Buddy Specific Practices
When working on this project:
- Reference the stage number from todo.md in commits when applicable
- Use descriptive scope names that match the feature area (wizard, teams, learning, etc.)
- Keep commits focused on single features or fixes taht were updated
- Write clear commit messages that explain the "why" not just the "what"

## MANDATORY GIT WORKFLOW - PREVENT "SLOPPY GIT"

**CRITICAL: Follow this workflow to avoid accumulating uncommitted changes**

### Daily Git Routine (MANDATORY)

#### 1. Start of Every Session
```bash
# Check status and pull latest changes
git status
git pull origin feature/current-branch
```

#### 2. During Development - THE "RULE OF 3"
**STOP and commit when ANY of these happen:**
- ✅ **3+ files modified** → Commit immediately
- ✅ **30+ minutes of coding** → Commit your progress  
- ✅ **Feature/fix completed** → Commit the completion
- ✅ **Before switching tasks** → Commit what you have

#### 3. Commit Process (Use This Exact Sequence)
```bash
# 1. Check what's changed
git status

# 2. Add files in logical groups (NOT git add .)
git add src/components/feature-name/
git add src/lib/services/new-service.ts

# 3. Commit with proper message
git commit -m "feat(scope): what you accomplished"

# 4. Push immediately (don't let commits pile up)
git push origin feature/current-branch
```

#### 4. End of Every Session
```bash
# NEVER leave uncommitted changes
git status  # Should show "working tree clean"

# If you have changes, commit them:
git add relevant-files
git commit -m "progress: end of session - working on X"
git push origin feature/current-branch
```

### What Caused the "Sloppy Git" Problem

**❌ What Went Wrong:**
- 28 uncommitted files sitting for days/weeks
- No intermediate commits during development
- Missing database migrations (types created but not SQL)
- No regular pushes to GitHub
- Working in isolation without backup

**✅ How to Prevent It:**

#### A. Never Accumulate Changes
```bash
# BAD: Let changes pile up for days
# 28 files modified, 5 new features, 3 bug fixes all mixed together

# GOOD: Commit after each logical piece
git commit -m "feat(transcript): add YouTube API integration"
git commit -m "feat(ai): implement OpenAI service"  
git commit -m "ui(wizard): update chat interface"
```

#### B. Complete Your Database Work
```bash
# BAD: Create TypeScript types but forget SQL migrations
src/types/migrations.ts  ✅ Created
supabase/migrations/      ❌ Forgot this!

# GOOD: Always complete both parts
src/types/migrations.ts           ✅ 
supabase/migrations/002_video.sql ✅
```

#### C. Push Regularly (Daily Minimum)
```bash
# Push after every significant commit
git push origin feature/your-branch

# NEVER go more than 24 hours without pushing
```

### Emergency "Uncommitted Changes" Recovery

If you find yourself with many uncommitted changes again:

#### 1. Create Backup Branch First
```bash
git branch backup/emergency-$(date +%Y%m%d)
```

#### 2. Organize Changes by Feature
```bash
git status --short  # See what's changed

# Group related changes
git add scripts/transcript-related-files*
git commit -m "feat(transcript): implement transcript system"

git add src/components/ui-related*  
git commit -m "ui(components): update interface components"

git add supabase/migrations*
git commit -m "db(migrations): add video and transcript tables"
```

#### 3. Push Immediately
```bash
git push origin feature/current-branch
```

### Git Health Checks (Run Weekly)

```bash
# 1. Check for uncommitted changes
git status  # Should be clean

# 2. Check branch is pushed
git log origin/feature/branch..HEAD  # Should be empty

# 3. Check recent commit frequency  
git log --oneline -10  # Should see regular commits, not huge gaps
```

### Claude Instructions for Git

**When working on this project, Claude should:**

1. **After every significant code change**: Commit immediately
2. **Before creating new files**: Check git status first
3. **When adding new features**: Break into multiple commits
4. **Always**: Push after committing
5. **Never**: Let more than 5 files accumulate without committing

**Commit Early, Commit Often, Push Regularly = No More Sloppy Git!**

