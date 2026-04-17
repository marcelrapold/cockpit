import { adaptLegacy } from '@/lib/legacy-adapter';
import handler from '@/api/v1/languages.js';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return adaptLegacy(handler as never, request);
}

export async function OPTIONS(request: NextRequest) {
  return adaptLegacy(handler as never, request);
}
