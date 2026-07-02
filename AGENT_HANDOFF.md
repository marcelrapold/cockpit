# Agent Handoff

Use this when another local/cloud coding agent needs to continue the Cockpit/Lunar work.

## Scope

- Repository: `/Users/marcelrapold/DEV/marcelrapold/cockpit`
- Local app: `http://localhost:3001`
- Primary routes: `/`, `/lunar`, `/insights`
- Current task: Cockpit now includes a Lunar Velocity analysis app, a home-page Lunar summary card, and a local static fallback so the home page is useful without Redis.

## Current State

- `/lunar` is implemented as a Next.js App Router page with Recharts, CSV/JSON export, report view, demo/live modes, moon-phase analysis via `astronomy-engine`, and GitHub collection APIs.
- The Lunar app defaults to clearly labeled demo data when no GitHub token is configured.
- The Cockpit home page has a client-side Lunar card wired to the external `GET /api/summary?window=2` contract.
- Until Lunar is deployed, the card reads `public/data-lunar-velocity.json` and the header keeps `Lunar TODO`.
- Once deployed, set `NEXT_PUBLIC_LUNAR_VELOCITY_SUMMARY_URL=https://<lunar-deploy-url>/api/summary`.
- `lib/data/static-fallback.ts` reads `public/data*.json` when Redis is absent or empty.
- `lib/data/cache-reader.ts` now falls back to static GitHub stats, narrative, repos, portfolio, and language stats.
- `npm run build` passes.

## Useful Commands

```bash
cd /Users/marcelrapold/DEV/marcelrapold/cockpit
npm run build
npm run dev -- --port 3001
curl "http://localhost:3001/api/lunar/analyze?demo=1&user=marcel&window=2"
```

## Remaining Notes

- DORA and Infra cards still need live Vercel/Supabase/Redis-backed data or a separate static fallback. They intentionally remain unavailable when those secrets are missing.
- If a dev server shows `Internal Server Error` after `npm run build`, restart `next dev`; build and dev both write `.next`.
- The other agent must be scoped to this Cockpit repo. A session scoped to `radiox` will not see these files.
