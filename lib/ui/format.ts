/**
 * Gemeinsame Formatierung für Server- und Client-Components.
 * de-CH locale, Empty-State-Pattern (siehe KpiStrip.tsx Header):
 *   - undefined/null → '—'
 *   - 0              → '0'
 */

export const EMPTY = '—';

export function fmtNumber(n: number | null | undefined, locale = 'de-CH'): string {
  if (n == null || Number.isNaN(n)) return EMPTY;
  return n.toLocaleString(locale);
}

export function fmtPercent(n: number | null | undefined, decimals = 0): string {
  if (n == null || Number.isNaN(n)) return EMPTY;
  return `${n.toFixed(decimals)}%`;
}

/** "5 min", "2h 30min", "3 Tage" — kontextabhängig je nach Größenordnung. */
export function fmtMinutes(min: number | null | undefined): string {
  if (min == null || Number.isNaN(min)) return EMPTY;
  if (min < 1) return '<1 min';
  if (min < 60) return `${Math.round(min)} min`;
  if (min < 24 * 60) {
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  const d = Math.round(min / 60 / 24);
  return d === 1 ? '1 Tag' : `${d} Tage`;
}

/** Deploy-Frequency-Wert (`/day`) lesefreundlich. */
export function fmtDeployFreq(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return EMPTY;
  if (value >= 1) return `${value.toFixed(1)}/Tag`;
  if (value >= 1 / 7) return `${(value * 7).toFixed(1)}/Wo`;
  if (value > 0) return `${(value * 30).toFixed(1)}/Mo`;
  return '0/Mo';
}

/** Relative Zeit "vor 5 min", "vor 2h", "vor 3 Tagen". */
export function fmtRelative(timestamp: string | null | undefined, now = Date.now()): string {
  if (!timestamp) return EMPTY;
  const t = new Date(timestamp).getTime();
  if (Number.isNaN(t)) return EMPTY;
  const diffMin = Math.max(0, Math.round((now - t) / 60000));
  if (diffMin < 1) return 'gerade eben';
  if (diffMin < 60) return `vor ${diffMin} min`;
  if (diffMin < 24 * 60) return `vor ${Math.round(diffMin / 60)}h`;
  const days = Math.round(diffMin / 60 / 24);
  return days === 1 ? 'vor 1 Tag' : `vor ${days} Tagen`;
}

export type TrendTone = 'up' | 'down' | 'flat' | 'unknown';

export function trendOf(n: number | null | undefined): TrendTone {
  if (n == null || Number.isNaN(n)) return 'unknown';
  if (n > 0) return 'up';
  if (n < 0) return 'down';
  return 'flat';
}

export function fmtTrend(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return EMPTY;
  if (n > 0) return `+${n.toFixed(0)}%`;
  if (n < 0) return `${n.toFixed(0)}%`;
  return '0%';
}
