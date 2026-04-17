import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 49;

function readPackageVersion(): string {
  try {
    const raw = readFileSync(join(process.cwd(), 'package.json'), 'utf8');
    const p = JSON.parse(raw) as { version?: string };
    return typeof p.version === 'string' ? p.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export async function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || '';
  const branch = process.env.VERCEL_GIT_COMMIT_REF || '';

  return NextResponse.json(
    {
      version: readPackageVersion(),
      commit: sha ? sha.slice(0, 7) : 'local',
      commitFull: sha || null,
      branch: branch || 'local',
      environment: process.env.VERCEL_ENV || 'development',
    },
    {
      headers: {
        'Cache-Control': 'private, no-cache, max-age=0, must-revalidate',
      },
    },
  );
}
