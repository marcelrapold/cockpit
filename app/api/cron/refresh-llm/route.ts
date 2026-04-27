import { adaptLegacy } from '@/lib/legacy-adapter';
import handler from '@/api/cron/refresh-llm.js';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// LLM batches plus GitHub fan-out can take a while when nothing is cached yet.
// 300s = Vercel Pro hard cap for non-fluid serverless. Fluid Compute can go higher.
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  return adaptLegacy(handler as never, request);
}
