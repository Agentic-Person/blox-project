# Next Steps: Intro to Video Game Design course on Blox Buddy

**Date:** 2026-09-30
**Repo root:** `D:\agent-services\projects\blox-project`
**This file:** `D:\agent-services\projects\blox-project\docs\NEXT-STEPS-game-design-course.md`
**Companion audit (open in a browser):** `D:\agent-services\projects\blox-project\docs\blox-buddy-audit-2026-09-30.html`

Paths below are full Windows paths. Where a path is shortened to the repo, it is relative to `D:\agent-services\projects\blox-project`.

---

## 1. The goal

Run a homeschool course, **Intro to Video Game Design**, for Jimmy's 10-year-old son, using Blox Buddy as the delivery app.

- **Scope is multi-engine, not Roblox-only.** The learner works in Unity, does 3D modelling (Blender), and compares different game engines. The original Blox Buddy curriculum already moved this way (Week 2 Blender, Week 3 Unity 6), so this is a return to the original idea, not a pivot.
- **The syllabus and daily structure already exist.** Another agent built them, and this repo does not have them yet. The job is to **load that syllabus into Blox Buddy**, not to write a new one.
- **The app does the delivery:** day-by-day lessons, an embedded video player, progress and XP, notes, daily screen-time limits, and (later) an AI tutor that answers questions from the course videos.

## 2. How the app actually works (read this first)

This determines the order of work.

| Piece | Where it lives today | Needs the database? |
|---|---|---|
| Course content (modules, weeks, days, lessons) | One static file: `D:\agent-services\projects\blox-project\src\data\curriculum.json` | **No** |
| Lesson pages and the video player | `D:\agent-services\projects\blox-project\src\app\(app)\learning\...` and `D:\agent-services\projects\blox-project\src\components\learning\VideoPlayer.tsx` | No |
| Progress, XP, streaks | The browser's localStorage (`D:\agent-services\projects\blox-project\src\store\learningStore.ts`), with a partial cloud sync | Only for syncing between devices |
| Whiteboard notes, daily time limits | localStorage | No |
| Login | Supabase Auth, and it **currently fails** because the app still points at a dead cloud project | Yes |
| AI tutor (Blox Wizard) | OpenAI plus video-transcript search in Supabase | Yes, and it isn't working yet |
| Profile, chat history, to-dos, calendar | Supabase | Yes |

**What this means:** the syllabus can go live **without waiting on the backend**. Convert it to the `curriculum.json` format, add a "kid mode" that skips login, and he can start. The Supabase rebuild matters later, for syncing progress, the AI tutor and parent records.

**Is the backend "already set up to do what we want"?** Partly.
- **It has:** login, user profiles, video progress, AI chat history and usage limits, to-dos/calendar, and transcript search tables for the AI tutor.
- **It doesn't have:** anything homeschool-specific, such as a time-on-task log, quiz results, project submissions, parent reports, or lesson progress keyed to non-YouTube lessons.
- **It isn't connected yet:**
  - The app isn't pointed at the new `bloxbuddy` schema.
  - 13 tables the code expects are missing.
  - The rebuild left open some security problems on the shared server (see section 6).

## 3. The data contract: what the syllabus must become

The app renders `D:\agent-services\projects\blox-project\src\data\curriculum.json`. Its shape today:

```jsonc
{
  "modules": [
    {
      "id": "module-1",                 // used in the URL: /learning/module-1/...
      "title": "M1: ...",
      "description": "...",
      "totalHours": 50,
      "totalXP": 750,
      "weeks": [
        {
          "id": "week-1",
          "title": "...",
          "description": "...",
          "days": [
            {
              "id": "day-1",
              "title": "D1: ...",
              "practiceTask": "One line of what to build or do today",
              "estimatedTime": "0.7h",
              "videos": [                // the lesson items for the day (the key name is "videos" for every item)
                {
                  "id": "video-1-1-1-1", // module-week-day-item; must be unique and must never change once used
                  "title": "...",
                  "creator": "Channel name",
                  "description": "...",
                  "duration": "39:33",
                  "totalMinutes": 40,
                  "youtubeId": "p005iduooyw",
                  "thumbnail": "https://i.ytimg.com/vi/<id>/maxresdefault.jpg",
                  "xpReward": 25
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Rules for the conversion:**
1. **Keep the IDs in this pattern and keep them stable.** Progress is saved against item IDs, so renaming an ID wipes his progress for that lesson.
2. **Keep the key name `videos`** for the day's item list, even for non-video items. It is read in about 11 files, and renaming it is avoidable churn.
3. **Every YouTube item needs a real `youtubeId`.** Do not use placeholders. The old file had 159 `YOUTUBE_ID_PLACEHOLDER` entries, which show "Video Unavailable" but still award XP.
4. **Add a `type` field to every item.** Today the player only understands YouTube videos plus a half-built `"assignment"` type whose page does not exist. A game design course needs these types:

| `type` | Used for | App work needed |
|---|---|---|
| `video` | A YouTube lesson | None; it works today |
| `link` | Unity Learn, Blender manual, an article, an engine download page | Small: a card with "Open tutorial" and a "Mark done" button |
| `build` | Hands-on work ("make a ball roll and collide with a wall") with a checklist | Medium: checklist, optional screenshot upload, "Show a parent" step |
| `quiz` | 3–5 questions | Medium: a quiz component that stores the score |
| `reading` | Short text written by us, rendered as markdown | Small: `react-markdown` is already installed |

5. **Optional fields per day that would help a lot:**
   - `objectives`: 1–2 "by the end of today you can…" lines
   - `software`: for example `["Unity 6", "Blender 4.x"]`
   - `parentNotes`: what to check or ask
   - `engine`: a tag such as `unity`, `blender`, `roblox`, `godot` or `none`
6. **Pacing:** keep days to about 30–60 minutes of screen time for a 10-year-old. The app's built-in limit defaults to 150 minutes a day, with a break every 45 minutes.

## 4. What I need from the other agent (the syllabus owner)

Please send back, or place in `D:\agent-services\projects\blox-project\docs\course\`:

1. **The syllabus converted to the JSON shape above.** If that's too much, send it in any structured form (JSON, CSV or markdown tables) with one row per lesson item, and the Blox Buddy side will convert it.
2. **A flat list of every resource,** with URL, type, creator, length and which day it belongs to. Videos and non-video resources both go on it.
3. **Per-day objectives and the hands-on task.** These matter more than the videos for a homeschool record.
4. **Confirmation that every video was checked by a person** for age suitability and topic. The old Blox Buddy course got a horror short and a Wi-Fi router buyer's guide from automated keyword search (Week 4 of the current file), so automated matching is not enough.
5. **The software and accounts each unit needs** (Unity Hub, Blender, any other engine), plus any age limits on those accounts. Accounts should be parent-owned where the provider's terms require it.
6. **Any assessment or grading plan,** if the homeschool course needs one.

## 5. Recommended order of work

S, M and L are rough effort sizes.

### Phase 1: Get him started (local only, no backend)
1. **Run `npm install`, `npm run typecheck` and `npm run build`.** Dependencies are not installed, and the project rules require Jimmy's OK before installing. This shows the real build errors up front. `S`
2. **Kid mode:** an environment flag that skips login with one fixed local user, in `D:\agent-services\projects\blox-project\src\middleware.ts` and `D:\agent-services\projects\blox-project\src\components\auth\RequireAuth.tsx`. `S`
3. **Hide the features that don't belong in this course** from the sidebar: wallet, tokenomics, teams, Discord, admin and the Premium upgrade card. Hide them; don't delete them yet. `S`
4. **Load the new syllabus** into `curriculum.json`. Keep the old file once as `curriculum.blox-legacy.json` and delete the other six backup files in `D:\agent-services\projects\blox-project\src\data\`. `S–M`
5. **Add the `link` lesson type** so Unity Learn and similar tutorials work. `S`
6. **Only allow "Mark as Watched" after real playback.** `S`
7. **Turn `/progress` into a parent view** using the real progress data. Today it shows made-up numbers (`D:\agent-services\projects\blox-project\src\app\(app)\progress\page.tsx`). `S`
8. **Kid-safe YouTube embeds:** use `youtube-nocookie.com` and `rel=0` so suggested videos stay on the same channel. `S`

### Phase 2: Make it a real course
1. Add the `build` lesson type: checklist, screenshot upload, and a portfolio page of what he made. `M`
2. Add the `quiz` lesson type. `M`
3. **Homeschool record:**
   - A time-on-task log based on actual player time, not estimates.
   - Lessons completed, with dates.
   - Objectives met.
   - A **printable report** for each week and term.
   - Check your state's homeschool record-keeping rules to decide what it must show. `M`
4. Rename the app's on-screen copy away from "Roblox-only" wording (titles, descriptions, landing page). Whether to keep the "Blox Buddy" name is Jimmy's call. `S`

### Phase 3: Connect the backend (the `bloxbuddy` schema on the VPS)
Do the security items **first**, because the schema lives on a server shared with other projects.
1. **Harden the schema:** `M`
   - Drop the wallet trigger on `auth.users`. It fires on every sign-up for every project on the VPS.
   - Revoke the blanket `SELECT` granted to `anon`.
   - Set the 3 views to `security_invoker`.
   - Revoke public `EXECUTE` on the `SECURITY DEFINER` functions, or make them use `auth.uid()` instead of a passed-in user ID.

   The SQL is in `D:\agent-services\projects\blox-project\rebuild\00_combined_bloxbuddy.sql`.
2. **Point the app at the VPS:** `M`
   - Set the API URL and keys in `D:\agent-services\projects\blox-project\.env.local`. Today the URL is a dashboard link to the dead cloud project.
   - Set `db: { schema: 'bloxbuddy' }` on every Supabase client.
   - Allow `supabase.agenticpersonnel.com` in the security policy in `D:\agent-services\projects\blox-project\next.config.js`.
   - Regenerate the types.
3. **One login system:** keep Supabase Auth and remove Clerk from the 5 to-do and calendar API routes. Fix the redirect in `D:\agent-services\projects\blox-project\src\app\auth\callback\route.ts`, which sends everyone to `/admin`. `M`
4. **New tables for the course:** `M`
   - `lesson_progress`, keyed by item ID, so it works for non-YouTube items.
   - `time_log`
   - `quiz_attempts`
   - `project_submissions`, with a storage bucket for screenshots.

   Recommendation: **keep the course content itself in the JSON file** (version-controlled, easy for an agent to edit). Move it into the database only if a second student or an editing UI is ever needed.
5. **AI tutor:** `L`
   - Pull transcripts for the new syllabus's videos and embed them.
   - Recreate the missing `search_transcript_chunks` function for the `video_transcript_chunks` table.
   - Make it child-safe:
     - Take the user from the server session (today the user ID comes from the request body, so anyone can use it for free).
     - Run OpenAI moderation in both directions.
     - Write a kid-safe system prompt.
     - Reject "system" messages sent from the browser.
     - Keep a chat log the parent can read.

### Phase 4: Clean up (any time)
- Delete about 10,000 lines of dead code and about 14 unused packages. `S`
- Merge the four service folders. `M`
- Rewrite `D:\agent-services\projects\blox-project\README.md`, which currently describes a different product. `S`
- Add a working test runner and an ESLint config. `M`

## 6. Risks to keep in view

- **Shared VPS:** the rebuilt schema's wallet trigger and broad `anon` grants affect a server that also hosts other projects. Fix them before (or immediately if) `bloxbuddy` is exposed through PostgREST.
- **Child privacy:** profiles default to public and include location and social links. Discord login requires users to be 13+. The AI tutor sends his messages to OpenAI. Run the app for the family only until these are addressed.
- **Video link rot:** YouTube videos disappear. Re-check every ID before each unit starts. `D:\agent-services\projects\blox-project\scripts\verify-videos.js` can be adapted for this.
- **Difficulty jump in Unity:** C# is a big step for a 10-year-old. Consider Unity's own beginner pathways, Unity Visual Scripting, or pairing sessions for the coding parts. Engine-comparison weeks are a good place to show lighter engines (GDevelop or Godot) next to Unity.

## 7. Open questions for Jimmy

1. Where is the other agent's syllabus? (Path or repo.)
2. Start date, days per week and target minutes per day?
3. Which computer will he use? Unity 6 and Blender need a reasonably capable Windows or Mac machine.
4. Local only at first (`npm run dev` on the home PC), or deployed to Vercel so it works from any device?
5. Keep the "Blox Buddy" name, or rename it for a multi-engine course?
6. Does the AI tutor matter for the first unit, or can it wait for Phase 3?
7. What does your state require in a homeschool record (hours, work samples, assessments)?

## 8. Key files

```
D:\agent-services\projects\blox-project\src\data\curriculum.json
D:\agent-services\projects\blox-project\src\components\learning\VideoPlayer.tsx
D:\agent-services\projects\blox-project\src\components\learning\DayView.tsx
D:\agent-services\projects\blox-project\src\app\(app)\learning\[moduleId]\[weekId]\[dayId]\[videoId]\page.tsx
D:\agent-services\projects\blox-project\src\store\learningStore.ts
D:\agent-services\projects\blox-project\src\store\timeManagementStore.ts
D:\agent-services\projects\blox-project\src\app\(app)\progress\page.tsx
D:\agent-services\projects\blox-project\src\middleware.ts
D:\agent-services\projects\blox-project\src\components\auth\RequireAuth.tsx
D:\agent-services\projects\blox-project\src\app\auth\callback\route.ts
D:\agent-services\projects\blox-project\src\lib\supabase\client.ts
D:\agent-services\projects\blox-project\src\lib\supabase\server.ts
D:\agent-services\projects\blox-project\next.config.js
D:\agent-services\projects\blox-project\.env.local
D:\agent-services\projects\blox-project\rebuild\00_combined_bloxbuddy.sql
D:\agent-services\projects\blox-project\docs\rebuild-plan.md
D:\agent-services\projects\blox-project\docs\blox-buddy-audit-2026-09-30.html
```
