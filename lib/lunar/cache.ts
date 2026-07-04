import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import legacyCache from '@/api-legacy/_lib/cache.js';

import { LUNAR_CACHE_TTL_MS, LUNAR_CACHE_VERSION } from './config';

const cacheDir = process.env.LUNAR_CACHE_DIR || path.join(process.cwd(), '.lunar-cache');
const redisPrefix = 'cache:lunar:';
const redisTtlSeconds = Math.max(60, Math.floor(LUNAR_CACHE_TTL_MS / 1000));

const redis = legacyCache as {
  get: (key: string) => Promise<unknown | null>;
  setWithTtl: (key: string, data: unknown, ttlSeconds: number) => Promise<unknown>;
};

export function lunarCacheKey(input: unknown): string {
  return createHash('sha256')
    .update(`${LUNAR_CACHE_VERSION}:${JSON.stringify(input)}`)
    .digest('hex')
    .slice(0, 32);
}

export async function readLunarCache<T>(key: string, ttlMs = LUNAR_CACHE_TTL_MS): Promise<T | null> {
  try {
    const cached = await redis.get(`${redisPrefix}${key}`);
    if (cached) return cached as T;
  } catch {
    // Redis is optional for local development; fall back to filesystem cache.
  }

  try {
    const raw = await readFile(path.join(cacheDir, `${key}.json`), 'utf8');
    const parsed = JSON.parse(raw) as { createdAt: number; payload: T };
    if (Date.now() - parsed.createdAt > ttlMs) return null;
    return parsed.payload;
  } catch {
    return null;
  }
}

export async function writeLunarCache<T>(key: string, payload: T): Promise<void> {
  try {
    await redis.setWithTtl(`${redisPrefix}${key}`, payload, redisTtlSeconds);
  } catch {
    // Cache failures must not block the analysis.
  }

  try {
    await mkdir(cacheDir, { recursive: true });
    await writeFile(
      path.join(cacheDir, `${key}.json`),
      JSON.stringify({ createdAt: Date.now(), payload }),
      'utf8',
    );
  } catch {
    // Cache failures must not block the analysis.
  }
}
