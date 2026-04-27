/**
 * DoraStrip — Server Component
 *
 * Vier DORA-Metriken (Deploy-Frequency, Lead-Time, Change-Failure-Rate, MTTR)
 * direkt aus Redis, mit Tier-Badge (Elite / High / Medium / Low) und
 * SVG-Sparkline. Ersetzt das `<div class="hero-kpi-bar">`-Konstrukt aus
 * dem Legacy-iframe (~50 IDs, ~200 Zeilen Inline-JS) durch reines SSR.
 *
 * Empty-State (wie KpiStrip):
 *   - configMissing | beide null → einzeiliger Cold-Hint statt 4× '—'.
 *   - Einzelner tier='unknown'   → 'unknown'-Badge statt fake 'elite'.
 */

import type { DoraTier } from '@/lib/data/cache-reader';
import { readDora } from '@/lib/data/cache-reader';
import { fmtDeployFreq, fmtMinutes, fmtPercent, fmtTrend, trendOf } from '@/lib/ui/format';

import { Sparkline } from './Sparkline';

const TIER_STYLE: Record<DoraTier, { label: string; classes: string }> = {
  elite: { label: 'Elite', classes: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30' },
  high: { label: 'High', classes: 'bg-sky-500/15 text-sky-300 ring-sky-400/30' },
  medium: { label: 'Medium', classes: 'bg-amber-500/15 text-amber-300 ring-amber-400/30' },
  low: { label: 'Low', classes: 'bg-rose-500/15 text-rose-300 ring-rose-400/30' },
  unknown: { label: '—', classes: 'bg-white/5 text-slate-500 ring-white/10' },
};

const TREND_TONE = {
  up: 'text-emerald-300',
  down: 'text-rose-300',
  flat: 'text-slate-400',
  unknown: 'text-slate-500',
} as const;

function TierBadge({ tier }: { tier: DoraTier }) {
  const t = TIER_STYLE[tier];
  return (
    <span
      className={`rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider ring-1 ring-inset ${t.classes}`}
    >
      {t.label}
    </span>
  );
}

type CardProps = {
  label: string;
  value: string;
  tier: DoraTier;
  trend?: number;
  spark?: number[];
  title: string;
};

function DoraCard({ label, value, tier, trend, spark, title }: CardProps) {
  const tone = trendOf(trend);
  return (
    <div
      title={title}
      className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 md:text-[11px]">
          {label}
        </span>
        <TierBadge tier={tier} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="font-mono text-lg leading-tight tabular-nums text-white md:text-xl">
          {value}
        </span>
        {spark && spark.length > 1 ? (
          <Sparkline values={spark} className="h-[18px] w-14 text-sky-400/60" />
        ) : null}
      </div>
      {tone !== 'unknown' ? (
        <div className={`text-[10px] tabular-nums ${TREND_TONE[tone]}`}>{fmtTrend(trend)}</div>
      ) : (
        <div className="text-[10px] text-slate-500">—</div>
      )}
    </div>
  );
}

export async function DoraStrip() {
  const dora = await readDora();

  if (!dora || dora.configMissing) {
    return (
      <section aria-label="DORA Four-Keys" className="px-4 pb-4 md:px-6">
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] text-slate-400">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-500 align-middle" />
          DORA-Metriken nicht verfügbar — Vercel-Konfiguration fehlt oder Cache wird aufgebaut.
        </div>
      </section>
    );
  }

  const m = dora.metrics;

  return (
    <section aria-label="DORA Four-Keys" className="px-4 pb-4 md:px-6">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-500">
        <span>DORA Four-Keys · {dora.period.days} Tage</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <DoraCard
          label="Deploy-Frequency"
          value={fmtDeployFreq(m.deployFrequency.value)}
          tier={m.deployFrequency.tier}
          trend={m.deployFrequency.trend}
          spark={m.deployFrequency.sparkline}
          title="Deploy-Frequency · Wie oft Code in Produktion ausgerollt wird. Elite: mehrfach pro Tag."
        />
        <DoraCard
          label="Lead-Time"
          value={fmtMinutes(m.leadTime.value)}
          tier={m.leadTime.tier}
          trend={m.leadTime.trend}
          title="Lead-Time for Changes · Zeit von Commit bis Live-Deploy. Elite: <1h."
        />
        <DoraCard
          label="Change-Failure-Rate"
          value={fmtPercent(m.changeFailureRate.value, 1)}
          tier={m.changeFailureRate.tier}
          trend={m.changeFailureRate.trend}
          title="Change-Failure-Rate · Anteil fehlerhafter Deploys. Elite: <5%."
        />
        <DoraCard
          label="MTTR"
          value={fmtMinutes(m.mttr.value)}
          tier={m.mttr.tier}
          title="Mean-Time-to-Recovery · Durchschnittliche Zeit bis ein Incident behoben ist. Elite: <1h."
        />
      </div>
    </section>
  );
}

export function DoraStripSkeleton() {
  return (
    <section
      aria-hidden
      className="grid grid-cols-2 gap-3 px-4 pb-4 md:grid-cols-4 md:gap-4 md:px-6"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[88px] animate-pulse rounded-lg border border-white/10 bg-white/[0.03]"
        />
      ))}
    </section>
  );
}
