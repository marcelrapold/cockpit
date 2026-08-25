#!/usr/bin/env node
/**
 * Kopiert die Skills in ein lokales Agent-Verzeichnis, z. B. .claude/skills.
 *
 *   node scripts/sync-skills.mjs [zielverzeichnis] [--dry-run]
 *
 * Standardziel ist .claude/skills im aktuellen Arbeitsverzeichnis. Bestehende
 * Ordner gleichen Namens werden ersetzt; alles andere im Ziel bleibt unangetastet.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const target = path.resolve(args.find((arg) => !arg.startsWith('--')) ?? '.claude/skills');

const slugs = fs
  .readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.'))
  .map((entry) => entry.name)
  .sort();

if (!dryRun) fs.mkdirSync(target, { recursive: true });

for (const slug of slugs) {
  const from = path.join(SKILLS_DIR, slug);
  const to = path.join(target, slug);

  if (dryRun) {
    console.log(`würde kopieren: ${slug} → ${to}`);
    continue;
  }

  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`kopiert: ${slug} → ${to}`);
}

console.log(`\n${slugs.length} Skills${dryRun ? ' (Probelauf)' : ''} nach ${target}.`);
