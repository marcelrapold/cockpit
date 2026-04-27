/**
 * Hybrid-Architektur (Sprint 1):
 *  - SSR-Hero über dem iframe (NarrativeTeaser + KPI-Strip) → liefert
 *    sofort sichtbaren Inhalt, gut für FCP/LCP und SEO/OG.
 *  - Detail-Dashboard bleibt vorerst als statisches /index.html im iframe;
 *    wird sukzessive in eigene Server-Components migriert (Sprint 2+).
 *
 * Caching: ISR mit `revalidate=60` — KPIs aktualisieren sich auf Vercel
 * automatisch hintergrund-rerender. Der LLM-Teaser hat seinen eigenen
 * 6h-Refresh-Zyklus via /api/cron/refresh-llm.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';

import { KpiStrip, KpiStripSkeleton } from '@/components/hero/KpiStrip';
import { NarrativeHero, NarrativeHeroSkeleton } from '@/components/hero/NarrativeHero';
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
    <main className="flex h-[100svh] min-h-[100dvh] w-full flex-col bg-[#0b1120] text-slate-100">
      <div className="border-b border-white/5 bg-gradient-to-b from-[#0d1426] to-[#0b1120]">
        <Suspense fallback={<NarrativeHeroSkeleton />}>
          <NarrativeHero />
        </Suspense>
        <Suspense fallback={<KpiStripSkeleton />}>
          <KpiStrip />
        </Suspense>
      </div>
      <iframe
        src="/index.html"
        title="Cockpit Dashboard"
        className="min-h-0 w-full flex-1 border-0"
      />
    </main>
  );
}
