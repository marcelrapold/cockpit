/**
 * SiteFooter — Server-Component
 *
 * Minimaler nativer Footer:
 *   - Build-Info (Version + Commit + Branch + Env)
 *   - Externe Links (GitHub, marcelrapold.com, Insights)
 *   - Verweis auf Legacy-Archiv und API-Endpoints
 */

import Link from 'next/link';

import { getBuildInfo } from '@/lib/data/build-info';

export function SiteFooter() {
  const build = getBuildInfo();
  return (
    <footer className="mt-8 border-t border-white/5 bg-[#0a0f1c] px-4 py-6 md:px-6">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 text-[11px] text-slate-500 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            Cockpit · <span className="text-slate-300">Marcel Rapold</span>
          </span>
          <span
            className="font-mono text-[10px]"
            title={
              build.commitFull
                ? `${build.branch} · ${build.commitFull} · ${build.environment}`
                : `${build.branch} · ${build.environment}`
            }
          >
            v{build.version} · {build.commit} · {build.environment}
          </span>
        </div>
        <nav aria-label="Footer-Navigation" className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/insights" className="hover:text-sky-300">
            Insights
          </Link>
          <a
            href="https://github.com/marcelrapold/cockpit"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-sky-300"
          >
            GitHub-Repo
          </a>
          <a
            href="https://marcelrapold.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-sky-300"
          >
            marcelrapold.com
          </a>
          <a
            href="/api/v1/summary"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-sky-300"
          >
            API
          </a>
          <a href="/legacy.html" className="text-slate-600 hover:text-slate-400">
            Legacy-Archiv
          </a>
        </nav>
      </div>
    </footer>
  );
}
