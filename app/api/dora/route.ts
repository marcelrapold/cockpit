import { unstable_noStore } from 'next/cache';
import { adaptLegacy } from '@/lib/legacy-adapter';
import handler from '@/api/legacy-dora-route.js';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Isolate serverless bundle (Vercel Fluid grouped routes incorrectly without this). */
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  unstable_noStore();
  return adaptLegacy(handler as never, request);
}
