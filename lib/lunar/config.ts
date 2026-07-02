import type { VelocityWeights } from './types';

export const LUNAR_APP_NAME = 'Lunar Velocity';
export const LUNAR_APP_SUBTITLE = 'Engineering output under the full moon.';
export const LUNAR_QUESTION = 'Does Marcel ship more when the moon is full?';

export const DEFAULT_LUNAR_USER = 'marcel';
export const DEFAULT_FULL_MOON_WINDOW_DAYS = 2;
export const DEFAULT_COMPARE_WINDOWS = [1, 2, 3, 5];
export const DEFAULT_ANALYSIS_MONTHS = 24;

export const DEFAULT_VELOCITY_WEIGHTS: VelocityWeights = {
  commits: 1,
  pullRequestsCreated: 3,
  pullRequestsMerged: 5,
  releases: 8,
  deployments: 10,
  issuesClosed: 2,
  tags: 4,
};

export const LUNAR_CACHE_VERSION = 'lunar-v1';
export const LUNAR_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
export const LUNAR_BOOTSTRAP_ITERATIONS = 4000;
export const LUNAR_MAX_LINE_COMMITS = 250;
export const LUNAR_MAX_TAGS_PER_REPO = 120;
