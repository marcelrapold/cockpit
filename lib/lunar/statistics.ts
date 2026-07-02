import { LUNAR_BOOTSTRAP_ITERATIONS } from './config';
import { addDays, weekdayIndex } from './date';
import { isInMoonWindow } from './moon';
import type {
  BootstrapResult,
  CohortStats,
  DailyActivity,
  EvidenceLevel,
  FullMoonActivity,
  MoonEvent,
  RepoDailyActivity,
  RepoVelocity,
  TopDay,
  VelocityWeights,
  WeekdayPhaseHeatmapCell,
  WindowComparison,
} from './types';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PHASES = ['full_moon_window', 'new_moon_window', 'normal'] as const;

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function percentDelta(full: number, baseline: number): number | null {
  if (baseline === 0) return full > 0 ? null : 0;
  return round(((full - baseline) / baseline) * 100, 1);
}

function cohort(values: number[]): CohortStats {
  return {
    days: values.length,
    mean: round(mean(values), 3),
    median: round(median(values), 3),
    total: round(values.reduce((sum, value) => sum + value, 0), 3),
  };
}

function cohenD(a: number[], b: number[]): number | null {
  if (a.length < 2 || b.length < 2) return null;
  const pooled = Math.sqrt((stddev(a) ** 2 + stddev(b) ** 2) / 2);
  if (pooled === 0) return null;
  return round((mean(a) - mean(b)) / pooled, 3);
}

function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] == null
    ? sorted[base]
    : sorted[base] + rest * (sorted[base + 1] - sorted[base]);
}

function bootstrapComparison(
  fullScores: number[],
  baselineScores: number[],
  iterations = LUNAR_BOOTSTRAP_ITERATIONS,
): BootstrapResult {
  const observedDiff = mean(fullScores) - mean(baselineScores);
  if (fullScores.length < 2 || baselineScores.length < 2) {
    return {
      observedDiff: round(observedDiff, 3),
      pValue: null,
      ciLow: null,
      ciHigh: null,
      iterations: 0,
    };
  }

  const random = mulberry32(0x5eed2026);
  const diffs: number[] = [];
  let tail = 0;
  for (let i = 0; i < iterations; i++) {
    let sampleSum = 0;
    for (let j = 0; j < fullScores.length; j++) {
      sampleSum += baselineScores[Math.floor(random() * baselineScores.length)];
    }
    const sampleDiff = sampleSum / fullScores.length - mean(baselineScores);
    diffs.push(sampleDiff);
    if (observedDiff >= 0 ? sampleDiff >= observedDiff : sampleDiff <= observedDiff) {
      tail += 1;
    }
  }

  return {
    observedDiff: round(observedDiff, 3),
    pValue: round(Math.max(1 / iterations, tail / iterations), 4),
    ciLow: round(quantile(diffs, 0.025), 3),
    ciHigh: round(quantile(diffs, 0.975), 3),
    iterations,
  };
}

export function compareWindow(
  days: DailyActivity[],
  fullMoons: MoonEvent[],
  windowDays: number,
): WindowComparison {
  const fullScores = days
    .filter((day) => isInMoonWindow(day.date, fullMoons, windowDays))
    .map((day) => day.velocityScore);
  const baselineScores = days
    .filter((day) => !isInMoonWindow(day.date, fullMoons, windowDays))
    .map((day) => day.velocityScore);

  const topDays = buildTopDays(days, 10);
  const topDayShare =
    topDays.length === 0
      ? 0
      : topDays.filter((day) => isInMoonWindow(day.date, fullMoons, windowDays)).length /
        topDays.length;

  const full = cohort(fullScores);
  const baseline = cohort(baselineScores);

  return {
    windowDays,
    fullMoon: full,
    baseline,
    percentDelta: percentDelta(full.mean, baseline.mean),
    effectSize: cohenD(fullScores, baselineScores),
    bootstrap: bootstrapComparison(fullScores, baselineScores),
    topDayShare: round(topDayShare, 3),
  };
}

export function classifyEvidence(comparison: WindowComparison): EvidenceLevel {
  const effect = Math.abs(comparison.effectSize ?? 0);
  const p = comparison.bootstrap.pValue ?? 1;
  const pct = Math.abs(comparison.percentDelta ?? 0);

  if (comparison.fullMoon.days < 10 || comparison.baseline.days < 30) return 'weak';
  if (p < 0.05 && effect >= 0.8 && pct >= 25) return 'strong';
  if (p < 0.1 && effect >= 0.45 && pct >= 10) return 'moderate';
  return 'weak';
}

export function buildTopDays(days: DailyActivity[], limit: number): TopDay[] {
  return [...days]
    .sort((a, b) => b.velocityScore - a.velocityScore || b.date.localeCompare(a.date))
    .slice(0, limit)
    .map((day) => ({
      date: day.date,
      score: round(day.velocityScore, 2),
      moonPhase: day.moonPhase,
      nearestFullMoonDate: day.nearestFullMoonDate,
      daysFromFullMoon: day.daysFromFullMoon,
      commits: day.commits,
      pullRequestsCreated: day.pullRequestsCreated,
      pullRequestsMerged: day.pullRequestsMerged,
      releases: day.releases,
      deployments: day.deployments,
      issuesClosed: day.issuesClosed,
    }));
}

function addRepoTotals(target: RepoDailyActivity, source: RepoDailyActivity) {
  target.commits += source.commits;
  target.prsCreated += source.prsCreated;
  target.prsMerged += source.prsMerged;
  target.releases += source.releases;
  target.tags += source.tags;
  target.deployments += source.deployments;
  target.issuesClosed += source.issuesClosed;
  target.velocityScore += source.velocityScore;
}

export function buildRepoVelocity(
  days: DailyActivity[],
  fullMoons: MoonEvent[],
  activeWindowDays: number,
): RepoVelocity[] {
  const repos = new Map<string, RepoDailyActivity>();
  for (const day of days) {
    for (const [repoName, repoActivity] of Object.entries(day.repositories)) {
      const total =
        repos.get(repoName) ??
        ({
          commits: 0,
          prsCreated: 0,
          prsMerged: 0,
          releases: 0,
          tags: 0,
          deployments: 0,
          issuesClosed: 0,
          velocityScore: 0,
        } satisfies RepoDailyActivity);
      addRepoTotals(total, repoActivity);
      repos.set(repoName, total);
    }
  }

  const fullDays = days.filter((day) => isInMoonWindow(day.date, fullMoons, activeWindowDays));
  const baselineDays = days.filter((day) => !isInMoonWindow(day.date, fullMoons, activeWindowDays));

  return [...repos.entries()]
    .map(([repo, total]) => {
      const fullMoonMean = mean(
        fullDays.map((day) => day.repositories[repo]?.velocityScore ?? 0),
      );
      const baselineMean = mean(
        baselineDays.map((day) => day.repositories[repo]?.velocityScore ?? 0),
      );

      return {
        repo,
        score: round(total.velocityScore, 2),
        commits: total.commits,
        pullRequestsCreated: total.prsCreated,
        pullRequestsMerged: total.prsMerged,
        releases: total.releases,
        deployments: total.deployments,
        issuesClosed: total.issuesClosed,
        fullMoonMean: round(fullMoonMean, 3),
        baselineMean: round(baselineMean, 3),
        fullMoonLiftPct: percentDelta(fullMoonMean, baselineMean),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
}

export function buildFullMoonTable(
  days: DailyActivity[],
  fullMoons: MoonEvent[],
  windowDays: number,
): FullMoonActivity[] {
  const byDate = new Map(days.map((day) => [day.date, day]));

  return fullMoons
    .filter((moon) => byDate.has(moon.date) || byDate.has(addDays(moon.date, -1)) || byDate.has(addDays(moon.date, 1)))
    .map((moon) => {
      const windowDates = Array.from({ length: windowDays * 2 + 1 }, (_, i) =>
        addDays(moon.date, i - windowDays),
      );
      const windowDaysData = windowDates.map((date) => byDate.get(date)).filter(Boolean) as DailyActivity[];

      return {
        date: moon.date,
        iso: moon.iso,
        windowStart: addDays(moon.date, -windowDays),
        windowEnd: addDays(moon.date, windowDays),
        score: round(windowDaysData.reduce((sum, day) => sum + day.velocityScore, 0), 2),
        commits: windowDaysData.reduce((sum, day) => sum + day.commits, 0),
        pullRequestsCreated: windowDaysData.reduce(
          (sum, day) => sum + day.pullRequestsCreated,
          0,
        ),
        pullRequestsMerged: windowDaysData.reduce(
          (sum, day) => sum + day.pullRequestsMerged,
          0,
        ),
        releases: windowDaysData.reduce((sum, day) => sum + day.releases, 0),
        deployments: windowDaysData.reduce((sum, day) => sum + day.deployments, 0),
        issuesClosed: windowDaysData.reduce((sum, day) => sum + day.issuesClosed, 0),
      };
    });
}

export function buildWeekdayPhaseHeatmap(days: DailyActivity[]): WeekdayPhaseHeatmapCell[] {
  return PHASES.flatMap((phase) =>
    WEEKDAYS.map((weekdayLabel, weekday) => {
      const cohortDays = days.filter(
        (day) => weekdayIndex(day.date) === weekday && day.moonPhase === phase,
      );
      return {
        weekday,
        weekdayLabel,
        phase,
        days: cohortDays.length,
        meanScore: round(mean(cohortDays.map((day) => day.velocityScore)), 3),
      };
    }),
  );
}

export function strongestWindow(windows: WindowComparison[]): WindowComparison {
  return [...windows].sort((a, b) => {
    const aScore = (a.percentDelta ?? -Infinity) * Math.max(0, a.effectSize ?? 0);
    const bScore = (b.percentDelta ?? -Infinity) * Math.max(0, b.effectSize ?? 0);
    return bScore - aScore;
  })[0];
}

export function totalScore(days: DailyActivity[]) {
  return round(days.reduce((sum, day) => sum + day.velocityScore, 0), 2);
}

export function scoreWeightsDescription(weights: VelocityWeights): string {
  return [
    `commits x${weights.commits}`,
    `PR created x${weights.pullRequestsCreated}`,
    `PR merged x${weights.pullRequestsMerged}`,
    `release x${weights.releases}`,
    `tag x${weights.tags}`,
    `deployment x${weights.deployments}`,
    `issue closed x${weights.issuesClosed}`,
  ].join(', ');
}
