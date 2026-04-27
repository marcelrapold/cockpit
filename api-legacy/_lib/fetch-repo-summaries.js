const { createHash } = require('crypto');
const { get, getRaw, setWithTtl, setRaw, KEYS, TTL_LLM } = require('./cache');

const MODEL_ID = 'anthropic/claude-sonnet-4-6';
const README_MAX = 1800;
const FACTS_CONCURRENCY = 6;
const BATCH_SIZE = 10;
const LLM_CONCURRENCY = 3;

function ghHeaders(token, accept) {
  return {
    Authorization: `token ${token}`,
    Accept: accept,
    'User-Agent': 'cockpit-runtime',
  };
}

async function ghJson(url, token) {
  const res = await fetch(url, { headers: ghHeaders(token, 'application/vnd.github+json') });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${url}`);
  return res.json();
}

async function ghRaw(url, token) {
  const res = await fetch(url, { headers: ghHeaders(token, 'application/vnd.github.raw') });
  if (!res.ok) return '';
  return res.text();
}

async function listPaginated(baseUrl, token) {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const sep = baseUrl.includes('?') ? '&' : '?';
    const data = await ghJson(`${baseUrl}${sep}per_page=100&page=${page}`, token);
    if (!Array.isArray(data) || !data.length) break;
    out.push(...data);
    if (data.length < 100) break;
  }
  return out;
}

async function listAllRepos(token, user, orgs) {
  const seen = new Set();
  const all = [];
  for (const org of orgs) {
    try {
      const orgRepos = await listPaginated(`https://api.github.com/orgs/${org}/repos?type=all`, token);
      for (const r of orgRepos) if (!seen.has(r.full_name)) { seen.add(r.full_name); all.push(r); }
    } catch (err) {
      console.error(`[repo-summaries] org ${org} failed: ${err.message}`);
    }
  }
  try {
    const userRepos = await listPaginated(`https://api.github.com/users/${user}/repos?type=owner`, token);
    for (const r of userRepos) if (!seen.has(r.full_name)) { seen.add(r.full_name); all.push(r); }
  } catch (err) {
    console.error(`[repo-summaries] user repos failed: ${err.message}`);
  }
  return all;
}

async function fetchFacts(repo, token) {
  const [readmeRaw, pkgText] = await Promise.all([
    ghRaw(`https://api.github.com/repos/${repo.full_name}/readme`, token),
    ghRaw(`https://api.github.com/repos/${repo.full_name}/contents/package.json?ref=${repo.default_branch || 'main'}`, token),
  ]);
  let pkgDescription = '';
  let pkgDeps = [];
  if (pkgText) {
    try {
      const pkg = JSON.parse(pkgText);
      pkgDescription = pkg.description || '';
      pkgDeps = Object.keys(pkg.dependencies || {}).slice(0, 20);
    } catch {}
  }
  return {
    full: repo.full_name,
    name: repo.name,
    owner: repo.owner?.login,
    ghDescription: repo.description || '',
    topics: repo.topics || [],
    language: repo.language || '',
    visibility: repo.private ? 'private' : 'public',
    archived: !!repo.archived,
    fork: !!repo.fork,
    pushedAt: repo.pushed_at,
    stars: repo.stargazers_count || 0,
    pkgDescription,
    pkgDeps,
    readme: (readmeRaw || '').slice(0, README_MAX),
  };
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      try { out[idx] = await fn(items[idx], idx); }
      catch (err) { out[idx] = { error: err.message, repo: items[idx]?.full_name }; }
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return out;
}

function buildSchemas(z) {
  const Summary = z.object({
    full: z.string().describe('Exakt der full_name wie im Input (owner/repo).'),
    oneLiner: z.string().max(200).describe('Google-Grade Einzeiler: Was ist es, für wen, mit welchem Stack. Max 180 Zeichen. Beispiele-Stil: "Self-service portal for ZVV subscribers to manage transit accounts, built on Next.js + Supabase." — sachlich, keine Marketing-Sprache.'),
    purpose: z.string().describe('2–3 Sätze: Welches konkrete Problem löst das Projekt oder welche Funktion erfüllt es. Engineering-Ton, keine Floskeln. Darf aus README/Description/Dependencies inferieren, aber nicht erfinden — wenn unklar, so schreiben ("unklar aus README").'),
    stack: z.string().describe('Tech-Stack als kompakte, kommagetrennte Tag-Liste, z.B. "Next.js 15 · Supabase · Vercel · Tailwind". Nur was aus Dependencies oder README ersichtlich ist.'),
    audience: z.string().describe('Primäre Nutzer oder Konsumenten in einer Phrase (z.B. "ZVV-Kunden (public)", "Internes Team", "API-Clients", "Eigengebrauch").'),
    status: z.enum(['active', 'stable', 'pilot', 'spec', 'experimental', 'archived', 'dormant']).describe('Aktueller Lebenszyklus-Status.'),
    tags: z.array(z.string()).min(1).max(6).describe('3–6 prägnante Domain-Tags in Kleinbuchstaben (z.B. "transit", "ai", "internal-tool", "portal").'),
  });
  return { Summary, Output: z.object({ summaries: z.array(Summary) }) };
}

async function summarizeBatch(facts) {
  const { generateObject } = await import('ai');
  const { gateway } = await import('@ai-sdk/gateway');
  const { z } = await import('zod');
  const { Output } = buildSchemas(z);

  const system = [
    'You are a senior staff engineer writing Google-grade repository descriptions for an engineering portfolio dashboard.',
    'Rules:',
    '- Purpose, not marketing. Every sentence earns its place.',
    '- Ground every claim in the provided facts (README, description, dependencies, topics, language). Do not invent features.',
    '- If the facts are too thin to describe purpose, say so explicitly — "Zweck aus README nicht ableitbar".',
    '- oneLiner: one sentence, Google/ShipIt style. What it does, for whom, on what stack.',
    '- purpose: 2–3 sentences, engineering tone, concrete.',
    '- Language for prose fields (oneLiner, purpose, audience): German.',
    '- stack and tags stay technical, lowercase, English-or-technical where appropriate.',
    '- For every repo in the input, produce exactly one summary with the matching full_name.',
  ].join('\n');

  const userPrompt = [
    'Für jedes Repo unten einen normalisierten Eintrag erzeugen. Antwort-Format strikt nach Schema.',
    '```json',
    JSON.stringify(facts, null, 2),
    '```',
  ].join('\n');

  const { object } = await generateObject({
    model: gateway(MODEL_ID),
    schema: Output,
    system,
    prompt: userPrompt,
  });
  return object.summaries;
}

function buildRepoListSignature(repos) {
  // pushed_at is the cheapest "did anything change" proxy GitHub gives us;
  // pair it with full_name so newly-added repos also bust the cache.
  const sig = repos
    .map(r => `${r.full_name}|${r.pushed_at || ''}|${r.archived ? 1 : 0}`)
    .sort()
    .join('\n');
  return createHash('sha256').update(sig).digest('hex').slice(0, 16);
}

/**
 * Generate (or reuse) repo summaries.
 * Hash-skip strategy: list repos via GitHub API (cheap), hash full_name + pushed_at,
 * skip the entire LLM run if nothing changed since last cron tick.
 *
 * @param {Object} opts
 * @param {boolean} opts.force - bypass hash-skip
 * @returns {Promise<{ payload: object, skipped: boolean, reason?: string }>}
 */
async function fetchRepoSummaries(opts = {}) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN required');
  // Auth wird von @ai-sdk/gateway gehandhabt: AI_GATEWAY_API_KEY oder OIDC.
  // Auf Vercel Functions kommt der OIDC-Token als request-header `x-vercel-oidc-token`
  // (nicht als process.env), deshalb hier KEIN Pre-Flight-Check.

  const user = process.env.GITHUB_USER || 'muraschal';
  const orgs = (process.env.GITHUB_ORGS || '').split(',').map(s => s.trim()).filter(Boolean);

  const repos = await listAllRepos(token, user, orgs);
  const relevant = repos.filter(r => !r.fork);
  const listHash = buildRepoListSignature(relevant);

  if (!opts.force) {
    try {
      const lastHash = await getRaw(KEYS.reposHash);
      if (lastHash === listHash) {
        const cached = await get(KEYS.repos);
        if (cached) {
          return { payload: cached, skipped: true, reason: 'hash-unchanged' };
        }
      }
    } catch {}
  }

  console.log(`[repo-summaries] running LLM for ${relevant.length} repos (hash ${listHash})`);

  const facts = await mapLimit(relevant, FACTS_CONCURRENCY, repo => fetchFacts(repo, token));
  const clean = facts.filter(f => f && !f.error);

  const batches = [];
  for (let i = 0; i < clean.length; i += BATCH_SIZE) {
    batches.push(clean.slice(i, i + BATCH_SIZE));
  }

  const batchResults = await mapLimit(batches, LLM_CONCURRENCY, async (batch, idx) => {
    try {
      const out = await summarizeBatch(batch);
      console.log(`[repo-summaries] batch ${idx + 1}/${batches.length} ok — ${out.length} summaries`);
      return out;
    } catch (err) {
      console.error(`[repo-summaries] batch ${idx + 1}/${batches.length} failed: ${err.message}`);
      return [];
    }
  });

  const summaries = batchResults.flat();
  if (summaries.length === 0) {
    throw new Error('All LLM batches failed — refusing to overwrite cache with empty output');
  }

  const byRepo = {};
  for (const s of summaries) byRepo[s.full] = s;

  const payload = {
    generatedAt: new Date().toISOString(),
    model: MODEL_ID,
    count: summaries.length,
    listHash,
    orgs,
    user,
    repos: byRepo,
  };

  await setWithTtl(KEYS.repos, payload, TTL_LLM);
  await setRaw(KEYS.reposHash, listHash, TTL_LLM);

  return { payload, skipped: false };
}

module.exports = fetchRepoSummaries;
module.exports.MODEL_ID = MODEL_ID;
