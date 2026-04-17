import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Temporary: prove whether this route is hit on production (remove after verification). */
export async function GET() {
  return NextResponse.json({
    _cockpitRouteProbe: true,
    commit: 'probe-dora-route',
  });
}
