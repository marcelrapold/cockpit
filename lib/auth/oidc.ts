/**
 * Schlanker OIDC-Client (Authorization Code + PKCE S256) für auth.rapold.io (Authelia).
 * Wird nur in Route Handlers unter /api/auth/* verwendet.
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

import { OIDC_SCOPES, type OidcConfig } from './config';

interface Discovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri: string;
}

const discoveryCache = new Map<string, Promise<Discovery>>();
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export function discover(issuer: string): Promise<Discovery> {
  let pending = discoveryCache.get(issuer);
  if (!pending) {
    pending = fetch(`${issuer}/.well-known/openid-configuration`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`OIDC-Discovery fehlgeschlagen (${response.status})`);
        const doc = (await response.json()) as Discovery;
        if (doc.issuer !== issuer) throw new Error('OIDC-Discovery: issuer stimmt nicht überein');
        return doc;
      })
      .catch((error) => {
        discoveryCache.delete(issuer);
        throw error;
      });
    discoveryCache.set(issuer, pending);
  }
  return pending;
}

function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function randomToken(byteLength = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

export async function authorizationUrl(
  config: OidcConfig,
  params: { redirectUri: string; state: string; nonce: string; verifier: string },
): Promise<string> {
  const discovery = await discover(config.issuer);
  const url = new URL(discovery.authorization_endpoint);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: params.redirectUri,
    scope: OIDC_SCOPES,
    state: params.state,
    nonce: params.nonce,
    code_challenge: await pkceChallenge(params.verifier),
    code_challenge_method: 'S256',
  }).toString();
  return url.toString();
}

export interface OidcUser {
  sub: string;
  name?: string;
  email?: string;
  groups: string[];
}

function stringClaim(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function groupsClaim(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((group): group is string => typeof group === 'string') : [];
}

/**
 * Tauscht den Code ein (client_secret_basic), prüft das ID-Token (Signatur via JWKS,
 * iss, aud, exp, nonce) und liest Profil und Gruppen aus dem UserInfo-Endpoint.
 */
export async function completeLogin(
  config: OidcConfig,
  params: { code: string; redirectUri: string; verifier: string; nonce: string },
): Promise<OidcUser> {
  const discovery = await discover(config.issuer);

  const basic = btoa(`${encodeURIComponent(config.clientId)}:${encodeURIComponent(config.clientSecret)}`);
  const tokenResponse = await fetch(discovery.token_endpoint, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri,
      code_verifier: params.verifier,
    }),
  });
  if (!tokenResponse.ok) throw new Error(`Token-Endpoint antwortete mit ${tokenResponse.status}`);
  const tokens = (await tokenResponse.json()) as { id_token?: string; access_token?: string };
  if (!tokens.id_token || !tokens.access_token) throw new Error('Token-Antwort ohne id_token/access_token');

  let jwks = jwksCache.get(discovery.jwks_uri);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(discovery.jwks_uri));
    jwksCache.set(discovery.jwks_uri, jwks);
  }
  const { payload: idToken } = await jwtVerify(tokens.id_token, jwks, {
    issuer: config.issuer,
    audience: config.clientId,
  });
  if (idToken.nonce !== params.nonce) throw new Error('ID-Token: nonce stimmt nicht überein');
  if (typeof idToken.sub !== 'string' || !idToken.sub) throw new Error('ID-Token ohne sub');

  let userinfo: Record<string, unknown> = {};
  if (discovery.userinfo_endpoint) {
    const userinfoResponse = await fetch(discovery.userinfo_endpoint, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: 'application/json' },
    });
    if (!userinfoResponse.ok) throw new Error(`UserInfo antwortete mit ${userinfoResponse.status}`);
    userinfo = (await userinfoResponse.json()) as Record<string, unknown>;
    if (userinfo.sub !== idToken.sub) throw new Error('UserInfo: sub stimmt nicht überein');
  }

  const groups = groupsClaim(userinfo.groups).length ? groupsClaim(userinfo.groups) : groupsClaim(idToken.groups);
  return {
    sub: idToken.sub,
    name: stringClaim(userinfo.name) ?? stringClaim(idToken.name) ?? stringClaim(userinfo.preferred_username),
    email: stringClaim(userinfo.email) ?? stringClaim(idToken.email),
    groups,
  };
}
