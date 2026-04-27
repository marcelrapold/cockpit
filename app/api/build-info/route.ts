import { NextResponse } from 'next/server';

import { getBuildInfo } from '@/lib/data/build-info';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 49;

export async function GET() {
  return NextResponse.json(getBuildInfo(), {
    headers: {
      'Cache-Control': 'private, no-cache, max-age=0, must-revalidate',
    },
  });
}
