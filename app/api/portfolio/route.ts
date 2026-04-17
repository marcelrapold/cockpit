import { adaptLegacy } from '@/lib/legacy-adapter';
import handler from '@/api/portfolio.js';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return adaptLegacy(handler as never, request);
}
