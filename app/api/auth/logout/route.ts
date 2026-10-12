import { SESSION_COOKIE, getOidcConfig } from '@/lib/auth/config';
import { authPage } from '@/lib/auth/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Beendet nur die Cockpit-Session. Die Single-Sign-On-Sitzung bei auth.rapold.io bleibt
 * bestehen (Authelia bietet keinen RP-initiierten Logout an); sie lässt sich dort beenden.
 */
function logout() {
  const config = getOidcConfig();
  const issuer = config?.issuer || 'https://auth.rapold.io';
  const response = authPage(200, 'Abgemeldet', 'Die Cockpit-Sitzung ist beendet.', [
    { href: '/', label: 'Wieder anmelden' },
    { href: `${issuer}/logout`, label: 'Auch bei auth.rapold.io abmelden' },
  ]);
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}

export const GET = logout;
export const POST = logout;
