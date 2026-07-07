import { NextResponse, type NextRequest } from 'next/server';

import { buildLunarAnalysis } from '@/lib/lunar/analyze';
import { lunarDailyCsv } from '@/lib/lunar/export';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const format = url.searchParams.get('format') || 'json';

  try {
    const analysis = await buildLunarAnalysis(params);
    const suffix = `${analysis.params.user}-${analysis.params.startDate}-${analysis.params.endDate}`;

    if (format === 'csv') {
      return new Response(lunarDailyCsv(analysis), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="lunar-velocity-${suffix}.csv"`,
          'Cache-Control': 'private, no-store',
        },
      });
    }

    return NextResponse.json(analysis, {
      headers: {
        'Content-Disposition': `attachment; filename="lunar-velocity-${suffix}.json"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message,
        hint:
          'Set GITHUB_TOKEN or LUNAR_GITHUB_TOKEN with access to the target repositories.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
