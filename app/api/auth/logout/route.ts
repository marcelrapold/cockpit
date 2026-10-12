import { NextResponse } from 'next/server';

import { SESSION_COOKIE, getOidcConfig, ssoLogoutUrl } from '@/lib/auth/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Abmelden über das zentrale Kontomenü (<rapold-account>): löscht die Cockpit-Session und
 * leitet direkt zum Logout bei auth.rapold.io weiter, der die SSO-Sitzung beendet.
 */
function logout() {
  const response = NextResponse.redirect(ssoLogoutUrl(getOidcConfig()?.issuer), 302);
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export const GET = logout;
export const POST = logout;
