# Workload-Portfolio

Forkbares, statisches **Workload- und Delivery-Dashboard** mit Live-KPIs (GitHub, Vercel, Supabase), Commit-Kalender, Tech-Stack-Analyse, Uptime-Checks und Kiosk-Modus. Deploy auf [Vercel](https://vercel.com) mit Serverless-APIs unter `api/`.

## Schnellstart

1. **Fork** dieses Repository.
2. **Vercel**: Projekt importieren, Root belassen, `outputDirectory` ist `public` (siehe `vercel.json`).
3. **Umgebungsvariablen** in Vercel (oder lokal `.env` aus `.env.example`) setzen — siehe unten.
4. **Daten aktualisieren**: `node scripts/generate-data.mjs` und `node scripts/scan-deps.mjs` (benötigen `GITHUB_TOKEN` und `GITHUB_ORG`), oder GitHub Actions Workflow `.github/workflows/update-data.yml` mit Secrets/Variablen verbinden.

## Umgebungsvariablen

| Variable | Zweck |
|----------|--------|
| `GITHUB_TOKEN` | GitHub PAT für APIs und Skripte |
| `GITHUB_ORG` | Organisation (oder User-Name bei User-Repos — dann ggf. Code anpassen) |
| `GITHUB_USER` | Dein GitHub-Login (u.a. `github-stats`, `scan-deps`) |
| `GITHUB_HUMAN_AUTHORS` | Optional: kommaseparierte Logins für Human/AI-Split in `generate-data` |
| `VERCEL_API_KEY` | Optional: Vercel REST API für Infra-Kachel |
| `VERCEL_TEAM_ID` | Optional: Team-ID; leer lassen für Hobby/Personal |
| `SUPABASE_ACCESS_TOKEN` | Optional: Management API für DB-Details |
| `SUPABASE_PROJECTS` | Optional: JSON-Array von Projekten (siehe `api/infra-stats.js`) |
| `HEALTH_TARGETS` | Optional: JSON-Array `{ name, url }` für `/api/health-check` |

Repository-Variablen für Actions (unter *Settings → Secrets and variables*): `GH_PAT` (Secret), sowie `GITHUB_ORG`, `GITHUB_USER`, `APP_URL` (Variables).

## Lokale Entwicklung

```bash
# Keine npm-Dependencies nötig — Node 20+
cp .env.example .env
# .env ausfüllen

node scripts/generate-data.mjs
node scripts/scan-deps.mjs
node scripts/generate-assets.mjs
```

Vercel CLI: `vercel dev` (führt `api/*` lokal aus).

## Anpassung

- **Portfolio-Tabelle & Texte**: `public/index.html` — Konstante `DATA`, Texte, `APP_GITHUB_REPO`.
- **Branding**: `scripts/generate-assets.mjs` (Farben, Titel), danach `node scripts/generate-assets.mjs`.
- **Health-Checks**: `api/health-check.js` oder nur `HEALTH_TARGETS`.

## Lizenz

MIT — siehe `LICENSE`.
