import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { SKILLS_DIR, getSkill, getSkills, getTags, resolveRawFile, toSummary } from './skills.ts';

test('laedt jeden Skill aus skills/', () => {
  const skills = getSkills();

  assert.ok(skills.length > 0, 'keine Skills geladen');
  for (const skill of skills) {
    assert.equal(skill.meta.name, skill.slug, `${skill.slug}: name weicht vom Ordner ab`);
    assert.ok(skill.body.length > 0, `${skill.slug}: leerer Body`);
    assert.match(skill.meta.updated, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('ignoriert Vorlagenordner mit fuehrendem Unterstrich', () => {
  assert.equal(getSkill('_template'), undefined);
  assert.ok(fs.existsSync(path.join(SKILLS_DIR, '_template')), 'Vorlage fehlt — Test prüft nichts');
});

test('sortiert Skills alphabetisch', () => {
  const slugs = getSkills().map((skill) => skill.slug);
  assert.deepEqual(slugs, [...slugs].sort());
});

test('sammelt Referenzen und misst ihre Groesse', () => {
  const adobe = getSkill('adobe-analytics');

  assert.ok(adobe, 'adobe-analytics fehlt');
  assert.ok(adobe.references.length >= 2);
  for (const reference of adobe.references) {
    assert.match(reference.path, /^references\/.+\.md$/);
    assert.ok(reference.bytes > 0);
    assert.ok(reference.title.length > 0);
  }
});

test('liefert Tags einmalig und sortiert', () => {
  const tags = getTags();

  assert.deepEqual(tags, [...new Set(tags)].sort());
});

test('baut absolute URLs auf der uebergebenen Basis', () => {
  const skill = getSkills()[0];
  const summary = toSummary(skill, 'https://skills.zvv.dev');

  assert.equal(summary.raw, `https://skills.zvv.dev/s/${skill.slug}/SKILL.md`);
  assert.equal(summary.html, `https://skills.zvv.dev/skills/${skill.slug}`);
  for (const reference of summary.references) {
    assert.ok(reference.startsWith('https://skills.zvv.dev/s/'));
  }
});

test('trennt Basis-URL ohne doppelten Schraegstrich', () => {
  const skill = getSkills()[0];
  assert.ok(!toSummary(skill, 'https://skills.zvv.dev').raw.includes('.dev//'));
});

// --- resolveRawFile: der Endpunkt liefert Dateien aus, also ist das die kritische Stelle.

test('loest eine echte SKILL.md auf', () => {
  const file = resolveRawFile(['adobe-analytics', 'SKILL.md']);

  assert.ok(file, 'SKILL.md nicht aufgelöst');
  assert.ok(file.startsWith(path.resolve(SKILLS_DIR)));
  assert.ok(fs.existsSync(file));
});

test('loest eine Referenzdatei auf', () => {
  assert.ok(resolveRawFile(['adobe-analytics', 'references', 'api.md']));
});

test('weist Pfade ausserhalb von skills/ zurueck', () => {
  // Bewusst .md-Ziele, die es ausserhalb von skills/ wirklich gibt: nur so greift die
  // Pfadprüfung statt der Endungsfilter davor. Mit .json-Zielen wäre der Test blind.
  const outside = ['README.md', 'CONTRIBUTING.md', 'ATLAS.md'];
  for (const name of outside) {
    assert.ok(
      fs.existsSync(path.join(SKILLS_DIR, '..', name)),
      `${name} fehlt — der Ausbruchstest prüft sonst nichts`,
    );
  }

  const escapes = [
    ['..', 'README.md'],
    ['..', '..', 'README.md'],
    ['adobe-analytics', '..', '..', 'CONTRIBUTING.md'],
    ['adobe-analytics', 'references', '..', '..', '..', 'ATLAS.md'],
    ['.', '..', 'README.md'],
    ['..', 'docs', 'skill-format.md'],
    ['adobe-analytics', '..', '..', 'package.json'],
  ];

  for (const segments of escapes) {
    assert.equal(resolveRawFile(segments), null, `Ausbruch nicht blockiert: ${segments.join('/')}`);
  }
});

test('weist alles zurueck, was nicht auf .md endet', () => {
  assert.equal(resolveRawFile(['adobe-analytics', 'SKILL.txt']), null);
  assert.equal(resolveRawFile(['adobe-analytics']), null);
  assert.equal(resolveRawFile(['adobe-analytics', 'SKILL.md.bak']), null);
});

test('weist leere und leere-Segment-Pfade zurueck', () => {
  assert.equal(resolveRawFile([]), null);
  assert.equal(resolveRawFile(['', 'SKILL.md']), null);
});

test('weist Verzeichnisse und fehlende Dateien zurueck', () => {
  assert.equal(resolveRawFile(['adobe-analytics', 'references']), null);
  assert.equal(resolveRawFile(['gibt-es-nicht', 'SKILL.md']), null);
});
