# Blox Buddy Audit

**Date:** 2026-09-30
**Repo root:** `D:\agent-services\projects\blox-project`
**Branch:** `main` @ `e718a32`
**Size:** about 258 source files, about 48,000 lines of TypeScript
**This file:** `D:\agent-services\projects\blox-project\docs\blox-buddy-audit-2026-09-30.md`
**Web version (open in a browser):** `D:\agent-services\projects\blox-project\docs\blox-buddy-audit-2026-09-30.html`
**Next-steps plan:** `D:\agent-services\projects\blox-project\docs\NEXT-STEPS-game-design-course.md`

This audit reviews the Blox Buddy code, the rebuilt Supabase database and the course syllabus. The question behind it: can a 10-year-old use this as a homeschool "Intro to Video Game Design" course (Unity, 3D modelling and several game engines), and what would it take to get there?

Paths in backticks without a drive letter are relative to `D:\agent-services\projects\blox-project`.

---

## Executive summary

**The app is well structured and its screens look finished. It is not ready for your son yet: he can't log in, the new database doesn't match the code, and most of the syllabus is empty.**

The parts a homeschool course needs most already work on local data: the course browser, the YouTube player, progress and XP, whiteboard notes and daily screen-time limits. The fastest safe route is a **kid mode**: skip the login, hide the crypto, payments, teams and Discord features, and load the new game design syllabus. Then fix the backend properly behind it.

| Measure | Estimate |
|---|---|
| Interface built | ~85% |
| Backend wired up | ~35% |
| Course content real | ~35% (85 of 244 video slots) |
| **Working product overall** | **~45%** |

### What blocks him today

1. **He can't get in.** Every learning page needs a real Supabase login, and `.env.local` still points at the dead cloud project. The value is a dashboard link, not an API address. The `USE_MOCK_*` flags in `.env.local` look like a way around this, but the code never reads them.
2. **The rebuilt database doesn't match the app.** The Hermes rebuild created a `bloxbuddy` schema, but nothing in the app points to it. It also left out 13 tables and several functions the code calls, including the search behind the Blox Wizard AI tutor. The to-do table's columns have different names from the ones the code uses.
3. **The syllabus is mostly empty, and parts of it are unsafe.** 159 of 244 video slots are placeholders. Only Weeks 1–3 have real, relevant videos. Week 4 has off-topic clips picked up by an automated keyword search, including a Wi-Fi router buyer's guide and a horror short.
4. **Some features aren't suitable for a child.** Profiles are public by default and show location and social links. The AI chat has no content moderation. Every new account gets a crypto wallet. The only social login is Discord, which requires users to be 13 or older.

---

## What we did well

- **A clean course model.** The course is organised as modules, then weeks, days and videos, with a practice task for each day. The folder layout splits the app into four clear areas: the main app, login, admin and the public site.
  *Evidence:* `src\data\curriculum.json`; `src\app\(app)`, `(auth)`, `(admin)`, `(marketing)`
- **A good video player.** It uses the real YouTube player, marks a video complete at 90% watched, and falls back to a "Watch on YouTube" link when a video is dead.
  *Evidence:* `src\components\learning\VideoPlayer.tsx`
- **Kid-friendly time limits.** A 150-minute daily limit and a break reminder every 45 minutes are already built in.
  *Evidence:* `src\store\timeManagementStore.ts`
- **Strict TypeScript.** Strict mode is on. The build is not told to ignore type or lint errors, and there are no `@ts-ignore` comments. The database types are generated from the schema.
  *Evidence:* `tsconfig.json`, `next.config.js`
- **Good security basics.** Next.js is patched against the middleware CVE, and login cookies are handled the correct way. The to-do and calendar routes only return the caller's own data. Every rebuilt table has owner-only access rules. No real secrets were found anywhere in the git history.
  *Evidence:* `src\middleware.ts`, `rebuild\00_combined_bloxbuddy.sql`
- **Solid Week 1–3 content and tooling.**
  - The Week 1–2 videos are good beginner material from SmartyRBX, CG Cookie and Grant Abbitt.
  - Week 3's Unity 6 series fits the multi-engine plan.
  - There are ready-made scripts to check and replace videos.
  - Commit messages follow a consistent format.

  *Evidence:* `scripts\verify-videos.js`, `git log`

---

## What we could do better

The findings fall into three groups: fixes needed before your son uses the app, code to simplify, and things that were missed. Effort: **S** = small, **M** = medium, **L** = large.

### 1. Fix before your son uses it (critical)

**Unsafe and off-topic videos are in the course.**
- Week 4 ("AI Tools for 3D") contains "My daughter's ghost haunts me #shorts", a Wi-Fi 7 mesh router buyer's guide, AI news clips and a "Proompt Engineer" skit.
- Every Week 4 duration is a fake 20:00.
- **Fix:** remove Week 4's off-topic entries and hide every placeholder day. **(S)**

**Anyone can use the AI tutor for free, and nothing checks what it says.**
- The chat route accepts whatever user ID the request sends, so the daily limit can be bypassed with a made-up ID, with no login.
- The only safety measure is one line in the prompt ("Never provide inappropriate content"). Nothing checks the child's messages or the AI's replies.
- The browser can slip in its own "system" instructions.
- **Fix:** take the user from the server login, run the OpenAI moderation check on messages in both directions, write a kid-safe prompt, reject "system" messages sent from the browser, and keep a chat log a parent can read. **(M)**

**The rebuild created risks on the shared VPS.**
- A crypto-wallet trigger is attached to the server's shared user table (`auth.users`). It fires on every sign-up for every project on that server, so if it ever errors, sign-ups on your other sites could fail.
- The whole schema grants read access to the public (anon) key.
- Three database views ignore the per-user access rules.
- Several elevated-permission functions can be called by anyone. Given a user ID, they can read that user's chats, credit tokens or use up that user's AI allowance.
- **Fix:** drop the wallet trigger (or the whole wallet migration), revoke anon access, set the views to `security_invoker`, and lock the functions to the logged-in user. If step 9 of the rebuild plan has already made `bloxbuddy` reachable through the API, do this now. **(M)**

**Child privacy (COPPA, the US law on children's data).**
- There is no age check and no parental consent.
- Profiles start public, showing location, social links and allowing messages, and portfolio images are publicly readable.
- The app shows Stripe "upgrade" prompts, and users can make themselves Premium because the Premium flag sits in a profile field they can edit.
- **Fix:** make profiles private by default, hide location, links and email, remove wallet, tokens, Stripe, Teams and Discord for this use case, and run the app for your family only until a consent flow exists. **(S)**

**The YouTube API key is sent to the browser.**
- It is stored as `NEXT_PUBLIC_YOUTUBE_API_KEY`, so anyone who opens the site can copy it and use up your quota.
- **Fix:** move it to the server, or restrict it to your domain in Google Cloud. **(S)**

### 2. Tangled code we can simplify

**Four login systems, one of which is live.**
- Supabase Auth is the live one. Five to-do and calendar API routes call Clerk, but Clerk is never set up, so those routes fail at runtime.
- There are fake Clerk hooks kept "for compatibility", a dead auth store, and two pairs of duplicate pages: `/login` vs `/sign-in` and `/signup` vs `/sign-up`.
- **Fix:** keep Supabase Auth and remove Clerk completely. The database's user-ID columns already expect Supabase users. **(M)**

**Five different ways to create a database connection.**
- The main server connection uses the all-powerful service key for every request, which quietly bypasses the database's per-user rules.
- Six files still use the deprecated `@supabase/auth-helpers-nextjs` package, even though commit `7645d92` says it was replaced.
- **Fix:** keep one browser connection and one server connection that act as the logged-in user, plus a separate, explicit admin connection. **(M)**

**About 10,000 lines of dead code.**
- Around 39 modules are never imported (about 7,100 lines), and another 2,700 lines are reachable only through unused index files.
- There are three chat interfaces, and only one is used.
- Four API folders are empty, and there are also `.disabled` migrations and six curriculum backup files.
- **Fix:** delete them. Git keeps the history. **(S)**

**Services scattered across four folders.**
- They live in `src\lib\services`, `src\services`, `src\lib\api` and `src\lib\learning`.
- Two YouTube helper files are almost identical, the duration formatter is defined four times, and core types such as Module, Video and Todo are defined two or three times each.
- **Fix:** move everything to one services folder and one types folder. **(M)**

**Two data paths for to-dos.**
- The browser store writes straight to the database, while the `/api/todos` routes are never called.
- All nine app stores save to browser storage, and the Teams store saves hard-coded sample teams as if they were real data.
- **Fix:** pick one path and delete the other. **(M)**

**Unused packages and small leftovers.**
- About 14 packages are never used, including the Solana wallet adapters, axios, react-player, react-big-calendar and stripe.
- The 163 KB curriculum file loads on every app page.
- The toast pop-ups are never mounted, so every "saved" or "error" message is invisible.
- **Fix:** trim the packages, mount `<Toaster />`, and load the curriculum on the server. **(S)**

### 3. What we missed

**Everything a homeschool course needs.**
- There is no parent view, no reliable log of time spent, and no printable progress report.
- Lessons have no learning objectives, quizzes or hands-on "build it" checkpoints, there is no portfolio, and the capstone is a placeholder.
- The `/progress` page shows made-up numbers (23%, 21h, 8 achievements), and `/settings` doesn't save anything.

**"Mark as Watched" works on videos that won't play.** Placeholder videos show "Video Unavailable" but still award XP when marked watched.

**Gaps in the rebuild plan.**
- It skipped migration 010 as "superseded by 004", but 004 doesn't create `search_transcript_chunks`, the function Blox Wizard uses to find videos.
- It left out `admin_users`, the six `ai_journey*` tables, `learning_paths`, `learning_path_steps` and `chat_todo_suggestions`. The code still uses all of them.
- No storage buckets were created.
- One piece of good news: the plan worried the app logs in with Clerk. It actually logs in with Supabase Auth, so the database's per-user rules will work once the app is connected.

**Connecting to the new server will need config changes.**
- The production security policy only allows `*.supabase.co`, so it will block `supabase.agenticpersonnel.com`.
- After login, the app sends every user to `/admin`, so a student lands on "Unauthorized".
- None of the curriculum videos have transcripts yet, so the AI tutor has nothing to search.

**No working tests.** There are five test files, but the test tool they need (Vitest) isn't installed, there's no test script, and the tests cover code that is now dead. There's no ESLint config either, so `npm run lint` will stop at a setup prompt.

**Docs have drifted.**
- The README describes a different product (an "AI training platform for coaches").
- The Quick Start points at the dead cloud project.
- `CLAUDE.md` names `rebuild-version-001` as the active branch, but that branch is 62 commits behind `main`.
- About 20 one-off debug notes and reports clutter the repo root.
- The uncommitted `.gitignore` change adds `.env*`, which also matches `.env.example`. Add `!.env.example` so the example file stays tracked.

**Readability for a 10-year-old.** The app is dark-only with light gray text. Extra-small text is used 424 times, and the whole codebase has only three accessibility labels. Some wording is aimed at adults ("tokenomics", "AI Journey").

---

## Overall functionality

This is what each area does today. The statuses assume someone could log in. With the current settings nobody can, so only the landing, login and About pages are reachable.

| Area | Status | What that means |
|---|---|---|
| Login | **BROKEN** | Points at the dead cloud project. There's no working mock mode. After login, users are sent to `/admin`. |
| Course browser + video player | **WORKS** | Works from local data. Only Weeks 1–3 have real, relevant videos. |
| Progress + XP | **PARTIAL** | Saved in this browser only. Cloud sync sends the wrong ID. The `/progress` page is static. |
| Whiteboard notes | **WORKS** | Saved in the browser. Text notes say "coming soon". |
| Daily time limit + breaks | **WORKS** | Set to 150 min/day with a break every 45 min. Browser only. |
| Blox Wizard AI tutor | **PARTIAL** | Real OpenAI calls, but no transcripts to search, a missing search function, a user ID anyone can fake, and no moderation. |
| Calendar + to-dos | **BROKEN** | The API routes call Clerk, which isn't set up, and use column names the new table doesn't have. |
| AI Journey planner | **BROKEN** | Its six tables weren't included in the rebuild. |
| Profile + uploads | **PARTIAL** | Needs the database and uses the deprecated auth package. The QR phone upload can never validate. |
| Admin | **BROKEN** | The `admin_users` table is in a disabled migration. |
| Teams, wallet, tokenomics | **MOCK** | Sample data only. Not suitable for this use case. |
| Discord, help, about, settings | **STUB** | "Coming soon" pages or static placeholders. |
| Build | **UNVERIFIED** | Not run. Dependencies aren't installed, and the project rules say to ask before installing. `src\app\auth\callback\route.ts` will probably fail a Next 15 type check. |

---

## The syllabus, for a 10-year-old

The live course is `D:\agent-services\projects\blox-project\src\data\curriculum.json`. It has 6 modules, 24 weeks, 120 days and 244 video slots.

### Course map

| Module | Week | Status |
|---|---|---|
| M1 Foundations | 1 | Real, relevant videos |
| M1 Foundations | 2 | Real, relevant videos |
| M1 Foundations | 3 | Real Unity 6 + C# videos: fits the plan, steep for age 10 |
| M1 Foundations | 4 | Mixed: off-topic or unsuitable clips |
| M2 Scripting | 5–8 | Placeholder: no video yet |
| M3 Game design | 9–12 | Placeholder: no video yet |
| M4 UI / UX | 13–16 | Placeholder: no video yet |
| M5 Advanced | 17–20 | Placeholder: no video yet |
| M6 Publishing | 21–24 | Placeholder: no video yet |

### Week by week

| Week | What's in it | Fit for age 10 |
|---|---|---|
| 1 · Roblox Studio | SmartyRBX beginner guides to Studio, terrain, building and lighting. Day 2 jumps straight to scripting (48 min). | **Good** |
| 2 · Blender | About 25 hours of Blender (CG Cookie's 21 parts, Grant Abbitt). Days 8–9 repeat Week 1's videos. | **Too long** |
| 3 · Unity 6 | A 20-part Jimmy Vegas Unity series. It fits the multi-engine course, but the C# is a big step for a 10-year-old. | **Fits, steep** |
| 4 · AI tools | A router buyer's guide, AI news, a horror short, and a few real Blender/AI clips. | **Remove** |
| 5–24 | Placeholders only. The Module 2 day titles ("Variables and Data Types") don't match their listed videos ("UV Unwrapping"). Later topics include anti-cheat, monetization and influencer outreach. | **Empty** |

### Verdict

Use this file as a skeleton, not a course. The overall order (build, then script, then design, then publish) is sound. The pacing isn't: planned days run 2–8 hours, and a 10-year-old needs 30–60 minutes. Past Week 3 the topics are aimed at older teens.

**Recommendation:** replace it with the multi-engine Intro to Video Game Design syllabus that has already been written (Unity, 3D modelling and engine comparisons), keeping days to 30–60 minutes. Check every video by hand, and give each lesson one "build it" task. The handoff plan is in `D:\agent-services\projects\blox-project\docs\NEXT-STEPS-game-design-course.md`.

---

## Recommended path

The phases are in order. The first phase gets your son started safely without waiting on the database.

### Phase 1: Get him started
1. Install dependencies and run the type check and build, so the real errors are visible. This needs your OK under the project rules. **(S)**
2. Add a kid mode that skips login with a fixed local user. **(S)**
3. Hide wallet, tokenomics, teams, Discord, admin and the upgrade card from the menu. **(S)**
4. Remove the Week 4 content, hide the placeholder days, and only allow "Mark as Watched" after the video has actually played. **(S)**
5. Connect `/progress` to the real progress data as a simple parent view. **(S)**

### Phase 2: Make it a course
1. Load the multi-engine syllabus (30–60 min a day), with an objective and a "build it" checkpoint for each lesson. **(M)**
2. Add a short quiz after each lesson, a screenshot or portfolio upload, and a small capstone game at the end. **(M)**
3. Add a printable parent report showing time spent, lessons done with dates, and objectives met. **(M)**

### Phase 3: Real backend
1. Harden the `bloxbuddy` schema first: drop the wallet trigger, revoke anon access, fix the views and lock down the functions. **(M)**
2. Point the app at the VPS: set the URL and keys, set `db.schema = 'bloxbuddy'`, update the security policy, and regenerate the types. **(M)**
3. Keep only Supabase Auth, and fix the to-do column names. Then either add the missing tables or delete the code that uses them. **(M)**
4. Make the AI tutor safe (server-side user, moderation, kid-safe prompt, parent-readable log), and rebuild its video search. **(M)**

### Phase 4: Clean up
1. Delete the roughly 10,000 lines of dead code, about 14 unused packages and the loose files in the repo root. **(S)**
2. Merge the service folders and duplicate types, and rewrite the README and Quick Start. **(M)**
3. Add a working test runner and an ESLint config. **(M)**

---

## Key files

```
D:\agent-services\projects\blox-project\docs\blox-buddy-audit-2026-09-30.md
D:\agent-services\projects\blox-project\docs\blox-buddy-audit-2026-09-30.html
D:\agent-services\projects\blox-project\docs\NEXT-STEPS-game-design-course.md
D:\agent-services\projects\blox-project\src\data\curriculum.json
D:\agent-services\projects\blox-project\rebuild\00_combined_bloxbuddy.sql
D:\agent-services\projects\blox-project\docs\rebuild-plan.md
D:\agent-services\projects\blox-project\.env.local
D:\agent-services\projects\blox-project\src\middleware.ts
D:\agent-services\projects\blox-project\src\lib\supabase\server.ts
D:\agent-services\projects\blox-project\src\lib\supabase\client.ts
D:\agent-services\projects\blox-project\src\app\api\chat\blox-wizard\route.ts
D:\agent-services\projects\blox-project\src\lib\services\openai-service.ts
D:\agent-services\projects\blox-project\src\app\auth\callback\route.ts
D:\agent-services\projects\blox-project\src\app\api\todos\route.ts
D:\agent-services\projects\blox-project\src\components\learning\VideoPlayer.tsx
D:\agent-services\projects\blox-project\src\store\learningStore.ts
D:\agent-services\projects\blox-project\src\store\profileStore.ts
D:\agent-services\projects\blox-project\src\app\(app)\progress\page.tsx
D:\agent-services\projects\blox-project\src\lib\config\features.ts
D:\agent-services\projects\blox-project\next.config.js
```

---

## How this audit was done

The code, the rebuild SQL and the course data were reviewed read-only. The most serious findings were then checked by hand against the source. Nothing was installed, built or run. The audit did not connect to the VPS database, so it can't confirm which rebuild steps were actually applied. The 73 real YouTube videos haven't been re-checked for dead links in the past year.
