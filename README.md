# Cockpit

Cross-platform engineering dashboard that tracks **GitHub**, **Vercel** and **Supabase** activity in a single view. Static SPA with Vercel Serverless Functions — no build step, no framework, zero npm dependencies.

**Live:** [cockpit.rapold.io](https://cockpit.rapold.io)

---

## Features

| Module | What it shows |
|--------|---------------|
| **KPI Tiles** | Commits today / week / month, velocity trend, open Issues & PRs |
| **Commit Calendar** | GitHub-style contribution heatmap (12 months) |
| **Hour / Day Heatmap** | Work pattern matrix (when you code) |
| **Active Repos** | Most-active repositories this week, across all orgs |
| **Language Stats** | Aggregated language breakdown, per-repo detail |
| **Infra Stats** | Vercel deployments & success rate, Supabase DB health |
| **Dependency Scanner** | Package usage, framework distribution, category breakdown |
| **Health Monitor** | Uptime checks for arbitrary URLs |
| **Live Feed** | Real-time event ticker (push, PR, issue, review) |
| **Kiosk Mode** | Fullscreen auto-rotating slides for wall displays |

Multi-org support: track commits, issues and deployments across **multiple GitHub organisations**, personal repos, **multiple Vercel teams** and **all Supabase projects** you own.

---

## Architecture

```
public/
  index.html          ← Entire UI (vanilla JS, CDN libs)
  manifest.json       ← PWA manifest
  data.json           ← Pre-generated commit data (GitHub Actions)
  data-deps.json      ← Pre-generated dependency data
  data-history.json   ← Historical trend data

api/
  github-stats.js     ← Live GitHub KPIs (commits, issues, PRs)
  language-stats.js   ← Language breakdown + event ticker
  infra-stats.js      ← Vercel + Supabase metrics
  health-check.js     ← URL uptime probe

scripts/
  generate-data.mjs   ← Batch commit fetcher (runs in CI)
  scan-deps.mjs       ← Dependency scanner (runs in CI)
  generate-assets.mjs ← SVG favicon, OG image, touch icon

.github/workflows/
  update-data.yml     ← Scheduled data refresh (3×/day)
```

No `npm install` required. Node 20+ only needed for scripts and serverless functions.

---

## Quick Start

### 1. Fork & Deploy

```bash
# Import on Vercel — no build command, output directory is "public"
```

### 2. Environment Variables

Set these in **Vercel → Project Settings → Environment Variables** (or copy `.env.example` to `.env` for local dev):

| Variable | Required | Purpose |
|----------|----------|---------|
| `GITHUB_TOKEN` | Yes | GitHub PAT with `repo` + `read:org` scope |
| `GITHUB_USER` | Yes | Your GitHub login |
| `GITHUB_ORGS` | Yes | Comma-separated org names |
| `VERCEL_API_KEY` | No | Vercel REST API token |
| `VERCEL_TEAM_IDS` | No | Comma-separated Vercel Team IDs |
| `SUPABASE_ACCESS_TOKEN` | No | Supabase Management API token |
| `HEALTH_TARGETS` | No | JSON array of `{ name, url }` for uptime checks |

> **Security note:** All tokens are server-side only (Vercel Serverless Functions). They are never exposed to the browser.

### 3. Generate Static Data

```bash
node scripts/generate-data.mjs    # → public/data.json + data-history.json
node scripts/scan-deps.mjs        # → public/data-deps.json
node scripts/generate-assets.mjs  # → public/og-image.svg, favicon.svg, apple-touch-icon.svg
```

### 4. GitHub Actions (optional)

The included workflow (`.github/workflows/update-data.yml`) runs 3×/day and on manual dispatch. Required repository secrets:

| Secret | Value |
|--------|-------|
| `GH_PAT` | GitHub PAT |
| `COCKPIT_USER` | GitHub login |
| `COCKPIT_ORGS` | Comma-separated org names |
| `COCKPIT_HUMAN_AUTHORS` | Optional: human author logins |

Repository variable: `APP_URL` (e.g. `https://cockpit.rapold.io`) for health-check alerting.

---

## Local Development

```bash
cp .env.example .env
# Fill in your tokens

vercel dev          # Runs serverless functions locally
```

No dependencies to install. Open `http://localhost:3000`.

---

## Customisation

- **Portfolio table & project links** — edit the `DATA` array in `public/index.html`
- **Branding & colors** — `scripts/generate-assets.mjs`, then regenerate
- **Health targets** — set `HEALTH_TARGETS` env var or edit `api/health-check.js`
- **Tracked orgs** — update `GITHUB_ORGS` (env var), no code changes needed

---

## Security

- No secrets in the repository — verified via automated audit
- `.env`, `.env.local`, `.env.*.local` are git-ignored
- All API tokens stay server-side (Vercel Serverless Functions)
- `GITHUB_` prefix variables use repository **secrets** (not variables) in GitHub Actions due to naming restrictions
- Content Security: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` headers set via `vercel.json`

---

## License

MIT — see [LICENSE](LICENSE).
