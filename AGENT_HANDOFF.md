# Agent Handoff

Use this when another local/cloud coding agent needs to continue the Cockpit/Lunar work.

## Scope

- Repository: `/Users/marcelrapold/DEV/marcelrapold/cockpit`
- Local app: `http://localhost:3001`
- Primary routes: `/`, `/lunar`, `/insights`
- Current task: Cockpit includes a Lunar Velocity analysis app and a home-page Lunar summary card. The app now uses live GitHub-backed data only.

## Current State

- `/lunar` is implemented as a Next.js App Router page with Recharts, CSV/JSON export, report view, moon-phase analysis via `astronomy-engine`, and GitHub collection APIs.
- The Lunar app requires live GitHub-backed data. `demo=1` is rejected instead of generating synthetic activity.
- The Cockpit home page has a client-side Lunar card wired to the external `GET /api/summary?window=2` contract.
- Lunar is deployed inside Cockpit. The card reads `/api/summary?window=2` (or `NEXT_PUBLIC_LUNAR_VELOCITY_SUMMARY_URL`) and rejects `demoMode: true`.
- Once deployed, set `NEXT_PUBLIC_LUNAR_VELOCITY_SUMMARY_URL=https://<lunar-deploy-url>/api/summary`.
- `lib/data/static-fallback.ts` reads `data/private/data*.json` when Redis is absent or empty; these files are deliberately not served as public static assets.
- `lib/data/cache-reader.ts` now falls back to static GitHub stats, narrative, repos, portfolio, and language stats.
- `npm run build` passes.

## Useful Commands

```bash
cd /Users/marcelrapold/DEV/marcelrapold/cockpit
npm run build
npm run dev -- --port 3001
curl "http://localhost:3001/api/lunar/analyze?user=marcel&window=2"
```

## Remaining Notes

- DORA and Infra cards still need live Vercel/Supabase/Redis-backed data or a separate static fallback. They intentionally remain unavailable when those secrets are missing.
- If a dev server shows `Internal Server Error` after `npm run build`, restart `next dev`; build and dev both write `.next`.
- The other agent must be scoped to this Cockpit repo. A session scoped to `radiox` will not see these files.
