/**
 * Server-only Redis-Reader für SSR-Komponenten.
 *
 * Liest die Caches, die von den /api/* Endpoints + Cron-Jobs geschrieben werden,
 * direkt aus Redis. Spart einen HTTP-Roundtrip vs. fetch('/api/…') und liefert
 * dadurch typischerweise <30ms TTFB für Hero-KPIs.
 *
 * @module lib/data/cache-reader
 */

import 'server-only';
import { cache as reactCache } from 'react';

import legacyCache from '@/api-legacy/_lib/cache.js';

const { get, KEYS } = legacyCache as {
  get: (key: string) => Promise<unknown>;
  KEYS: Record<string, string>;
};

export type GithubStats = {
  today: number;
  week: number;
  month: number;
  prevWeek?: number;
  velocity: number;
  avgPerDay?: number;
  openIssues?: number;
  openPRs?: number;
  lastCommit?: { message: string; repo: string; time: string };
  recentCommits?: Array<{ message: string; repo: string; time: string }>;
  activeRepos?: Array<{ name: string; commits: number }>;
  streak?: number;
  orgs?: string[];
  sparkline?: number[];
  timestamp?: string;
};

export type PortfolioProject = {
  name: string;
  purpose?: string;
  work?: string;
  mode?: 'build' | 'run' | 'improve' | 'govern' | string;
  modeLabel?: string;
  lc?: 'prod' | 'pilot' | 'spec' | 'tool' | 'jw' | 'archive' | string;
  lcLabel?: string;
  pt?: string;
  ptMid?: number;
  cat?: 'change' | 'run' | 'steward' | 'govern' | string;
  lcNote?: string;
  forecast?: string;
  commits?: Record<string, number> | { total?: number; week?: number; month?: number };
  github?: string;
  repo: string;
  pushed_at?: string;
  stars?: number;
  language?: string | null;
  topics?: string[];
  prod?: string;
  vercel?: string;
  supabase?: string;
};

export type PortfolioCache = {
  total: number;
  orgs: string[];
  user: string;
  projects?: PortfolioProject[];
  timestamp: string;
};

export type NarrativePayload = {
  generatedAt: string;
  model: string;
  dataHash: string;
  teaser: string;
  extended: string[];
  weekly: string;
  strategic: string;
};

export type DoraTier = 'elite' | 'high' | 'medium' | 'low' | 'unknown';

export type DoraPayload = {
  timestamp: string;
  period: { days: number; since: string; until: string };
  metrics: {
    deployFrequency: {
      value: number;
      unit: string;
      tier: DoraTier;
      trend?: number;
      total?: number;
      sparkline?: number[];
    };
    leadTime: {
      value: number;
      unit: string;
      tier: DoraTier;
      trend?: number;
      samples?: number;
    };
    changeFailureRate: {
      value: number;
      unit: string;
      tier: DoraTier;
      trend?: number;
      errors?: number;
      total?: number;
    };
    mttr: {
      value: number;
      unit: string;
      tier: DoraTier;
      incidents?: number;
    };
  };
  configMissing?: boolean;
  error?: string;
};

export type InfraPayload = {
  timestamp: string;
  vercel: {
    configured: boolean;
    teams?: number;
    totalProjects?: number;
    deploymentsToday?: number;
    deploymentsWeek?: number;
    successRate?: number;
    latestDeploy?: {
      project?: string;
      state?: string;
      time?: string;
      url?: string;
    };
  } | null;
  supabase: {
    configured: boolean;
    totalProjects?: number;
    healthy?: number;
    avgLatency?: number;
    projects?: Array<{
      name: string;
      status?: string;
      ok?: boolean;
      latency?: number;
      region?: string;
    }>;
  } | null;
};

export type ReposPayload = {
  generatedAt: string;
  model: string;
  count: number;
  listHash: string;
  orgs: string[];
  user: string;
  repos: Record<
    string,
    {
      full: string;
      oneLiner: string;
      purpose: string;
      stack?: string[] | string;
      audience?: string;
      status?: string;
      tags?: string[];
    }
  >;
};

/**
 * Liefert die zuletzt gecachten github-stats. `null` wenn Cache leer.
 * Pro React-Request memoized via `cache()` — mehrfache Aufrufe in derselben
 * Render-Pass kosten nur einen Redis-RTT.
 */
export const readGithubStats = reactCache(async (): Promise<GithubStats | null> => {
  try {
    return ((await get(KEYS.githubStats)) as GithubStats | null) ?? null;
  } catch {
    return null;
  }
});

export const readPortfolio = reactCache(async (): Promise<PortfolioCache | null> => {
  try {
    return ((await get(KEYS.portfolio)) as PortfolioCache | null) ?? null;
  } catch {
    return null;
  }
});

export const readNarrative = reactCache(async (): Promise<NarrativePayload | null> => {
  try {
    return ((await get(KEYS.narrative)) as NarrativePayload | null) ?? null;
  } catch {
    return null;
  }
});

export const readRepos = reactCache(async (): Promise<ReposPayload | null> => {
  try {
    return ((await get(KEYS.repos)) as ReposPayload | null) ?? null;
  } catch {
    return null;
  }
});

export const readDora = reactCache(async (): Promise<DoraPayload | null> => {
  try {
    return ((await get(KEYS.dora)) as DoraPayload | null) ?? null;
  } catch {
    return null;
  }
});

export const readInfra = reactCache(async (): Promise<InfraPayload | null> => {
  try {
    return ((await get(KEYS.infraStats)) as InfraPayload | null) ?? null;
  } catch {
    return null;
  }
});
