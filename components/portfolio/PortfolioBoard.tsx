/**
 * PortfolioBoard — Server-Component-Wrapper
 *
 * Lädt Portfolio + LLM-Repo-Summaries aus Redis, normalisiert das
 * Schema und übergibt ein flaches `items[]` an die Client-Insel
 * (PortfolioBoardClient). Damit bleibt der Initial-HTML komplett
 * gerendert, und nur die Filter-Logik (Tabs + Suche) läuft im Browser.
 */

import { readPortfolio, readRepos } from '@/lib/data/cache-reader';
import type { PortfolioProject } from '@/lib/data/cache-reader';

import { PortfolioBoardClient, type PortfolioItem } from './PortfolioBoardClient';

const CAT_FALLBACK: PortfolioItem['cat'] = 'change';

function normalize(p: PortfolioProject, llmOneLiner?: string): PortfolioItem {
  const cat: PortfolioItem['cat'] = (() => {
    const raw = (p.cat || '').toLowerCase();
    if (raw === 'change' || raw === 'run' || raw === 'steward' || raw === 'govern') return raw;
    return CAT_FALLBACK;
  })();

  const totalCommits =
    (p.commits && typeof p.commits === 'object'
      ? typeof (p.commits as { total?: number }).total === 'number'
        ? (p.commits as { total?: number }).total
        : Object.values(p.commits as Record<string, number>).reduce(
            (s, n) => s + (typeof n === 'number' ? n : 0),
            0,
          )
      : null) ?? null;

  return {
    repo: p.repo,
    name: p.name,
    purpose: (p.purpose || '').trim() || llmOneLiner || '',
    work: p.work || '',
    cat,
    mode: p.mode || '',
    modeLabel: p.modeLabel || p.mode || '',
    lc: p.lc || '',
    lcLabel: p.lcLabel || p.lc || '',
    lcNote: p.lcNote || '',
    forecast: p.forecast || '',
    ptMid: typeof p.ptMid === 'number' ? p.ptMid : null,
    pt: p.pt || '',
    stars: typeof p.stars === 'number' ? p.stars : 0,
    language: p.language || null,
    topics: Array.isArray(p.topics) ? p.topics : [],
    pushed_at: p.pushed_at || null,
    github: p.github || `https://github.com/${p.repo}`,
    prod: p.prod || null,
    vercel: p.vercel || null,
    totalCommits,
  };
}

export async function PortfolioBoard() {
  const [portfolio, repos] = await Promise.all([readPortfolio(), readRepos()]);

  if (!portfolio || !portfolio.projects || portfolio.projects.length === 0) {
    return (
      <section aria-label="Portfolio" className="px-4 pb-6 md:px-6">
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] text-slate-400">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-500 align-middle" />
          Portfolio wird geladen — Liste erscheint nach dem nächsten Refresh.
        </div>
      </section>
    );
  }

  const items: PortfolioItem[] = portfolio.projects.map((p) => {
    const llm = repos?.repos?.[p.repo];
    return normalize(p, llm?.oneLiner);
  });

  // Sort: Personentage absteigend (große Initiativen zuerst), dann alphabetisch.
  items.sort((a, b) => {
    const ap = a.ptMid ?? 0;
    const bp = b.ptMid ?? 0;
    if (ap !== bp) return bp - ap;
    return a.name.localeCompare(b.name, 'de-CH');
  });

  return <PortfolioBoardClient items={items} updatedAt={portfolio.timestamp} />;
}

export function PortfolioBoardSkeleton() {
  return (
    <section aria-hidden className="px-4 pb-6 md:px-6">
      <div className="mb-3 h-8 w-full max-w-md animate-pulse rounded-md bg-white/5" />
      <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[120px] animate-pulse rounded-lg border border-white/10 bg-white/[0.03]"
          />
        ))}
      </div>
    </section>
  );
}
