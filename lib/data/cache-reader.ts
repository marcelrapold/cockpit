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
import {
  readPublicDora,
  readPublicGithubStats,
  readPublicInfra,
  readPublicLanguageStats,
  readPublicPortfolio,
  readPublicRepos,
} from '@/lib/data/public-fallback';
import {
  readStaticGithubStats,
  readStaticLanguageStats,
  readStaticNarrative,
  readStaticPortfolio,
  readStaticRepos,
} from '@/lib/data/static-fallback';
import {
  sanitizeGithubStats,
  sanitizeInfra,
  sanitizeLanguageStats,
  sanitizeNarrative,
  sanitizePortfolio,
  sanitizeRepos,
} from '@/lib/security/exposure';

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
  scope?: 'all' | 'private' | 'organizations' | 'zvv' | string;
  identity?: {
    primaryLogin?: string;
    authorLogins?: string[];
    authorEmailCount?: number;
    authorEmailsMasked?: string[];
  };
  dataSources?: {
    scope?: string;
    orgs?: string[];
    repoOwners?: string[];
    searchScopes?: string[];
    note?: string;
  };
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

export type LanguageStatsPayload = {
  timestamp: string;
  totalRepos?: number;
  orgs?: string[];
  languages: Record<string, number>;
  languagesByRepo?: Record<string, Record<string, number>>;
  events?: unknown[];
  error?: string;
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
    const data = (
      ((await get(KEYS.githubStats)) as GithubStats | null) ??
      (await readPublicGithubStats()) ??
      (await readStaticGithubStats())
    );
    return data ? sanitizeGithubStats(data) : null;
  } catch {
    const data = (await readPublicGithubStats()) ?? (await readStaticGithubStats());
    return data ? sanitizeGithubStats(data) : null;
  }
});

export const readPortfolio = reactCache(async (): Promise<PortfolioCache | null> => {
  try {
    const data = (
      ((await get(KEYS.portfolio)) as PortfolioCache | null) ??
      (await readPublicPortfolio()) ??
      (await readStaticPortfolio())
    );
    return data ? sanitizePortfolio(data) : null;
  } catch {
    const data = (await readPublicPortfolio()) ?? (await readStaticPortfolio());
    return data ? sanitizePortfolio(data) : null;
  }
});

export const readNarrative = reactCache(async (): Promise<NarrativePayload | null> => {
  try {
    const data = (
      ((await get(KEYS.narrative)) as NarrativePayload | null) ??
      (await readStaticNarrative())
    );
    return data ? sanitizeNarrative(data) : null;
  } catch {
    const data = await readStaticNarrative();
    return data ? sanitizeNarrative(data) : null;
  }
});

export const readRepos = reactCache(async (): Promise<ReposPayload | null> => {
  try {
    const data = (
      ((await get(KEYS.repos)) as ReposPayload | null) ??
      (await readPublicRepos()) ??
      (await readStaticRepos())
    );
    return data ? sanitizeRepos(data) : null;
  } catch {
    const data = (await readPublicRepos()) ?? (await readStaticRepos());
    return data ? sanitizeRepos(data) : null;
  }
});

export const readDora = reactCache(async (): Promise<DoraPayload | null> => {
  try {
    return ((await get(KEYS.dora)) as DoraPayload | null) ?? (await readPublicDora());
  } catch {
    return readPublicDora();
  }
});

export const readInfra = reactCache(async (): Promise<InfraPayload | null> => {
  try {
    const data = ((await get(KEYS.infraStats)) as InfraPayload | null) ?? (await readPublicInfra());
    return data ? sanitizeInfra(data) : null;
  } catch {
    const data = await readPublicInfra();
    return data ? sanitizeInfra(data) : null;
  }
});

export const readLanguageStats = reactCache(
  async (): Promise<LanguageStatsPayload | null> => {
    try {
      const data = (
        ((await get(KEYS.languageStats)) as LanguageStatsPayload | null) ??
        (await readPublicLanguageStats()) ??
        (await readStaticLanguageStats())
      );
      return data ? sanitizeLanguageStats(data) : null;
    } catch {
      const data = (await readPublicLanguageStats()) ?? (await readStaticLanguageStats());
      return data ? sanitizeLanguageStats(data) : null;
    }
  },
);
