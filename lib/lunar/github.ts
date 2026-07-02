import {
  LUNAR_MAX_LINE_COMMITS,
  LUNAR_MAX_TAGS_PER_REPO,
} from './config';
import {
  bumpActivity,
  bumpLines,
  createDailyActivityMap,
} from './activity';
import { isoEndOfDay, isoStartOfDay } from './date';
import type { AnalysisParams, DailyActivity, GitHubCollectionMeta } from './types';

type GitHubActor = {
  login?: string;
  type?: string;
};

type GitHubRepo = {
  name: string;
  full_name: string;
  fork?: boolean;
  archived?: boolean;
  pushed_at?: string | null;
  owner?: GitHubActor;
};

type GitHubCommit = {
  sha: string;
  url?: string;
  author?: GitHubActor | null;
  committer?: GitHubActor | null;
  parents?: Array<unknown>;
  commit?: {
    message?: string;
    author?: { date?: string | null; name?: string | null; email?: string | null };
    committer?: { date?: string | null };
  };
};

type GitHubCommitDetail = GitHubCommit & {
  stats?: {
    additions?: number;
    deletions?: number;
  };
};

type GitHubPullRequest = {
  user?: GitHubActor | null;
  created_at?: string | null;
  updated_at?: string | null;
  merged_at?: string | null;
};

type GitHubIssue = {
  user?: GitHubActor | null;
  created_at?: string | null;
  updated_at?: string | null;
  closed_at?: string | null;
  pull_request?: unknown;
};

type GitHubRelease = {
  author?: GitHubActor | null;
  created_at?: string | null;
  published_at?: string | null;
};

type GitHubDeployment = {
  creator?: GitHubActor | null;
  created_at?: string | null;
};

type GitHubTag = {
  name: string;
  commit?: {
    sha?: string;
    url?: string;
  };
};

type TagObject = {
  tagger?: { date?: string | null };
  author?: GitHubActor | null;
  commit?: {
    author?: { date?: string | null };
    committer?: { date?: string | null };
  };
  object?: {
    type?: string;
    url?: string;
  };
};

type FetchMeta = {
  repositoriesScanned: number;
  repositoriesSkipped: number;
  warnings: string[];
};

class GitHubClient {
  requests = 0;
  rateLimitRemaining: number | undefined;
  rateLimitReset: string | undefined;

  constructor(private readonly token: string) {}

  async get<T>(url: string): Promise<T> {
    this.requests += 1;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    });

    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');
    this.rateLimitRemaining = remaining == null ? undefined : Number(remaining);
    this.rateLimitReset = reset
      ? new Date(Number(reset) * 1000).toISOString()
      : this.rateLimitReset;

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub ${response.status} ${response.statusText}: ${body.slice(0, 240)}`);
    }

    return response.json() as Promise<T>;
  }

  async paginate<T>(
    baseUrl: string,
    options: {
      perPage?: number;
      maxPages?: number;
      stop?: (items: T[]) => boolean;
    } = {},
  ): Promise<T[]> {
    const perPage = options.perPage ?? 100;
    const maxPages = options.maxPages ?? 30;
    const results: T[] = [];

    for (let page = 1; page <= maxPages; page++) {
      const url = new URL(baseUrl);
      url.searchParams.set('per_page', String(perPage));
      url.searchParams.set('page', String(page));
      const items = await this.get<T[]>(url.toString());
      results.push(...items);

      if (items.length < perPage || options.stop?.(items)) break;
    }

    return results;
  }
}

function dateKeyFromIso(iso?: string | null) {
  return iso ? iso.slice(0, 10) : null;
}

function isWithin(dateKey: string | null, startDate: string, endDate: string) {
  return Boolean(dateKey && dateKey >= startDate && dateKey <= endDate);
}

function isLikelyBot(actor?: GitHubActor | null) {
  const login = actor?.login?.toLowerCase() ?? '';
  return (
    actor?.type === 'Bot' ||
    login.endsWith('[bot]') ||
    login.includes('dependabot') ||
    login.includes('renovate') ||
    login.includes('vercel') ||
    login.includes('github-actions')
  );
}

function isTargetActor(actor: GitHubActor | null | undefined, targetUser: string, excludeBots: boolean) {
  if (!actor?.login) return false;
  if (excludeBots && isLikelyBot(actor)) return false;
  return actor.login.toLowerCase() === targetUser.toLowerCase();
}

function shouldCountRepoEvent(actor: GitHubActor | null | undefined, excludeBots: boolean) {
  if (!actor) return true;
  return !(excludeBots && isLikelyBot(actor));
}

function isMergeCommit(commit: GitHubCommit) {
  const message = commit.commit?.message ?? '';
  return (commit.parents?.length ?? 0) > 1 || /^merge\b/i.test(message);
}

function repoApiPath(fullName: string) {
  const [owner, repo] = fullName.split('/');
  return `${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

function repoAllowList(targetUser: string) {
  return new Set(
    [
      targetUser,
      ...(process.env.LUNAR_GITHUB_ORGS || process.env.GITHUB_ORGS || '')
        .split(',')
        .map((org) => org.trim())
        .filter(Boolean),
    ].map((value) => value.toLowerCase()),
  );
}

async function fetchRepositories(
  client: GitHubClient,
  targetUser: string,
  includeForks: boolean,
  warnings: string[],
): Promise<GitHubRepo[]> {
  const allowedOwners = repoAllowList(targetUser);
  const repos = new Map<string, GitHubRepo>();

  try {
    const accessible = await client.paginate<GitHubRepo>(
      'https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=pushed&direction=desc',
      { maxPages: 20 },
    );
    accessible
      .filter((repo) => allowedOwners.has(repo.owner?.login?.toLowerCase() ?? ''))
      .forEach((repo) => repos.set(repo.full_name, repo));
  } catch (error) {
    warnings.push(`Could not list authenticated-user repos: ${(error as Error).message}`);
  }

  try {
    const publicRepos = await client.paginate<GitHubRepo>(
      `https://api.github.com/users/${encodeURIComponent(targetUser)}/repos?type=owner&sort=pushed&direction=desc`,
      { maxPages: 10 },
    );
    publicRepos.forEach((repo) => repos.set(repo.full_name, repo));
  } catch (error) {
    warnings.push(`Could not list public repos for ${targetUser}: ${(error as Error).message}`);
  }

  return [...repos.values()]
    .filter((repo) => includeForks || !repo.fork)
    .sort((a, b) => (b.pushed_at ?? '').localeCompare(a.pushed_at ?? ''));
}

async function fetchCommits(
  client: GitHubClient,
  days: Map<string, DailyActivity>,
  repo: GitHubRepo,
  params: AnalysisParams,
  lineBudget: { remaining: number },
  warnings: string[],
) {
  const fullPath = repoApiPath(repo.full_name);
  const commits = await client.paginate<GitHubCommit>(
    `https://api.github.com/repos/${fullPath}/commits?author=${encodeURIComponent(params.user)}&since=${encodeURIComponent(isoStartOfDay(params.startDate))}&until=${encodeURIComponent(isoEndOfDay(params.endDate))}`,
    { maxPages: 30 },
  );

  for (const commit of commits) {
    const date = dateKeyFromIso(commit.commit?.author?.date ?? commit.commit?.committer?.date);
    if (!isWithin(date, params.startDate, params.endDate)) continue;
    if (params.excludeBots && isLikelyBot(commit.author)) continue;
    if (isMergeCommit(commit)) continue;

    bumpActivity(days, date!, repo.full_name, 'commits');

    if (params.includeLines && commit.url && lineBudget.remaining > 0) {
      lineBudget.remaining -= 1;
      try {
        const detail = await client.get<GitHubCommitDetail>(commit.url);
        bumpLines(
          days,
          date!,
          repo.full_name,
          detail.stats?.additions ?? 0,
          detail.stats?.deletions ?? 0,
        );
      } catch (error) {
        warnings.push(`Could not fetch commit stats for ${repo.full_name}@${commit.sha.slice(0, 7)}: ${(error as Error).message}`);
      }
    }
  }
}

async function fetchPullRequests(
  client: GitHubClient,
  days: Map<string, DailyActivity>,
  repo: GitHubRepo,
  params: AnalysisParams,
) {
  const fullPath = repoApiPath(repo.full_name);
  const pulls = await client.paginate<GitHubPullRequest>(
    `https://api.github.com/repos/${fullPath}/pulls?state=all&sort=updated&direction=desc`,
    {
      maxPages: 20,
      stop: (items) =>
        items.length > 0 &&
        items.every((item) => (dateKeyFromIso(item.updated_at) ?? '9999-99-99') < params.startDate),
    },
  );

  for (const pr of pulls) {
    if (!isTargetActor(pr.user, params.user, params.excludeBots)) continue;

    const created = dateKeyFromIso(pr.created_at);
    if (isWithin(created, params.startDate, params.endDate)) {
      bumpActivity(days, created!, repo.full_name, 'pullRequestsCreated');
    }

    const merged = dateKeyFromIso(pr.merged_at);
    if (isWithin(merged, params.startDate, params.endDate)) {
      bumpActivity(days, merged!, repo.full_name, 'pullRequestsMerged');
    }
  }
}

async function fetchIssues(
  client: GitHubClient,
  days: Map<string, DailyActivity>,
  repo: GitHubRepo,
  params: AnalysisParams,
) {
  const fullPath = repoApiPath(repo.full_name);
  const issues = await client.paginate<GitHubIssue>(
    `https://api.github.com/repos/${fullPath}/issues?state=all&since=${encodeURIComponent(isoStartOfDay(params.startDate))}`,
    {
      maxPages: 20,
      stop: (items) =>
        items.length > 0 &&
        items.every((item) => (dateKeyFromIso(item.updated_at) ?? '9999-99-99') < params.startDate),
    },
  );

  for (const issue of issues) {
    if (issue.pull_request) continue;
    if (!isTargetActor(issue.user, params.user, params.excludeBots)) continue;

    const closed = dateKeyFromIso(issue.closed_at);
    if (isWithin(closed, params.startDate, params.endDate)) {
      bumpActivity(days, closed!, repo.full_name, 'issuesClosed');
    }
  }
}

async function fetchReleases(
  client: GitHubClient,
  days: Map<string, DailyActivity>,
  repo: GitHubRepo,
  params: AnalysisParams,
) {
  const fullPath = repoApiPath(repo.full_name);
  const releases = await client.paginate<GitHubRelease>(
    `https://api.github.com/repos/${fullPath}/releases`,
    {
      maxPages: 10,
      stop: (items) =>
        items.length > 0 &&
        items.every((item) => (dateKeyFromIso(item.published_at ?? item.created_at) ?? '9999-99-99') < params.startDate),
    },
  );

  for (const release of releases) {
    if (!shouldCountRepoEvent(release.author, params.excludeBots)) continue;
    const date = dateKeyFromIso(release.published_at ?? release.created_at);
    if (isWithin(date, params.startDate, params.endDate)) {
      bumpActivity(days, date!, repo.full_name, 'releases');
    }
  }
}

async function fetchDeployments(
  client: GitHubClient,
  days: Map<string, DailyActivity>,
  repo: GitHubRepo,
  params: AnalysisParams,
) {
  const fullPath = repoApiPath(repo.full_name);
  const deployments = await client.paginate<GitHubDeployment>(
    `https://api.github.com/repos/${fullPath}/deployments`,
    {
      maxPages: 10,
      stop: (items) =>
        items.length > 0 &&
        items.every((item) => (dateKeyFromIso(item.created_at) ?? '9999-99-99') < params.startDate),
    },
  );

  for (const deployment of deployments) {
    const date = dateKeyFromIso(deployment.created_at);
    if (!isWithin(date, params.startDate, params.endDate)) continue;

    if (
      isTargetActor(deployment.creator, params.user, params.excludeBots) ||
      (!params.excludeBots && shouldCountRepoEvent(deployment.creator, false))
    ) {
      bumpActivity(days, date!, repo.full_name, 'deployments');
    }
  }
}

async function fetchTags(
  client: GitHubClient,
  days: Map<string, DailyActivity>,
  repo: GitHubRepo,
  params: AnalysisParams,
  warnings: string[],
) {
  const fullPath = repoApiPath(repo.full_name);
  const tags = await client.paginate<GitHubTag>(
    `https://api.github.com/repos/${fullPath}/tags`,
    { maxPages: Math.max(1, Math.ceil(LUNAR_MAX_TAGS_PER_REPO / 100)) },
  );

  for (const tag of tags.slice(0, LUNAR_MAX_TAGS_PER_REPO)) {
    if (!tag.commit?.url) continue;

    try {
      let detail = await client.get<TagObject>(tag.commit.url);
      if (detail.object?.type === 'commit' && detail.object.url) {
        detail = await client.get<TagObject>(detail.object.url);
      }

      if (!shouldCountRepoEvent(detail.author, params.excludeBots)) continue;
      const date = dateKeyFromIso(
        detail.tagger?.date ?? detail.commit?.author?.date ?? detail.commit?.committer?.date,
      );

      if (isWithin(date, params.startDate, params.endDate)) {
        bumpActivity(days, date!, repo.full_name, 'tags');
      }
    } catch (error) {
      warnings.push(`Could not resolve tag ${repo.full_name}@${tag.name}: ${(error as Error).message}`);
    }
  }
}

async function collectRepo(
  client: GitHubClient,
  days: Map<string, DailyActivity>,
  repo: GitHubRepo,
  params: AnalysisParams,
  lineBudget: { remaining: number },
  warnings: string[],
) {
  await fetchCommits(client, days, repo, params, lineBudget, warnings);
  await Promise.all([
    fetchPullRequests(client, days, repo, params),
    fetchIssues(client, days, repo, params),
    fetchReleases(client, days, repo, params),
    fetchDeployments(client, days, repo, params),
  ]);
  await fetchTags(client, days, repo, params, warnings);
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      await worker(item);
    }
  });
  await Promise.all(workers);
}

export async function fetchGitHubActivity(params: AnalysisParams): Promise<{
  days: Map<string, DailyActivity>;
  meta: GitHubCollectionMeta;
}> {
  const token = process.env.LUNAR_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN or LUNAR_GITHUB_TOKEN is not configured.');
  }

  const days = createDailyActivityMap(params.startDate, params.endDate);
  const client = new GitHubClient(token);
  const fetchMeta: FetchMeta = {
    repositoriesScanned: 0,
    repositoriesSkipped: 0,
    warnings: [],
  };

  const repos = await fetchRepositories(
    client,
    params.user,
    params.includeForks,
    fetchMeta.warnings,
  );
  const lineBudget = { remaining: params.includeLines ? LUNAR_MAX_LINE_COMMITS : 0 };

  await runPool(repos, 3, async (repo) => {
    try {
      await collectRepo(client, days, repo, params, lineBudget, fetchMeta.warnings);
      fetchMeta.repositoriesScanned += 1;
    } catch (error) {
      fetchMeta.repositoriesSkipped += 1;
      fetchMeta.warnings.push(`${repo.full_name}: ${(error as Error).message}`);
    }
  });

  return {
    days,
    meta: {
      source: 'github',
      user: params.user,
      repositoriesScanned: fetchMeta.repositoriesScanned,
      repositoriesSkipped: fetchMeta.repositoriesSkipped,
      apiRequests: client.requests,
      rateLimitRemaining: client.rateLimitRemaining,
      rateLimitReset: client.rateLimitReset,
      warnings: fetchMeta.warnings.slice(0, 80),
      generatedAt: new Date().toISOString(),
    },
  };
}
