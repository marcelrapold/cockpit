import { NextResponse, type NextRequest } from 'next/server';
import fetchRepoSummaries from '@/api-legacy/_lib/fetch-repo-summaries.js';
import fetchNarrative from '@/api-legacy/_lib/fetch-narrative.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// LLM batches plus GitHub fan-out can take a while when nothing is cached yet.
// 300s = Vercel Pro hard cap for non-fluid serverless.
export const maxDuration = 300;

type FetcherResult = {
  skipped?: boolean;
  reason?: string;
  payload?: { count?: number; listHash?: string; dataHash?: string };
};

export async function GET(request: NextRequest) {
  const secret = (process.env.CRON_SECRET || '').trim();
  const auth = request.headers.get('authorization') || '';
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get('force') === '1' || url.searchParams.get('force') === 'true';
  const start = Date.now();
  const summary: Array<Record<string, unknown>> = [];

  try {
    const r: FetcherResult = await (fetchRepoSummaries as unknown as (o: unknown) => Promise<FetcherResult>)({ force });
    summary.push({
      job: 'repos',
      status: 'fulfilled',
      skipped: r.skipped,
      reason: r.reason,
      count: r.payload?.count,
      hash: r.payload?.listHash,
    });
  } catch (err) {
    summary.push({ job: 'repos', status: 'rejected', error: (err as Error).message });
  }

  try {
    const n: FetcherResult = await (fetchNarrative as unknown as (o: unknown) => Promise<FetcherResult>)({ force });
    summary.push({
      job: 'narrative',
      status: 'fulfilled',
      skipped: n.skipped,
      reason: n.reason,
      hash: n.payload?.dataHash,
    });
  } catch (err) {
    summary.push({ job: 'narrative', status: 'rejected', error: (err as Error).message });
  }

  const fulfilled = summary.filter((s) => s.status === 'fulfilled').length;
  const skipped = summary.filter((s) => s.skipped).length;

  return NextResponse.json({
    refreshed: new Date().toISOString(),
    duration: `${Date.now() - start}ms`,
    ok: fulfilled === summary.length,
    skippedCount: skipped,
    summary,
  });
}
