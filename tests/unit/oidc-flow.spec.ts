import { expect, test } from '@playwright/test';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { NextRequest } from 'next/server';

import { GET as callback } from '../../app/api/auth/callback/route';
import { GET as login } from '../../app/api/auth/login/route';
import { LOGIN_COOKIE, SESSION_COOKIE } from '../../lib/auth/config';
import { verifySession } from '../../lib/auth/session';

/**
 * Kompletter Login-Ablauf gegen einen simulierten Authelia-Provider (fetch gemockt):
 * Login → Authorization-URL mit PKCE → Callback → Token + UserInfo → Session-Cookie.
 */

const ISSUER = 'https://auth.example.test';
const SECRET = 'flow-secret-0123456789-abcdefghijklmnopqrstuvwxyz';
const ORIGIN = 'https://cockpit.rapold.io';

let groups: string[] = ['admins'];
let tokenRequests: Array<{ auth: string | null; body: URLSearchParams }> = [];
let lastNonce = '';
const realFetch = globalThis.fetch;

test.beforeAll(async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'test', alg: 'RS256', use: 'sig' };

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
    if (url === `${ISSUER}/.well-known/openid-configuration`) {
      return json({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/api/oidc/authorization`,
        token_endpoint: `${ISSUER}/api/oidc/token`,
        userinfo_endpoint: `${ISSUER}/api/oidc/userinfo`,
        jwks_uri: `${ISSUER}/jwks.json`,
      });
    }
    if (url === `${ISSUER}/jwks.json`) return json({ keys: [jwk] });
    if (url === `${ISSUER}/api/oidc/token`) {
      const headers = new Headers(init?.headers);
      tokenRequests.push({ auth: headers.get('authorization'), body: new URLSearchParams(String(init?.body)) });
      const idToken = await new SignJWT({ nonce: lastNonce })
        .setProtectedHeader({ alg: 'RS256', kid: 'test' })
        .setIssuer(ISSUER)
        .setAudience('cockpit')
        .setSubject('marcel-uuid')
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(privateKey);
      return json({ id_token: idToken, access_token: 'at', token_type: 'bearer' });
    }
    if (url === `${ISSUER}/api/oidc/userinfo`) {
      return json({ sub: 'marcel-uuid', name: 'Marcel Rapold', email: 'marcel@example.test', groups });
    }
    throw new Error(`Unerwarteter fetch: ${url}`);
  }) as typeof fetch;
});

test.afterAll(() => {
  globalThis.fetch = realFetch;
});

test.beforeEach(() => {
  process.env.OIDC_ISSUER = ISSUER;
  process.env.OIDC_CLIENT_ID = 'cockpit';
  process.env.OIDC_CLIENT_SECRET = 'client-secret';
  process.env.AUTH_SECRET = SECRET;
  delete process.env.AUTH_URL;
  delete process.env.OIDC_ALLOWED_GROUPS;
  groups = ['admins'];
  tokenRequests = [];
});

async function startLogin() {
  const response = await login(new NextRequest(`${ORIGIN}/api/auth/login?returnTo=/lunar`));
  expect(response.status).toBe(302);
  const authorize = new URL(response.headers.get('location') || '');
  const cookie = response.cookies.get(LOGIN_COOKIE)?.value || '';
  lastNonce = authorize.searchParams.get('nonce') || '';
  return { authorize, cookie };
}

function callbackRequest(query: string, cookie: string) {
  return new NextRequest(`${ORIGIN}/api/auth/callback?${query}`, {
    headers: { cookie: `${LOGIN_COOKIE}=${cookie}` },
  });
}

test('Login-URL enthält PKCE S256, Scopes und exakte Redirect-URI', async () => {
  const { authorize, cookie } = await startLogin();
  expect(authorize.origin + authorize.pathname).toBe(`${ISSUER}/api/oidc/authorization`);
  expect(authorize.searchParams.get('client_id')).toBe('cockpit');
  expect(authorize.searchParams.get('response_type')).toBe('code');
  expect(authorize.searchParams.get('scope')).toBe('openid profile email groups');
  expect(authorize.searchParams.get('redirect_uri')).toBe(`${ORIGIN}/api/auth/callback`);
  expect(authorize.searchParams.get('code_challenge_method')).toBe('S256');
  expect(authorize.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(cookie).not.toBe('');
});

test('Callback der Gruppe admins setzt Session und leitet zu returnTo', async () => {
  const { authorize, cookie } = await startLogin();
  const state = authorize.searchParams.get('state');
  const response = await callback(callbackRequest(`code=abc&state=${state}&iss=${encodeURIComponent(ISSUER)}`, cookie));

  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toBe(`${ORIGIN}/lunar`);
  const session = await verifySession(response.cookies.get(SESSION_COOKIE)?.value, SECRET);
  expect(session).toMatchObject({ sub: 'marcel-uuid', name: 'Marcel Rapold', groups: ['admins'] });

  expect(tokenRequests).toHaveLength(1);
  expect(tokenRequests[0].auth).toBe(`Basic ${btoa('cockpit:client-secret')}`);
  expect(tokenRequests[0].body.get('code_verifier')).toMatch(/^[A-Za-z0-9_-]{64}$/);
  expect(tokenRequests[0].body.get('redirect_uri')).toBe(`${ORIGIN}/api/auth/callback`);
});

test('Callback ohne Gruppe admins: 403, keine Session', async () => {
  groups = ['users'];
  const { authorize, cookie } = await startLogin();
  const response = await callback(callbackRequest(`code=abc&state=${authorize.searchParams.get('state')}`, cookie));
  expect(response.status).toBe(403);
  expect(response.cookies.get(SESSION_COOKIE)).toBeUndefined();
});

test('Callback mit falschem state wird abgelehnt', async () => {
  const { cookie } = await startLogin();
  const response = await callback(callbackRequest('code=abc&state=falsch', cookie));
  expect(response.status).toBe(400);
  expect(tokenRequests).toHaveLength(0);
});

test('Callback mit fremdem Issuer wird abgelehnt', async () => {
  const { authorize, cookie } = await startLogin();
  const state = authorize.searchParams.get('state');
  const response = await callback(callbackRequest(`code=abc&state=${state}&iss=https://evil.example`, cookie));
  expect(response.status).toBe(400);
});

test('AUTH_URL bestimmt die Redirect-URI', async () => {
  process.env.AUTH_URL = 'https://cockpit.rapold.io/';
  const response = await login(new NextRequest('https://preview-xyz.vercel.app/api/auth/login'));
  const authorize = new URL(response.headers.get('location') || '');
  expect(authorize.searchParams.get('redirect_uri')).toBe('https://cockpit.rapold.io/api/auth/callback');
});
