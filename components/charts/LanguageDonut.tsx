/**
 * LanguageDonut — Server Component
 *
 * Sprachen-Verteilung aus cache:language-stats (Bytes pro Sprache).
 * Render: pures inline-SVG (kein Chart.js, kein Client-JS), Top-N als
 * Donut-Slices, Rest aggregiert in "Andere", Legende mit Prozent + Bytes.
 *
 * Farb-Palette: bewusst kompakt + farb-blind-tauglich (Tailwind-Tokens).
 */

import { readLanguageStats } from '@/lib/data/cache-reader';
import { fmtPercent } from '@/lib/ui/format';

const TOP_N = 8;

const PALETTE = [
  '#38bdf8', // sky-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#f87171', // rose-400
  '#a78bfa', // violet-400
  '#22d3ee', // cyan-400
  '#fb923c', // orange-400
  '#4ade80', // green-400
  '#94a3b8', // slate-400 (rest)
];

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(1)} MiB`;
  return `${(n / 1024 ** 3).toFixed(2)} GiB`;
}

type Slice = { name: string; bytes: number; pct: number; color: string };

function aggregate(languages: Record<string, number>): {
  slices: Slice[];
  totalBytes: number;
} {
  const entries = Object.entries(languages)
    .filter(([, v]) => typeof v === 'number' && v > 0)
    .sort((a, b) => b[1] - a[1]);

  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return { slices: [], totalBytes: 0 };

  const top = entries.slice(0, TOP_N);
  const rest = entries.slice(TOP_N);
  const restBytes = rest.reduce((s, [, v]) => s + v, 0);

  const slices: Slice[] = top.map(([name, bytes], i) => ({
    name,
    bytes,
    pct: (bytes / total) * 100,
    color: PALETTE[i] ?? PALETTE[PALETTE.length - 1],
  }));
  if (restBytes > 0) {
    slices.push({
      name: `Andere (${rest.length})`,
      bytes: restBytes,
      pct: (restBytes / total) * 100,
      color: PALETTE[PALETTE.length - 1],
    });
  }
  return { slices, totalBytes: total };
}

/**
 * Donut-Pfad aus Polar-Koordinaten. r1=Außen-Radius, r2=Innen-Radius,
 * angles in Radians, im Uhrzeigersinn ab 12 Uhr.
 */
function donutPath(
  cx: number,
  cy: number,
  r1: number,
  r2: number,
  startRad: number,
  endRad: number,
): string {
  const x1 = cx + r1 * Math.sin(startRad);
  const y1 = cy - r1 * Math.cos(startRad);
  const x2 = cx + r1 * Math.sin(endRad);
  const y2 = cy - r1 * Math.cos(endRad);
  const x3 = cx + r2 * Math.sin(endRad);
  const y3 = cy - r2 * Math.cos(endRad);
  const x4 = cx + r2 * Math.sin(startRad);
  const y4 = cy - r2 * Math.cos(startRad);
  const large = endRad - startRad > Math.PI ? 1 : 0;
  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A ${r1} ${r1} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A ${r2} ${r2} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export async function LanguageDonut() {
  const stats = await readLanguageStats();
  if (!stats || !stats.languages || Object.keys(stats.languages).length === 0) {
    return (
      <section aria-label="Sprachen-Verteilung" className="px-4 pb-6 md:px-6">
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] text-slate-400">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-500 align-middle" />
          Sprachen-Verteilung wird geladen — Daten erscheinen nach dem nächsten Refresh.
        </div>
      </section>
    );
  }

  const { slices, totalBytes } = aggregate(stats.languages);
  const cx = 80;
  const cy = 80;
  const r1 = 70;
  const r2 = 42;

  let acc = 0;
  const arcs = slices.map((s) => {
    const startRad = (acc / 100) * Math.PI * 2;
    acc += s.pct;
    const endRad = (acc / 100) * Math.PI * 2;
    return {
      ...s,
      d:
        s.pct >= 99.9
          ? // Vollkreis (1 Sprache deckt alles ab)
            `M ${cx} ${cy - r1} A ${r1} ${r1} 0 1 1 ${cx - 0.01} ${cy - r1} L ${cx - 0.01} ${cy - r2} A ${r2} ${r2} 0 1 0 ${cx} ${cy - r2} Z`
          : donutPath(cx, cy, r1, r2, startRad, endRad),
    };
  });

  return (
    <section aria-label="Sprachen-Verteilung" className="px-4 pb-6 md:px-6">
      <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-slate-500">
        Sprachen-Verteilung · {stats.totalRepos ?? '—'} Repos · {fmtBytes(totalBytes)}
      </div>
      <div className="grid items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4 md:grid-cols-[160px_1fr] md:gap-6">
        <div className="mx-auto">
          <svg viewBox="0 0 160 160" className="h-40 w-40" role="img" aria-label="Sprachen-Donut">
            {arcs.map((a) => (
              <path key={a.name} d={a.d} fill={a.color} stroke="#0b1120" strokeWidth="0.5" />
            ))}
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              className="fill-slate-300 font-mono text-[12px]"
            >
              {slices.length}
            </text>
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              className="fill-slate-500 text-[8px] uppercase tracking-wider"
            >
              Sprachen
            </text>
          </svg>
        </div>
        <ul className="grid grid-cols-1 gap-1.5 text-[12px] sm:grid-cols-2">
          {slices.map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                <span className="truncate text-slate-200">{s.name}</span>
              </span>
              <span className="shrink-0 font-mono tabular-nums text-slate-400">
                {fmtPercent(s.pct, 1)}
                <span className="ml-2 text-slate-500">{fmtBytes(s.bytes)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function LanguageDonutSkeleton() {
  return (
    <section aria-hidden className="px-4 pb-6 md:px-6">
      <div className="mb-3 h-3 w-48 animate-pulse rounded bg-white/10" />
      <div className="h-44 animate-pulse rounded-lg border border-white/10 bg-white/[0.03]" />
    </section>
  );
}
