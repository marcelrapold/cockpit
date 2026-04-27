/**
 * NarrativeHero — Server Component
 *
 * Rendert den vom LLM generierten Teaser + Headline-Sub aus Redis.
 * Wird vom Cron `/api/cron/refresh-llm` alle ~6h aktualisiert; SSR liefert
 * ihn deshalb sehr günstig direkt in den initial HTML.
 */

import Link from 'next/link';

import { readNarrative } from '@/lib/data/cache-reader';

const FALLBACK_TEASER =
  'Engineering-Cockpit für Marcels Portfolio — Live-Commits, Deployments, Uptime und Sprachen-Verteilung über alle Projekte.';

type Props = {
  /** Wenn `true`, wird der "Insights →"-Link nicht gerendert (z.B. auf der Insights-Seite selbst). */
  hideInsightsLink?: boolean;
};

export async function NarrativeHero({ hideInsightsLink = false }: Props = {}) {
  const narrative = await readNarrative();

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

  return (
    <header className="px-4 pb-3 pt-5 md:px-6 md:pb-4 md:pt-7">
      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
        Cockpit · Marcel Rapold
        <span className="ml-auto flex items-center gap-3">
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
