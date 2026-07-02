import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  GithubStats,
  LanguageStatsPayload,
  NarrativePayload,
  PortfolioCache,
  PortfolioProject,
  ReposPayload,
} from './cache-reader';

type StaticActivityData = {
  generated: string;
  user: string;
  orgs: string[];
  calendar: Record<string, number>;
  repoMonthly?: Record<string, Record<string, number>>;
  weeklyTrend?: Array<{ commits?: number; activeRepos?: number }>;
  totalCommits?: number;
};

type StaticRepoMeta = {
  full: string;
  oneLiner?: string;
  purpose?: string;
  stack?: string[] | string;
  audience?: string;
  status?: string;
  tags?: string[];
};

type StaticReposData = Omit<ReposPayload, 'listHash'> & {
  listHash?: string;
  repos: Record<string, StaticRepoMeta>;
};

type PortfolioConfig = {
  overrides?: Record<string, Partial<PortfolioProject>>;
  virtual?: Array<Partial<PortfolioProject>>;
  exclude?: string[];
};

async function readJson<T>(file: string): Promise<T | null> {
  try {
    const raw = await readFile(path.join(process.cwd(), 'public', file), 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function readPortfolioConfig(): Promise<PortfolioConfig> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), 'api-legacy', 'portfolio-config.json'),
      'utf8',
    );
    return JSON.parse(raw) as PortfolioConfig;
  } catch {
    return {};
  }
}

function dateAdd(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function sumRange(calendar: Record<string, number>, endDate: string, days: number) {
  let total = 0;
  for (let i = 0; i < days; i++) {
    total += calendar[dateAdd(endDate, -i)] ?? 0;
  }
  return total;
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function humanizeRepo(fullName: string) {
  const repo = fullName.split('/').pop() || fullName;
  return repo
    .replace(/^zvv-/, 'ZVV ')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bZvv\b/g, 'ZVV')
    .replace(/\bMcp\b/g, 'MCP')
    .replace(/\bApi\b/g, 'API')
    .replace(/\bAi\b/g, 'AI');
}

function stackToLanguage(stack?: string[] | string): string | null {
  const text = Array.isArray(stack) ? stack.join(', ') : stack ?? '';
  const lower = text.toLowerCase();
  if (lower.includes('typescript') || lower.includes('next.js')) return 'TypeScript';
  if (lower.includes('python') || lower.includes('fastapi')) return 'Python';
  if (lower.includes('swift')) return 'Swift';
  if (lower.includes('html') || lower.includes('vanilla js')) return 'JavaScript';
  return null;
}

function normalizeProject(
  fullName: string,
  repo: StaticRepoMeta,
  override?: Partial<PortfolioProject>,
): PortfolioProject {
  const stack = repo.stack;
  return {
    name: override?.name || humanizeRepo(fullName),
    purpose: override?.purpose || repo.purpose || repo.oneLiner || '',
    work: override?.work || '',
    mode: override?.mode || (repo.status === 'active' ? 'build' : 'run'),
    modeLabel: override?.modeLabel || override?.mode || (repo.status === 'active' ? 'Build' : 'Run'),
    lc: override?.lc || (repo.status === 'archived' ? 'archive' : 'tool'),
    lcLabel: override?.lcLabel || override?.lc || (repo.status === 'archived' ? 'Archived' : 'Tooling'),
    pt: override?.pt || '1-3',
    ptMid: override?.ptMid ?? 2,
    cat: override?.cat || 'change',
    lcNote: override?.lcNote || '',
    forecast: override?.forecast || '',
    commits: {},
    github: override?.github || `https://github.com/${fullName}`,
    repo: fullName,
    pushed_at: override?.pushed_at || undefined,
    stars: override?.stars ?? 0,
    language: override?.language || stackToLanguage(stack),
    topics: override?.topics || repo.tags || [],
    prod: override?.prod,
    vercel: override?.vercel,
    supabase: override?.supabase,
  };
}

export async function readStaticGithubStats(): Promise<GithubStats | null> {
  const data = await readJson<StaticActivityData>('data.json');
  if (!data?.calendar || Object.keys(data.calendar).length === 0) return null;

  const dates = Object.keys(data.calendar).sort();
  const latestDate = dates[dates.length - 1];
  const today = data.calendar[latestDate] ?? 0;
  const week = sumRange(data.calendar, latestDate, 7);
  const month = sumRange(data.calendar, latestDate, 30);
  const prevWeekEnd = dateAdd(latestDate, -7);
  const prevWeek = sumRange(data.calendar, prevWeekEnd, 7);
  const currentMonth = latestDate.slice(0, 7);

  const activeRepos = Object.entries(data.repoMonthly ?? {})
    .map(([name, months]) => ({ name, commits: months[currentMonth] ?? 0 }))
    .filter((repo) => repo.commits > 0)
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 8);

  const sparkline = Array.from({ length: 90 }, (_, index) => {
    const offset = 89 - index;
    return data.calendar[dateAdd(latestDate, -offset)] ?? 0;
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
    lastCommit: undefined,
    recentCommits: [],
    activeRepos,
    streak: 0,
    orgs: data.orgs,
    sparkline,
    timestamp: data.generated,
  };
}

export async function readStaticNarrative(): Promise<NarrativePayload | null> {
  return readJson<NarrativePayload>('data-narrative.json');
}

export async function readStaticRepos(): Promise<ReposPayload | null> {
  const data = await readJson<StaticReposData>('data-repos.json');
  if (!data?.repos) return null;
  return {
    generatedAt: data.generatedAt,
    model: data.model,
    count: data.count,
    listHash: data.listHash || 'static-local',
    orgs: data.orgs,
    user: data.user,
    repos: data.repos,
  };
}

export async function readStaticPortfolio(): Promise<PortfolioCache | null> {
  const [reposData, config] = await Promise.all([readStaticRepos(), readPortfolioConfig()]);
  if (!reposData?.repos) return null;

  const excluded = new Set(config.exclude ?? []);
  const projects: PortfolioProject[] = Object.entries(reposData.repos)
    .filter(([fullName]) => !excluded.has(fullName))
    .map(([fullName, repo]) =>
      normalizeProject(fullName, repo, config.overrides?.[fullName]),
    );

  for (const item of config.virtual ?? []) {
    if (!item.name) continue;
    projects.push({
      name: item.name,
      purpose: item.purpose || '',
      work: item.work || '',
      mode: item.mode || 'govern',
      modeLabel: item.modeLabel || item.mode || 'Govern',
      lc: item.lc || 'jw',
      lcLabel: item.lcLabel || item.lc || 'Recurring',
      pt: item.pt || '5-8',
      ptMid: item.ptMid ?? 6,
      cat: item.cat || 'govern',
      lcNote: item.lcNote || '',
      forecast: item.forecast || '',
      commits: {},
      repo: item.repo || item.name,
      pushed_at: item.pushed_at,
      stars: item.stars ?? 0,
      language: item.language || null,
      topics: item.topics || [],
    });
  }

  projects.sort((a, b) => (b.ptMid ?? 0) - (a.ptMid ?? 0));

  return {
    total: projects.length,
    orgs: reposData.orgs,
    user: reposData.user,
    projects,
    timestamp: reposData.generatedAt,
  };
}

export async function readStaticLanguageStats(): Promise<LanguageStatsPayload | null> {
  const reposData = await readStaticRepos();
  if (!reposData?.repos) return null;

  const languages: Record<string, number> = {};
  const languagesByRepo: Record<string, Record<string, number>> = {};

  for (const [fullName, repo] of Object.entries(reposData.repos)) {
    const lang = stackToLanguage(repo.stack) || 'Other';
    const weight = Math.max(1, repo.tags?.length ?? 1) * 1000;
    languages[lang] = (languages[lang] ?? 0) + weight;
    languagesByRepo[fullName] = { [lang]: weight };
  }

  return {
    timestamp: reposData.generatedAt,
    totalRepos: reposData.count,
    orgs: reposData.orgs,
    languages,
    languagesByRepo,
    events: [],
  };
}
