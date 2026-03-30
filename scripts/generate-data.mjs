#!/usr/bin/env node
import { writeFileSync } from 'fs';

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const ORG = 'zvvch';
const HUMAN_AUTHORS = new Set(['muraschal', 'ALONELY19XX', 'frankhofmann', 'jannik868']);
const BOTS = new Set(['github-actions[bot]', 'dependabot[bot]', 'renovate[bot]']);

if (!TOKEN) { console.error('GITHUB_TOKEN required'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function ghFetch(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'zvv-workload-dashboard',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${res.status}: ${url}\n${body.slice(0, 200)}`);
  }
  return res.json();
}

async function searchCommits(query) {
  const items = [];
  let page = 1;
  while (page <= 10) {
    const url = `https://api.github.com/search/commits?q=${encodeURIComponent(query)}&per_page=100&page=${page}&sort=author-date&order=desc`;
    const data = await ghFetch(url);
    items.push(...(data.items || []));
    if (!data.items || data.items.length < 100 || items.length >= (data.total_count || 0)) break;
    page++;
    await sleep(2200);
  }
  return items;
}

function cetHour(isoStr) {
  const d = new Date(isoStr);
  const month = d.getUTCMonth() + 1;
  const isCEST = month >= 4 && month <= 10;
  return (d.getUTCHours() + (isCEST ? 2 : 1)) % 24;
}

function cetDay(isoStr) {
  const d = new Date(isoStr);
  const month = d.getUTCMonth() + 1;
  const isCEST = month >= 4 && month <= 10;
  const offset = isCEST ? 2 : 1;
  const cetDate = new Date(d.getTime() + offset * 3600000);
  return cetDate.getUTCDay();
}

async function main() {
  const now = new Date();
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const months = [];
  let cur = new Date(yearAgo.getFullYear(), yearAgo.getMonth(), 1);
  const today = now.toISOString().split('T')[0];
  while (cur <= now) {
    const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    const from = cur.toISOString().split('T')[0];
    const toDate = new Date(Math.min(next.getTime() - 86400000, now.getTime()));
    const to = toDate.toISOString().split('T')[0];
    months.push({ from, to });
    cur = next;
  }

  console.log(`Fetching commits across ${months.length} months...`);

  const allCommits = [];
  for (const { from, to } of months) {
    console.log(`  ${from} → ${to}`);
    try {
      const items = await searchCommits(`org:${ORG} committer-date:${from}..${to}`);
      allCommits.push(...items);
      console.log(`    → ${items.length} commits`);
    } catch (e) {
      console.warn(`    ⚠ Error: ${e.message}`);
    }
    await sleep(3000);
  }

  console.log(`Total fetched: ${allCommits.length} commits`);

  const calendar = {};
  const hourly = Array.from({ length: 7 }, () => Array(24).fill(0));
  const authors = {};
  const repoMonthly = {};

  allCommits.forEach(c => {
    const dateStr = c.commit?.author?.date || c.commit?.committer?.date;
    if (!dateStr) return;

    const date = dateStr.split('T')[0];
    const login = c.author?.login || c.commit?.author?.name || 'unknown';
    const repo = c.repository?.name || 'unknown';
    const month = date.slice(0, 7);

    calendar[date] = (calendar[date] || 0) + 1;
    hourly[cetDay(dateStr)][cetHour(dateStr)]++;
    authors[login] = (authors[login] || 0) + 1;

    if (!repoMonthly[repo]) repoMonthly[repo] = {};
    repoMonthly[repo][month] = (repoMonthly[repo][month] || 0) + 1;
  });

  const sparkMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    sparkMonths.push(d.toISOString().slice(0, 7));
  }
  const sparklines = {};
  for (const [repo, data] of Object.entries(repoMonthly)) {
    sparklines[repo] = sparkMonths.map(m => data[m] || 0);
  }

  const aiAuthors = {};
  const humanAuthors = {};
  for (const [login, count] of Object.entries(authors)) {
    if (BOTS.has(login)) continue;
    if (HUMAN_AUTHORS.has(login)) humanAuthors[login] = count;
    else aiAuthors[login] = count;
  }

  const output = {
    generated: now.toISOString(),
    calendar,
    hourly,
    authors: { human: humanAuthors, ai: aiAuthors },
    sparklines,
    sparkMonths,
    repoMonthly,
    totalCommits: allCommits.length,
  };

  writeFileSync('public/data.json', JSON.stringify(output));
  console.log(`✓ Written public/data.json (${JSON.stringify(output).length} bytes)`);
}

main().catch(e => { console.error(e); process.exit(1); });
