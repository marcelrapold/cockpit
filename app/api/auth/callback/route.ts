import { NextResponse, type NextRequest } from 'next/server';

import {
  LOGIN_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  getOidcConfig,
  hasAllowedGroup,
  redirectUri,
  sanitizeReturnTo,
} from '@/lib/auth/config';
import { completeLogin } from '@/lib/auth/oidc';
import { authPage } from '@/lib/auth/responses';
import { signSession, verifyLoginState } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RETRY = [{ href: '/api/auth/login', label: 'Erneut anmelden' }];

function clearLoginCookie(response: NextResponse) {
  response.cookies.set(LOGIN_COOKIE, '', { path: '/api/auth', maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const config = getOidcConfig();
  if (!config) {
    return authPage(404, 'Login nicht aktiv', 'Der Login über auth.rapold.io ist für diese Umgebung nicht konfiguriert.');
  }

  const params = request.nextUrl.searchParams;
  const login = await verifyLoginState(request.cookies.get(LOGIN_COOKIE)?.value, config.authSecret);

  if (params.get('error')) {
    return clearLoginCookie(
      authPage(401, 'Anmeldung abgebrochen', `auth.rapold.io meldet: ${params.get('error_description') || params.get('error')}`, RETRY),
    );
  }

  const code = params.get('code');
  if (!login || !code || params.get('state') !== login.state) {
    return clearLoginCookie(authPage(400, 'Anmeldung abgelaufen', 'Der Login-Vorgang ist ungültig oder abgelaufen.', RETRY));
  }

  // RFC 9207: Authelia sendet den Issuer in der Antwort mit.
  const responseIssuer = params.get('iss');
  if (responseIssuer && responseIssuer.replace(/\/+$/, '') !== config.issuer) {
    return clearLoginCookie(authPage(400, 'Anmeldung abgelehnt', 'Die Antwort stammt nicht vom erwarteten Anmeldedienst.', RETRY));
  }

  const callback = redirectUri(config, request.nextUrl.origin);
  let user;
  try {
    user = await completeLogin(config, { code, redirectUri: callback, verifier: login.verifier, nonce: login.nonce });
  } catch (error) {
    console.error('[auth] Callback fehlgeschlagen:', error instanceof Error ? error.message : error);
    return clearLoginCookie(authPage(502, 'Anmeldung fehlgeschlagen', 'Die Antwort von auth.rapold.io konnte nicht bestätigt werden.', RETRY));
  }

  if (!hasAllowedGroup(user.groups, config.allowedGroups)) {
    console.warn('[auth] Zugriff verweigert: Benutzer ohne erlaubte Gruppe', user.sub);
    return clearLoginCookie(
      authPage(403, 'Kein Zugriff', 'Dieses Konto ist nicht für Cockpit freigeschaltet.', [
        { href: 'https://auth.rapold.io', label: 'Konto wechseln' },
      ]),
    );
  }

  const response = NextResponse.redirect(new URL(sanitizeReturnTo(login.returnTo), request.nextUrl.origin), 302);
  response.headers.set('Cache-Control', 'no-store');
  response.cookies.set(SESSION_COOKIE, await signSession(user, config.authSecret), {
    httpOnly: true,
    secure: callback.startsWith('https://'),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return clearLoginCookie(response);
}
