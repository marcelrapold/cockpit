import { adaptLegacy } from '@/lib/legacy-adapter';
import handler from '@/api/health-check.js';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 50;

export async function GET(request: NextRequest) {
  return adaptLegacy(handler as never, request);
}
