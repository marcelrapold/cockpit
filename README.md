# Cockpit

Cross-platform engineering dashboard that tracks **GitHub**, **Vercel** and **Supabase** activity in a single view. Built with Next.js and server-side API routes, with cached data pipelines for portfolio, infrastructure and engineering velocity analysis.

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
| **Lunar Velocity** | Full-moon correlation analysis for commits, PRs, releases, tags, deployments and closed issues |
| **Kiosk Mode** | Fullscreen auto-rotating slides for wall displays |

Multi-org support: track commits, issues and deployments across **multiple GitHub organisations**, personal repos, **multiple Vercel teams** and **all Supabase projects** you own.

---

## Architecture

```
app/
  page.tsx            ← Cockpit dashboard
  lunar/page.tsx      ← Lunar Velocity dashboard
  api/                ← Next.js API routes

components/
  hero/               ← Cockpit KPI and narrative sections
  lunar/              ← Lunar Velocity client dashboard

lib/
  lunar/              ← GitHub collector, moon phases, scoring, stats, exports

api-legacy/
  _lib/               ← Existing reusable fetchers/cache adapters

scripts/
  generate-data.mjs   ← Batch commit fetcher (runs in CI)
  scan-deps.mjs       ← Dependency scanner (runs in CI)
  generate-assets.mjs ← SVG favicon, OG image, touch icon

.github/workflows/
  update-data.yml     ← Scheduled data refresh (3×/day)
```

Node 22 is the production target. The app also runs locally on newer Node versions, though npm may print an engine warning.

---

## Quick Start

### 1. Fork & Deploy

```bash
npm install
npm run dev
```

### 2. Environment Variables

Set these in **Vercel → Project Settings → Environment Variables** (or copy `.env.example` to `.env` for local dev):

| Variable | Required | Purpose |
|----------|----------|---------|
| `GITHUB_TOKEN` | Yes | GitHub PAT with `repo` + `read:org` scope |
| `GITHUB_USER` | Yes | Your GitHub login |
| `GITHUB_ORGS` | Yes | Comma-separated org names |
| `GITHUB_AUTHOR_LOGINS` | No | Additional GitHub author logins that should count as the same person |
| `GITHUB_AUTHOR_EMAILS` | No | Additional Git commit author emails to aggregate; used server-side and masked in public payloads |
| `GITHUB_REPO_OWNERS` | No | Additional personal/user repo owners to search, beyond `GITHUB_USER` |
| `GITHUB_ZVV_ORGS` | No | Orgs included by `scope=zvv`, defaults to org names containing `zvv` |
| `GITHUB_SCOPE` | No | Default contribution scope: `all`, `private`, `organizations`, or `zvv` |
| `COCKPIT_EXPOSURE_MODE` | No | `public` redacts business/internal details; `private` shows the full operating view |
| `COCKPIT_PRIVATE_BASIC_AUTH` | Required for private mode | `username:password` credentials for the same-domain private Cockpit |
| `COCKPIT_PUBLIC_REDACT_OWNERS` | No | Comma-separated repo owners redacted in public mode |
| `COCKPIT_CORS_ORIGIN` | No | Allowed browser origin for public API CORS, defaults to `https://cockpit.rapold.io` |
| `LUNAR_GITHUB_USER` | No | GitHub login for Lunar Velocity, defaults to `marcel` |
| `LUNAR_GITHUB_TOKEN` | No | Optional separate PAT for Lunar Velocity; falls back to `GITHUB_TOKEN` |
| `LUNAR_GITHUB_ORGS` | No | Optional org owners included in Lunar repo scan; falls back to `GITHUB_ORGS` |
| `LUNAR_CACHE_DIR` | No | Local JSON cache directory, defaults to `.lunar-cache` |
| `NEXT_PUBLIC_LUNAR_VELOCITY_SUMMARY_URL` | No | Optional external Lunar `/api/summary` endpoint for the Cockpit home-card; defaults to same-origin `/api/summary` |
| `VERCEL_API_KEY` | No | Vercel REST API token |
| `VERCEL_TEAM_IDS` | No | Comma-separated Vercel Team IDs |
| `SUPABASE_ACCESS_TOKEN` | No | Supabase Management API token |
| `HEALTH_TARGETS` | No | JSON array of `{ name, url }` for uptime checks |
| `COCKPIT_PUBLIC_FALLBACK_ORIGIN` | No | Optional public Cockpit origin used for local SSR fallbacks; disabled by default |

> **Security note:** All tokens are server-side only. They are never exposed to the browser.

GitHub token scopes:

- Fine-grained PAT: repository read access for target repositories, plus metadata read.
- Classic PAT: `repo` for private repositories and `read:org` for organization membership.
- Public-only analysis can work with less access, but private repos, deployments and organization repos will be incomplete.

### 3. Generate Static Data

```bash
node scripts/generate-data.mjs    # → data/private/data.json + data-history.json
node scripts/scan-deps.mjs        # → data/private/data-deps.json
node scripts/generate-assets.mjs  # → public/og-image.svg, favicon.svg, apple-touch-icon.svg
```

### 4. GitHub Actions (optional)

The included workflow (`.github/workflows/update-data.yml`) runs 3×/day and on manual dispatch. Required repository secrets:

| Secret | Value |
|--------|-------|
| `GH_PAT` | GitHub PAT |
| `COCKPIT_USER` | GitHub login |
| `COCKPIT_ORGS` | Comma-separated org names |
| `COCKPIT_AUTHOR_LOGINS` | Optional: additional GitHub author aliases |
| `COCKPIT_AUTHOR_EMAILS` | Optional: additional Git commit author emails |
| `COCKPIT_REPO_OWNERS` | Optional: additional personal/user repo owners |
| `COCKPIT_ZVV_ORGS` | Optional: orgs included by `scope=zvv` |
| `COCKPIT_HUMAN_AUTHORS` | Optional: human author logins |

Repository variable: `APP_URL` (e.g. `https://cockpit.rapold.io`) for health-check alerting.

---

## Local Development

```bash
cp .env.example .env.local
# Fill in your tokens

npm run dev
```

Open `http://localhost:3000`. Lunar Velocity is available at `http://localhost:3000/lunar`.

---

## Lunar Velocity

Lunar Velocity asks: **“Does Marcel ship more when the moon is full?”**

Cockpit home-card contract:

- Client fetches `NEXT_PUBLIC_LUNAR_VELOCITY_SUMMARY_URL?window=2` when configured.
- Otherwise it fetches same-origin `/api/summary?window=2`.
- Cockpit displays live GitHub-backed Lunar data only.
- Expected endpoint shape:

```json
{
  "generatedAt": "...",
  "username": "marcel",
  "periodStart": "YYYY-MM-DD",
  "periodEnd": "YYYY-MM-DD",
  "fullMoonWindowDays": 2,
  "velocityPctDiff": 48,
  "evidence": "moderate",
  "direction": "higher",
  "pValue": 0,
  "mostAffectedRepo": "marcel/radiox",
  "topDaysInFullMoonShare": 50,
  "verdict": "Marcel ships 48% more around the full moon (p=0.000, moderate evidence).",
  "detailUrl": "https://lunar.example/?start=...&end=...&window=2"
}
```

Data sources:

- GitHub REST API repositories visible to the token.
- Commits authored by the configured user, excluding merge commits by default.
- Pull requests authored by the configured user, counted on creation and merge dates.
- Releases, tags and deployments where GitHub exposes enough metadata.
- Issues authored by the configured user and closed in the analysis range.

Moon phases:

- Computed with `astronomy-engine`; full moon is `SearchMoonPhase(180, ...)`, new moon is `SearchMoonPhase(0, ...)`.
- No full-moon table is hardcoded.

Velocity score:

```txt
commits * 1
+ pullRequestsCreated * 3
+ pullRequestsMerged * 5
+ releases * 8
+ deployments * 10
+ issuesClosed * 2
+ tags * 4
```

The weights live in `lib/lunar/config.ts`.

Statistics:

- Mean and median score/day for the selected full-moon window vs baseline.
- Window comparisons for ±1, ±2, ±3 and ±5 days.
- Top-10 output days and the share that fall inside a full-moon window.
- Repository-specific score and full-moon lift.
- Bootstrap comparison and Cohen’s d effect size.
- Evidence level: weak, moderate or strong, based on sample size, effect size, bootstrap tail probability and percentage lift.

Exports:

- JSON: `/api/lunar/export?format=json`
- CSV: `/api/lunar/export?format=csv`
- Use the dashboard export buttons to include the current live-data filters.

Limitations:

- GitHub does not expose every kind of “shipping” event equally. Vercel deployments triggered by bots are excluded when bot filtering is enabled.
- PR merge counts currently mean PRs authored by the configured user that were merged, not every PR merged by that user.
- Tags are repository events; author attribution can be incomplete for lightweight tags.
- Lines changed are optional because per-commit stats require extra API calls and can burn rate limit quickly.
- Statistical significance is exploratory. A strong-looking lift can still be confounded by weekday patterns, release cycles or project deadlines.

---

## Customisation

- **Portfolio table & project links** — edit the `DATA` array in `public/index.html`
- **Branding & colors** — `scripts/generate-assets.mjs`, then regenerate
- **Health targets** — set `HEALTH_TARGETS` env var or edit `api/health-check.js`
- **Tracked orgs** — update `GITHUB_ORGS` (env var), no code changes needed
- **Lunar scoring** — edit `DEFAULT_VELOCITY_WEIGHTS` in `lib/lunar/config.ts`

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
