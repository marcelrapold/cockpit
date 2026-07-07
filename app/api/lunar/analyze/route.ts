import { NextResponse, type NextRequest } from 'next/server';

import { buildLunarAnalysis } from '@/lib/lunar/analyze';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());

  try {
    const analysis = await buildLunarAnalysis(params);
    return NextResponse.json(analysis, {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message,
        hint:
          'Set GITHUB_TOKEN or LUNAR_GITHUB_TOKEN in .env.local with access to private and organization repositories.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
