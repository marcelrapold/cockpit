export type MoonPhaseKind = 'full_moon_window' | 'new_moon_window' | 'normal';

export type RepoDailyActivity = {
  commits: number;
  prsCreated: number;
  prsMerged: number;
  releases: number;
  tags: number;
  deployments: number;
  issuesClosed: number;
  linesAdded?: number;
  linesDeleted?: number;
  velocityScore: number;
};

export type DailyActivity = {
  date: string;
  commits: number;
  pullRequestsCreated: number;
  pullRequestsMerged: number;
  releases: number;
  tags: number;
  deployments: number;
  issuesClosed: number;
  linesAdded?: number;
  linesDeleted?: number;
  repositories: Record<string, RepoDailyActivity>;
  moonPhase: MoonPhaseKind;
  nearestFullMoonDate?: string;
  daysFromFullMoon?: number;
  velocityScore: number;
};

export type VelocityWeights = {
  commits: number;
  pullRequestsCreated: number;
  pullRequestsMerged: number;
  releases: number;
  deployments: number;
  issuesClosed: number;
  tags: number;
};

export type MoonEvent = {
  kind: 'full' | 'new';
  date: string;
  iso: string;
};

export type AnalysisParams = {
  user: string;
  startDate: string;
  endDate: string;
  fullMoonWindowDays: number;
  compareWindows: number[];
  includeNewMoon: boolean;
  includeForks: boolean;
  includeLines: boolean;
  excludeBots: boolean;
  demo: boolean;
  force: boolean;
};

export type CohortStats = {
  days: number;
  mean: number;
  median: number;
  total: number;
};

export type BootstrapResult = {
  observedDiff: number;
  pValue: number | null;
  ciLow: number | null;
  ciHigh: number | null;
  iterations: number;
};

export type WindowComparison = {
  windowDays: number;
  fullMoon: CohortStats;
  baseline: CohortStats;
  percentDelta: number | null;
  effectSize: number | null;
  bootstrap: BootstrapResult;
  topDayShare: number;
};

export type RepoVelocity = {
  repo: string;
  score: number;
  commits: number;
  pullRequestsCreated: number;
  pullRequestsMerged: number;
  releases: number;
  deployments: number;
  issuesClosed: number;
  fullMoonMean: number;
  baselineMean: number;
  fullMoonLiftPct: number | null;
};

export type FullMoonActivity = {
  date: string;
  iso: string;
  windowStart: string;
  windowEnd: string;
  score: number;
  commits: number;
  pullRequestsCreated: number;
  pullRequestsMerged: number;
  releases: number;
  deployments: number;
  issuesClosed: number;
};

export type WeekdayPhaseHeatmapCell = {
  weekday: number;
  weekdayLabel: string;
  phase: MoonPhaseKind;
  days: number;
  meanScore: number;
};

export type TopDay = {
  date: string;
  score: number;
  moonPhase: MoonPhaseKind;
  nearestFullMoonDate?: string;
  daysFromFullMoon?: number;
  commits: number;
  pullRequestsCreated: number;
  pullRequestsMerged: number;
  releases: number;
  deployments: number;
  issuesClosed: number;
};

export type EvidenceLevel = 'weak' | 'moderate' | 'strong';

export type GitHubCollectionMeta = {
  source: 'github';
  user: string;
  repositoriesScanned: number;
  repositoriesSkipped: number;
  apiRequests: number;
  rateLimitRemaining?: number;
  rateLimitReset?: string;
  warnings: string[];
  generatedAt: string;
};

export type LunarAnalysis = {
  app: 'Lunar Velocity';
  question: 'Does Marcel ship more when the moon is full?';
  params: AnalysisParams;
  weights: VelocityWeights;
  summary: {
    fullMoonVelocityPct: number | null;
    evidenceLevel: EvidenceLevel;
    mostAffectedRepo: string | null;
    strongestWindowDays: number;
    fullMoonDays: number;
    baselineDays: number;
    totalScore: number;
    topOutputShareInFullMoonWindow: number;
  };
  dailyActivity: DailyActivity[];
  moonEvents: {
    fullMoons: MoonEvent[];
    newMoons: MoonEvent[];
  };
  metrics: {
    activeWindow: WindowComparison;
    windows: WindowComparison[];
    topDays: TopDay[];
    repoVelocity: RepoVelocity[];
    fullMoonTable: FullMoonActivity[];
    weekdayPhaseHeatmap: WeekdayPhaseHeatmapCell[];
  };
  meta: GitHubCollectionMeta;
};
