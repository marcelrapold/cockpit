import { DEFAULT_ANALYSIS_MONTHS } from './config';

const DAY_MS = 86_400_000;

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseDateKey(a).getTime() - parseDateKey(b).getTime()) / DAY_MS);
}

export function eachDateKey(startDate: string, endDate: string): string[] {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  const dates: string[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(toDateKey(d));
  }
  return dates;
}

export function clampDateRange(startDate: string, endDate: string) {
  if (parseDateKey(startDate) <= parseDateKey(endDate)) {
    return { startDate, endDate };
  }
  return { startDate: endDate, endDate: startDate };
}

export function defaultDateRange(now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  start.setUTCMonth(start.getUTCMonth() - DEFAULT_ANALYSIS_MONTHS);
  start.setUTCDate(start.getUTCDate() + 1);
  return {
    startDate: toDateKey(start),
    endDate: toDateKey(end),
  };
}

export function isoStartOfDay(dateKey: string): string {
  return `${dateKey}T00:00:00.000Z`;
}

export function isoEndOfDay(dateKey: string): string {
  return `${dateKey}T23:59:59.999Z`;
}

export function weekdayIndex(dateKey: string): number {
  return (parseDateKey(dateKey).getUTCDay() + 6) % 7;
}

export function formatCompactDate(dateKey: string): string {
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(parseDateKey(dateKey));
}
