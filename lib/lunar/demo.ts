import { createDailyActivityMap, bumpActivity } from './activity';
import { eachDateKey, weekdayIndex } from './date';
import { isInMoonWindow } from './moon';
import type { AnalysisParams, MoonEvent } from './types';

const DEMO_REPOS = [
  'marcelrapold/cockpit',
  'marcelrapold/mycvbuilder.app',
  'zvvch/zvv-kundenradar',
  'zvvch/zvv-fzdb',
  'marcelrapold/radiox',
  'zvvch/zvv-mailer',
];

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFor(input: string) {
  let seed = hashString(input);
  return function random() {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pickRepo(seed: string, index: number) {
  return DEMO_REPOS[(hashString(`${seed}:${index}`) + index) % DEMO_REPOS.length];
}

export function generateDemoActivity(params: AnalysisParams, fullMoons: MoonEvent[]) {
  const days = createDailyActivityMap(params.startDate, params.endDate);

  for (const date of eachDateKey(params.startDate, params.endDate)) {
    const rand = randomFor(`${params.user}:${date}`);
    const weekday = weekdayIndex(date);
    const isWeekend = weekday >= 5;
    const moonBoost = isInMoonWindow(date, fullMoons, params.fullMoonWindowDays) ? 1.75 : 1;
    const weekdayBoost = isWeekend ? 0.35 : weekday === 0 ? 0.75 : 1;
    const base = (rand() * 6 + rand() * 4) * moonBoost * weekdayBoost;
    const commits = Math.max(0, Math.floor(base - 1.5));

    for (let i = 0; i < commits; i++) {
      bumpActivity(days, date, pickRepo(date, i), 'commits');
    }

    if (commits > 2 && rand() > 0.58) {
      bumpActivity(days, date, pickRepo(date, 11), 'pullRequestsCreated');
    }
    if (commits > 3 && rand() > 0.64) {
      bumpActivity(days, date, pickRepo(date, 12), 'pullRequestsMerged');
    }
    if (moonBoost > 1 && rand() > 0.82) {
      bumpActivity(days, date, pickRepo(date, 13), 'releases');
    }
    if (moonBoost > 1 && rand() > 0.78) {
      bumpActivity(days, date, pickRepo(date, 14), 'deployments');
    }
    if (commits > 1 && rand() > 0.72) {
      bumpActivity(days, date, pickRepo(date, 15), 'issuesClosed');
    }
    if (rand() > 0.94) {
      bumpActivity(days, date, pickRepo(date, 16), 'tags');
    }
  }

  return days;
}
