/**
 * PortfolioBoardClient — Client-Island
 *
 * Genau zwei Aufgaben: Tab-Filter (cat) und Volltext-Suche.
 * Die Liste der Items kommt komplett-gerendert vom Server, kein
 * Client-Fetch. State ist URL-frei (Hash), damit kein Hydration-
 * Mismatch und kein Verlust beim Tab-Wechsel.
 */

'use client';

import { useDeferredValue, useMemo, useState } from 'react';

import { fmtNumber, fmtRelative } from '@/lib/ui/format';

export type PortfolioItem = {
  repo: string;
  name: string;
  purpose: string;
  work: string;
  cat: 'change' | 'run' | 'steward' | 'govern';
  mode: string;
  modeLabel: string;
  lc: string;
  lcLabel: string;
  lcNote: string;
  forecast: string;
  ptMid: number | null;
  pt: string;
  stars: number;
  language: string | null;
  topics: string[];
  pushed_at: string | null;
  github: string;
  prod: string | null;
  vercel: string | null;
  totalCommits: number | null;
};

type Tab = { id: 'all' | PortfolioItem['cat']; label: string };

const TABS: Tab[] = [
  { id: 'all', label: 'Alle' },
  { id: 'change', label: 'Change' },
  { id: 'run', label: 'Produktiv (Run)' },
  { id: 'steward', label: 'Tools & Plattform' },
  { id: 'govern', label: 'Governance' },
];

const LC_TONE: Record<string, string> = {
  prod: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  pilot: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
  spec: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  tool: 'bg-violet-500/15 text-violet-300 ring-violet-400/30',
  jw: 'bg-slate-500/15 text-slate-300 ring-slate-400/30',
  archive: 'bg-white/5 text-slate-500 ring-white/10',
};

function lcTone(lc: string): string {
  return LC_TONE[lc] || 'bg-white/5 text-slate-300 ring-white/10';
}

type Props = {
  items: PortfolioItem[];
  updatedAt?: string;
};

export function PortfolioBoardClient({ items, updatedAt }: Props) {
  const [tab, setTab] = useState<Tab['id']>('all');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const counts = useMemo(() => {
    const c: Record<Tab['id'], number> = {
      all: items.length,
      change: 0,
      run: 0,
      steward: 0,
      govern: 0,
    };
    for (const it of items) c[it.cat] = (c[it.cat] ?? 0) + 1;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return items.filter((it) => {
      if (tab !== 'all' && it.cat !== tab) return false;
      if (!q) return true;
      const hay = [it.name, it.repo, it.purpose, it.work, it.lcLabel, it.lcNote, ...it.topics]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, tab, deferredQuery]);

  return (
    <section aria-label="Portfolio-Übersicht" className="px-4 pb-6 md:px-6">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Portfolio · {fmtNumber(items.length)} Initiativen
          {updatedAt ? <span className="ml-2">· Stand {fmtRelative(updatedAt)}</span> : null}
        </div>
        <div className="relative w-full md:w-72">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Initiative suchen …"
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] text-slate-100 placeholder:text-slate-500 focus:border-sky-400/40 focus:outline-none focus:ring-1 focus:ring-sky-400/40"
            aria-label="Initiativen filtern"
          />
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Kategorien"
        className="mb-4 flex flex-wrap gap-2"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-3 py-1 text-[12px] transition ${
                active
                  ? 'bg-sky-500/20 text-sky-200 ring-1 ring-inset ring-sky-400/40'
                  : 'bg-white/5 text-slate-300 ring-1 ring-inset ring-white/10 hover:bg-white/10'
              }`}
            >
              {t.label}
              <span className="ml-2 text-[10px] tabular-nums text-slate-500">
                {fmtNumber(counts[t.id])}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-[12px] text-slate-400">
          Keine Initiative passt zu dem Filter.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {filtered.map((it) => (
            <li
              key={it.repo}
              className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-3 transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-slate-100">
                    {it.name}
                  </div>
                  <div className="truncate font-mono text-[10.5px] text-slate-500">
                    {it.repo}
                  </div>
                </div>
                {it.lcLabel ? (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset ${lcTone(it.lc)}`}
                  >
                    {it.lcLabel}
                  </span>
                ) : null}
              </div>

              {it.purpose ? (
                <p className="text-[12px] leading-relaxed text-slate-300 line-clamp-3">
                  {it.purpose}
                </p>
              ) : null}

              {it.work ? (
                <div className="text-[11px] text-slate-400">
                  <span className="text-slate-500">Arbeit · </span>
                  {it.work}
                </div>
              ) : null}

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                {it.ptMid != null ? (
                  <span title={`Aufwand · ${it.pt} Personentage`}>
                    <span className="text-slate-500">PT · </span>
                    <span className="tabular-nums text-slate-200">{it.ptMid}</span>
                  </span>
                ) : null}
                {it.totalCommits != null ? (
                  <span title="Commits gesamt im Beobachtungs-Zeitraum">
                    <span className="text-slate-500">Commits · </span>
                    <span className="tabular-nums text-slate-200">
                      {fmtNumber(it.totalCommits)}
                    </span>
                  </span>
                ) : null}
                {it.language ? (
                  <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">
                    {it.language}
                  </span>
                ) : null}
                {it.pushed_at ? (
                  <span className="text-slate-500" title={`Letzter Push · ${it.pushed_at}`}>
                    {fmtRelative(it.pushed_at)}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                <a
                  href={it.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-sky-300"
                >
                  GitHub →
                </a>
                {it.prod ? (
                  <a
                    href={it.prod}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-emerald-300"
                  >
                    Live →
                  </a>
                ) : null}
                {it.vercel ? (
                  <a
                    href={it.vercel}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-sky-300"
                  >
                    Vercel →
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
