/**
 * RepoIndex — Server Component
 *
 * Rendert die LLM-angereicherten Repo-Summaries (oneLiner, Tags, Status)
 * als sortierte, suchbare Liste. Status-Filter unten basieren auf dem
 * `:target`-Pseudo via Anchor-Links — bewusst kein Client-JS für die
 * Insights-Route.
 */

import { readRepos } from '@/lib/data/cache-reader';

type RepoMeta = {
  full: string;
  oneLiner: string;
  purpose: string;
  stack?: string[] | string;
  audience?: string;
  status?: string;
  tags?: string[];
};

const STATUS_RANK: Record<string, number> = {
  active: 0,
  maintenance: 1,
  archived: 2,
  experimental: 3,
};

function sortRepos(repos: RepoMeta[]): RepoMeta[] {
  return [...repos].sort((a, b) => {
    const sa = STATUS_RANK[a.status?.toLowerCase() ?? ''] ?? 4;
    const sb = STATUS_RANK[b.status?.toLowerCase() ?? ''] ?? 4;
    if (sa !== sb) return sa - sb;
    return a.full.localeCompare(b.full);
  });
}

function statusTone(status: string | undefined): string {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20';
    case 'maintenance':
      return 'bg-amber-400/10 text-amber-300 ring-amber-400/20';
    case 'archived':
      return 'bg-slate-400/10 text-slate-400 ring-slate-400/20';
    case 'experimental':
      return 'bg-purple-400/10 text-purple-300 ring-purple-400/20';
    default:
      return 'bg-slate-500/10 text-slate-400 ring-slate-500/20';
  }
}

export async function RepoIndex() {
  const data = await readRepos();
  if (!data?.repos) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8 text-slate-400 md:px-6">
        <p className="text-sm">Repo-Index wird beim nächsten Cron-Lauf generiert.</p>
      </section>
    );
  }

  const repos = sortRepos(Object.values(data.repos));
  const orgs = data.orgs?.length ? data.orgs : [];

  return (
    <section className="mx-auto max-w-5xl px-4 pt-12 md:px-6 md:pt-16">
      <header className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-lg font-medium text-slate-100 md:text-xl">Repo-Index</h2>
        <span className="font-mono text-xs text-slate-500">
          {data.count} Repos
          {orgs.length ? ` · ${orgs.join(' · ')}` : ''}
        </span>
      </header>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {repos.map((r) => (
          <li
            key={r.full}
            className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 transition hover:border-white/10 hover:bg-white/[0.04]"
          >
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <a
                href={`https://github.com/${r.full}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[13px] text-slate-200 hover:text-sky-300"
              >
                {r.full}
              </a>
              {r.status ? (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ring-1 ring-inset ${statusTone(r.status)}`}
                >
                  {r.status}
                </span>
              ) : null}
            </div>

            {r.oneLiner ? (
              <p className="text-sm leading-snug text-slate-300">{r.oneLiner}</p>
            ) : null}

            {r.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.tags.slice(0, 6).map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
