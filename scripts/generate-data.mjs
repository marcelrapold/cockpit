#!/usr/bin/env node
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
  buildCommitSearchScopes,
  getGithubIdentity,
} = require('../api-legacy/_lib/github-identity.js');
const { redactRepoName } = require('../api-legacy/_lib/exposure.js');

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const IDENTITY = getGithubIdentity();
const SOURCE = buildCommitSearchScopes(process.env.GITHUB_SCOPE);
const USER = IDENTITY.primaryLogin;
const ORGS = SOURCE.owners.orgs;
const HUMAN_AUTHORS = new Set(IDENTITY.humanAuthors);
const BOTS = new Set(['github-actions[bot]', 'dependabot[bot]', 'renovate[bot]']);

if (!TOKEN) { console.error('GITHUB_TOKEN required'); process.exit(1); }

mkdirSync('data/private', { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function ghFetch(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'cockpit-dashboard',
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

function getISOWeek(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getWeekStart(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.getFullYear(), date.getMonth(), diff).toISOString().split('T')[0];
}

function dateAdd(dateKey, days) {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function sumRange(calendar, endDate, days) {
  let total = 0;
  for (let i = 0; i < days; i++) total += calendar[dateAdd(endDate, -i)] || 0;
  return total;
}

function pctChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function buildPublicGithubStats(data) {
  const dates = Object.keys(data.calendar || {}).sort();
  const latestDate = dates[dates.length - 1];
  if (!latestDate) return null;
  const today = data.calendar[latestDate] || 0;
  const week = sumRange(data.calendar, latestDate, 7);
  const month = sumRange(data.calendar, latestDate, 30);
  const prevWeekEnd = dateAdd(latestDate, -7);
  const prevWeek = sumRange(data.calendar, prevWeekEnd, 7);
  const currentMonth = latestDate.slice(0, 7);
  const activeRepos = Object.entries(data.repoMonthly || {})
    .map(([name, months]) => ({ name: redactRepoName(name), commits: months[currentMonth] || 0 }))
    .filter(repo => repo.commits > 0)
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 8);
  const sparkline = Array.from({ length: 90 }, (_, index) => {
    const offset = 89 - index;
    return data.calendar[dateAdd(latestDate, -offset)] || 0;
  });
  return {
    today,
    week,
    month,
    prevWeek,
    velocity: pctChange(week, prevWeek),
    avgPerDay: Number((month / 30).toFixed(1)),
    openIssues: 0,
    openPRs: 0,
    activeRepos,
    streak: 0,
    orgs: ['public + business scopes'],
    scope: 'all',
    dataSources: {
      scope: 'all',
      orgs: ['redacted-business-orgs'],
      repoOwners: ['redacted-business-owners'],
      searchScopes: ['public + redacted business scopes'],
      note: 'Public static fallback contains no internal repository names.',
    },
    sparkline,
    timestamp: data.generated,
  };
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

  const scopes = SOURCE.scopes;
  const authorQueries = IDENTITY.commitAuthorQueries;

  console.log(
    `Fetching commits for ${authorQueries.map(a => a.query).join(', ')} ` +
    `across ${scopes.length} scopes × ${months.length} months...`,
  );

  const allCommits = [];
  const seen = new Set();
  for (const { from, to } of months) {
    console.log(`  ${from} → ${to}`);
    for (const scope of scopes) {
      for (const author of authorQueries) {
        try {
          const query = [scope, author.query, `committer-date:${from}..${to}`]
            .filter(Boolean)
            .join(' ');
          const items = await searchCommits(query);
          let added = 0;
          for (const c of items) {
            const repo = c.repository?.full_name || c.repository?.name || 'unknown';
            const key = `${repo}:${c.sha}`;
            if (c.sha && !seen.has(key)) {
              seen.add(key);
              allCommits.push(c);
              added++;
            }
          }
          if (added > 0) console.log(`    ${scope || 'global-accessible'} ${author.query}: ${added} commits`);
        } catch (e) {
          console.warn(`    ⚠ ${scope || 'global-accessible'} ${author.query}: ${e.message}`);
        }
        await sleep(1500);
      }
    }
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
    const repo = c.repository?.full_name || c.repository?.name || 'unknown';
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
    if (HUMAN_AUTHORS.size === 0 || HUMAN_AUTHORS.has(login)) humanAuthors[login] = count;
    else aiAuthors[login] = count;
  }

  const historyPath = 'data/private/data-history.json';
  let history = [];
  if (existsSync(historyPath)) {
    try { history = JSON.parse(readFileSync(historyPath, 'utf8')); } catch {}
  }
  const weekKey = getISOWeek(now);
  const weekCommits = allCommits.filter(c => {
    const d = c.commit?.author?.date?.split('T')[0];
    return d && d >= getWeekStart(now) && d <= today;
  }).length;
  const activeReposThisWeek = new Set(allCommits.filter(c => {
    const d = c.commit?.author?.date?.split('T')[0];
    return d && d >= getWeekStart(now) && d <= today;
  }).map(c => c.repository?.full_name || c.repository?.name)).size;

  const existing = history.findIndex(h => h.week === weekKey);
  const weekEntry = {
    week: weekKey,
    date: now.toISOString(),
    commits: weekCommits,
    totalCommits: allCommits.length,
    activeRepos: activeReposThisWeek,
  };
  if (existing >= 0) history[existing] = weekEntry;
  else history.push(weekEntry);
  history = history.slice(-52);

  writeFileSync(historyPath, JSON.stringify(history));
  console.log(`✓ Written ${historyPath} (${history.length} weeks)`);

  const output = {
    generated: now.toISOString(),
    user: USER,
    orgs: ORGS,
    scope: SOURCE.scope,
    identity: IDENTITY.public,
    dataSources: {
      scope: SOURCE.scope,
      orgs: SOURCE.owners.orgs,
      repoOwners: SOURCE.owners.repoOwners,
      searchScopes: scopes.map(scope => scope || 'global-accessible'),
      commitIdentity: IDENTITY.public,
    },
    calendar,
    hourly,
    authors: { human: humanAuthors, ai: aiAuthors },
    sparklines,
    sparkMonths,
    repoMonthly,
    totalCommits: allCommits.length,
    weeklyTrend: history.slice(-12),
  };

  writeFileSync('data/private/data.json', JSON.stringify(output));
  console.log(`✓ Written data/private/data.json (${JSON.stringify(output).length} bytes)`);

  const publicStats = buildPublicGithubStats(output);
  if (publicStats) {
    writeFileSync('data/private/data-public-github-stats.json', JSON.stringify(publicStats));
    console.log('✓ Written data/private/data-public-github-stats.json');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
