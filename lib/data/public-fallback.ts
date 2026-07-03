import 'server-only';

import type {
  DoraPayload,
  GithubStats,
  InfraPayload,
  LanguageStatsPayload,
  PortfolioCache,
  ReposPayload,
} from './cache-reader';

function fallbackOrigin(): string | null {
  const raw = (process.env.COCKPIT_PUBLIC_FALLBACK_ORIGIN || '').trim();
  if (!raw || raw === 'off' || raw === 'false') return null;
  return raw.replace(/\/+$/, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

async function readPublicEndpoint<T>(
  pathname: string,
  validate: (value: unknown) => value is T,
): Promise<T | null> {
  const origin = fallbackOrigin();
  if (!origin) return null;

  try {
    const response = await fetch(new URL(pathname, origin), {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const data: unknown = await response.json();
    return validate(data) ? data : null;
  } catch {
    return null;
  }
}

function isGithubStats(value: unknown): value is GithubStats {
  const data = value as Partial<GithubStats> | null;
  return Boolean(
    data &&
      typeof data.today === 'number' &&
      typeof data.week === 'number' &&
      typeof data.month === 'number' &&
      typeof data.velocity === 'number',
  );
}

function isPortfolioCache(value: unknown): value is PortfolioCache {
  const data = value as Partial<PortfolioCache> | null;
  return Boolean(
    data &&
      typeof data.total === 'number' &&
      Array.isArray(data.orgs) &&
      typeof data.user === 'string' &&
      typeof data.timestamp === 'string',
  );
}

function isReposPayload(value: unknown): value is ReposPayload {
  const data = value as Partial<ReposPayload> | null;
  return Boolean(
    data &&
      typeof data.generatedAt === 'string' &&
      typeof data.model === 'string' &&
      typeof data.count === 'number' &&
      Array.isArray(data.orgs) &&
      typeof data.user === 'string' &&
      isRecord(data.repos),
  );
}

function isLanguageStats(value: unknown): value is LanguageStatsPayload {
  const data = value as Partial<LanguageStatsPayload> | null;
  return Boolean(data && typeof data.timestamp === 'string' && isRecord(data.languages));
}

function isDoraPayload(value: unknown): value is DoraPayload {
  const data = value as Partial<DoraPayload> | null;
  return Boolean(data && typeof data.timestamp === 'string' && isRecord(data.metrics));
}

function isInfraPayload(value: unknown): value is InfraPayload {
  const data = value as Partial<InfraPayload> | null;
  return Boolean(data && typeof data.timestamp === 'string' && 'vercel' in data && 'supabase' in data);
}

export function readPublicGithubStats(): Promise<GithubStats | null> {
  return readPublicEndpoint('/api/github-stats', isGithubStats);
}

export function readPublicPortfolio(): Promise<PortfolioCache | null> {
  return readPublicEndpoint('/api/portfolio', isPortfolioCache);
}

export function readPublicRepos(): Promise<ReposPayload | null> {
  return readPublicEndpoint('/api/repos', isReposPayload);
}

export function readPublicLanguageStats(): Promise<LanguageStatsPayload | null> {
  return readPublicEndpoint('/api/language-stats', isLanguageStats);
}

export function readPublicDora(): Promise<DoraPayload | null> {
  return readPublicEndpoint('/api/dora', isDoraPayload);
}

export function readPublicInfra(): Promise<InfraPayload | null> {
  return readPublicEndpoint('/api/infra-stats', isInfraPayload);
}
