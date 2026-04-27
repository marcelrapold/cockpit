/**
 * Freshness-Utility für Status-Indikatoren.
 *
 * Übersetzt einen Daten-Timestamp in eine semantische Frische-Stufe:
 *   - `fresh`   → Daten < FRESH_THRESHOLD_MIN alt (grüner Pulse)
 *   - `stale`   → Daten älter, aber vorhanden (gelber Pulse, "Cache veraltet")
 *   - `unknown` → kein Timestamp (grauer Pulse, "Cache wird aufgebaut")
 *
 * Rationale: GPT-Feedback P1 — `0` darf nicht als Live-Wert wirken, wenn
 * der Cache veraltet ist. Der Pulse-Indikator muss den Daten-Zustand
 * sichtbar kommunizieren.
 */

const FRESH_THRESHOLD_MIN = 30;
const STALE_THRESHOLD_MIN = 24 * 60;

export type Freshness = {
  status: 'fresh' | 'stale' | 'unknown';
  ageMinutes: number | null;
  label: string;
};

export function classifyFreshness(timestamp: string | null | undefined): Freshness {
  if (!timestamp) {
    return { status: 'unknown', ageMinutes: null, label: 'Cache wird aufgebaut' };
  }
  const t = new Date(timestamp).getTime();
  if (Number.isNaN(t)) {
    return { status: 'unknown', ageMinutes: null, label: 'Zeitstempel ungültig' };
  }
  const ageMin = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (ageMin <= FRESH_THRESHOLD_MIN) {
    return { status: 'fresh', ageMinutes: ageMin, label: `aktualisiert vor ${ageMin} Min` };
  }
  if (ageMin <= STALE_THRESHOLD_MIN) {
    const hours = Math.round(ageMin / 60);
    return {
      status: 'stale',
      ageMinutes: ageMin,
      label: `Cache veraltet (vor ${hours}h)`,
    };
  }
  const days = Math.round(ageMin / 60 / 24);
  return { status: 'stale', ageMinutes: ageMin, label: `Cache veraltet (vor ${days} Tagen)` };
}

/**
 * Kombiniert mehrere Freshness-Werte zur "schwächsten" Stufe.
 * Verwendung: ein einziger Status-Pulse, der die ganze Datenseite repräsentiert.
 */
export function combineFreshness(...inputs: Array<Freshness | null | undefined>): Freshness {
  const valid = inputs.filter((x): x is Freshness => Boolean(x));
  if (!valid.length) {
    return { status: 'unknown', ageMinutes: null, label: 'Cache wird aufgebaut' };
  }
  if (valid.some((f) => f.status === 'unknown')) {
    return valid.find((f) => f.status === 'unknown')!;
  }
  if (valid.some((f) => f.status === 'stale')) {
    return valid.find((f) => f.status === 'stale')!;
  }
  // Alle fresh — nimm das jüngste Update als Repräsentanten.
  return valid.reduce((acc, f) =>
    (f.ageMinutes ?? Infinity) < (acc.ageMinutes ?? Infinity) ? f : acc,
  );
}
