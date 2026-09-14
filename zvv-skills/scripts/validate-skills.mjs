#!/usr/bin/env node
/**
 * Prueft jeden Skill gegen das in docs/skill-format.md festgelegte Format.
 *
 * Laeuft in CI und als Vorstufe von `npm run build`: Ein Skill, der hier scheitert,
 * geht nicht live. Bewusst ohne Dependencies — dasselbe Frontmatter-Verstaendnis wie
 * lib/frontmatter.ts, nur in JS.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');

const REQUIRED_FIELDS = ['name', 'description', 'status', 'owner', 'tags', 'updated'];
const STATUSES = ['draft', 'review', 'stable', 'deprecated'];
const REQUIRED_HEADINGS = ['## Wann dieser Skill greift', '## Ablauf'];
const RECOMMENDED_HEADINGS = ['## Fallstricke', '## Ergebnisformat'];

const DESCRIPTION_MIN = 40;
const DESCRIPTION_MAX = 400;
const BODY_WARN_BYTES = 12_000;
const BODY_MAX_BYTES = 40_000;

/** Muster, die auf ein versehentlich eingecheckten Zugangsdaten hindeuten. */
const SECRET_PATTERNS = [
  [/\bsk-[A-Za-z0-9]{20,}/, 'API-Key-artiger String (sk-…)'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'privater Schlüssel'],
  [/\bghp_[A-Za-z0-9]{20,}/, 'GitHub-Token'],
  [/"private_key"\s*:\s*"-----BEGIN/, 'Service-Account-JSON mit Schlüssel'],
];

const errors = [];
const warnings = [];

function fail(scope, message) {
  errors.push(`${scope}: ${message}`);
}

function warn(scope, message) {
  warnings.push(`${scope}: ${message}`);
}

function stripQuotes(raw) {
  const value = raw.trim();
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) return value.slice(1, -1);
  }
  return value;
}

function parseFrontmatter(source) {
  const normalised = source.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  if (!normalised.startsWith('---\n')) throw new Error('Datei beginnt nicht mit "---".');

  const end = normalised.indexOf('\n---', 3);
  if (end === -1) throw new Error('Frontmatter nicht geschlossen.');

  const head = normalised.slice(4, end);
  const body = normalised.slice(end + 4).replace(/^\n/, '');
  const data = {};
  let currentListKey = null;

  for (const line of head.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && currentListKey) {
      data[currentListKey].push(stripQuotes(listItem[1]));
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) throw new Error(`Zeile nicht lesbar: ${JSON.stringify(line)}`);

    const [, key, rawValue] = pair;
    const value = rawValue.trim();

    if (value === '') {
      data[key] = [];
      currentListKey = key;
      continue;
    }

    currentListKey = null;
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      data[key] = inner ? inner.split(',').map(stripQuotes).filter(Boolean) : [];
    } else {
      data[key] = stripQuotes(value);
    }
  }

  return { data, body };
}

function checkSecrets(scope, source) {
  for (const [pattern, label] of SECRET_PATTERNS) {
    if (pattern.test(source)) fail(scope, `sieht aus wie ein eingecheckter ${label} — nicht committen.`);
  }
}

function validateSkill(slug, { registered }) {
  const scope = `skills/${slug}`;
  const dir = path.join(SKILLS_DIR, slug);
  const file = path.join(dir, 'SKILL.md');

  if (!fs.existsSync(file)) {
    fail(scope, 'SKILL.md fehlt.');
    return;
  }

  const source = fs.readFileSync(file, 'utf8');
  checkSecrets(`${scope}/SKILL.md`, source);

  let parsed;
  try {
    parsed = parseFrontmatter(source);
  } catch (error) {
    fail(scope, `Frontmatter unlesbar — ${error.message}`);
    return;
  }

  const { data, body } = parsed;

  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === '') fail(scope, `Feld "${field}" fehlt.`);
  }

  if (data.name && data.name !== slug) {
    fail(scope, `"name" ist "${data.name}", muss dem Ordnernamen "${slug}" entsprechen.`);
  }

  if (data.status && !STATUSES.includes(data.status)) {
    fail(scope, `"status" ist "${data.status}", erlaubt: ${STATUSES.join(', ')}.`);
  }

  if (data.updated && !/^\d{4}-\d{2}-\d{2}$/.test(data.updated)) {
    fail(scope, `"updated" ist "${data.updated}", erwartet YYYY-MM-DD.`);
  }

  if (typeof data.description === 'string') {
    if (data.description.includes('\n')) fail(scope, '"description" muss einzeilig sein.');
    if (data.description.length < DESCRIPTION_MIN) {
      fail(scope, `"description" ist ${data.description.length} Zeichen kurz — mindestens ${DESCRIPTION_MIN}. Sie ist das Routing-Signal für das Modell.`);
    }
    if (data.description.length > DESCRIPTION_MAX) {
      fail(scope, `"description" ist ${data.description.length} Zeichen lang — höchstens ${DESCRIPTION_MAX}.`);
    }
  }

  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    fail(scope, '"tags" muss eine Liste sein.');
  } else if (registered && Array.isArray(data.tags) && data.tags.length === 0) {
    warn(scope, 'keine Tags gesetzt — der Skill taucht in keiner Themenliste auf.');
  }

  if (registered) {
    for (const heading of REQUIRED_HEADINGS) {
      if (!body.includes(heading)) fail(scope, `Abschnitt "${heading}" fehlt.`);
    }
    for (const heading of RECOMMENDED_HEADINGS) {
      if (!body.includes(heading)) warn(scope, `Abschnitt "${heading}" fehlt.`);
    }
  }

  const bytes = Buffer.byteLength(source, 'utf8');
  if (bytes > BODY_MAX_BYTES) {
    fail(scope, `SKILL.md ist ${(bytes / 1024).toFixed(1)} kB — Detail nach references/ auslagern.`);
  } else if (registered && bytes > BODY_WARN_BYTES) {
    warn(scope, `SKILL.md ist ${(bytes / 1024).toFixed(1)} kB — Auslagern nach references/ prüfen.`);
  }

  // Jede im Body genannte Referenz muss existieren.
  for (const match of body.matchAll(/`(references\/[A-Za-z0-9._-]+\.md)`/g)) {
    if (!fs.existsSync(path.join(dir, match[1]))) {
      fail(scope, `verweist auf "${match[1]}", die Datei fehlt.`);
    }
  }

  // Und jede vorhandene Referenz sollte im Body auftauchen, sonst findet sie niemand.
  const referencesDir = path.join(dir, 'references');
  if (fs.existsSync(referencesDir)) {
    for (const entry of fs.readdirSync(referencesDir)) {
      if (!entry.endsWith('.md')) continue;
      const absolute = path.join(referencesDir, entry);
      checkSecrets(`${scope}/references/${entry}`, fs.readFileSync(absolute, 'utf8'));
      if (registered && !body.includes(`references/${entry}`)) {
        warn(scope, `references/${entry} wird in SKILL.md nicht erwähnt.`);
      }
    }
  }
}

function main() {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.error('skills/ nicht gefunden.');
    process.exit(1);
  }

  const dirs = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();

  const registered = dirs.filter((name) => !name.startsWith('_'));

  for (const slug of dirs) {
    validateSkill(slug, { registered: !slug.startsWith('_') });
  }

  for (const message of warnings) console.warn(`WARN  ${message}`);
  for (const message of errors) console.error(`FEHLER ${message}`);

  const summary = `${registered.length} Skills geprüft, ${errors.length} Fehler, ${warnings.length} Warnungen.`;

  if (errors.length > 0) {
    console.error(`\n${summary}`);
    process.exit(1);
  }

  console.log(summary);
}

main();
