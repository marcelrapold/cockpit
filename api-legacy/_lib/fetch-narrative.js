const { readFileSync } = require('fs');
const { join } = require('path');
const { createHash } = require('crypto');
const { get, getRaw, setWithTtl, setRaw, KEYS, TTL_LLM } = require('./cache');

const MODEL_ID = 'anthropic/claude-sonnet-4-6';
const MAX_RETRIES = 2;

function readJsonFile(relativePath) {
  try {
    const raw = readFileSync(join(process.cwd(), relativePath), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function last7DaysCommits(calendar) {
  if (!calendar) return 0;
  const now = new Date();
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    total += calendar[d.toISOString().slice(0, 10)] || 0;
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
    total += calendar[d.toISOString().slice(0, 10)] || 0;
  }
  return total;
}

function topActiveReposLastWeek(calendar, repoMonthly, sparklines) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  return Object.entries(repoMonthly || {})
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
      repo, name: meta.name, work: meta.work, mode: meta.mode,
      lc: meta.lc, pt: meta.ptMid, cat: meta.cat, note: meta.lcNote,
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

function enrichTopRepos(topRepos, repoSummaries) {
  if (!repoSummaries) return topRepos;
  return topRepos.map(r => {
    const s = repoSummaries[r.repo];
    if (!s) return r;
    return {
      ...r,
      oneLiner: s.oneLiner, purpose: s.purpose, stack: s.stack,
      audience: s.audience, status: s.status, tags: s.tags,
    };
  });
}

function enrichInitiatives(initiatives, repoSummaries) {
  if (!repoSummaries) return initiatives;
  return initiatives.map(i => {
    const s = repoSummaries[i.repo];
    if (!s) return i;
    return { ...i, oneLiner: s.oneLiner, purpose: s.purpose, audience: s.audience };
  });
}

async function loadRepoSummaries() {
  // Prefer freshly-cached summaries from Redis; fall back to bundled JSON if cache is empty.
  try {
    const cached = await get(KEYS.repos);
    if (cached?.repos) return cached.repos;
  } catch {}
  const bundled = readJsonFile('public/data-repos.json');
  return bundled?.repos || null;
}

async function buildContext() {
  const data = readJsonFile('public/data.json');
  const deps = readJsonFile('public/data-deps.json');
  const history = readJsonFile('public/data-history.json');
  const portfolio = readJsonFile('api/portfolio-config.json');
  if (!data || !deps || !portfolio) {
    throw new Error('Missing input data: data.json / data-deps.json / portfolio-config.json');
  }
  const repoSummaries = await loadRepoSummaries();
  const week = last7DaysCommits(data.calendar);
  const month = last30DaysCommits(data.calendar);
  const topRepos = enrichTopRepos(
    topActiveReposLastWeek(data.calendar, data.repoMonthly, data.sparklines),
    repoSummaries,
  );
  const folio = portfolioBreakdown(portfolio);
  folio.topInitiatives = enrichInitiatives(folio.topInitiatives, repoSummaries);
  const velocity = velocityPct(data.weeklyTrend || history);
  const repoIndex = repoSummaries
    ? Object.values(repoSummaries).map(s => ({
        full: s.full, oneLiner: s.oneLiner, status: s.status, tags: s.tags,
      }))
    : [];
  return {
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
    repoIndex,
    hasRepoSummaries: !!repoSummaries,
  };
}

function hashContext(context) {
  return createHash('sha256').update(JSON.stringify(context)).digest('hex').slice(0, 16);
}

function buildSchema(z) {
  return z.object({
    teaser: z.string().max(260).describe('1–2 Sätze deutscher Hook-Text, max ~220 Zeichen. Enthält eine konkrete Zahl oder ein konkretes Projekt. Macht Lust aufs Weiterlesen.'),
    extended: z.array(z.string()).min(3).max(5).describe('3–5 Absätze Management-Prosa auf Deutsch. Worin investiert Marcel gerade? Was hat sich in den letzten Wochen verschoben? Wo liegt der Fokus? Konkret, zahlenbasiert, aber in Fliesstext — keine Aufzählungen, keine Bullet-Points, keine Floskeln.'),
    weekly: z.string().describe('Ein zusammenhängender deutscher Absatz (3–5 Sätze) über die letzte Woche. Welche Repos waren aktiv? Welche Art Arbeit? Rhythmus, Schwerpunkte? Darf Zahlen aus den letzten 7 Tagen nennen. Keine Wiederholung von Teaser oder Extended.'),
    strategic: z.string().describe('Ein deutscher Absatz (3–5 Sätze) mit forward-looking Beobachtungen. Was fällt im Portfolio-Mix auf, wo entsteht Risiko oder Hebel, welcher nächste Schritt liegt nahe? Keine Wiederholung von Teaser, Extended oder Weekly.'),
  });
}

async function generateWithRetry(context) {
  const { generateObject } = await import('ai');
  const { gateway } = await import('@ai-sdk/gateway');
  const { z } = await import('zod');
  const schema = buildSchema(z);

  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const { object } = await generateObject({
        model: gateway(MODEL_ID),
        schema,
        system: [
          'Du bist ein Senior-Engineer-Manager und schreibst einen knappen, deutschen Management-Report über die Engineering-Aktivität von Marcel Rapold.',
          'Regeln:',
          '- Keine Emojis, keine Marketing-Floskeln, keine Aufzählungen oder Bullet-Points.',
          '- Jede Sektion hat einen eigenen Fokus und darf Formulierungen anderer Sektionen nicht wiederholen.',
          '- Teaser = Hook mit einer konkreten Zahl oder einem konkreten Projektnamen und WAS das Projekt tut.',
          '- Extended = Management-Prosa in Absätzen (investiert-in / verschoben / Fokus / Risiken).',
          '- Weekly = Wochen-Narrativ aus den letzten 7 Tagen.',
          '- Strategic = Forward-Looking (Hebel, Risiko, nächster logischer Schritt).',
          '- WICHTIG: Wenn ein Projekt genannt wird, nenne IMMER seinen konkreten Zweck — nutze die Purpose/OneLiner-Felder aus topRepos und topInitiatives. "zvv-kundenkonto" ist nicht informativ, "das Self-Service-Portal für ZVV-Abonnenten (zvv-kundenkonto)" schon.',
          '- Zahlen nur aus den bereitgestellten Daten zitieren, niemals erfinden. Gleiches gilt für Projekt-Zwecke: wenn Purpose fehlt, nicht erraten.',
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
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw lastErr;
}

/**
 * Generate (or reuse) the narrative.
 *
 * @param {Object} opts
 * @param {boolean} opts.force          - bypass hash-skip
 * @returns {Promise<{ payload: object, skipped: boolean, reason?: string }>}
 */
async function fetchNarrative(opts = {}) {
  // Auth wird komplett von @ai-sdk/gateway übernommen:
  //   1. AI_GATEWAY_API_KEY (env, manuell)
  //   2. VERCEL_OIDC_TOKEN — auf Vercel Functions als request-header `x-vercel-oidc-token`
  //      injiziert; @vercel/oidc holt es daraus, NICHT aus process.env.
  // Deshalb hier KEIN process.env-Pre-Flight-Check (würde im Funktions-Runtime
  // fälschlich failen, obwohl der Header da ist).

  const context = await buildContext();
  const dataHash = hashContext(context);

  if (!opts.force) {
    try {
      const lastHash = await getRaw(KEYS.narrativeHash);
      if (lastHash === dataHash) {
        const cached = await get(KEYS.narrative);
        if (cached) {
          return { payload: cached, skipped: true, reason: 'hash-unchanged' };
        }
      }
    } catch {}
  }

  const object = await generateWithRetry(context);
  const payload = {
    generatedAt: new Date().toISOString(),
    model: MODEL_ID,
    dataHash,
    teaser: object.teaser,
    extended: object.extended,
    weekly: object.weekly,
    strategic: object.strategic,
  };

  await setWithTtl(KEYS.narrative, payload, TTL_LLM);
  await setRaw(KEYS.narrativeHash, dataHash, TTL_LLM);

  return { payload, skipped: false };
}

module.exports = fetchNarrative;
module.exports.buildContext = buildContext;
module.exports.MODEL_ID = MODEL_ID;
