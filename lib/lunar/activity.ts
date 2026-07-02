import { eachDateKey } from './date';
import type { DailyActivity, RepoDailyActivity, VelocityWeights } from './types';

type ActivityField =
  | 'commits'
  | 'pullRequestsCreated'
  | 'pullRequestsMerged'
  | 'releases'
  | 'tags'
  | 'deployments'
  | 'issuesClosed';

const repoFieldMap: Record<ActivityField, keyof RepoDailyActivity> = {
  commits: 'commits',
  pullRequestsCreated: 'prsCreated',
  pullRequestsMerged: 'prsMerged',
  releases: 'releases',
  tags: 'tags',
  deployments: 'deployments',
  issuesClosed: 'issuesClosed',
};

export function createEmptyRepoActivity(): RepoDailyActivity {
  return {
    commits: 0,
    prsCreated: 0,
    prsMerged: 0,
    releases: 0,
    tags: 0,
    deployments: 0,
    issuesClosed: 0,
    velocityScore: 0,
  };
}

export function createEmptyDailyActivity(date: string): DailyActivity {
  return {
    date,
    commits: 0,
    pullRequestsCreated: 0,
    pullRequestsMerged: 0,
    releases: 0,
    tags: 0,
    deployments: 0,
    issuesClosed: 0,
    repositories: {},
    moonPhase: 'normal',
    velocityScore: 0,
  };
}

export function createDailyActivityMap(startDate: string, endDate: string) {
  const entries = eachDateKey(startDate, endDate).map((date) => [
    date,
    createEmptyDailyActivity(date),
  ] as const);
  return new Map<string, DailyActivity>(entries);
}

export function bumpActivity(
  days: Map<string, DailyActivity>,
  date: string,
  repoName: string,
  field: ActivityField,
  amount = 1,
) {
  const day = days.get(date);
  if (!day || amount <= 0) return;

  day[field] += amount;

  const repo = day.repositories[repoName] ?? createEmptyRepoActivity();
  const repoField = repoFieldMap[field];
  repo[repoField] = (repo[repoField] as number) + amount;
  day.repositories[repoName] = repo;
}

export function bumpLines(
  days: Map<string, DailyActivity>,
  date: string,
  repoName: string,
  added = 0,
  deleted = 0,
) {
  const day = days.get(date);
  if (!day) return;

  day.linesAdded = (day.linesAdded ?? 0) + Math.max(0, added);
  day.linesDeleted = (day.linesDeleted ?? 0) + Math.max(0, deleted);

  const repo = day.repositories[repoName] ?? createEmptyRepoActivity();
  repo.linesAdded = (repo.linesAdded ?? 0) + Math.max(0, added);
  repo.linesDeleted = (repo.linesDeleted ?? 0) + Math.max(0, deleted);
  day.repositories[repoName] = repo;
}

export function scoreRepoActivity(repo: RepoDailyActivity, weights: VelocityWeights): number {
  return (
    repo.commits * weights.commits +
    repo.prsCreated * weights.pullRequestsCreated +
    repo.prsMerged * weights.pullRequestsMerged +
    repo.releases * weights.releases +
    repo.tags * weights.tags +
    repo.deployments * weights.deployments +
    repo.issuesClosed * weights.issuesClosed
  );
}

export function scoreDailyActivity(day: DailyActivity, weights: VelocityWeights): number {
  for (const repo of Object.values(day.repositories)) {
    repo.velocityScore = scoreRepoActivity(repo, weights);
  }

  day.velocityScore =
    day.commits * weights.commits +
    day.pullRequestsCreated * weights.pullRequestsCreated +
    day.pullRequestsMerged * weights.pullRequestsMerged +
    day.releases * weights.releases +
    day.tags * weights.tags +
    day.deployments * weights.deployments +
    day.issuesClosed * weights.issuesClosed;

  return day.velocityScore;
}

export function finalizeDailyActivity(
  days: Map<string, DailyActivity>,
  weights: VelocityWeights,
): DailyActivity[] {
  const list = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  list.forEach((day) => scoreDailyActivity(day, weights));
  return list;
}
