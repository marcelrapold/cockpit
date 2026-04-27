/**
 * KpiStrip — Server Component
 *
 * Rendert die wichtigsten Live-KPIs (Today / Week / Month / Velocity /
 * Active Repos / Open PRs) direkt aus Redis. Erscheint **vor** dem
 * Detail-Dashboard-iframe und ist damit Teil des First-Paint.
 *
 * Fallback wenn Cache leer: stille Platzhalter (—), damit kein Layout-Shift
 * entsteht und die Seite nicht zerbricht.
 */

import { readGithubStats, readPortfolio } from '@/lib/data/cache-reader';

function fmt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('de-CH');
}

function velocitySign(velocity: number | null | undefined): {
  text: string;
  tone: 'up' | 'down' | 'flat';
} {
  if (velocity == null || Number.isNaN(velocity)) return { text: '—', tone: 'flat' };
  if (velocity > 0) return { text: `+${velocity}%`, tone: 'up' };
  if (velocity < 0) return { text: `${velocity}%`, tone: 'down' };
  return { text: '0%', tone: 'flat' };
}

export async function KpiStrip() {
  const [gh, portfolio] = await Promise.all([readGithubStats(), readPortfolio()]);

  const v = velocitySign(gh?.velocity);
  const items: Array<{ label: string; value: string; accent?: string; title?: string }> = [
    { label: 'Heute', value: fmt(gh?.today), title: 'Commits heute (UTC)' },
    { label: '7 Tage', value: fmt(gh?.week), title: 'Commits in den letzten 7 Tagen' },
    {
      label: 'WoW',
      value: v.text,
      accent: v.tone === 'up' ? 'text-emerald-300' : v.tone === 'down' ? 'text-rose-300' : 'text-slate-300',
      title: 'Velocity Woche-über-Woche',
    },
    { label: '30 Tage', value: fmt(gh?.month), title: 'Commits in den letzten 30 Tagen' },
    { label: 'Active Repos', value: fmt(gh?.activeRepos?.length), title: 'Repos mit Commits in den letzten 7 Tagen' },
    { label: 'Open PRs', value: fmt(gh?.openPRs), title: 'Offene Pull Requests' },
    { label: 'Projekte', value: fmt(portfolio?.total), title: 'Aktive Projekte im Portfolio' },
  ];

  return (
    <section
      aria-label="Live-KPIs"
      className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-3 md:grid-cols-7 md:gap-4 md:px-6"
    >
      {items.map((it) => (
        <div
          key={it.label}
          title={it.title}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm"
        >
          <div
            className={`font-mono text-xl tabular-nums leading-tight md:text-2xl ${it.accent ?? 'text-white'}`}
          >
            {it.value}
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400 md:text-[11px]">
            {it.label}
          </div>
        </div>
      ))}
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
