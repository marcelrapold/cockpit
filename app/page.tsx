/**
 * Hybrid-Architektur (Welle C — Phase 1):
 *  Native SSR-Hero mit allen kritischen KPIs, der Detail-iframe wird
 *  nach unten verschoben und enthält jetzt nur noch Portfolio-Tabs +
 *  Charts (Phase 2/3 ersetzen ihn schrittweise).
 *
 *  Reihenfolge ist redaktionell, nicht technisch:
 *    1. NarrativeHero  — der "warum"-Teaser (LLM, 6h-Refresh)
 *    2. KpiStrip       — Hochfrequente Aktivitäts-KPIs (10 min-Refresh)
 *    3. DoraStrip      — DORA Four-Keys (Vercel, ~Stunden-Refresh)
 *    4. InfraHealth    — Vercel/Supabase-Health auf einen Blick
 *    5. LiveActivity   — Letzter Commit + Top-Repos (Kontext)
 *    6. Detail-iframe  — Portfolio-Tabs, Charts, Vergleich (Phase 2/3)
 *
 *  Caching: ISR mit `revalidate=60`. Jede Server-Component liest aus
 *  Redis (Cache-Reader), kein HTTP-Roundtrip in den eigenen API-Endpoints.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';

import { DoraStrip, DoraStripSkeleton } from '@/components/hero/DoraStrip';
import { InfraHealth, InfraHealthSkeleton } from '@/components/hero/InfraHealth';
import { KpiStrip, KpiStripSkeleton } from '@/components/hero/KpiStrip';
import { LiveActivity, LiveActivitySkeleton } from '@/components/hero/LiveActivity';
import { NarrativeHero, NarrativeHeroSkeleton } from '@/components/hero/NarrativeHero';
import {
  PortfolioBoard,
  PortfolioBoardSkeleton,
} from '@/components/portfolio/PortfolioBoard';
import { readNarrative } from '@/lib/data/cache-reader';

export const revalidate = 60;

const FALLBACK_DESCRIPTION =
  'Engineering-Dashboard für 70+ Projekte: Live-Commits, Deployments, Uptime, Sprachen-Verteilung. GitHub, Vercel, Supabase — alles auf einen Blick.';

export async function generateMetadata(): Promise<Metadata> {
  const narrative = await readNarrative();
  const description = narrative?.teaser?.trim() || FALLBACK_DESCRIPTION;

  return {
    title: 'Cockpit | Marcel Rapold',
    description,
    openGraph: {
      title: 'Cockpit | Marcel Rapold',
      description,
      url: 'https://cockpit.rapold.io/',
      type: 'website',
      locale: 'de_CH',
      siteName: 'Cockpit',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Cockpit Dashboard — Commit-Heatmap, KPIs, Deployment-Stats',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Cockpit | Marcel Rapold',
      description,
      images: ['/og-image.png'],
    },
  };
}

export default function Home() {
  return (
    <main className="min-h-[100svh] w-full bg-[#0b1120] text-slate-100">
      <div className="border-b border-white/5 bg-gradient-to-b from-[#0d1426] to-[#0b1120] pb-2">
        <Suspense fallback={<NarrativeHeroSkeleton />}>
          <NarrativeHero />
        </Suspense>
        <Suspense fallback={<KpiStripSkeleton />}>
          <KpiStrip />
        </Suspense>
        <Suspense fallback={<DoraStripSkeleton />}>
          <DoraStrip />
        </Suspense>
        <Suspense fallback={<InfraHealthSkeleton />}>
          <InfraHealth />
        </Suspense>
        <Suspense fallback={<LiveActivitySkeleton />}>
          <LiveActivity />
        </Suspense>
      </div>

      <Suspense fallback={<PortfolioBoardSkeleton />}>
        <PortfolioBoard />
      </Suspense>

      <details className="group mx-auto max-w-screen-2xl px-4 py-3 md:px-6">
        <summary className="cursor-pointer select-none text-[11px] uppercase tracking-[0.18em] text-slate-500 hover:text-slate-300">
          Charts &amp; Detailansicht (Legacy)
          <span className="ml-2 text-slate-600 group-open:hidden">(klicken zum Öffnen)</span>
        </summary>
        <iframe
          src="/index.html#charts"
          title="Charts und Detail-Visualisierungen"
          className="mt-3 h-[80vh] w-full rounded-lg border border-white/10 bg-[#0f172a]"
          loading="lazy"
        />
      </details>
    </main>
  );
}
