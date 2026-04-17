import { adaptLegacy } from '@/lib/legacy-adapter';
import handler from '@/api/github-stats.js';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 55;

export async function GET(request: NextRequest) {
  return adaptLegacy(handler as never, request);
}
