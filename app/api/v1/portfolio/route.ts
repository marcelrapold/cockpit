import { runLegacyApi } from '@/lib/run-legacy-api';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return runLegacyApi('v1/portfolio.js', request);
}
