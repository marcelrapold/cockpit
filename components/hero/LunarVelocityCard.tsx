'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

type Evidence = 'weak' | 'moderate' | 'strong';
type Direction = 'higher' | 'lower' | 'none';

const MoonSignal3D = dynamic(
  () => import('./MoonSignal3D').then((mod) => mod.MoonSignal3D),
  {
    ssr: false,
    loading: () => (
      <div className="relative h-[170px] min-w-[230px] overflow-hidden rounded-md border border-white/10 bg-[#050816] md:h-[190px] md:w-[270px]">
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_45%,rgba(251,191,36,0.16),rgba(15,23,42,0)_60%)]">
          <div className="h-24 w-24 rounded-full bg-[radial-gradient(circle_at_35%_30%,#f8fafc,#94a3b8_46%,#111827_72%)] shadow-[0_0_70px_rgba(251,191,36,0.25)]" />
        </div>
      </div>
    ),
  },
);

type LunarSummary = {
  generatedAt: string;
  demoMode: boolean;
  username: string;
  periodStart: string;
  periodEnd: string;
  fullMoonWindowDays: number;
  velocityPctDiff: number | null;
  evidence: Evidence;
  direction: Direction;
  pValue: number;
  mostAffectedRepo: string | null;
  topDaysInFullMoonShare: number;
  verdict: string;
  detailUrl: string;
};

type CardState =
  | { status: 'loading' }
  | { status: 'ready'; summary: LunarSummary; source: 'live' | 'static' }
  | { status: 'error'; message: string };

const STATIC_SUMMARY_URL = '/data-lunar-velocity.json';
const LIVE_SUMMARY_URL = process.env.NEXT_PUBLIC_LUNAR_VELOCITY_SUMMARY_URL?.trim();
const SAME_ORIGIN_SUMMARY_URL = '/api/summary';
const LIVE_SUMMARY_TIMEOUT_MS = 120_000;

const EVIDENCE_STYLE: Record<Evidence, string> = {
  weak: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
  moderate: 'border-amber-300/40 bg-amber-300/10 text-amber-200',
  strong: 'border-emerald-300/40 bg-emerald-300/10 text-emerald-200',
};

function isLunarSummary(value: unknown): value is LunarSummary {
  const data = value as Partial<LunarSummary> | null;
  return Boolean(
    data &&
      typeof data.generatedAt === 'string' &&
      typeof data.demoMode === 'boolean' &&
      typeof data.username === 'string' &&
      typeof data.periodStart === 'string' &&
      typeof data.periodEnd === 'string' &&
      typeof data.fullMoonWindowDays === 'number' &&
      (typeof data.velocityPctDiff === 'number' || data.velocityPctDiff === null) &&
      (data.evidence === 'weak' || data.evidence === 'moderate' || data.evidence === 'strong') &&
      (data.direction === 'higher' || data.direction === 'lower' || data.direction === 'none') &&
      typeof data.pValue === 'number' &&
      (typeof data.mostAffectedRepo === 'string' || data.mostAffectedRepo === null) &&
      typeof data.topDaysInFullMoonShare === 'number' &&
      typeof data.verdict === 'string' &&
      typeof data.detailUrl === 'string',
  );
}

function withWindowParam(source: string): string {
  const url = new URL(source, window.location.origin);
  if (!url.searchParams.has('window')) {
    url.searchParams.set('window', '2');
  }
  return url.toString();
}

async function fetchSummary(
  url: string,
  source: 'live' | 'static',
  timeoutMs?: number,
): Promise<CardState> {
  const controller = timeoutMs ? new AbortController() : null;
  const timeout = controller
    ? window.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const response = await fetch(withWindowParam(url), {
      cache: source === 'live' ? 'no-store' : 'no-cache',
      signal: controller?.signal,
    });
    if (!response.ok) {
      return { status: 'error', message: `Lunar summary returned HTTP ${response.status}.` };
    }

    const data: unknown = await response.json();
    if (!isLunarSummary(data)) {
      return {
        status: 'error',
        message: 'Lunar summary payload does not match the endpoint contract.',
      };
    }

    return { status: 'ready', summary: data, source };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to load Lunar summary.',
    };
  } finally {
    if (timeout != null) window.clearTimeout(timeout);
  }
}

async function loadStaticSummary(): Promise<CardState> {
  return fetchSummary(STATIC_SUMMARY_URL, 'static');
}

async function loadLiveSummary(): Promise<CardState> {
  const candidates = [
    ...(LIVE_SUMMARY_URL ? [LIVE_SUMMARY_URL] : []),
    SAME_ORIGIN_SUMMARY_URL,
  ];

  let lastError = 'No Lunar Velocity summary source configured.';
  for (const url of candidates) {
    const next = await fetchSummary(url, 'live', LIVE_SUMMARY_TIMEOUT_MS);
    if (next.status === 'ready') return next;
    if (next.status === 'error') lastError = next.message;
  }
  return { status: 'error', message: lastError };
}

function formatVelocity(value: number | null, direction: Direction): string {
  if (value == null || Number.isNaN(value)) return '—';
  const rounded = Math.round(value);
  if (direction === 'none' || rounded === 0) return '0%';
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

function formatPValue(value: number): string {
  if (Number.isNaN(value)) return 'p=--';
  if (value < 0.001) return 'p<0.001';
  return `p=${value.toFixed(3)}`;
}

function formatShare(value: number): string {
  if (Number.isNaN(value)) return '--';
  return `${Math.round(value)}%`;
}

function impactCountFor(summary: LunarSummary): number {
  const velocityLift = Math.abs(summary.velocityPctDiff ?? 0);
  const topDaySignal = Number.isFinite(summary.topDaysInFullMoonShare)
    ? summary.topDaysInFullMoonShare
    : 0;
  return 12 + velocityLift / 4 + topDaySignal / 5;
}

export function LunarVelocityCard() {
  const [state, setState] = useState<CardState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    let liveApplied = false;

    loadStaticSummary().then((next) => {
      if (!cancelled && !liveApplied) setState(next);
    });

    loadLiveSummary().then((next) => {
      if (!cancelled && next.status === 'ready') {
        liveApplied = true;
        setState(next);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const content = useMemo(() => {
    if (state.status === 'loading') {
      return {
        velocity: '...',
        evidence: 'weak' as Evidence,
        verdict: 'Lunar Velocity summary wird geladen.',
        detailUrl: '',
        sourceLabel: 'loading',
        meta: 'window +/-2d',
        repo: 'pending',
        share: '--',
        pValue: 'p=--',
        actionUrl: '/lunar',
        actionLabel: 'Open Lab',
        metricLabel: 'moon signal',
        impactCount: 12,
        signalTone: 'pending' as const,
      };
    }

    if (state.status === 'error') {
      return {
        velocity: '—',
        evidence: 'weak' as Evidence,
        verdict: `Moon signal kurz nicht erreichbar. ${state.message}`,
        detailUrl: '',
        sourceLabel: 'offline',
        meta: 'live signal unavailable',
        repo: 'fallback',
        share: '--',
        pValue: 'p=--',
        actionUrl: '/lunar',
        actionLabel: 'Open Lab',
        metricLabel: 'moon lift',
        impactCount: 10,
        signalTone: 'offline' as const,
      };
    }

    const { summary, source } = state;
    const isPending = summary.velocityPctDiff == null || !summary.detailUrl;
    return {
      velocity: formatVelocity(summary.velocityPctDiff, summary.direction),
      evidence: summary.evidence,
      verdict: summary.verdict,
      detailUrl: summary.detailUrl,
      sourceLabel: isPending ? 'signal pending' : source === 'live' ? 'live endpoint' : 'snapshot',
      meta: `${summary.periodStart} - ${summary.periodEnd} / +/-${summary.fullMoonWindowDays}d`,
      repo: summary.mostAffectedRepo || 'awaiting deploy',
      share: formatShare(summary.topDaysInFullMoonShare),
      pValue: formatPValue(summary.pValue),
      actionUrl: summary.detailUrl || '/lunar',
      actionLabel: summary.detailUrl ? 'Details' : 'Open Lab',
      metricLabel: isPending ? 'moon signal' : 'moon lift',
      impactCount: impactCountFor(summary),
      signalTone: isPending ? ('pending' as const) : ('live' as const),
    };
  }, [state]);

  return (
    <section aria-label="Lunar Velocity Summary" className="px-4 pb-4 md:px-6">
      <div className="overflow-hidden rounded-lg border border-amber-200/15 bg-[linear-gradient(135deg,rgba(245,158,11,0.11),rgba(14,165,233,0.08)_48%,rgba(15,23,42,0.5))] px-4 py-3 shadow-[0_18px_70px_rgba(2,6,23,0.28)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-100/80">
                Lunar Velocity
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${EVIDENCE_STYLE[content.evidence]}`}
              >
                {content.evidence}
              </span>
              <span className="font-mono text-[10px] text-slate-500">{content.sourceLabel}</span>
            </div>
            <p className="text-sm font-medium leading-snug text-slate-100 md:text-[15px]">
              {content.verdict}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-slate-500">
              <span>{content.meta}</span>
              <span>{content.pValue}</span>
              <span>top-days {content.share}</span>
              <span>{content.repo}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center md:justify-end">
            <MoonSignal3D impactCount={content.impactCount} signalTone={content.signalTone} />
            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
              <div className="text-right">
                <div className="font-mono text-3xl font-semibold tabular-nums text-amber-100">
                  {content.velocity}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  {content.metricLabel}
                </div>
              </div>
              {content.actionUrl ? (
                <a
                  href={content.actionUrl}
                  target={content.actionUrl.startsWith('http') ? '_blank' : undefined}
                  rel={content.actionUrl.startsWith('http') ? 'noreferrer' : undefined}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-slate-300 transition hover:border-amber-200/40 hover:text-amber-100"
                >
                  {content.actionLabel}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
