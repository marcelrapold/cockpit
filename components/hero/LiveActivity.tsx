/**
 * LiveActivity — Server Component
 *
 * Letzter Commit (Repo + Message + relative Zeit), Streak und Top-3 aktive
 * Repos. Ersetzt die `<div class="live-bar">`-Sektion aus dem Legacy-iframe.
 *
 * Datenquelle: cache:github-stats (siehe api-legacy/_lib/fetch-github-stats.js).
 */

import { readGithubStats } from '@/lib/data/cache-reader';
import { fmtNumber, fmtRelative } from '@/lib/ui/format';

export async function LiveActivity() {
  const gh = await readGithubStats();

  if (!gh) {
    return (
      <section aria-label="Live-Activity" className="px-4 pb-4 md:px-6">
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] text-slate-400">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-500 align-middle" />
          Live-Activity wird geladen — Daten erscheinen nach dem nächsten Refresh.
        </div>
      </section>
    );
  }

  const last = gh.lastCommit;
  const top = (gh.activeRepos || []).slice(0, 3);

  return (
    <section aria-label="Live-Activity" className="px-4 pb-4 md:px-6">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-500">
        <span>Live-Activity (GitHub)</span>
        {gh.streak ? (
          <span className="text-emerald-300">
            🔥 {gh.streak}-Tage-Streak
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-3 md:gap-4">
        <div className="md:col-span-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Letzter Commit</div>
          {last ? (
            <>
              <div className="mt-1 truncate font-mono text-[13px] text-slate-100">
                <span className="text-sky-300">{last.repo}</span>
                <span className="text-slate-500"> · </span>
                <span>{last.message}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">{fmtRelative(last.time)}</div>
            </>
          ) : (
            <div className="mt-1 text-[12px] text-slate-500">Kein Commit-Eintrag im Cache.</div>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Top-Repos · 7 Tage
          </div>
          {top.length ? (
            <ol className="mt-1 space-y-0.5 text-[12px]">
              {top.map((r) => (
                <li key={r.name} className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-mono text-slate-200">{r.name}</span>
                  <span className="font-mono tabular-nums text-slate-400">
                    {fmtNumber(r.commits)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-1 text-[12px] text-slate-500">—</div>
          )}
        </div>
      </div>
    </section>
  );
}

export function LiveActivitySkeleton() {
  return (
    <section
      aria-hidden
      className="grid gap-3 px-4 pb-4 md:grid-cols-3 md:gap-4 md:px-6"
    >
      <div className="h-[64px] animate-pulse rounded-lg border border-white/10 bg-white/[0.03] md:col-span-2" />
      <div className="h-[64px] animate-pulse rounded-lg border border-white/10 bg-white/[0.03]" />
    </section>
  );
}
