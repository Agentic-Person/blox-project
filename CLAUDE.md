# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL IMPLEMENTATION RULES

**IMPORTANT: Follow these rules for ALL work in this repository:**

1. **NEVER install dependencies unless explicitly told to**
2. **NEVER create duplicate directories**
   - Do NOT create duplicate folders
3. **ALWAYS check if files/folders exist before creating**
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

Blox Buddy is a free learning and community platform for young Roblox developers (ages 10-25) that provides:
- Structured 6-month learning journey through curated YouTube content  
- Team formation and collaboration features
- Discord community integration
- Progress tracking and gamification
- Web3 integration with Solana blockchain and BLOX token rewards

This is Phase 1 of a two-part ecosystem, with Phase 2 being "Roblox Code Buddy" for advanced scripting.

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

## Core Implementation Details

### Database Schema
The application uses Supabase with the following key tables:
- `users` - User profiles with Discord integration
- `learning_progress` - Video completion tracking
- `content_items` - Curated YouTube content library
- `teams` - Team information and Discord channel IDs
- `team_members` - Team membership and roles
- `projects` - Individual and team projects

### API Routes Pattern
```typescript
GET    /api/curriculum/:module     # Get module content
POST   /api/progress/complete      # Mark content complete
GET    /api/teams/recruiting       # Get recruiting teams
POST   /api/teams/create          # Create new team
POST   /api/webhooks/discord      # Discord bot webhooks
POST   /api/webhooks/n8n          # n8n automation webhooks
```

### Authentication Flow
1. Primary authentication through Clerk with Discord OAuth
2. Supabase used for database row-level security
3. Web3 wallet connection for blockchain features
4. Parent consent flow for users under 13

### Learning System Architecture
- 6-month curriculum divided into modules and weeks
- YouTube videos embedded with progress tracking
- Content health monitoring via n8n automation
- Achievement system with gamification elements

### Team Formation System
- Skill-based team discovery
- Discord channel auto-creation via n8n webhooks
- Team project tracking
- Member role management (leader, member)

## Testing Approach

The project uses the following testing strategy:
- Component testing with React Testing Library
- API route testing with Jest
- E2E testing considerations for critical flows
- Focus on authentication, progress tracking, and team formation

## Important Notes

- Always use environment variables for sensitive credentials
- Implement Row Level Security (RLS) in Supabase for data protection
- Content must be regularly audited for availability (YouTube videos)
- Discord integration requires webhook security
- Parent email collection required for users under 13
- Web3 features are optional enhancements, not core requirements

## Integration Points

### YouTube Content
- Videos curated from channels like TheDevKing, BrawlDev, Blender Guru
- Content organized by skill level and learning objectives
- Regular health checks for video availability

### Discord Integration
- OAuth for authentication
- Team channel creation via bot
- Community event notifications
- Progress sharing capabilities

### Future Code Buddy Integration
- Shared Supabase database infrastructure
- User progression carries over
- Team persistence across platforms
- Unified authentication system