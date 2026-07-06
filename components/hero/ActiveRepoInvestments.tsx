import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { readGithubStats, readRepos, type PortfolioProject } from '@/lib/data/cache-reader';

type PortfolioConfig = {
  overrides?: Record<string, Partial<PortfolioProject>>;
};

async function readPortfolioOverrides() {
  try {
    const raw = await readFile(
      path.join(process.cwd(), 'api-legacy', 'portfolio-config.json'),
      'utf8',
    );
    const parsed = JSON.parse(raw) as PortfolioConfig;
    return parsed.overrides ?? {};
  } catch {
    return {};
  }
}

function repoLabel(repo: string, override?: Partial<PortfolioProject>) {
  if (override?.name) return override.name;
  return repo
    .split('/')
    .pop()
    ?.replace(/\.(app|com|io|ch)$/i, '')
    .replace(/^zvv-/, 'ZVV ')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase()) ?? repo;
}

function valueLabel(override?: Partial<PortfolioProject>) {
  if (override?.pt) return override.pt;
  if (typeof override?.ptMid === 'number') return `${override.ptMid} PT`;
  return 'unbewertet';
}

export async function ActiveRepoInvestments() {
  const [gh, repos, overrides] = await Promise.all([
    readGithubStats(),
    readRepos(),
    readPortfolioOverrides(),
  ]);

  const activeRepos = gh?.activeRepos ?? [];
  if (activeRepos.length === 0) return null;

  const items = activeRepos.slice(0, 8).map((repo) => {
    const override = overrides[repo.name];
    const meta = repos?.repos?.[repo.name];
    return {
      repo: repo.name,
      commits: repo.commits,
      name: repoLabel(repo.name, override),
      value: valueLabel(override),
      work: override?.work || meta?.oneLiner || '',
      status: override?.lc || meta?.status || 'active',
    };
  });

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <header className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-300">
          Aktive Delivery-Signale
        </h2>
        <span className="font-mono text-[11px] text-slate-500">
          Repo-Aktivität × Portfolio-Wert
        </span>
      </header>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.repo}
            className="rounded-lg border border-white/5 bg-white/[0.025] px-4 py-3"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-slate-100">{item.name}</h3>
                <a
                  href={`https://github.com/${item.repo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] text-slate-500 hover:text-sky-300"
                >
                  {item.repo}
                </a>
              </div>
              <div className="text-right font-mono">
                <div className="text-sm text-slate-100">{item.commits}</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Commits
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded bg-emerald-400/10 px-2 py-1 font-mono text-emerald-200 ring-1 ring-inset ring-emerald-400/20">
                {item.value}
              </span>
              <span className="rounded bg-sky-400/10 px-2 py-1 font-mono uppercase tracking-[0.14em] text-sky-200 ring-1 ring-inset ring-sky-400/20">
                {item.status}
              </span>
            </div>

            {item.work ? (
              <p className="mt-2 line-clamp-2 text-xs leading-snug text-slate-400">{item.work}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function ActiveRepoInvestmentsSkeleton() {
  return (
    <section aria-hidden className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-4 h-3 w-56 animate-pulse rounded bg-white/10" />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-lg bg-white/[0.03]" />
        ))}
      </div>
    </section>
  );
}
