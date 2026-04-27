/**
 * ExtendedNarrative — Server Component
 *
 * Rendert die längeren LLM-Abschnitte (extended / weekly / strategic) als
 * lesbare Prosa-Sektion. Keine Charts, keine Interaktivität — pure SSR
 * für Mobile-Reader, Crawler und Slow Connections.
 */

import { readNarrative } from '@/lib/data/cache-reader';

export async function ExtendedNarrative() {
  const narrative = await readNarrative();
  if (!narrative) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8 text-slate-400 md:px-6">
        <p className="text-sm">
          Narrative wird beim nächsten Cron-Lauf generiert (alle 6h). Bitte später erneut versuchen.
        </p>
      </section>
    );
  }

  const { extended = [], weekly, strategic, generatedAt, model } = narrative;
  const generated = generatedAt ? new Date(generatedAt) : null;
  const generatedLabel = generated
    ? new Intl.DateTimeFormat('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(generated)
    : null;

  return (
    <article className="mx-auto max-w-3xl px-4 pt-6 md:px-6 md:pt-10">
      <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
        <span>Portfolio · Long-Form</span>
        {generatedLabel ? <span className="font-mono normal-case">· {generatedLabel}</span> : null}
        {model ? <span className="font-mono normal-case text-slate-600">· {model}</span> : null}
      </div>

      <div className="space-y-5 text-[15px] leading-relaxed text-slate-200 md:text-[16px]">
        {extended.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {weekly ? (
        <section className="mt-10 border-l-2 border-emerald-400/40 pl-4">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">
            Letzte Woche
          </h2>
          <p className="text-[15px] leading-relaxed text-slate-200 md:text-[16px]">{weekly}</p>
        </section>
      ) : null}

      {strategic ? (
        <section className="mt-8 border-l-2 border-sky-400/40 pl-4">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-sky-300/80">
            Strategischer Blick
          </h2>
          <p className="text-[15px] leading-relaxed text-slate-200 md:text-[16px]">{strategic}</p>
        </section>
      ) : null}
    </article>
  );
}
