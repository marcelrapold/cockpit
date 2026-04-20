#!/usr/bin/env node
import { writeFileSync } from 'fs';
import { generateObject } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { z } from 'zod';

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const USER = process.env.GITHUB_USER || 'muraschal';
const ORGS = (process.env.GITHUB_ORGS || '').split(',').map(s => s.trim()).filter(Boolean);
const MODEL_ID = 'anthropic/claude-sonnet-4-6';
const README_MAX = 1800;
const CONCURRENCY = 6;

if (!TOKEN) { console.error('GITHUB_TOKEN required'); process.exit(1); }
if (!process.env.AI_GATEWAY_API_KEY) { console.error('AI_GATEWAY_API_KEY required'); process.exit(1); }

async function ghJson(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'cockpit-repo-summaries',
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${url}`);
  return res.json();
}

async function ghRaw(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github.raw',
      'User-Agent': 'cockpit-repo-summaries',
    },
  });
  if (!res.ok) return '';
  return res.text();
}

async function listPaginated(baseUrl) {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const sep = baseUrl.includes('?') ? '&' : '?';
    const data = await ghJson(`${baseUrl}${sep}per_page=100&page=${page}`);
    if (!Array.isArray(data) || !data.length) break;
    out.push(...data);
    if (data.length < 100) break;
  }
  return out;
}

async function listAllRepos() {
  const seen = new Set();
  const all = [];
  for (const org of ORGS) {
    try {
      const orgRepos = await listPaginated(`https://api.github.com/orgs/${org}/repos?type=all`);
      for (const r of orgRepos) if (!seen.has(r.full_name)) { seen.add(r.full_name); all.push(r); }
    } catch (err) {
      console.error(`[repo-summaries] org ${org} failed: ${err.message}`);
    }
  }
  try {
    const userRepos = await listPaginated(`https://api.github.com/users/${USER}/repos?type=owner`);
    for (const r of userRepos) if (!seen.has(r.full_name)) { seen.add(r.full_name); all.push(r); }
  } catch (err) {
    console.error(`[repo-summaries] user repos failed: ${err.message}`);
  }
  return all;
}

async function fetchFacts(repo) {
  const [readmeRaw, pkgText] = await Promise.all([
    ghRaw(`https://api.github.com/repos/${repo.full_name}/readme`),
    ghRaw(`https://api.github.com/repos/${repo.full_name}/contents/package.json?ref=${repo.default_branch || 'main'}`),
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
      try { out[idx] = await fn(items[idx]); }
      catch (err) { out[idx] = { error: err.message, repo: items[idx]?.full_name }; }
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return out;
}

const Summary = z.object({
  full: z.string().describe('Exakt der full_name wie im Input (owner/repo).'),
  oneLiner: z.string().max(200).describe('Google-Grade Einzeiler: Was ist es, für wen, mit welchem Stack. Max 180 Zeichen. Beispiele-Stil: "Self-service portal for ZVV subscribers to manage transit accounts, built on Next.js + Supabase." — sachlich, keine Marketing-Sprache.'),
  purpose: z.string().describe('2–3 Sätze: Welches konkrete Problem löst das Projekt oder welche Funktion erfüllt es. Engineering-Ton, keine Floskeln. Darf aus README/Description/Dependencies inferieren, aber nicht erfinden — wenn unklar, so schreiben ("unklar aus README").'),
  stack: z.string().describe('Tech-Stack als kompakte, kommagetrennte Tag-Liste, z.B. "Next.js 15 · Supabase · Vercel · Tailwind". Nur was aus Dependencies oder README ersichtlich ist.'),
  audience: z.string().describe('Primäre Nutzer oder Konsumenten in einer Phrase (z.B. "ZVV-Kunden (public)", "Internes Team", "API-Clients", "Eigengebrauch").'),
  status: z.enum(['active', 'stable', 'pilot', 'spec', 'experimental', 'archived', 'dormant']).describe('Aktueller Lebenszyklus-Status.'),
  tags: z.array(z.string()).min(1).max(6).describe('3–6 prägnante Domain-Tags in Kleinbuchstaben (z.B. "transit", "ai", "internal-tool", "portal").'),
});

const Output = z.object({
  summaries: z.array(Summary),
});

async function summarizeBatch(facts) {
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

async function main() {
  console.log(`[repo-summaries] listing repos across ${ORGS.length} orgs + user ${USER}`);
  const repos = await listAllRepos();
  console.log(`[repo-summaries] found ${repos.length} repos`);

  const relevant = repos.filter(r => !r.fork);
  console.log(`[repo-summaries] fetching facts for ${relevant.length} (skipped ${repos.length - relevant.length} forks)`);

  const facts = await mapLimit(relevant, CONCURRENCY, fetchFacts);
  const clean = facts.filter(f => f && !f.error);
  if (facts.length !== clean.length) {
    console.warn(`[repo-summaries] ${facts.length - clean.length} facts failed to fetch`);
  }
  console.log(`[repo-summaries] calling LLM for ${clean.length} repos`);

  const summaries = await summarizeBatch(clean);
  console.log(`[repo-summaries] received ${summaries.length} summaries`);

  const byRepo = {};
  for (const s of summaries) byRepo[s.full] = s;

  const payload = {
    generatedAt: new Date().toISOString(),
    model: MODEL_ID,
    count: summaries.length,
    orgs: ORGS,
    user: USER,
    repos: byRepo,
  };

  writeFileSync('public/data-repos.json', JSON.stringify(payload, null, 2) + '\n');
  console.log(`[repo-summaries] wrote public/data-repos.json (${summaries.length} repos)`);
}

main().catch(err => {
  console.error('[repo-summaries] fatal:', err.message);
  process.exit(1);
});
