import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Diagnostic: if this returns JSON with zDoraProbe but /api/dora does not, something targets /api/dora only. */
export async function GET() {
  unstable_noStore();
  return NextResponse.json(
    { zDoraProbe: true, t: new Date().toISOString() },
    {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Cockpit-Probe': 'z-dora',
      },
    },
  );
}
