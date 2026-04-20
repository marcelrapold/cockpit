#!/usr/bin/env node
import { writeFileSync, readFileSync } from 'fs';
import { createHash } from 'crypto';
import { generateObject } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { z } from 'zod';

const MODEL_ID = 'anthropic/claude-sonnet-4-6';
const MAX_RETRIES = 2;

const Narrative = z.object({
  teaser: z.string().max(260).describe('1–2 Sätze deutscher Hook-Text, max ~220 Zeichen. Enthält eine konkrete Zahl oder ein konkretes Projekt. Macht Lust aufs Weiterlesen.'),
  extended: z.array(z.string()).min(3).max(5).describe('3–5 Absätze Management-Prosa auf Deutsch. Worin investiert Marcel gerade? Was hat sich in den letzten Wochen verschoben? Wo liegt der Fokus? Konkret, zahlenbasiert, aber in Fliesstext — keine Aufzählungen, keine Bullet-Points, keine Floskeln.'),
  weekly: z.string().describe('Ein zusammenhängender deutscher Absatz (3–5 Sätze) über die letzte Woche. Welche Repos waren aktiv? Welche Art Arbeit? Rhythmus, Schwerpunkte? Darf Zahlen aus den letzten 7 Tagen nennen. Keine Wiederholung von Teaser oder Extended.'),
  strategic: z.string().describe('Ein deutscher Absatz (3–5 Sätze) mit forward-looking Beobachtungen. Was fällt im Portfolio-Mix auf, wo entsteht Risiko oder Hebel, welcher nächste Schritt liegt nahe? Keine Wiederholung von Teaser, Extended oder Weekly.'),
});

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function last7DaysCommits(calendar) {
  if (!calendar) return 0;
  const now = new Date();
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    total += calendar[key] || 0;
  }
  return total;
}

function last30DaysCommits(calendar) {
  if (!calendar) return 0;
  const now = new Date();
  let total = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    total += calendar[key] || 0;
  }
  return total;
}

function topActiveReposLastWeek(calendar, repoMonthly, sparklines) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const ranked = Object.entries(repoMonthly || {})
    .map(([repo, months]) => {
      const sparkline = sparklines?.[repo] || [];
      const last6Sum = sparkline.reduce((a, b) => a + (b || 0), 0);
      return {
        repo,
        thisMonth: months[currentMonth] || 0,
        last6Months: last6Sum,
        recent: sparkline.slice(-2).reduce((a, b) => a + (b || 0), 0),
      };
    })
    .filter(r => r.recent > 0 || r.thisMonth > 0)
    .sort((a, b) => b.recent - a.recent || b.thisMonth - a.thisMonth)
    .slice(0, 8);
  return ranked;
}

function portfolioBreakdown(portfolio) {
  const overrides = portfolio?.overrides || {};
  const byMode = {};
  const byLc = {};
  const byCat = {};
  let totalPt = 0;
  let prodCount = 0;
  const initiatives = [];
  for (const [repo, meta] of Object.entries(overrides)) {
    byMode[meta.mode] = (byMode[meta.mode] || 0) + 1;
    byLc[meta.lc] = (byLc[meta.lc] || 0) + 1;
    byCat[meta.cat] = (byCat[meta.cat] || 0) + 1;
    totalPt += meta.ptMid || 0;
    if (meta.lc === 'prod') prodCount++;
    initiatives.push({
      repo,
      name: meta.name,
      work: meta.work,
      mode: meta.mode,
      lc: meta.lc,
      pt: meta.ptMid,
      cat: meta.cat,
      note: meta.lcNote,
    });
  }
  initiatives.sort((a, b) => (b.pt || 0) - (a.pt || 0));
  return {
    total: Object.keys(overrides).length,
    byMode, byLc, byCat,
    totalPt, prodCount,
    topInitiatives: initiatives.slice(0, 10),
  };
}

function velocityPct(weeklyTrend) {
  if (!Array.isArray(weeklyTrend) || weeklyTrend.length < 2) return null;
  const last = weeklyTrend[weeklyTrend.length - 1]?.commits || 0;
  const prev = weeklyTrend[weeklyTrend.length - 2]?.commits || 0;
  if (prev === 0) return null;
  return Math.round(((last - prev) / prev) * 100);
}

function buildContext() {
  const data = readJson('public/data.json');
  const deps = readJson('public/data-deps.json');
  const history = readJson('public/data-history.json');
  const portfolio = readJson('api/portfolio-config.json');

  if (!data || !deps || !portfolio) {
    throw new Error('Missing input data: data.json / data-deps.json / portfolio-config.json');
  }

  const week = last7DaysCommits(data.calendar);
  const month = last30DaysCommits(data.calendar);
  const topRepos = topActiveReposLastWeek(data.calendar, data.repoMonthly, data.sparklines);
  const folio = portfolioBreakdown(portfolio);
  const velocity = velocityPct(data.weeklyTrend || history);

  return {
    generated: new Date().toISOString(),
    activity: {
      totalCommits: data.totalCommits,
      last7Days: week,
      last30Days: month,
      velocityPctWoW: velocity,
      weeklyTrendRecent: (data.weeklyTrend || history || []).slice(-8),
      authors: data.authors,
      sparkMonths: data.sparkMonths,
    },
    topRepos,
    portfolio: folio,
    tech: {
      repoCount: deps.repoCount,
      uniquePackages: deps.uniquePackages,
      frameworks: deps.frameworks?.slice(0, 5) || [],
      topPackagesByCategory: (deps.categories || []).slice(0, 6).map(c => ({
        category: c.name, count: c.count,
      })),
      topPackages: (deps.topPackages || []).slice(0, 8).map(p => ({
        name: p.name, count: p.count, category: p.category,
      })),
    },
  };
}

async function generateWithRetry(context) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const { object } = await generateObject({
        model: gateway(MODEL_ID),
        schema: Narrative,
        system: [
          'Du bist ein Senior-Engineer-Manager und schreibst einen knappen, deutschen Management-Report über die Engineering-Aktivität von Marcel Rapold.',
          'Regeln:',
          '- Keine Emojis, keine Marketing-Floskeln, keine Aufzählungen oder Bullet-Points.',
          '- Jede Sektion hat einen eigenen Fokus und darf Formulierungen anderer Sektionen nicht wiederholen.',
          '- Teaser = Hook mit einer konkreten Zahl oder einem konkreten Projektnamen.',
          '- Extended = Management-Prosa in Absätzen (investiert-in / verschoben / Fokus / Risiken).',
          '- Weekly = Wochen-Narrativ aus den letzten 7 Tagen.',
          '- Strategic = Forward-Looking (Hebel, Risiko, nächster logischer Schritt).',
          '- Zahlen nur aus den bereitgestellten Daten zitieren, niemals erfinden.',
          '- Ton: sachlich, dicht, lesbar — kein Consulting-Sprech.',
        ].join('\n'),
        prompt: [
          'Hier ist der aktuelle Datenstand (JSON):',
          '```json',
          JSON.stringify(context, null, 2),
          '```',
          '',
          'Erzeuge daraus einen Management-Report mit den vier Sektionen teaser, extended, weekly, strategic.',
        ].join('\n'),
      });
      return object;
    } catch (err) {
      lastErr = err;
      if (attempt <= MAX_RETRIES) {
        const backoff = 1000 * attempt;
        console.error(`[narrative] attempt ${attempt} failed: ${err.message} — retrying in ${backoff}ms`);
        await new Promise(r => setTimeout(r, backoff));
      }
    }
  }
  throw lastErr;
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error('AI_GATEWAY_API_KEY required');
    process.exit(1);
  }

  const context = buildContext();
  const contextHash = createHash('sha256').update(JSON.stringify(context)).digest('hex').slice(0, 16);

  console.log(`[narrative] context ready — ${context.activity.last7Days} commits last 7d, ${context.portfolio.total} initiatives, hash ${contextHash}`);

  const object = await generateWithRetry(context);

  const payload = {
    generatedAt: new Date().toISOString(),
    model: MODEL_ID,
    dataHash: contextHash,
    teaser: object.teaser,
    extended: object.extended,
    weekly: object.weekly,
    strategic: object.strategic,
  };

  writeFileSync('public/data-narrative.json', JSON.stringify(payload, null, 2) + '\n');
  console.log(`[narrative] wrote public/data-narrative.json (${payload.extended.length} extended paragraphs)`);
}

main().catch(err => {
  console.error('[narrative] fatal:', err.message);
  process.exit(1);
});
