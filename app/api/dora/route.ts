import { adaptLegacy } from '@/lib/legacy-adapter';
import handler from '@/api/legacy-dora-route.js';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const res = await adaptLegacy(handler as never, request);
  const headers = new Headers(res.headers);
  headers.set('X-Cockpit-Handler', 'legacy-dora-route');
  return new Response(res.body, { status: res.status, headers });
}
