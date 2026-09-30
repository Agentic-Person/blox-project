# Blox-Buddy Supabase Rebuild Plan

**Date:** 2026-09-30
**Author:** Spock (on Chronos)
**Repo:** `Agentic-Person/blox-project` → cloned to `D:\agent-services\projects\blox-project`

## Goal

Rebuild the Blox-Buddy database schema fresh on the **main self-hosted VPS** Supabase
(`supabase.agenticpersonnel.com` = `76.13.114.176`), abandoning the dead cloud project
`jpkwtpvwimhclncdswdk` (all PATs `Unauthorized`, may be auto-frozen since May 2026).

## Context / findings

- **Self-hosted Supabase is healthy** — full stack running 6 days: Postgres 17.6
  (`supabase-db`), plus `supabase-auth`, `supabase-rest` (PostgREST), `supabase-storage`,
  `supabase-realtime`, `supabase-studio`, `supabase-kong`, `supabase-edge-functions`,
  `supabase-pooler`. Compose at `/opt/supabase-selfhost/docker/`.
- **Topology = schema-per-project.** One `postgres` database. Each project is its own
  schema: `aps_website`, `mission_control`. PostgREST exposes them via
  `PGRST_DB_SCHEMAS=public,graphql_public,mission_control,aps_website`.
- **Blox-Buddy migrations target `public.`** (498 bare `public.` refs, 0 quoted `"public".`,
  0 bare `PUBLIC` role grants) → safe to remap `public.` → `bloxbuddy.`.
- **All required extensions available:** `vector`, `uuid-ossp`, `pgcrypto`, `pg_trgm`, `pgjwt`.
- **API role template** (from `aps_website`): schema owned by `postgres`, `USAGE` granted to
  `anon`/`authenticated`/`service_role`; table grants `SELECT` to anon+authenticated,
  full CRUD to `service_role`. RLS policies govern row access.

## Approach

1. Create a dedicated `bloxbuddy` schema on the VPS `postgres` database.
2. Grant schema USAGE to `anon`, `authenticated`, `service_role` (match `aps_website` template).
3. Apply the 9 active numbered migrations in order, remapping `public.` → `bloxbuddy.` and
   forcing `search_path = bloxbuddy, public` (migrations are inconsistent: some qualify
   `public.`, some create tables unqualified).
4. Skip the `.disabled` migrations (`003_learning_paths`, `005_admin_system`) — the original
   developer disabled them deliberately.
5. Skip `cleanup-mock-chat-data.sql` — destructive mock-data purge; nothing to purge on a fresh DB.
6. Skip `009_fix_chunk_video_ids.sql` — data-only backfill targeting stale `transcript_chunks`
   (actual table is `video_transcript_chunks`); zero data on fresh rebuild.
7. Skip `010_search_function_for_old_schema.sql` — "old schema" search functions against stale
   `transcript_chunks`; superseded by `004_vector_search.sql`.
8. Skip `CONSOLIDATED_MISSING_TABLES.sql` — fully redundant: re-declares all 8 tables + policies
   already created by 002/007/008/012 (its `'public'` string-literal RLS guards are also wrong).
9. Add `bloxbuddy` to `PGRST_DB_SCHEMAS` in `/opt/supabase-selfhost/docker/.env` and
   **force-recreate** `rest` + `kong` (plain `restart` reuses stale env; Docker bakes env at
   container creation).
10. Verify: table count, extension presence, RLS policy count, index count, role grants, and a
    live `/rest/v1` call with `Accept-Profile: bloxbuddy`.

## Active migration set (apply order — FINAL, as shipped)

```
001_custodial_wallets.sql
002_video_content.sql
004_vector_search.sql
006_calendar_todo_system.sql
007_chat_persistence.sql
008_user_profiles.sql
009_storage_buckets.sql
011_add_video_metadata_columns.sql
012_ai_usage_tracking.sql
```

**Skipped** (stale or redundant): `003` (disabled), `005` (disabled),
`009_fix_chunk_video_ids` (stale `transcript_chunks`), `010_search_function_for_old_schema`
(stale `transcript_chunks`), `CONSOLIDATED_MISSING_TABLES` (redundant re-declare),
`cleanup-mock-chat-data` (data-only purge).

## Known caveats (documented, not blocking rebuild)

- **Auth mismatch:** migrations use `auth.uid()` in RLS policies (86 refs), but the app
  authenticates via **Clerk**, not Supabase Auth. `auth.uid()` returns NULL without a Supabase
  session, so RLS policies will deny rows until the app wiring is revisited. This is a
  functional concern for end-to-end usage, not a schema-build blocker.
- **`video_transcripts.video_id` vs `youtube_id`:** migrations evolved from `video_id` to
  `youtube_id` as primary identifier; `RUN-THIS-IN-SUPABASE.sql` + `011` + `009_fix` reconcile
  this. The numbered migrations already contain the reconciled state.
- **Storage buckets:** `009_storage_buckets.sql` documents required buckets; actual buckets are
  created via the storage API/dashboard, not raw SQL.

## Files touched

- VPS: `/opt/supabase-selfhost/docker/.env` (`PGRST_DB_SCHEMAS` line only)
- VPS: `postgres` DB — new `bloxbuddy` schema (+ tables/types/functions/policies)
- Local: `D:\agent-services\projects\blox-project\` (clone, untouched source)
- Local: `D:\agent-services\projects\blox-project\rebuild\` (generated remapped SQL, transient)

## Verification

- `\dn` shows `bloxbuddy` schema.
- `pg_namespace` ACL matches `aps_website` template (anon/authenticated/service_role = USAGE).
- Table count ≈ 20 (numbered migrations create the full set; `video_progress` included).
- Extensions: `vector`, `uuid-ossp` active.
- RLS policy count + index count reported and non-zero.
- `PGRST_DB_SCHEMAS` includes `bloxbuddy`; PostgREST container reloaded.
