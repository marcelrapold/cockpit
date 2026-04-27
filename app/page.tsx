/**
 * Cockpit-Startseite — komplett native (Welle C — Phase 4: iframe-frei).
 *
 *  Sektion-Reihenfolge:
 *    1. NarrativeHero    — LLM-Teaser, Build-Badge, Stale-Pulse (6h-Refresh)
 *    2. KpiStrip         — Aktivitäts-KPIs (Heute/7d/30d/Velocity/Repos/PRs)
 *    3. DoraStrip        — DORA Four-Keys mit Tier-Badges + Sparkline
 *    4. InfraHealth      — Vercel + Supabase Status-Pulse
 *    5. LiveActivity     — Letzter Commit + Top-3 aktive Repos
 *    6. ActivityHeatmap  — 30-Tage-Aktivität als SVG-Heatmap
 *    7. LanguageDonut    — Sprachen-Verteilung als SVG-Donut
 *    8. PortfolioBoard   — Tabs + Suche, Server-Component + Client-Island
 *    9. SiteFooter       — Build-Info + externe Links + Legacy-Archiv
 *
 *  Caching: ISR mit `revalidate=60`. Jede Server-Component liest direkt
 *  aus Redis (cache-reader), kein HTTP-Roundtrip zu den eigenen
 *  API-Endpoints. Suspense-Boundaries pro Sektion isolieren langsame
 *  Reads, damit der Render nicht block.
 *
 *  Bundle-Footprint: < 110 kB First-Load JS, davon ~2 kB für die
 *  Portfolio-Tab/Search-Insel (alles andere = SSR-only, 0 Client-JS).
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';

import {
  ActivityHeatmap,
  ActivityHeatmapSkeleton,
} from '@/components/charts/ActivityHeatmap';
import { LanguageDonut, LanguageDonutSkeleton } from '@/components/charts/LanguageDonut';
import { DoraStrip, DoraStripSkeleton } from '@/components/hero/DoraStrip';
import { InfraHealth, InfraHealthSkeleton } from '@/components/hero/InfraHealth';
import { KpiStrip, KpiStripSkeleton } from '@/components/hero/KpiStrip';
import { LiveActivity, LiveActivitySkeleton } from '@/components/hero/LiveActivity';
import { NarrativeHero, NarrativeHeroSkeleton } from '@/components/hero/NarrativeHero';
import { SiteFooter } from '@/components/layout/SiteFooter';
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

      <Suspense fallback={<ActivityHeatmapSkeleton />}>
        <ActivityHeatmap />
      </Suspense>

      <Suspense fallback={<LanguageDonutSkeleton />}>
        <LanguageDonut />
      </Suspense>

      <Suspense fallback={<PortfolioBoardSkeleton />}>
        <PortfolioBoard />
      </Suspense>

      <SiteFooter />
    </main>
  );
}
