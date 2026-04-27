/**
 * ActivityHeatmap — Server Component
 *
 * 30-Tage-Aktivitäts-Heatmap aus cache:github-stats sparkline (tägliche
 * Commit-Counts der letzten N Tage, Default 30). Render: pures SVG-Grid,
 * 5 Intensitätsstufen analog GitHub-Contribution-Graph.
 *
 * Empty-State: gh.sparkline fehlt → Hint statt leeres Grid.
 */

import { readGithubStats } from '@/lib/data/cache-reader';
import { fmtNumber } from '@/lib/ui/format';

const CELL = 12;
const GAP = 3;

const STEPS = [
  '#1e293b', // 0 commits — slate-800/60
  '#0e3a5e', // 1 commit
  '#0f5786', // ~mid
  '#117dba', // active
  '#0ea5e9', // hot — sky-500
];

function intensity(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  const r = value / max;
  if (r > 0.75) return 4;
  if (r > 0.5) return 3;
  if (r > 0.25) return 2;
  return 1;
}

function dateLabel(d: Date): string {
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
  }).format(d);
}

export async function ActivityHeatmap() {
  const gh = await readGithubStats();
  const series = gh?.sparkline;

  if (!series || series.length === 0) {
    return (
      <section aria-label="Aktivitäts-Heatmap" className="px-4 pb-6 md:px-6">
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] text-slate-400">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-500 align-middle" />
          Aktivitäts-Heatmap wird geladen — Daten erscheinen nach dem nächsten Refresh.
        </div>
      </section>
    );
  }

  const max = Math.max(0, ...series);
  const total = series.reduce((s, n) => s + (n || 0), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (series.length - 1));

  // Wochen-Grid: Spalten = Wochen, Zeilen = Wochentage (Mo..So).
  // Wir füllen das Grid linksbündig: erste Spalte = Woche, in der startDate liegt.
  const weekdayOf = (d: Date) => (d.getDay() + 6) % 7; // 0=Mo, 6=So
  const startWeekday = weekdayOf(startDate);
  const cells: Array<{ row: number; col: number; value: number; date: Date } | null> = [];
  let col = 0;
  for (let i = 0; i < series.length; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const row = weekdayOf(d);
    if (i > 0 && row === 0) col += 1;
    cells.push({ row, col, value: series[i] ?? 0, date: d });
  }
  // Vor dem ersten Tag (Mo..startWeekday-1) leere Zellen, damit Grid bündig.
  const offsetCells: Array<{ row: number; col: number } | null> = [];
  for (let r = 0; r < startWeekday; r++) offsetCells.push({ row: r, col: 0 });

  const totalCols = (cells[cells.length - 1]?.col ?? 0) + 1;
  const width = totalCols * (CELL + GAP);
  const height = 7 * (CELL + GAP);

  return (
    <section aria-label="Aktivitäts-Heatmap" className="px-4 pb-6 md:px-6">
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-500">
        <span>
          Aktivität · letzte {series.length} Tage · {fmtNumber(total)} Commits
        </span>
        <span className="flex items-center gap-1 normal-case tracking-normal">
          weniger
          {STEPS.map((c, i) => (
            <span
              key={i}
              className="inline-block rounded-sm"
              style={{ width: 9, height: 9, backgroundColor: c }}
            />
          ))}
          mehr
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block"
          style={{ width: `${width}px`, maxWidth: '100%', height: 'auto' }}
          role="img"
          aria-label={`Aktivitäts-Heatmap der letzten ${series.length} Tage`}
        >
          {offsetCells.map((c, i) =>
            c ? (
              <rect
                key={`o${i}`}
                x={c.col * (CELL + GAP)}
                y={c.row * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={2}
                fill={STEPS[0]}
                opacity={0.4}
              />
            ) : null,
          )}
          {cells.map((c) =>
            c ? (
              <rect
                key={c.date.toISOString()}
                x={c.col * (CELL + GAP)}
                y={c.row * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={2}
                fill={STEPS[intensity(c.value, max)]}
              >
                <title>
                  {dateLabel(c.date)} · {c.value} Commit{c.value === 1 ? '' : 's'}
                </title>
              </rect>
            ) : null,
          )}
        </svg>
      </div>
    </section>
  );
}

export function ActivityHeatmapSkeleton() {
  return (
    <section aria-hidden className="px-4 pb-6 md:px-6">
      <div className="mb-3 h-3 w-56 animate-pulse rounded bg-white/10" />
      <div className="h-32 animate-pulse rounded-lg border border-white/10 bg-white/[0.03]" />
    </section>
  );
}
