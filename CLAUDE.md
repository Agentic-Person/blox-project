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

