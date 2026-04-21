#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const APPLY = String(process.env.APPLY || '').toLowerCase() === 'true';
const GH_MAX_DESCRIPTION = 350;

if (!TOKEN) { console.error('GITHUB_TOKEN required'); process.exit(1); }

async function ghJson(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'cockpit-sync-descriptions',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status} ${method} ${url}`);
  return res.json();
}

function truncate(s, max) {
  if (!s) return s;
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

async function main() {
  const reposFile = JSON.parse(readFileSync('public/data-repos.json', 'utf8'));
  const entries = Object.entries(reposFile.repos || {});
  console.log(`[sync-desc] loaded ${entries.length} repo summaries (${APPLY ? 'APPLY' : 'DRY-RUN'})`);

  const changes = [];
  let updates = 0, sets = 0, skips = 0, misses = 0;

  for (const [full, s] of entries) {
    const proposed = truncate(s.oneLiner, GH_MAX_DESCRIPTION);
    if (!proposed) { skips++; continue; }

    let current;
    try {
      const repo = await ghJson('GET', `https://api.github.com/repos/${full}`);
      if (!repo) { misses++; continue; }
      if (repo.archived || repo.fork) {
        changes.push({ repo: full, current: repo.description, proposed, action: 'skip', reason: repo.archived ? 'archived' : 'fork' });
        skips++;
        continue;
      }
      current = repo.description || '';
    } catch (err) {
      changes.push({ repo: full, current: null, proposed, action: 'error', error: err.message });
      misses++;
      continue;
    }

    if (current === proposed) {
      changes.push({ repo: full, current, proposed, action: 'skip', reason: 'unchanged' });
      skips++;
      continue;
    }

    const action = current ? 'update' : 'set';
    if (action === 'update') updates++; else sets++;
    changes.push({ repo: full, current, proposed, action });
  }

  console.log(`[sync-desc] diff computed — ${updates} updates, ${sets} sets, ${skips} skips, ${misses} misses`);

  const toApply = changes.filter(c => c.action === 'update' || c.action === 'set');
  const applied = [];

  if (APPLY) {
    console.log(`[sync-desc] applying ${toApply.length} changes to GitHub...`);
    for (const c of toApply) {
      try {
        await ghJson('PATCH', `https://api.github.com/repos/${c.repo}`, { description: c.proposed });
        applied.push({ repo: c.repo, ok: true });
        console.log(`  ✓ ${c.repo}`);
      } catch (err) {
        applied.push({ repo: c.repo, ok: false, error: err.message });
        console.error(`  ✗ ${c.repo}: ${err.message}`);
      }
    }
    const okCount = applied.filter(a => a.ok).length;
    console.log(`[sync-desc] applied ${okCount}/${toApply.length} successfully`);
  } else {
    console.log('[sync-desc] dry-run — set APPLY=true to write to GitHub');
    for (const c of toApply.slice(0, 20)) {
      console.log(`  [${c.action}] ${c.repo}`);
      console.log(`    before: ${c.current || '(empty)'}`);
      console.log(`    after:  ${c.proposed}`);
    }
    if (toApply.length > 20) console.log(`  ... and ${toApply.length - 20} more (see diff JSON)`);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    apply: APPLY,
    source: reposFile.generatedAt,
    summary: { total: entries.length, updates, sets, skips, misses },
    changes,
    ...(APPLY ? { applied } : {}),
  };

  writeFileSync('public/data-descriptions-diff.json', JSON.stringify(payload, null, 2) + '\n');
  console.log('[sync-desc] wrote public/data-descriptions-diff.json');
}

main().catch(err => {
  console.error('[sync-desc] fatal:', err.message);
  process.exit(1);
});
