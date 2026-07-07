import { NextResponse, type NextRequest } from 'next/server';

import {
  buildLunarAnalysis,
  isDegradedGitHubAnalysis,
} from '@/lib/lunar/analyze';
import type { LunarAnalysis } from '@/lib/lunar/types';
import { publicOrigin } from '@/lib/security/exposure';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function responseHeaders() {
  return {
    'Cache-Control': 's-maxage=300, stale-while-revalidate=1800',
    'Access-Control-Allow-Origin': publicOrigin(),
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

function round(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function directionFor(value: number | null | undefined) {
  if (value == null || Number.isNaN(value) || Math.abs(value) < 0.05) return 'none' as const;
  return value > 0 ? ('higher' as const) : ('lower' as const);
}

function pValueFor(analysis: LunarAnalysis) {
  return analysis.metrics.activeWindow.bootstrap.pValue ?? 1;
}

function buildVerdict(analysis: LunarAnalysis) {
  const pct = round(analysis.summary.fullMoonVelocityPct, 0);
  const evidence = analysis.summary.evidenceLevel;
  const pValue = pValueFor(analysis);
  const direction = directionFor(analysis.summary.fullMoonVelocityPct);

  if (pct == null || direction === 'none') {
    return `${analysis.params.user} shows no clear full-moon velocity lift (p=${pValue.toFixed(3)}, ${evidence} evidence).`;
  }

  const magnitude = `${Math.abs(pct)}%`;
  const qualifier = direction === 'higher' ? 'more' : 'less';
  return `${analysis.params.user} ships ${magnitude} ${qualifier} around the full moon (p=${pValue.toFixed(3)}, ${evidence} evidence).`;
}

function detailUrlFor(request: NextRequest, analysis: LunarAnalysis) {
  const detailUrl = new URL('/lunar', request.url);
  detailUrl.searchParams.set('start', analysis.params.startDate);
  detailUrl.searchParams.set('end', analysis.params.endDate);
  detailUrl.searchParams.set('window', String(analysis.params.fullMoonWindowDays));
  return detailUrl.toString();
}

function toSummaryContract(request: NextRequest, analysis: LunarAnalysis) {
  return {
    generatedAt: analysis.meta.generatedAt,
    username: analysis.params.user,
    periodStart: analysis.params.startDate,
    periodEnd: analysis.params.endDate,
    fullMoonWindowDays: analysis.params.fullMoonWindowDays,
    velocityPctDiff: round(analysis.summary.fullMoonVelocityPct, 1),
    evidence: analysis.summary.evidenceLevel,
    direction: directionFor(analysis.summary.fullMoonVelocityPct),
    pValue: pValueFor(analysis),
    mostAffectedRepo: analysis.summary.mostAffectedRepo,
    topDaysInFullMoonShare: round(analysis.summary.topOutputShareInFullMoonWindow * 100, 0) ?? 0,
    verdict: buildVerdict(analysis),
    detailUrl: detailUrlFor(request, analysis),
  };
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: responseHeaders(),
  });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());

  try {
    const analysis = await buildLunarAnalysis(params);

    if (isDegradedGitHubAnalysis(analysis)) {
      return NextResponse.json(
        {
          error:
            'Lunar summary unavailable: GitHub rate limit was exhausted before any repositories were scanned.',
          generatedAt: analysis.meta.generatedAt,
          rateLimitReset: analysis.meta.rateLimitReset,
          warnings: analysis.meta.warnings,
        },
        {
          status: 503,
          headers: {
            ...responseHeaders(),
            'Cache-Control': 'no-store',
          },
        },
      );
    }

    return NextResponse.json(toSummaryContract(request, analysis), {
      headers: responseHeaders(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message,
        hint:
          'Set GITHUB_TOKEN or LUNAR_GITHUB_TOKEN with access to the target private and organization repositories.',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          ...responseHeaders(),
          'Cache-Control': 'no-store',
        },
      },
    );
  }
}
