import Link from 'next/link';
import { Activity, BarChart3, GitBranch, Home, Moon, ShieldCheck } from 'lucide-react';

type ActiveNav = 'dashboard' | 'insights' | 'lunar';

const primaryLinks = [
  { id: 'dashboard', href: '/', label: 'Dashboard', icon: Home },
  { id: 'insights', href: '/insights', label: 'Insights', icon: BarChart3 },
  { id: 'lunar', href: '/lunar', label: 'Lunar', icon: Moon, badge: 'Live' },
] satisfies Array<{
  id: ActiveNav;
  href: string;
  label: string;
  icon: typeof Home;
  badge?: string;
}>;

export function AtlasNavigation({ active }: { active: ActiveNav }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1120]/88 backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 max-w-screen-2xl flex-wrap items-center gap-3 px-4 py-2 md:flex-nowrap md:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="Cockpit Dashboard">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-sky-300/25 bg-sky-300/10 text-sky-200 shadow-[0_0_28px_rgba(14,165,233,0.12)]">
            <Activity className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-tight text-slate-100 group-hover:text-sky-100">
              Cockpit · Marcel Rapold
            </span>
            <span className="block truncate font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Atlas nav · live GitHub data
            </span>
          </span>
        </Link>

        <nav aria-label="Cockpit navigation" className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:ml-3 md:w-auto">
          {primaryLinks.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === active;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-medium transition ${
                  isActive
                    ? 'border-sky-300/45 bg-sky-300/12 text-sky-100 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.08)]'
                    : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
                {item.badge ? (
                  <span className="rounded border border-emerald-300/30 bg-emerald-300/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-200">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden h-8 items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-2.5 text-xs text-emerald-200 md:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            Real data
          </span>
          <a
            href="/api/v1/summary"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-8 items-center rounded-md border border-white/10 bg-white/[0.03] px-2.5 font-mono text-[10px] uppercase tracking-wider text-slate-400 transition hover:border-sky-300/35 hover:text-sky-100 sm:inline-flex"
          >
            API
          </a>
          <a
            href="https://github.com/marcelrapold/cockpit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-slate-400 transition hover:border-sky-300/35 hover:text-sky-100"
            aria-label="Cockpit GitHub repository"
          >
            <GitBranch className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}
