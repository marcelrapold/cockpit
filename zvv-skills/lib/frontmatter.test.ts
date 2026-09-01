import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseFrontmatter } from './frontmatter.ts';

test('liest flache Felder und trennt den Body ab', () => {
  const { data, body } = parseFrontmatter('---\nname: demo\nstatus: stable\n---\n# Titel\n\nText.\n');

  assert.equal(data.name, 'demo');
  assert.equal(data.status, 'stable');
  assert.equal(body, '# Titel\n\nText.\n');
});

test('versteht Inline-Arrays', () => {
  const { data } = parseFrontmatter('---\ntags: [a, b, c]\n---\nx\n');
  assert.deepEqual(data.tags, ['a', 'b', 'c']);
});

test('versteht leere Inline-Arrays', () => {
  const { data } = parseFrontmatter('---\nrequires: []\n---\nx\n');
  assert.deepEqual(data.requires, []);
});

test('versteht Block-Arrays', () => {
  const { data } = parseFrontmatter('---\nrequires:\n  - EINS\n  - ZWEI\n---\nx\n');
  assert.deepEqual(data.requires, ['EINS', 'ZWEI']);
});

test('beendet ein Block-Array beim naechsten Schluessel', () => {
  const { data } = parseFrontmatter('---\nrequires:\n  - EINS\nowner: Team\n---\nx\n');

  assert.deepEqual(data.requires, ['EINS']);
  assert.equal(data.owner, 'Team');
});

test('entfernt umschliessende Anfuehrungszeichen', () => {
  const { data } = parseFrontmatter('---\na: "mit: Doppelpunkt"\nb: \'einfach\'\n---\nx\n');

  assert.equal(data.a, 'mit: Doppelpunkt');
  assert.equal(data.b, 'einfach');
});

test('behaelt Doppelpunkte im Wert', () => {
  const { data } = parseFrontmatter('---\ndescription: Zieht Daten: Klicks und Impressionen.\n---\nx\n');
  assert.equal(data.description, 'Zieht Daten: Klicks und Impressionen.');
});

test('normalisiert CRLF und entfernt ein BOM', () => {
  const { data, body } = parseFrontmatter('﻿---\r\nname: demo\r\n---\r\nText\r\n');

  assert.equal(data.name, 'demo');
  assert.equal(body, 'Text\n');
});

test('ueberspringt Kommentare und Leerzeilen', () => {
  const { data } = parseFrontmatter('---\n# Kommentar\n\nname: demo\n---\nx\n');

  assert.equal(data.name, 'demo');
  assert.equal(Object.keys(data).length, 1);
});

// Fehlerfaelle: lieber laut scheitern als still falsch lesen.
test('scheitert ohne Frontmatter', () => {
  assert.throws(() => parseFrontmatter('# Nur Markdown\n'), /Frontmatter fehlt/);
});

test('scheitert bei nicht geschlossenem Frontmatter', () => {
  assert.throws(() => parseFrontmatter('---\nname: demo\n'), /nicht geschlossen/);
});

test('scheitert bei einer unlesbaren Zeile', () => {
  assert.throws(() => parseFrontmatter('---\nkein Doppelpunkt hier\n---\nx\n'), /nicht lesbar/);
});
