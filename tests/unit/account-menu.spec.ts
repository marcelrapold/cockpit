import { expect, test } from '@playwright/test';

import { GET as logoutGet, POST as logoutPost } from '../../app/api/auth/logout/route';
import { isAccountMenuEnabled } from '../../lib/auth/account-menu';
import { SESSION_COOKIE, ssoLogoutUrl } from '../../lib/auth/config';

/** Kontomenü <rapold-account> und Abmelden über auth.rapold.io. */

const SECRET = 'menu-secret-0123456789-abcdefghijklmnopqrstuvwxyz';
const ENV_KEYS = ['COCKPIT_EXPOSURE_MODE', 'OIDC_ISSUER', 'OIDC_CLIENT_ID', 'OIDC_CLIENT_SECRET', 'AUTH_SECRET'];
const saved: Record<string, string | undefined> = {};

test.beforeEach(() => {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

test.afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function enableOidc(issuer = 'https://auth.rapold.io') {
  process.env.OIDC_ISSUER = issuer;
  process.env.OIDC_CLIENT_ID = 'cockpit';
  process.env.OIDC_CLIENT_SECRET = 'client-secret';
  process.env.AUTH_SECRET = SECRET;
}

test('Kontomenü nur im privaten Modus mit OIDC', () => {
  expect(isAccountMenuEnabled()).toBe(false);
  process.env.COCKPIT_EXPOSURE_MODE = 'private';
  expect(isAccountMenuEnabled(), 'Basic Auth').toBe(false);
  enableOidc();
  expect(isAccountMenuEnabled()).toBe(true);
  process.env.COCKPIT_EXPOSURE_MODE = 'public';
  expect(isAccountMenuEnabled(), 'öffentlicher Modus').toBe(false);
});

test('ssoLogoutUrl führt zum Logout bei auth.rapold.io', () => {
  const expected = 'https://auth.rapold.io/logout?rd=https%3A%2F%2Fauth.rapold.io%2F';
  expect(ssoLogoutUrl('https://auth.rapold.io')).toBe(expected);
  expect(ssoLogoutUrl('https://auth.rapold.io/')).toBe(expected);
  expect(ssoLogoutUrl(null)).toBe(expected);
});

test('Logout löscht die Session und leitet direkt weiter (GET und POST)', async () => {
  enableOidc('https://auth.example.test');
  for (const handler of [logoutGet, logoutPost]) {
    const response = handler();
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://auth.example.test/logout?rd=https%3A%2F%2Fauth.rapold.io%2F');
    expect(response.headers.get('cache-control')).toBe('no-store');
    const cookie = response.cookies.get(SESSION_COOKIE);
    expect(cookie?.value).toBe('');
    expect(cookie?.maxAge).toBe(0);
  }
});
