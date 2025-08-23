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

