import { KpiStripSkeleton } from '@/components/hero/KpiStrip';
import { NarrativeHeroSkeleton } from '@/components/hero/NarrativeHero';

export default function Loading() {
  return (
    <main className="flex h-[100svh] min-h-[100dvh] w-full flex-col bg-[#0b1120] text-slate-100">
      <div className="border-b border-white/5 bg-gradient-to-b from-[#0d1426] to-[#0b1120]">
        <NarrativeHeroSkeleton />
        <KpiStripSkeleton />
      </div>
      <div className="min-h-0 w-full flex-1 animate-pulse bg-white/[0.02]" />
    </main>
  );
}
