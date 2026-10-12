/**
 * OIDC-Konfiguration (Login mit auth.rapold.io).
 *
 * OIDC ist nur aktiv, wenn OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET und
 * AUTH_SECRET gesetzt sind. Fehlt eine davon, bleibt der bisherige Basic-Auth-Schutz
 * (COCKPIT_PRIVATE_BASIC_AUTH) unverändert aktiv.
 *
 * Läuft in Middleware (Edge) und Route Handlers (Node) – daher nur Web-APIs.
 */

export const SESSION_COOKIE = 'cockpit_session';
export const LOGIN_COOKIE = 'cockpit_oidc_login';
export const AUTH_ROUTE_PREFIX = '/api/auth/';
export const CALLBACK_PATH = '/api/auth/callback';
export const LOGIN_PATH = '/api/auth/login';
export const LOGOUT_PATH = '/api/auth/logout';

export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
export const LOGIN_MAX_AGE_SECONDS = 10 * 60;
export const OIDC_SCOPES = 'openid profile email groups';

/** AUTH_SECRET muss lang genug für HMAC-SHA256 sein. */
export const MIN_SECRET_LENGTH = 32;

export interface OidcConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  authSecret: string;
  allowedGroups: string[];
  /** Öffentliche Basis-URL (z. B. https://cockpit.rapold.io); leer = Origin des Requests. */
  baseUrl: string;
}

function env(name: string): string {
  return String(process.env[name] || '').trim();
}

export function getOidcConfig(): OidcConfig | null {
  const issuer = env('OIDC_ISSUER').replace(/\/+$/, '');
  const clientId = env('OIDC_CLIENT_ID');
  const clientSecret = env('OIDC_CLIENT_SECRET');
  const authSecret = env('AUTH_SECRET');

  if (!issuer || !clientId || !clientSecret || !authSecret) return null;
  if (authSecret.length < MIN_SECRET_LENGTH) return null;

  const allowedGroups = (env('OIDC_ALLOWED_GROUPS') || 'admins')
    .split(',')
    .map((group) => group.trim())
    .filter(Boolean);

  return {
    issuer,
    clientId,
    clientSecret,
    authSecret,
    allowedGroups,
    baseUrl: env('AUTH_URL').replace(/\/+$/, ''),
  };
}

export function isOidcEnabled(): boolean {
  return getOidcConfig() !== null;
}

export function redirectUri(config: OidcConfig, requestOrigin: string): string {
  return `${config.baseUrl || requestOrigin}${CALLBACK_PATH}`;
}

export function hasAllowedGroup(groups: unknown, allowed: string[]): boolean {
  if (!Array.isArray(groups)) return false;
  return groups.some((group) => typeof group === 'string' && allowed.includes(group));
}

/** Nur relative Pfade derselben Origin zulassen (kein Open Redirect). */
export function sanitizeReturnTo(value: string | null | undefined): string {
  const candidate = String(value || '').trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.startsWith('/\\')) return '/';
  if (candidate.startsWith(AUTH_ROUTE_PREFIX)) return '/';
  return candidate;
}
