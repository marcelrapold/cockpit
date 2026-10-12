import { expect, test } from '@playwright/test';
import { NextRequest } from 'next/server';

import { SESSION_COOKIE, sanitizeReturnTo } from '../../lib/auth/config';
import { signLoginState, signSession, verifyLoginState, verifySession } from '../../lib/auth/session';
import { middleware } from '../../middleware';

const SECRET = 'test-secret-0123456789-abcdefghijklmnopqrstuvwxyz';
const BASIC = 'marcel:geheim';
const ENV_KEYS = [
  'COCKPIT_EXPOSURE_MODE',
  'COCKPIT_PRIVATE_BASIC_AUTH',
  'OIDC_ISSUER',
  'OIDC_CLIENT_ID',
  'OIDC_CLIENT_SECRET',
  'OIDC_ALLOWED_GROUPS',
  'AUTH_SECRET',
  'AUTH_URL',
];

const saved: Record<string, string | undefined> = {};

test.beforeEach(() => {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  process.env.COCKPIT_EXPOSURE_MODE = 'private';
  process.env.COCKPIT_PRIVATE_BASIC_AUTH = BASIC;
});

test.afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function enableOidc() {
  process.env.OIDC_ISSUER = 'https://auth.rapold.io';
  process.env.OIDC_CLIENT_ID = 'cockpit';
  process.env.OIDC_CLIENT_SECRET = 'client-secret';
  process.env.AUTH_SECRET = SECRET;
}

function request(path: string, init: { headers?: Record<string, string>; cookie?: string } = {}) {
  const headers = new Headers(init.headers);
  if (init.cookie) headers.set('cookie', init.cookie);
  return new NextRequest(new URL(path, 'https://cockpit.rapold.io'), { headers });
}

const html = { accept: 'text/html,application/xhtml+xml' };
const basicHeader = { authorization: `Basic ${btoa(BASIC)}` };
const passedThrough = (response: Response) => response.headers.get('x-middleware-next') === '1';

test.describe('Basic Auth (OIDC nicht konfiguriert)', () => {
  test('ohne Zugangsdaten: 401 mit WWW-Authenticate Basic', async () => {
    const response = await middleware(request('/', { headers: html }));
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toMatch(/^Basic realm="Cockpit Private"/);
  });

  test('mit gültigen Zugangsdaten: durchgelassen', async () => {
    const response = await middleware(request('/', { headers: basicHeader }));
    expect(passedThrough(response)).toBe(true);
    expect(response.headers.get('x-cockpit-mode')).toBe('private');
  });

  test('unvollständige OIDC-Variablen lassen Basic Auth aktiv', async () => {
    enableOidc();
    delete process.env.OIDC_CLIENT_SECRET;
    const response = await middleware(request('/', { headers: html }));
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toMatch(/^Basic /);
  });

  test('zu kurzes AUTH_SECRET lässt Basic Auth aktiv', async () => {
    enableOidc();
    process.env.AUTH_SECRET = 'kurz';
    const response = await middleware(request('/', { headers: html }));
    expect(response.headers.get('www-authenticate')).toMatch(/^Basic /);
  });

  test('ohne COCKPIT_PRIVATE_BASIC_AUTH: 503', async () => {
    delete process.env.COCKPIT_PRIVATE_BASIC_AUTH;
    const response = await middleware(request('/'));
    expect(response.status).toBe(503);
  });

  test('öffentlicher Modus: kein Schutz', async () => {
    process.env.COCKPIT_EXPOSURE_MODE = 'public';
    expect(passedThrough(await middleware(request('/')))).toBe(true);
  });

  test('Favicon und Manifest bleiben frei', async () => {
    for (const path of ['/favicon.svg', '/favicon.ico', '/manifest.json', '/apple-touch-icon.png']) {
      expect(passedThrough(await middleware(request(path))), path).toBe(true);
    }
  });
});

test.describe('OIDC (auth.rapold.io konfiguriert)', () => {
  test.beforeEach(() => enableOidc());

  test('Seitenaufruf ohne Session: Weiterleitung zum Login mit returnTo', async () => {
    const response = await middleware(request('/insights?x=1', { headers: html }));
    expect(response.status).toBe(302);
    const location = new URL(response.headers.get('location') || '');
    expect(location.pathname).toBe('/api/auth/login');
    expect(location.searchParams.get('returnTo')).toBe('/insights?x=1');
    expect(response.headers.get('www-authenticate')).toBeNull();
  });

  test('API-Aufruf ohne Session: 401 JSON ohne Basic-Challenge', async () => {
    const response = await middleware(request('/api/summary'));
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toBeNull();
  });

  test('Basic Auth wird nicht mehr akzeptiert', async () => {
    const response = await middleware(request('/', { headers: { ...html, ...basicHeader } }));
    expect(response.status).toBe(302);
  });

  test('gültige Session der Gruppe admins: durchgelassen', async () => {
    const token = await signSession({ sub: 'marcel', groups: ['admins'] }, SECRET);
    const response = await middleware(request('/', { headers: html, cookie: `${SESSION_COOKIE}=${token}` }));
    expect(passedThrough(response)).toBe(true);
    expect(response.headers.get('x-cockpit-mode')).toBe('private');
  });

  test('Session ohne admins: 403', async () => {
    const token = await signSession({ sub: 'gast', groups: ['users'] }, SECRET);
    const response = await middleware(request('/', { headers: html, cookie: `${SESSION_COOKIE}=${token}` }));
    expect(response.status).toBe(403);
  });

  test('Session mit fremdem Schlüssel: Login', async () => {
    const token = await signSession({ sub: 'marcel', groups: ['admins'] }, `${SECRET}-anders`);
    const response = await middleware(request('/', { headers: html, cookie: `${SESSION_COOKIE}=${token}` }));
    expect(response.status).toBe(302);
  });

  test('OIDC_ALLOWED_GROUPS überschreibt die Gruppe', async () => {
    process.env.OIDC_ALLOWED_GROUPS = 'ops, admins-cockpit';
    const admins = await signSession({ sub: 'marcel', groups: ['admins'] }, SECRET);
    expect((await middleware(request('/', { cookie: `${SESSION_COOKIE}=${admins}` }))).status).toBe(403);
    const ops = await signSession({ sub: 'marcel', groups: ['ops'] }, SECRET);
    expect(passedThrough(await middleware(request('/', { cookie: `${SESSION_COOKIE}=${ops}` })))).toBe(true);
  });

  test('Auth-Routen und Cron bleiben erreichbar', async () => {
    for (const path of ['/api/auth/login', '/api/auth/callback?code=x', '/api/auth/logout', '/api/cron/refresh']) {
      expect(passedThrough(await middleware(request(path))), path).toBe(true);
    }
  });
});

test.describe('Hilfsfunktionen', () => {
  test('sanitizeReturnTo verhindert offene Weiterleitungen', () => {
    expect(sanitizeReturnTo('/lunar?window=2')).toBe('/lunar?window=2');
    expect(sanitizeReturnTo('https://evil.example')).toBe('/');
    expect(sanitizeReturnTo('//evil.example')).toBe('/');
    expect(sanitizeReturnTo('/\\evil.example')).toBe('/');
    expect(sanitizeReturnTo('/api/auth/login')).toBe('/');
    expect(sanitizeReturnTo(null)).toBe('/');
  });

  test('Session- und Login-Token sind nicht austauschbar', async () => {
    const login = await signLoginState({ state: 's', nonce: 'n', verifier: 'v', returnTo: '/' }, SECRET);
    expect(await verifyLoginState(login, SECRET)).toEqual({ state: 's', nonce: 'n', verifier: 'v', returnTo: '/' });
    expect(await verifySession(login, SECRET)).toBeNull();
    const session = await signSession({ sub: 'marcel', groups: ['admins'] }, SECRET);
    expect(await verifyLoginState(session, SECRET)).toBeNull();
  });
});
