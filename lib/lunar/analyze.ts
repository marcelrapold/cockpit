import {
  DEFAULT_COMPARE_WINDOWS,
  DEFAULT_FULL_MOON_WINDOW_DAYS,
  DEFAULT_LUNAR_USER,
  DEFAULT_VELOCITY_WEIGHTS,
  LUNAR_APP_NAME,
  LUNAR_QUESTION,
} from './config';
import { finalizeDailyActivity } from './activity';
import { lunarCacheKey, readLunarCache, writeLunarCache } from './cache';
import { clampDateRange, defaultDateRange } from './date';
import { fetchGitHubActivity } from './github';
import { annotateMoonPhases, getMoonEvents } from './moon';
import {
  buildFullMoonTable,
  buildRepoVelocity,
  buildTopDays,
  buildWeekdayPhaseHeatmap,
  classifyEvidence,
  compareWindow,
  strongestWindow,
  totalScore,
} from './statistics';
import type {
  AnalysisParams,
  LunarAnalysis,
  WindowComparison,
} from './types';

type ParamInput = Partial<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function boolParam(value: string | string[] | undefined, fallback: boolean) {
  const raw = first(value);
  if (raw == null || raw === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

function intParam(value: string | string[] | undefined, fallback: number) {
  const parsed = Number.parseInt(first(value) ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeWindow(windowDays: number) {
  if ([1, 2, 3, 5].includes(windowDays)) return windowDays;
  return DEFAULT_FULL_MOON_WINDOW_DAYS;
}

export function normalizeAnalysisParams(input: ParamInput): AnalysisParams {
  const defaults = defaultDateRange();
  const range = clampDateRange(
    first(input.start) || first(input.startDate) || defaults.startDate,
    first(input.end) || first(input.endDate) || defaults.endDate,
  );

  return {
    user:
      first(input.user) ||
      process.env.LUNAR_GITHUB_USER ||
      DEFAULT_LUNAR_USER,
    startDate: range.startDate,
    endDate: range.endDate,
    fullMoonWindowDays: normalizeWindow(intParam(input.window, DEFAULT_FULL_MOON_WINDOW_DAYS)),
    compareWindows: DEFAULT_COMPARE_WINDOWS,
    includeNewMoon: boolParam(input.includeNewMoon, true),
    includeForks: boolParam(input.includeForks, false),
    includeLines: boolParam(input.includeLines, false),
    excludeBots: boolParam(input.excludeBots, true),
    force: boolParam(input.force, false),
  };
}

function buildSummary(
  activeWindow: WindowComparison,
  windows: WindowComparison[],
  repoVelocity: LunarAnalysis['metrics']['repoVelocity'],
  total: number,
) {
  const evidenceLevel = classifyEvidence(activeWindow);
  const strongest = strongestWindow(windows);
  const mostAffectedRepo =
    [...repoVelocity]
      .filter((repo) => (repo.fullMoonLiftPct ?? -Infinity) > 0)
      .sort((a, b) => {
        const diffA = a.fullMoonMean - a.baselineMean;
        const diffB = b.fullMoonMean - b.baselineMean;
        return diffB - diffA;
      })[0]?.repo ?? null;

  return {
    fullMoonVelocityPct: activeWindow.percentDelta,
    evidenceLevel,
    mostAffectedRepo,
    strongestWindowDays: strongest.windowDays,
    fullMoonDays: activeWindow.fullMoon.days,
    baselineDays: activeWindow.baseline.days,
    totalScore: total,
    topOutputShareInFullMoonWindow: activeWindow.topDayShare,
  };
}

export function isDegradedGitHubAnalysis(analysis: LunarAnalysis) {
  const rateLimitWarning = analysis.meta.warnings.some((warning) =>
    warning.toLowerCase().includes('rate limit'),
  );

  return (
    analysis.meta.source === 'github' &&
    analysis.meta.repositoriesScanned === 0 &&
    analysis.summary.totalScore === 0 &&
    (analysis.meta.rateLimitRemaining === 0 || rateLimitWarning)
  );
}

export async function buildLunarAnalysis(input: ParamInput): Promise<LunarAnalysis> {
  const params = normalizeAnalysisParams(input);
  const cacheKey = lunarCacheKey({ params, weights: DEFAULT_VELOCITY_WEIGHTS });

  if (!params.force) {
    const cached = await readLunarCache<LunarAnalysis>(cacheKey);
    if (cached && !isDegradedGitHubAnalysis(cached)) return cached;
  }

  const moonEvents = getMoonEvents(params.startDate, params.endDate);

  const collected = await fetchGitHubActivity(params);

  const dailyActivity = finalizeDailyActivity(collected.days, DEFAULT_VELOCITY_WEIGHTS);
  annotateMoonPhases(
    dailyActivity,
    moonEvents.fullMoons,
    moonEvents.newMoons,
    params.fullMoonWindowDays,
    params.includeNewMoon,
  );

  const windows = params.compareWindows.map((windowDays) =>
    compareWindow(dailyActivity, moonEvents.fullMoons, windowDays),
  );
  const activeWindow =
    windows.find((window) => window.windowDays === params.fullMoonWindowDays) ?? windows[0];
  const repoVelocity = buildRepoVelocity(
    dailyActivity,
    moonEvents.fullMoons,
    params.fullMoonWindowDays,
  );
  const topDays = buildTopDays(dailyActivity, 10);
  const fullMoonTable = buildFullMoonTable(
    dailyActivity,
    moonEvents.fullMoons,
    params.fullMoonWindowDays,
  );
  const total = totalScore(dailyActivity);

  const analysis: LunarAnalysis = {
    app: LUNAR_APP_NAME,
    question: LUNAR_QUESTION,
    params,
    weights: DEFAULT_VELOCITY_WEIGHTS,
    summary: buildSummary(activeWindow, windows, repoVelocity, total),
    dailyActivity,
    moonEvents,
    metrics: {
      activeWindow,
      windows,
      topDays,
      repoVelocity,
      fullMoonTable,
      weekdayPhaseHeatmap: buildWeekdayPhaseHeatmap(dailyActivity),
    },
    meta: collected.meta,
  };

  if (!isDegradedGitHubAnalysis(analysis)) {
    await writeLunarCache(cacheKey, analysis);
  }

  return analysis;
}
