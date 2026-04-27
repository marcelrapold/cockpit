import { NextResponse } from 'next/server';
// Pure App Router route — no legacy adapter, so the bundler treats this as a
// canonical Next.js route. The legacy /api/_lib/cache.js is still imported as
// a CommonJS module via webpack interop, which is fine.
import cache from '@/api-legacy/_lib/cache.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
  };

  try {
    const cached = await cache.get(cache.KEYS.narrative);
    if (cached) {
      return NextResponse.json(cached, { headers });
    }
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, timestamp: new Date().toISOString() },
      { status: 200, headers },
    );
  }

  return NextResponse.json(
    {
      error: 'narrative not yet generated',
      hint: 'cron /api/cron/refresh-llm has not produced an artifact yet',
      timestamp: new Date().toISOString(),
    },
    { status: 503, headers },
  );
}
