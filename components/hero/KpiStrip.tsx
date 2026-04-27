/**
 * KpiStrip — Server Component
 *
 * Rendert die wichtigsten Live-KPIs (Today / Week / Month / Velocity /
 * Active Repos / Open PRs / Projekte) direkt aus Redis. Erscheint **vor**
 * dem Detail-Dashboard-iframe und ist damit Teil des First-Paint.
 *
 * Empty-State-Pattern (P1 aus GPT-Feedback):
 *   - Wenn der Cache vorhanden, aber ein einzelner Wert fehlt → "—"
 *     (Single-Source: `fmt(undefined) === '—'`).
 *   - Wenn der Cache komplett leer (Cold Start, beide Reads null) →
 *     einzeiliger Hinweis statt 7x "—" (sonst wirkt die ganze Page
 *     wie ein Defekt).
 *   - `0` bleibt `0` — echte Nullen sind ein gültiger Wert (z.B. heute
 *     noch nichts committed) und dürfen nicht mit "fehlend" verschmelzen.
 */

import { readGithubStats, readPortfolio } from '@/lib/data/cache-reader';
import { classifyFreshness, combineFreshness } from '@/lib/data/freshness';

const EMPTY = '—';

function fmt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return EMPTY;
  return n.toLocaleString('de-CH');
}

function velocitySign(velocity: number | null | undefined): {
  text: string;
  tone: 'up' | 'down' | 'flat' | 'unknown';
} {
  if (velocity == null || Number.isNaN(velocity)) return { text: EMPTY, tone: 'unknown' };
  if (velocity > 0) return { text: `+${velocity}%`, tone: 'up' };
  if (velocity < 0) return { text: `${velocity}%`, tone: 'down' };
  return { text: '0%', tone: 'flat' };
}

const TONE_CLASS: Record<'up' | 'down' | 'flat' | 'unknown', string> = {
  up: 'text-emerald-300',
  down: 'text-rose-300',
  flat: 'text-slate-300',
  unknown: 'text-slate-500',
};

export async function KpiStrip() {
  const [gh, portfolio] = await Promise.all([readGithubStats(), readPortfolio()]);

  // Cold Start: noch nie befüllter Cache → expliziter Hinweis.
  if (!gh && !portfolio) {
    return (
      <section
        aria-label="Live-KPIs (Cache wird aufgebaut)"
        className="px-4 pb-4 md:px-6"
      >
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] text-slate-400">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-500 align-middle" />
          Cache wird aufgebaut — Live-KPIs erscheinen sobald der nächste
          Refresh-Lauf abgeschlossen ist (~1 Min).
        </div>
      </section>
    );
  }

  const freshness = combineFreshness(
    classifyFreshness(gh?.timestamp),
    classifyFreshness(portfolio?.timestamp),
  );

  const v = velocitySign(gh?.velocity);
  const items: Array<{ label: string; value: string; accent: string; title?: string }> = [
    { label: 'Heute', value: fmt(gh?.today), accent: 'text-white', title: 'Commits heute (UTC)' },
    { label: '7 Tage', value: fmt(gh?.week), accent: 'text-white', title: 'Commits in den letzten 7 Tagen' },
    { label: 'WoW', value: v.text, accent: TONE_CLASS[v.tone], title: 'Velocity Woche-über-Woche' },
    { label: '30 Tage', value: fmt(gh?.month), accent: 'text-white', title: 'Commits in den letzten 30 Tagen' },
    {
      label: 'Aktive Repos',
      value: fmt(gh?.activeRepos?.length),
      accent: 'text-white',
      title: 'Repos mit Commits in den letzten 7 Tagen',
    },
    { label: 'Offene PRs', value: fmt(gh?.openPRs), accent: 'text-white', title: 'Offene Pull Requests' },
    { label: 'Projekte', value: fmt(portfolio?.total), accent: 'text-white', title: 'Aktive Projekte im Portfolio' },
  ];

  return (
    <section aria-label="Live-KPIs" className="px-4 pb-4 md:px-6">
      {freshness.status === 'stale' ? (
        <div
          className="mb-3 rounded-md border border-amber-400/20 bg-amber-400/5 px-3 py-1.5 text-[11px] text-amber-200/90"
          role="status"
        >
          {freshness.label} · KPIs zeigen den letzten erfolgreichen Refresh.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-7 md:gap-4">
        {items.map((it) => (
          <div
            key={it.label}
            title={it.title}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm"
          >
            <div
              className={`font-mono text-xl tabular-nums leading-tight md:text-2xl ${it.accent}`}
            >
              {it.value}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400 md:text-[11px]">
              {it.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function KpiStripSkeleton() {
  return (
    <section
      aria-hidden
      className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-3 md:grid-cols-7 md:gap-4 md:px-6"
    >
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="h-[58px] animate-pulse rounded-lg border border-white/10 bg-white/[0.03]"
        />
      ))}
    </section>
  );
}
