import { SearchMoonPhase } from 'astronomy-engine';

import { addDays, diffDays, parseDateKey, toDateKey } from './date';
import type { DailyActivity, MoonEvent } from './types';

function enumerateMoonPhase(
  kind: MoonEvent['kind'],
  targetLongitude: number,
  startDate: string,
  endDate: string,
): MoonEvent[] {
  const searchStart = parseDateKey(addDays(startDate, -35));
  const searchEnd = parseDateKey(addDays(endDate, 35));
  const events: MoonEvent[] = [];
  let cursor = searchStart;

  for (let i = 0; i < 80 && cursor <= searchEnd; i++) {
    const found = SearchMoonPhase(targetLongitude, cursor, 40);
    if (!found) break;

    const date = toDateKey(found.date);
    if (parseDateKey(date) >= searchStart && parseDateKey(date) <= searchEnd) {
      events.push({ kind, date, iso: found.date.toISOString() });
    }

    cursor = new Date(found.date.getTime() + 25 * 86_400_000);
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function getMoonEvents(startDate: string, endDate: string) {
  return {
    fullMoons: enumerateMoonPhase('full', 180, startDate, endDate),
    newMoons: enumerateMoonPhase('new', 0, startDate, endDate),
  };
}

export function nearestMoonEvent(date: string, events: MoonEvent[]) {
  let nearest: { event: MoonEvent; days: number } | null = null;
  for (const event of events) {
    const days = diffDays(date, event.date);
    if (!nearest || Math.abs(days) < Math.abs(nearest.days)) {
      nearest = { event, days };
    }
  }
  return nearest;
}

export function isInMoonWindow(date: string, events: MoonEvent[], windowDays: number) {
  const nearest = nearestMoonEvent(date, events);
  return Boolean(nearest && Math.abs(nearest.days) <= windowDays);
}

export function annotateMoonPhases(
  days: DailyActivity[],
  fullMoons: MoonEvent[],
  newMoons: MoonEvent[],
  fullMoonWindowDays: number,
  includeNewMoon: boolean,
) {
  days.forEach((day) => {
    const nearestFull = nearestMoonEvent(day.date, fullMoons);
    if (nearestFull) {
      day.nearestFullMoonDate = nearestFull.event.date;
      day.daysFromFullMoon = nearestFull.days;
    }

    if (nearestFull && Math.abs(nearestFull.days) <= fullMoonWindowDays) {
      day.moonPhase = 'full_moon_window';
      return;
    }

    if (includeNewMoon) {
      const nearestNew = nearestMoonEvent(day.date, newMoons);
      if (nearestNew && Math.abs(nearestNew.days) <= fullMoonWindowDays) {
        day.moonPhase = 'new_moon_window';
        return;
      }
    }

    day.moonPhase = 'normal';
  });
}
