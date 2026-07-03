import { NextResponse } from 'next/server';
import cache from '@/api-legacy/_lib/cache.js';
import { publicOrigin, sanitizeRepos } from '@/lib/security/exposure';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const headers = {
    'Access-Control-Allow-Origin': publicOrigin(),
    Vary: 'Origin',
    'Cache-Control': 's-maxage=600, stale-while-revalidate=1800',
  };

  try {
    const cached = await cache.get(cache.KEYS.repos);
    if (cached) {
      return NextResponse.json(sanitizeRepos(cached), { headers });
    }
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, timestamp: new Date().toISOString() },
      { status: 200, headers },
    );
  }

  return NextResponse.json(
    {
      error: 'repo summaries not yet generated',
      hint: 'cron /api/cron/refresh-llm has not produced an artifact yet',
      timestamp: new Date().toISOString(),
    },
    { status: 503, headers },
  );
}
