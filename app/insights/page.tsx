/**
 * /insights — Pure-SSR Read-Only-View ohne iframe und ohne Client-JS.
 *
 * Optimiert für:
 *  - Mobile-Reader (kein Chart-Overhead, schneller LCP)
 *  - SEO / Crawler (volltext-indexierbarer Long-Form-Content)
 *  - Shareable Permalinks (statisch prerendered, ISR alle 5min)
 *
 * Architektur:
 *  - NarrativeHero + KpiStrip = oben (gleiche Komponenten wie Root /)
 *  - ExtendedNarrative = LLM-Long-Form (extended/weekly/strategic)
 *  - RepoIndex = LLM-angereicherte Repo-Summaries als Listenview
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';

import { ExtendedNarrative } from '@/components/hero/ExtendedNarrative';
import { KpiStrip, KpiStripSkeleton } from '@/components/hero/KpiStrip';
import { NarrativeHero, NarrativeHeroSkeleton } from '@/components/hero/NarrativeHero';
import { RepoIndex } from '@/components/hero/RepoIndex';
import { readNarrative } from '@/lib/data/cache-reader';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const narrative = await readNarrative();
  const description =
    narrative?.teaser?.trim() ||
    'Engineering-Insights: Long-Form-Narrative und Repo-Index zu Marcel Rapolds Portfolio.';

  return {
    title: 'Cockpit Insights | Marcel Rapold',
    description,
    alternates: { canonical: 'https://cockpit.rapold.io/insights' },
    openGraph: {
      title: 'Cockpit Insights | Marcel Rapold',
      description,
      url: 'https://cockpit.rapold.io/insights',
      type: 'article',
      locale: 'de_CH',
      siteName: 'Cockpit',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Cockpit Insights — Engineering-Narrative & Repo-Index',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Cockpit Insights | Marcel Rapold',
      description,
      images: ['/og-image.png'],
    },
  };
}

export default function InsightsPage() {
  return (
    <main className="min-h-[100dvh] w-full bg-[#0b1120] text-slate-100">
      <div className="border-b border-white/5 bg-gradient-to-b from-[#0d1426] to-[#0b1120]">
        <div className="flex items-center justify-between px-4 pt-3 md:px-6">
          <Link
            href="/"
            className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400 hover:text-slate-200"
          >
            ← Dashboard
          </Link>
          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Insights</span>
        </div>
        <Suspense fallback={<NarrativeHeroSkeleton />}>
          <NarrativeHero hideInsightsLink />
        </Suspense>
        <Suspense fallback={<KpiStripSkeleton />}>
          <KpiStrip />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl px-4 py-10 text-slate-500 md:px-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 w-full animate-pulse rounded bg-white/5" />
              ))}
            </div>
          </div>
        }
      >
        <ExtendedNarrative />
      </Suspense>

      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-white/[0.03]" />
              ))}
            </div>
          </div>
        }
      >
        <RepoIndex />
      </Suspense>

      <footer className="mx-auto max-w-5xl px-4 py-12 text-center text-[11px] uppercase tracking-[0.2em] text-slate-600 md:px-6">
        <Link href="/" className="hover:text-slate-300">
          → Zurück zum Live-Dashboard
        </Link>
      </footer>
    </main>
  );
}
