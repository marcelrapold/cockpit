const CONFIG = require('../portfolio-config.json');

const TOKEN = process.env.GITHUB_TOKEN;
const USER = process.env.GITHUB_USER || 'muraschal';
const ORGS = (process.env.GITHUB_ORGS || '').split(',').map(s => s.trim()).filter(Boolean);

const MODE_LABELS = { build: 'Build', run: 'Run', improve: 'Improve', govern: 'Govern' };
const LC_LABELS = { prod: 'Production', pilot: 'Prototype', spec: 'Specification', tool: 'Tooling', jw: 'Recurring', archive: 'Archived' };
const EXCLUDE_SET = new Set(CONFIG.exclude || []);

async function ghFetch(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'cockpit-portfolio',
    },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${url}`);
  return res.json();
}

async function fetchAllRepos() {
  const repos = [];
  const seen = new Set();

  for (const org of ORGS) {
    let page = 1;
    while (page <= 10) {
      const data = await ghFetch(
        `https://api.github.com/orgs/${org}/repos?type=all&per_page=100&page=${page}`
      );
      if (!data.length) break;
      for (const r of data) {
        if (!seen.has(r.full_name)) { seen.add(r.full_name); repos.push(r); }
      }
      if (data.length < 100) break;
      page++;
    }
  }

  let page = 1;
  while (page <= 5) {
    const data = await ghFetch(
      `https://api.github.com/users/${USER}/repos?type=owner&per_page=100&page=${page}`
    );
    if (!data.length) break;
    for (const r of data) {
      if (!seen.has(r.full_name)) { seen.add(r.full_name); repos.push(r); }
    }
    if (data.length < 100) break;
    page++;
  }

  return repos;
}

function humanizeName(repoName) {
  return repoName
    .replace(/^zvv-/, 'ZVV ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bZvv\b/g, 'ZVV')
    .replace(/\bMcp\b/g, 'MCP')
    .replace(/\bApi\b/g, 'API')
    .replace(/\bAi\b/g, 'AI')
    .replace(/\bCms\b/g, 'CMS')
    .replace(/\bN8n\b/g, 'n8n')
    .replace(/\.app$/, '')
    .replace(/\.io$/, '')
    .replace(/\.ch$/, '')
    .replace(/\.cloud$/, '');
}

function deriveCategory(repo) {
  const topics = repo.topics || [];
  if (topics.includes('governance') || topics.includes('spec')) return 'govern';
  if (topics.includes('tooling') || topics.includes('tool') || topics.includes('platform')) return 'steward';
  if (topics.includes('production') || topics.includes('run') || topics.includes('ops')) return 'run';
  return 'change';
}

function deriveMode(repo) {
  const daysSincePush = (Date.now() - new Date(repo.pushed_at).getTime()) / 86400000;
  if (daysSincePush < 60) return 'build';
  if (daysSincePush < 180) return 'run';
  return 'run';
}

function deriveLifecycle(repo) {
  if (repo.archived) return 'archive';
  if (repo.homepage) return 'prod';
  const daysSincePush = (Date.now() - new Date(repo.pushed_at).getTime()) / 86400000;
  if (daysSincePush < 90) return 'pilot';
  return 'tool';
}

function buildPortfolioItem(repo, override) {
  const mode = override?.mode || deriveMode(repo);
  const lc = override?.lc || deriveLifecycle(repo);
  const cat = override?.cat || deriveCategory(repo);

  const item = {
    name: override?.name || humanizeName(repo.name),
    purpose: override?.purpose || repo.description || '',
    work: override?.work || '',
    mode,
    modeLabel: override?.modeLabel || MODE_LABELS[mode] || mode,
    lc,
    lcLabel: override?.lcLabel || LC_LABELS[lc] || lc,
    pt: override?.pt || '1–3',
    ptMid: override?.ptMid || 2,
    cat,
    lcNote: override?.lcNote || '',
    forecast: override?.forecast || '',
    commits: {},
    github: repo.html_url,
    repo: repo.full_name,
    pushed_at: repo.pushed_at,
    stars: repo.stargazers_count || 0,
    language: repo.language || null,
    topics: repo.topics || [],
  };

  if (repo.homepage) item.prod = repo.homepage;
  if (override?.vercel) item.vercel = override.vercel;
  if (override?.supabase) item.supabase = override.supabase;

  return item;
}

module.exports = async function fetchPortfolio() {
  if (!TOKEN) {
    return { projects: [], error: 'GITHUB_TOKEN not configured' };
  }

  const repos = await fetchAllRepos();
  const projects = [];
  const usedOverrides = new Set();

  for (const repo of repos) {
    if (repo.archived || repo.fork) continue;
    if (EXCLUDE_SET.has(repo.full_name)) continue;

    const override = CONFIG.overrides[repo.full_name] || null;
    if (override) usedOverrides.add(repo.full_name);
    projects.push(buildPortfolioItem(repo, override));
  }

  for (const [key, override] of Object.entries(CONFIG.overrides)) {
    if (!usedOverrides.has(key)) {
      projects.push({
        name: override.name || key,
        purpose: override.purpose || '',
        work: override.work || '',
        mode: override.mode || 'run',
        modeLabel: override.modeLabel || MODE_LABELS[override.mode] || 'Run',
        lc: override.lc || 'tool',
        lcLabel: override.lcLabel || LC_LABELS[override.lc] || '',
        pt: override.pt || '1–3',
        ptMid: override.ptMid || 2,
        cat: override.cat || 'change',
        lcNote: override.lcNote || '',
        forecast: override.forecast || '',
        commits: {},
        github: `https://github.com/${key}`,
        repo: key,
        pushed_at: null,
        stars: 0,
        language: null,
        topics: [],
      });
    }
  }

  for (const v of (CONFIG.virtual || [])) {
    projects.push({
      name: v.name,
      purpose: v.purpose || '',
      work: v.work || '',
      mode: v.mode || 'govern',
      modeLabel: v.modeLabel || MODE_LABELS[v.mode] || 'Govern',
      lc: v.lc || 'jw',
      lcLabel: v.lcLabel || LC_LABELS[v.lc] || '',
      pt: v.pt || '5–8',
      ptMid: v.ptMid || 6,
      cat: v.cat || 'govern',
      lcNote: v.lcNote || '',
      forecast: v.forecast || '',
      commits: {},
      pushed_at: null,
      stars: 0,
      language: null,
      topics: [],
    });
  }

  projects.sort((a, b) => {
    const catOrder = { change: 0, run: 1, steward: 2, govern: 3 };
    const catDiff = (catOrder[a.cat] || 9) - (catOrder[b.cat] || 9);
    if (catDiff !== 0) return catDiff;
    if (a.pushed_at && b.pushed_at) return new Date(b.pushed_at) - new Date(a.pushed_at);
    if (a.pushed_at) return -1;
    if (b.pushed_at) return 1;
    return 0;
  });

  return {
    timestamp: new Date().toISOString(),
    total: projects.length,
    orgs: ORGS,
    user: USER,
    projects,
  };
};
