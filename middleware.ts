import { NextResponse, type NextRequest } from 'next/server';

const AUTH_REALM = 'Cockpit Private';

function isPrivateMode() {
  return String(process.env.COCKPIT_EXPOSURE_MODE || 'public').toLowerCase() === 'private';
}

function isBypassedPath(pathname: string) {
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/api/cron/')) return true;

  return [
    '/favicon.ico',
    '/favicon.svg',
    '/apple-touch-icon.png',
    '/apple-touch-icon.svg',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png',
    '/manifest.json',
    '/robots.txt',
    '/sw.js',
    '/og-image.png',
    '/og-image.svg',
  ].includes(pathname);
}

function unauthorized() {
  return new NextResponse('Cockpit Private', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${AUTH_REALM}", charset="UTF-8"`,
      'Cache-Control': 'no-store',
    },
  });
}

function authNotConfigured() {
  return new NextResponse('Cockpit private auth is not configured.', {
    status: 503,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function hasValidBasicAuth(request: NextRequest, expectedCredentials: string) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) return false;

  try {
    const credentials = atob(header.slice('Basic '.length).trim());
    return credentials === expectedCredentials;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  if (!isPrivateMode() || isBypassedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const expectedCredentials = (process.env.COCKPIT_PRIVATE_BASIC_AUTH || '').trim();
  if (!expectedCredentials) {
    return authNotConfigured();
  }

  if (!hasValidBasicAuth(request, expectedCredentials)) {
    return unauthorized();
  }

  const response = NextResponse.next();
  response.headers.set('X-Cockpit-Mode', 'private');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

