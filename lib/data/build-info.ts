/**
 * Server-only Build-Info-Reader.
 *
 * Liest Version (aus package.json) und Commit/Branch (aus VERCEL_GIT_*-Env-Vars).
 * Wird sowohl von /api/build-info als auch vom SSR-Hero verwendet — single
 * source of truth, deshalb hier ausgelagert.
 */

import 'server-only';
import { readFileSync } from 'fs';
import { join } from 'path';
import { cache as reactCache } from 'react';

export type BuildInfo = {
  version: string;
  commit: string;
  commitFull: string | null;
  branch: string;
  environment: string;
};

function readPackageVersion(): string {
  try {
    const raw = readFileSync(join(process.cwd(), 'package.json'), 'utf8');
    const p = JSON.parse(raw) as { version?: string };
    return typeof p.version === 'string' ? p.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export const getBuildInfo = reactCache((): BuildInfo => {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || '';
  const branch = process.env.VERCEL_GIT_COMMIT_REF || '';
  return {
    version: readPackageVersion(),
    commit: sha ? sha.slice(0, 7) : 'local',
    commitFull: sha || null,
    branch: branch || 'local',
    environment: process.env.VERCEL_ENV || 'development',
  };
});
