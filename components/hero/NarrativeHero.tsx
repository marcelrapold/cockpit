/**
 * NarrativeHero — Server Component
 *
 * Rendert den vom LLM generierten Teaser + Headline-Sub aus Redis.
 * Wird vom Cron `/api/cron/refresh-llm` alle ~6h aktualisiert; SSR liefert
 * ihn deshalb sehr günstig direkt in den initial HTML.
 *
 * Erweiterungen aus Welle A (GPT-Feedback):
 *  - Stale-aware Pulse-LED (grün/gelb/grau) basierend auf kombinierter
 *    Freshness von github-stats + narrative.
 *  - Live-Build-Badge (Version + Commit-SHA) statt "lädt …"-Placeholder.
 */

import Link from 'next/link';

import { getBuildInfo } from '@/lib/data/build-info';
import { readGithubStats, readNarrative } from '@/lib/data/cache-reader';
import { classifyFreshness, combineFreshness } from '@/lib/data/freshness';

const FALLBACK_TEASER =
  'Engineering-Cockpit für Marcels Portfolio — Live-Commits, Deployments, Uptime und Sprachen-Verteilung über alle Projekte.';

type Props = {
  /** Wenn `true`, wird der "Insights →"-Link nicht gerendert (z.B. auf der Insights-Seite selbst). */
  hideInsightsLink?: boolean;
};

const PULSE_TONE: Record<'fresh' | 'stale' | 'unknown', string> = {
  fresh: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]',
  stale: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]',
  unknown: 'bg-slate-500',
};

export async function NarrativeHero({ hideInsightsLink = false }: Props = {}) {
  const [narrative, gh] = await Promise.all([readNarrative(), readGithubStats()]);
  const build = getBuildInfo();

  const teaser = narrative?.teaser?.trim() || FALLBACK_TEASER;
  const generated = narrative?.generatedAt ? new Date(narrative.generatedAt) : null;
  const generatedLabel = generated
    ? new Intl.DateTimeFormat('de-CH', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(generated)
    : null;

  const freshness = combineFreshness(
    classifyFreshness(gh?.timestamp),
    classifyFreshness(narrative?.generatedAt),
  );

  return (
    <header className="px-4 pb-3 pt-5 md:px-6 md:pb-4 md:pt-7">
      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
        <span
          aria-label={freshness.label}
          title={freshness.label}
          className={`inline-block h-1.5 w-1.5 rounded-full ${PULSE_TONE[freshness.status]}`}
        />
        Cockpit · Marcel Rapold
        <span className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          <span
            className="font-mono text-[10px] text-slate-500"
            title={build.commitFull ? `${build.branch} · ${build.commitFull}` : build.branch}
          >
            v{build.version} · {build.commit}
          </span>
          {generatedLabel ? (
            <span className="font-mono text-[10px] text-slate-500">
              Narrative · {generatedLabel}
            </span>
          ) : null}
          {!hideInsightsLink ? (
            <Link
              href="/insights"
              className="font-mono text-[10px] text-slate-500 hover:text-sky-300"
            >
              Insights →
            </Link>
          ) : null}
        </span>
      </div>
      <h1 className="text-balance text-[15px] font-medium leading-snug text-slate-100 md:text-[17px] md:leading-snug">
        {teaser}
      </h1>
    </header>
  );
}

export function NarrativeHeroSkeleton() {
  return (
    <header aria-hidden className="px-4 pb-3 pt-5 md:px-6 md:pb-4 md:pt-7">
      <div className="mb-2 h-3 w-48 animate-pulse rounded bg-white/10" />
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-white/10" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-white/10" />
      </div>
    </header>
  );
}
