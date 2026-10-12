import { NextResponse, type NextRequest } from 'next/server';

import {
  AUTH_ROUTE_PREFIX,
  LOGIN_PATH,
  SESSION_COOKIE,
  getOidcConfig,
  hasAllowedGroup,
  type OidcConfig,
} from './lib/auth/config';
import { verifySession } from './lib/auth/session';

const AUTH_REALM = 'Cockpit Private';

function isPrivateMode() {
  return String(process.env.COCKPIT_EXPOSURE_MODE || 'public').toLowerCase() === 'private';
}

function isBypassedPath(pathname: string) {
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/api/cron/')) return true;
  if (pathname.startsWith('/brand/')) return true;

  return [
    '/favicon.ico',
    '/favicon.svg',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
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

function withPrivateHeaders(request: NextRequest, response: NextResponse) {
  response.headers.set('X-Cockpit-Mode', 'private');
  if (request.nextUrl.pathname !== '/api/summary') {
    response.headers.set('Cache-Control', 'private, no-store');
  }
  return response;
}

/** Bisheriger Schutz: HTTP Basic Auth (COCKPIT_PRIVATE_BASIC_AUTH). */
function basicAuthGate(request: NextRequest) {
  const expectedCredentials = (process.env.COCKPIT_PRIVATE_BASIC_AUTH || '').trim();
  if (!expectedCredentials) {
    return authNotConfigured();
  }

  if (!hasValidBasicAuth(request, expectedCredentials)) {
    return unauthorized();
  }

  return withPrivateHeaders(request, NextResponse.next());
}

function wantsHtml(request: NextRequest) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  if (request.nextUrl.pathname.startsWith('/api/')) return false;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html') || request.headers.get('sec-fetch-mode') === 'navigate';
}

/** Login mit auth.rapold.io: signiertes Session-Cookie, nur erlaubte Gruppen. */
async function oidcGate(request: NextRequest, config: OidcConfig) {
  if (request.nextUrl.pathname.startsWith(AUTH_ROUTE_PREFIX)) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value, config.authSecret);
  if (session && hasAllowedGroup(session.groups, config.allowedGroups)) {
    return withPrivateHeaders(request, NextResponse.next());
  }

  if (session) {
    return new NextResponse('Kein Zugriff auf Cockpit.', {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (wantsHtml(request)) {
    const login = new URL(LOGIN_PATH, request.nextUrl.origin);
    login.searchParams.set('returnTo', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    const response = NextResponse.redirect(login, 302);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  return NextResponse.json(
    { error: 'Unauthorized — Login über auth.rapold.io erforderlich' },
    { status: 401, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function middleware(request: NextRequest) {
  if (!isPrivateMode() || isBypassedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Weiche: OIDC nur, wenn OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET und AUTH_SECRET
  // gesetzt sind. Sonst bleibt Basic Auth unverändert aktiv.
  const oidc = getOidcConfig();
  if (oidc) {
    return oidcGate(request, oidc);
  }

  return basicAuthGate(request);
}
