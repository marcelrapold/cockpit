import { NextResponse, type NextRequest } from 'next/server';

import {
  LOGIN_COOKIE,
  LOGIN_MAX_AGE_SECONDS,
  getOidcConfig,
  redirectUri,
  sanitizeReturnTo,
} from '@/lib/auth/config';
import { authorizationUrl, randomToken } from '@/lib/auth/oidc';
import { authPage } from '@/lib/auth/responses';
import { signLoginState } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const config = getOidcConfig();
  if (!config) {
    return authPage(404, 'Login nicht aktiv', 'Der Login über auth.rapold.io ist für diese Umgebung nicht konfiguriert.');
  }

  const callback = redirectUri(config, request.nextUrl.origin);
  const state = randomToken();
  const nonce = randomToken();
  const verifier = randomToken(48);
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get('returnTo'));

  let target: string;
  try {
    target = await authorizationUrl(config, { redirectUri: callback, state, nonce, verifier });
  } catch (error) {
    console.error('[auth] Login-Start fehlgeschlagen:', error instanceof Error ? error.message : error);
    return authPage(502, 'Anmeldedienst nicht erreichbar', 'auth.rapold.io antwortet gerade nicht. Bitte später erneut versuchen.', [
      { href: '/api/auth/login', label: 'Erneut versuchen' },
    ]);
  }

  const response = NextResponse.redirect(target, 302);
  response.headers.set('Cache-Control', 'no-store');
  response.cookies.set(LOGIN_COOKIE, await signLoginState({ state, nonce, verifier, returnTo }, config.authSecret), {
    httpOnly: true,
    secure: callback.startsWith('https://'),
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: LOGIN_MAX_AGE_SECONDS,
  });
  return response;
}
