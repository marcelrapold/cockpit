/**
 * InfraHealth — Server Component
 *
 * Zwei Kacheln:
 *   1. Vercel — Deployments heute / 7d, Success-Rate, letzter Deploy (Repo + Zeit).
 *   2. Supabase — Healthy/Total Projekte + ø Latency.
 *
 * Ersetzt die `<div class="live-bar infra-bar">`-Sektion aus dem Legacy-iframe.
 * Datenquelle: cache:infra-stats (siehe api-legacy/_lib/fetch-infra-stats.js).
 */

import { readInfra } from '@/lib/data/cache-reader';
import { fmtNumber, fmtPercent, fmtRelative } from '@/lib/ui/format';

const STATUS_TONE = {
  ok: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]',
  warn: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.55)]',
  err: 'bg-rose-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]',
  unknown: 'bg-slate-500',
} as const;

function vercelTone(successRate?: number): keyof typeof STATUS_TONE {
  if (successRate == null) return 'unknown';
  if (successRate >= 95) return 'ok';
  if (successRate >= 80) return 'warn';
  return 'err';
}

function supaTone(healthy?: number, total?: number): keyof typeof STATUS_TONE {
  if (!total) return 'unknown';
  if ((healthy ?? 0) === total) return 'ok';
  if ((healthy ?? 0) === 0) return 'err';
  return 'warn';
}

export async function InfraHealth() {
  const infra = await readInfra();

  if (!infra || (!infra.vercel && !infra.supabase)) {
    return (
      <section aria-label="Infra-Health" className="px-4 pb-4 md:px-6">
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] text-slate-400">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-500 align-middle" />
          Infra-Stats werden geladen — Vercel + Supabase erscheinen nach dem nächsten Refresh.
        </div>
      </section>
    );
  }

  const v = infra.vercel;
  const s = infra.supabase;
  const vTone = STATUS_TONE[vercelTone(v?.successRate)];
  const sTone = STATUS_TONE[supaTone(s?.healthy, s?.totalProjects)];

  return (
    <section aria-label="Infra-Health" className="px-4 pb-4 md:px-6">
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
        Infrastruktur
      </div>
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Vercel</div>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${vTone}`} />
          </div>
          {v?.configured ? (
            <>
              <div className="mt-1 grid grid-cols-3 gap-2 font-mono text-[13px] tabular-nums">
                <div>
                  <div className="text-white">{fmtNumber(v.deploymentsToday)}</div>
                  <div className="text-[10px] text-slate-500">Heute</div>
                </div>
                <div>
                  <div className="text-white">{fmtNumber(v.deploymentsWeek)}</div>
                  <div className="text-[10px] text-slate-500">7 Tage</div>
                </div>
                <div>
                  <div className="text-emerald-300">{fmtPercent(v.successRate)}</div>
                  <div className="text-[10px] text-slate-500">Success</div>
                </div>
              </div>
              {v.latestDeploy ? (
                <div className="mt-2 truncate text-[11px] text-slate-500">
                  Letzter:{' '}
                  <span className="text-slate-300">{v.latestDeploy.project ?? '?'}</span> ·{' '}
                  {fmtRelative(v.latestDeploy.time)}
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-1 text-[12px] text-slate-500">
              Vercel-Konfiguration fehlt (VERCEL_API_KEY / VERCEL_TEAM_IDS).
            </div>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Supabase</div>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${sTone}`} />
          </div>
          {s?.configured ? (
            <>
              <div className="mt-1 grid grid-cols-3 gap-2 font-mono text-[13px] tabular-nums">
                <div>
                  <div className="text-white">
                    {fmtNumber(s.healthy)}
                    <span className="text-slate-500"> / {fmtNumber(s.totalProjects)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Healthy</div>
                </div>
                <div>
                  <div className="text-white">{fmtNumber(s.avgLatency)} ms</div>
                  <div className="text-[10px] text-slate-500">ø Latency</div>
                </div>
                <div>
                  <div className="text-white">{fmtNumber(s.projects?.length)}</div>
                  <div className="text-[10px] text-slate-500">Projekte</div>
                </div>
              </div>
              {s.projects && s.projects.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.projects.slice(0, 6).map((p) => (
                    <span
                      key={p.name}
                      title={`${p.status ?? 'unknown'} · ${p.region ?? '?'} · ${p.latency ?? '?'}ms`}
                      className={`inline-flex items-center gap-1 rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] ${
                        p.ok ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-1 w-1 rounded-full ${
                          p.ok ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      {p.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-1 text-[12px] text-slate-500">
              Supabase-Konfiguration fehlt (SUPABASE_ACCESS_TOKEN / SUPABASE_PROJECTS).
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function InfraHealthSkeleton() {
  return (
    <section
      aria-hidden
      className="grid gap-3 px-4 pb-4 md:grid-cols-2 md:gap-4 md:px-6"
    >
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="h-[112px] animate-pulse rounded-lg border border-white/10 bg-white/[0.03]"
        />
      ))}
    </section>
  );
}
