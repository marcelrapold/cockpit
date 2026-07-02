import type { DailyActivity, LunarAnalysis } from './types';

function escapeCsv(value: unknown) {
  const text = value == null ? '' : String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function dailyRow(day: DailyActivity) {
  return [
    day.date,
    day.velocityScore,
    day.commits,
    day.pullRequestsCreated,
    day.pullRequestsMerged,
    day.releases,
    day.tags,
    day.deployments,
    day.issuesClosed,
    day.linesAdded ?? '',
    day.linesDeleted ?? '',
    day.moonPhase,
    day.nearestFullMoonDate ?? '',
    day.daysFromFullMoon ?? '',
    Object.keys(day.repositories).join('|'),
  ];
}

export function lunarDailyCsv(analysis: LunarAnalysis) {
  const header = [
    'date',
    'velocityScore',
    'commits',
    'pullRequestsCreated',
    'pullRequestsMerged',
    'releases',
    'tags',
    'deployments',
    'issuesClosed',
    'linesAdded',
    'linesDeleted',
    'moonPhase',
    'nearestFullMoonDate',
    'daysFromFullMoon',
    'repositories',
  ];

  return [header, ...analysis.dailyActivity.map(dailyRow)]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');
}
