'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  BarChart3,
  CalendarDays,
  Download,
  GitPullRequest,
  Moon,
  RefreshCw,
  Rocket,
  Search,
  Sparkles,
  Table2,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type {
  LunarAnalysis,
  MoonPhaseKind,
  RepoVelocity,
  WeekdayPhaseHeatmapCell,
  WindowComparison,
} from '@/lib/lunar/types';
import { AtlasNavigation } from '@/components/layout/AtlasNavigation';

type Props = {
  initialUser: string;
  initialStartDate: string;
  initialEndDate: string;
  initialWindowDays: number;
};

type DashboardParams = {
  user: string;
  startDate: string;
  endDate: string;
  windowDays: number;
  includeNewMoon: boolean;
  includeForks: boolean;
  includeLines: boolean;
  excludeBots: boolean;
};

const phaseColor: Record<MoonPhaseKind, string> = {
  full_moon_window: '#d7ff45',
  new_moon_window: '#5eead4',
  normal: '#70685b',
};

const evidenceTone = {
  weak: 'border-[#70685b] bg-[#2a241b] text-[#f4f1e8]',
  moderate: 'border-[#5eead4]/60 bg-[#163330] text-[#8ff7e7]',
  strong: 'border-[#d7ff45]/70 bg-[#303817] text-[#e6ff7a]',
};

function formatNumber(value: number | null | undefined, digits = 0) {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('de-CH', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return 'n/a';
  return `${value > 0 ? '+' : ''}${formatNumber(value, 1)}%`;
}

function phaseLabel(phase: MoonPhaseKind) {
  if (phase === 'full_moon_window') return 'Full';
  if (phase === 'new_moon_window') return 'New';
  return 'Normal';
}

function buildQuery(params: DashboardParams, force = false) {
  const query = new URLSearchParams({
    user: params.user,
    start: params.startDate,
    end: params.endDate,
    window: String(params.windowDays),
    includeNewMoon: params.includeNewMoon ? '1' : '0',
    includeForks: params.includeForks ? '1' : '0',
    includeLines: params.includeLines ? '1' : '0',
    excludeBots: params.excludeBots ? '1' : '0',
  });
  if (force) query.set('force', '1');
  return query;
}

function rollingMean(values: number[], index: number, windowSize = 7) {
  const start = Math.max(0, index - windowSize + 1);
  const slice = values.slice(start, index + 1);
  return slice.reduce((sum, value) => sum + value, 0) / slice.length;
}

function StatTile({
  label,
  value,
  detail,
  icon,
  tone = 'citron',
}: {
  label: string;
  value: string;
  detail?: string;
  icon: React.ReactNode;
  tone?: 'citron' | 'teal' | 'coral' | 'moon';
}) {
  const tones = {
    citron: 'text-[#d7ff45] bg-[#d7ff45]/10 border-[#d7ff45]/25',
    teal: 'text-[#5eead4] bg-[#5eead4]/10 border-[#5eead4]/25',
    coral: 'text-[#ff6b57] bg-[#ff6b57]/10 border-[#ff6b57]/25',
    moon: 'text-[#f4f1e8] bg-[#f4f1e8]/10 border-[#f4f1e8]/20',
  };

  return (
    <div className="rounded-lg border border-[#3a3328] bg-[#191713]/90 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[#a69b88]">{label}</div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${tones[tone]}`}>
          {icon}
        </div>
      </div>
      <div className="font-mono text-3xl tabular-nums text-[#f4f1e8]">{value}</div>
      {detail ? <div className="mt-1 text-xs text-[#a69b88]">{detail}</div> : null}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="py-5">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a69b88]">
        <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[#3a3328] bg-[#211d18] text-[#d7ff45]">
          {icon}
        </span>
        {title}
      </div>
      {children}
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-[#3a3328] bg-[#191713] px-3 py-2 text-sm text-[#f4f1e8]">
      <span>{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 accent-[#d7ff45]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function WindowButton({
  days,
  active,
  onClick,
}: {
  days: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-md border px-3 font-mono text-sm transition ${
        active
          ? 'border-[#d7ff45] bg-[#d7ff45] text-[#14130f]'
          : 'border-[#3a3328] bg-[#191713] text-[#f4f1e8] hover:border-[#d7ff45]/70'
      }`}
    >
      ±{days}
    </button>
  );
}

function TimeSeries({ analysis }: { analysis: LunarAnalysis }) {
  const scores = analysis.dailyActivity.map((day) => day.velocityScore);
  const data = analysis.dailyActivity.map((day, index) => ({
    date: day.date,
    label: day.date.slice(5),
    score: day.velocityScore,
    rolling: Number(rollingMean(scores, index).toFixed(2)),
    phase: day.moonPhase,
    commits: day.commits,
    prs: day.pullRequestsCreated + day.pullRequestsMerged,
    releases: day.releases,
    deployments: day.deployments,
  }));

  return (
    <div className="h-[330px] rounded-lg border border-[#3a3328] bg-[#191713] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#3a3328" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            minTickGap={36}
            tick={{ fill: '#a69b88', fontSize: 11 }}
            axisLine={{ stroke: '#3a3328' }}
            tickLine={false}
          />
          <YAxis
            width={36}
            tick={{ fill: '#a69b88', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <RechartsTooltip
            cursor={{ fill: 'rgba(215,255,69,0.08)' }}
            contentStyle={{
              background: '#14130f',
              border: '1px solid #3a3328',
              borderRadius: 8,
              color: '#f4f1e8',
            }}
            labelStyle={{ color: '#d7ff45' }}
          />
          <Bar dataKey="score" radius={[2, 2, 0, 0]} name="Velocity score">
            {data.map((entry) => (
              <Cell key={entry.date} fill={phaseColor[entry.phase as MoonPhaseKind]} />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="rolling"
            dot={false}
            stroke="#ff6b57"
            strokeWidth={2}
            name="7-day mean"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function ComparisonChart({ comparison }: { comparison: WindowComparison }) {
  const data = [
    {
      name: 'Full moon',
      mean: comparison.fullMoon.mean,
      median: comparison.fullMoon.median,
    },
    {
      name: 'Baseline',
      mean: comparison.baseline.mean,
      median: comparison.baseline.median,
    },
  ];

  return (
    <div className="h-[260px] rounded-lg border border-[#3a3328] bg-[#191713] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 14, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#3a3328" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#a69b88', fontSize: 12 }} tickLine={false} />
          <YAxis width={36} tick={{ fill: '#a69b88', fontSize: 11 }} axisLine={false} tickLine={false} />
          <RechartsTooltip
            contentStyle={{
              background: '#14130f',
              border: '1px solid #3a3328',
              borderRadius: 8,
              color: '#f4f1e8',
            }}
          />
          <Bar dataKey="mean" name="Mean score/day" fill="#d7ff45" radius={[4, 4, 0, 0]} />
          <Bar dataKey="median" name="Median score/day" fill="#5eead4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Heatmap({ cells }: { cells: WeekdayPhaseHeatmapCell[] }) {
  const max = Math.max(1, ...cells.map((cell) => cell.meanScore));
  return (
    <div className="overflow-x-auto rounded-lg border border-[#3a3328] bg-[#191713] p-3">
      <div className="grid min-w-[540px] grid-cols-[120px_repeat(7,1fr)] gap-2">
        <div />
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center text-[11px] uppercase tracking-wider text-[#a69b88]">
            {day}
          </div>
        ))}
        {(['full_moon_window', 'new_moon_window', 'normal'] as MoonPhaseKind[]).map((phase) => (
          <div key={phase} className="contents">
            <div key={`${phase}-label`} className="flex items-center text-xs text-[#f4f1e8]">
              {phaseLabel(phase)}
            </div>
            {cells
              .filter((cell) => cell.phase === phase)
              .sort((a, b) => a.weekday - b.weekday)
              .map((cell) => {
                const intensity = cell.meanScore / max;
                return (
                  <div
                    key={`${phase}-${cell.weekday}`}
                    title={`${phaseLabel(phase)} ${cell.weekdayLabel}: ${formatNumber(cell.meanScore, 2)} score/day`}
                    className="h-14 rounded-md border border-[#3a3328] p-2 text-right font-mono text-sm text-[#f4f1e8]"
                    style={{
                      background: `color-mix(in srgb, ${phaseColor[phase]} ${Math.max(8, intensity * 80)}%, #191713)`,
                    }}
                  >
                    {formatNumber(cell.meanScore, 1)}
                    <div className="text-[10px] text-[#14130f]/70">{cell.days}d</div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

function RepoRanking({ repos }: { repos: RepoVelocity[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#3a3328] bg-[#191713]">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-[#211d18] text-[11px] uppercase tracking-[0.16em] text-[#a69b88]">
          <tr>
            <th className="px-3 py-2">Repository</th>
            <th className="px-3 py-2 text-right">Score</th>
            <th className="px-3 py-2 text-right">Commits</th>
            <th className="px-3 py-2 text-right">PRs</th>
            <th className="px-3 py-2 text-right">Deploys</th>
            <th className="px-3 py-2 text-right">Full lift</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#3a3328]">
          {repos.slice(0, 12).map((repo) => (
            <tr key={repo.repo} className="text-[#f4f1e8]">
              <td className="px-3 py-2 font-mono text-xs">{repo.repo}</td>
              <td className="px-3 py-2 text-right font-mono">{formatNumber(repo.score, 0)}</td>
              <td className="px-3 py-2 text-right font-mono">{repo.commits}</td>
              <td className="px-3 py-2 text-right font-mono">
                {repo.pullRequestsCreated + repo.pullRequestsMerged}
              </td>
              <td className="px-3 py-2 text-right font-mono">{repo.deployments}</td>
              <td className="px-3 py-2 text-right font-mono text-[#d7ff45]">
                {formatPercent(repo.fullMoonLiftPct)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FullMoonTable({ analysis }: { analysis: LunarAnalysis }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#3a3328] bg-[#191713]">
      <table className="w-full min-w-[780px] text-left text-sm">
        <thead className="bg-[#211d18] text-[11px] uppercase tracking-[0.16em] text-[#a69b88]">
          <tr>
            <th className="px-3 py-2">Full moon</th>
            <th className="px-3 py-2">Window</th>
            <th className="px-3 py-2 text-right">Score</th>
            <th className="px-3 py-2 text-right">Commits</th>
            <th className="px-3 py-2 text-right">PRs</th>
            <th className="px-3 py-2 text-right">Releases</th>
            <th className="px-3 py-2 text-right">Deploys</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#3a3328]">
          {analysis.metrics.fullMoonTable.slice(-14).map((moon) => (
            <tr key={moon.iso} className="text-[#f4f1e8]">
              <td className="px-3 py-2 font-mono text-xs">{moon.date}</td>
              <td className="px-3 py-2 font-mono text-xs text-[#a69b88]">
                {moon.windowStart} → {moon.windowEnd}
              </td>
              <td className="px-3 py-2 text-right font-mono">{formatNumber(moon.score, 0)}</td>
              <td className="px-3 py-2 text-right font-mono">{moon.commits}</td>
              <td className="px-3 py-2 text-right font-mono">
                {moon.pullRequestsCreated + moon.pullRequestsMerged}
              </td>
              <td className="px-3 py-2 text-right font-mono">{moon.releases}</td>
              <td className="px-3 py-2 text-right font-mono">{moon.deployments}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopDays({ analysis }: { analysis: LunarAnalysis }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {analysis.metrics.topDays.map((day, index) => (
        <div
          key={day.date}
          className="flex items-center gap-3 rounded-lg border border-[#3a3328] bg-[#191713] p-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#211d18] font-mono text-sm text-[#d7ff45]">
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-sm text-[#f4f1e8]">{day.date}</div>
            <div className="truncate text-xs text-[#a69b88]">
              {phaseLabel(day.moonPhase)} · {day.commits} commits ·{' '}
              {day.pullRequestsCreated + day.pullRequestsMerged} PR events
            </div>
          </div>
          <div className="font-mono text-xl text-[#f4f1e8]">{formatNumber(day.score, 0)}</div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ error }: { error: string | null }) {
  return (
    <div className="rounded-lg border border-[#ff6b57]/40 bg-[#2a1714] p-5 text-[#f4f1e8]">
      <div className="mb-3 flex items-center gap-2 text-[#ff9b8d]">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-semibold">Live analysis unavailable</span>
      </div>
      <p className="text-sm leading-relaxed text-[#d8cdb9]">
        {error || 'The API did not return an analysis.'}
      </p>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[#ffb1a7]">
        Live GitHub data required
      </p>
    </div>
  );
}

export function LunarDashboard({
  initialUser,
  initialStartDate,
  initialEndDate,
  initialWindowDays,
}: Props) {
  const [params, setParams] = useState<DashboardParams>({
    user: initialUser,
    startDate: initialStartDate,
    endDate: initialEndDate,
    windowDays: initialWindowDays,
    includeNewMoon: true,
    includeForks: false,
    includeLines: false,
    excludeBots: true,
  });
  const [analysis, setAnalysis] = useState<LunarAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => buildQuery(params).toString(), [params]);

  const load = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/lunar/analyze?${buildQuery(params, force).toString()}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Lunar analysis failed.');
        }
        setAnalysis(payload as LunarAnalysis);
      } catch (loadError) {
        setError((loadError as Error).message);
        setAnalysis(null);
      } finally {
        setLoading(false);
      }
    },
    [params],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const exportCsv = `/api/lunar/export?${query}&format=csv`;
  const exportJson = `/api/lunar/export?${query}&format=json`;

  const chartReady = analysis && !loading;
  const comparison = analysis?.metrics.activeWindow;

  return (
    <main
      className="min-h-screen bg-[#100f0d] text-[#f4f1e8]"
      style={{
        backgroundImage:
          'linear-gradient(180deg, #100f0d 0%, #181410 52%, #0f100d 100%)',
      }}
    >
      <AtlasNavigation active="lunar" />

      <header className="border-b border-[#3a3328] bg-[#14130f]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-3 px-4 md:px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d7ff45]/40 bg-[#d7ff45]/10 text-[#d7ff45]">
            <Moon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">Lunar Velocity</div>
            <div className="truncate text-[11px] text-[#a69b88]">
              Engineering output under the full moon.
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load(true)}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-[#3a3328] bg-[#191713] px-2.5 text-xs text-[#f4f1e8] hover:border-[#d7ff45]/60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <a
              href={exportCsv}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-[#3a3328] bg-[#191713] px-2.5 text-xs text-[#f4f1e8] hover:border-[#5eead4]/70"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              CSV
            </a>
            <a
              href={exportJson}
              className="hidden h-8 items-center gap-2 rounded-md border border-[#3a3328] bg-[#191713] px-2.5 text-xs text-[#f4f1e8] hover:border-[#5eead4]/70 sm:inline-flex"
            >
              <Download className="h-3.5 w-3.5" />
              JSON
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#3a3328] bg-[#14130f]/55 p-3 md:block">
          <div className="sticky top-[4.25rem] space-y-4">
            <div className="rounded-lg border border-[#3a3328] bg-[#191713] p-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#a69b88]">
                <Search className="h-3.5 w-3.5" />
                Scope
              </div>
              <label className="mb-3 block text-xs text-[#a69b88]">
                GitHub user
                <input
                  value={params.user}
                  onChange={(event) =>
                    setParams((current) => ({ ...current, user: event.target.value }))
                  }
                  className="mt-1 h-9 w-full rounded-md border border-[#3a3328] bg-[#100f0d] px-2 font-mono text-sm text-[#f4f1e8] outline-none focus:border-[#d7ff45]"
                />
              </label>
              <label className="mb-3 block text-xs text-[#a69b88]">
                Start
                <input
                  type="date"
                  value={params.startDate}
                  onChange={(event) =>
                    setParams((current) => ({ ...current, startDate: event.target.value }))
                  }
                  className="mt-1 h-9 w-full rounded-md border border-[#3a3328] bg-[#100f0d] px-2 font-mono text-sm text-[#f4f1e8] outline-none focus:border-[#d7ff45]"
                />
              </label>
              <label className="block text-xs text-[#a69b88]">
                End
                <input
                  type="date"
                  value={params.endDate}
                  onChange={(event) =>
                    setParams((current) => ({ ...current, endDate: event.target.value }))
                  }
                  className="mt-1 h-9 w-full rounded-md border border-[#3a3328] bg-[#100f0d] px-2 font-mono text-sm text-[#f4f1e8] outline-none focus:border-[#d7ff45]"
                />
              </label>
            </div>

            <div className="rounded-lg border border-[#3a3328] bg-[#191713] p-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#a69b88]">
                <Moon className="h-3.5 w-3.5" />
                Window
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 5].map((days) => (
                  <WindowButton
                    key={days}
                    days={days}
                    active={params.windowDays === days}
                    onClick={() => setParams((current) => ({ ...current, windowDays: days }))}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Toggle
                label="New moon"
                checked={params.includeNewMoon}
                onChange={(includeNewMoon) =>
                  setParams((current) => ({ ...current, includeNewMoon }))
                }
              />
              <Toggle
                label="Forks"
                checked={params.includeForks}
                onChange={(includeForks) =>
                  setParams((current) => ({ ...current, includeForks }))
                }
              />
              <Toggle
                label="Lines"
                checked={params.includeLines}
                onChange={(includeLines) =>
                  setParams((current) => ({ ...current, includeLines }))
                }
              />
              <Toggle
                label="No bots"
                checked={params.excludeBots}
                onChange={(excludeBots) =>
                  setParams((current) => ({ ...current, excludeBots }))
                }
              />
            </div>
          </div>
        </aside>

        <div className="min-w-0 px-4 py-5 md:px-6">
          <section className="mb-5 rounded-lg border border-[#3a3328] bg-[#191713]/80 p-5">
            <div className="mb-4 flex flex-wrap items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[#d7ff45]/30 bg-[#d7ff45]/10 text-[#d7ff45]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-[#a69b88]">
                  Cockpit lab
                </div>
                <h1 className="text-balance text-2xl font-semibold text-[#f4f1e8] md:text-4xl">
                  Does Marcel ship more when the moon is full?
                </h1>
              </div>
              {analysis ? (
                <div
                  className={`rounded-md border px-3 py-2 text-sm font-semibold ${evidenceTone[analysis.summary.evidenceLevel]}`}
                >
                  {analysis.summary.evidenceLevel.toUpperCase()}
                </div>
              ) : null}
            </div>

            {analysis ? (
              <div className="grid gap-3 md:grid-cols-4">
                <StatTile
                  label="Full Moon Velocity"
                  value={formatPercent(analysis.summary.fullMoonVelocityPct)}
                  detail={`${analysis.summary.fullMoonDays} window days vs ${analysis.summary.baselineDays} baseline days`}
                  icon={<Zap className="h-4 w-4" />}
                  tone="citron"
                />
                <StatTile
                  label="Mean Score"
                  value={formatNumber(analysis.metrics.activeWindow.fullMoon.mean, 1)}
                  detail={`Baseline ${formatNumber(analysis.metrics.activeWindow.baseline.mean, 1)}`}
                  icon={<BarChart3 className="h-4 w-4" />}
                  tone="teal"
                />
                <StatTile
                  label="Top Days In Window"
                  value={formatPercent(analysis.summary.topOutputShareInFullMoonWindow * 100)}
                  detail="Share of top-10 output days"
                  icon={<CalendarDays className="h-4 w-4" />}
                  tone="coral"
                />
                <StatTile
                  label="Most Affected Repo"
                  value={analysis.summary.mostAffectedRepo?.split('/').slice(-1)[0] ?? '—'}
                  detail={analysis.summary.mostAffectedRepo ?? 'No repo lift detected'}
                  icon={<Rocket className="h-4 w-4" />}
                  tone="moon"
                />
              </div>
            ) : null}
          </section>

          {loading && !analysis ? (
            <div className="grid gap-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-lg border border-[#3a3328] bg-[#191713]"
                />
              ))}
            </div>
          ) : null}

          {!loading && !analysis ? <EmptyState error={error} /> : null}

          {chartReady && comparison ? (
            <>
              <Section title="Daily Velocity" icon={<Zap className="h-4 w-4" />}>
                <TimeSeries analysis={analysis} />
              </Section>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <Section title="Full Moon vs Baseline" icon={<BarChart3 className="h-4 w-4" />}>
                  <ComparisonChart comparison={comparison} />
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {analysis.metrics.windows.map((window) => (
                      <div
                        key={window.windowDays}
                        className="rounded-lg border border-[#3a3328] bg-[#191713] p-3"
                      >
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#a69b88]">
                          Full moon ±{window.windowDays}
                        </div>
                        <div className="mt-2 font-mono text-2xl text-[#f4f1e8]">
                          {formatPercent(window.percentDelta)}
                        </div>
                        <div className="mt-1 text-xs text-[#a69b88]">
                          d={formatNumber(window.effectSize, 2)} · p=
                          {window.bootstrap.pValue == null
                            ? 'n/a'
                            : formatNumber(window.bootstrap.pValue, 3)}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Weekday × Moon Phase" icon={<Moon className="h-4 w-4" />}>
                  <Heatmap cells={analysis.metrics.weekdayPhaseHeatmap} />
                </Section>
              </div>

              <Section title="Repository Velocity" icon={<GitPullRequest className="h-4 w-4" />}>
                <div className="overflow-x-auto">
                  <RepoRanking repos={analysis.metrics.repoVelocity} />
                </div>
              </Section>

              <div className="grid gap-5 xl:grid-cols-2">
                <Section title="Full Moon Windows" icon={<Table2 className="h-4 w-4" />}>
                  <div className="overflow-x-auto">
                    <FullMoonTable analysis={analysis} />
                  </div>
                </Section>

                <Section title="Top Output Days" icon={<Rocket className="h-4 w-4" />}>
                  <TopDays analysis={analysis} />
                </Section>
              </div>

              <Section title="Run Metadata" icon={<RefreshCw className="h-4 w-4" />}>
                <div className="grid gap-3 md:grid-cols-4">
                  <StatTile
                    label="Source"
                    value={analysis.meta.source}
                    detail={analysis.meta.generatedAt.slice(0, 16).replace('T', ' ')}
                    icon={<RefreshCw className="h-4 w-4" />}
                    tone="teal"
                  />
                  <StatTile
                    label="Repos Scanned"
                    value={formatNumber(analysis.meta.repositoriesScanned)}
                    detail={`${analysis.meta.repositoriesSkipped} skipped`}
                    icon={<Search className="h-4 w-4" />}
                    tone="moon"
                  />
                  <StatTile
                    label="API Requests"
                    value={formatNumber(analysis.meta.apiRequests)}
                    detail={
                      analysis.meta.rateLimitRemaining == null
                        ? 'No GitHub calls'
                        : `${analysis.meta.rateLimitRemaining} remaining`
                    }
                    icon={<RefreshCw className="h-4 w-4" />}
                    tone="teal"
                  />
                  <StatTile
                    label="Total Score"
                    value={formatNumber(analysis.summary.totalScore)}
                    detail={`Weights: commit ${analysis.weights.commits}, PR merge ${analysis.weights.pullRequestsMerged}`}
                    icon={<Zap className="h-4 w-4" />}
                    tone="citron"
                  />
                </div>

                {analysis.meta.warnings.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-[#ff6b57]/35 bg-[#2a1714] p-3 text-xs text-[#ffb1a7]">
                    {analysis.meta.warnings.slice(0, 4).map((warning) => (
                      <div key={warning}>• {warning}</div>
                    ))}
                  </div>
                ) : null}
              </Section>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
