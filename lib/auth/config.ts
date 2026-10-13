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

type OidcEnvName =
  | 'OIDC_ISSUER'
  | 'OIDC_CLIENT_ID'
  | 'OIDC_CLIENT_SECRET'
  | 'AUTH_SECRET'
  | 'OIDC_ALLOWED_GROUPS'
  | 'AUTH_URL';

/**
 * Jede Variable statisch lesen: In der Edge-Middleware ersetzt Next.js nur
 * `process.env.NAME`-Ausdrücke; ein Zugriff mit berechnetem Schlüssel bleibt dort
 * leer, und OIDC wäre in Produktion nie aktiv (gemessen 14.10.2026: alle vier
 * Variablen gesetzt, cockpit.rapold.io antwortete trotzdem mit Basic Auth).
 */
function readEnv(name: OidcEnvName): string | undefined {
  switch (name) {
    case 'OIDC_ISSUER':
      return process.env.OIDC_ISSUER;
    case 'OIDC_CLIENT_ID':
      return process.env.OIDC_CLIENT_ID;
    case 'OIDC_CLIENT_SECRET':
      return process.env.OIDC_CLIENT_SECRET;
    case 'AUTH_SECRET':
      return process.env.AUTH_SECRET;
    case 'OIDC_ALLOWED_GROUPS':
      return process.env.OIDC_ALLOWED_GROUPS;
    case 'AUTH_URL':
      return process.env.AUTH_URL;
  }
}

function env(name: OidcEnvName): string {
  return String(readEnv(name) || '').trim();
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

const DEFAULT_ISSUER = 'https://auth.rapold.io';
const SSO_LOGOUT_RETURN = 'https://auth.rapold.io/';

/** Logout bei auth.rapold.io (beendet die SSO-Sitzung), danach zurück auf dessen Startseite. */
export function ssoLogoutUrl(issuer: string | null | undefined): string {
  const base = String(issuer || DEFAULT_ISSUER).replace(/\/+$/, '');
  return `${base}/logout?rd=${encodeURIComponent(SSO_LOGOUT_RETURN)}`;
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
