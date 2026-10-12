/**
 * Signierte Cookies (HS256-JWT mit AUTH_SECRET) für Session und Login-Zwischenstand.
 * Edge-kompatibel (jose, Web Crypto).
 */

import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

import { LOGIN_MAX_AGE_SECONDS, SESSION_MAX_AGE_SECONDS } from './config';

const SESSION_AUDIENCE = 'cockpit:session';
const LOGIN_AUDIENCE = 'cockpit:login';

export interface SessionClaims {
  sub: string;
  name?: string;
  email?: string;
  groups: string[];
}

export interface LoginState {
  state: string;
  nonce: string;
  verifier: string;
  returnTo: string;
}

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

async function sign(payload: JWTPayload, audience: string, maxAge: number, secret: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(key(secret));
}

async function verify(token: string | undefined, audience: string, secret: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: ['HS256'],
      audience,
    });
    return payload;
  } catch {
    return null;
  }
}

export function signSession(claims: SessionClaims, secret: string) {
  return sign({ ...claims }, SESSION_AUDIENCE, SESSION_MAX_AGE_SECONDS, secret);
}

export async function verifySession(token: string | undefined, secret: string): Promise<SessionClaims | null> {
  const payload = await verify(token, SESSION_AUDIENCE, secret);
  if (!payload || typeof payload.sub !== 'string' || !Array.isArray(payload.groups)) return null;
  return {
    sub: payload.sub,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    groups: payload.groups.filter((group): group is string => typeof group === 'string'),
  };
}

export function signLoginState(state: LoginState, secret: string) {
  return sign({ ...state }, LOGIN_AUDIENCE, LOGIN_MAX_AGE_SECONDS, secret);
}

export async function verifyLoginState(token: string | undefined, secret: string): Promise<LoginState | null> {
  const payload = await verify(token, LOGIN_AUDIENCE, secret);
  if (!payload) return null;
  const { state, nonce, verifier, returnTo } = payload;
  if (typeof state !== 'string' || typeof nonce !== 'string' || typeof verifier !== 'string') return null;
  return { state, nonce, verifier, returnTo: typeof returnTo === 'string' ? returnTo : '/' };
}
