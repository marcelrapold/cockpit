/**
 * Minimaler YAML-Frontmatter-Parser.
 *
 * Bewusst keine YAML-Dependency: Das Frontmatter-Schema ist in docs/skill-format.md
 * eng definiert (flache Keys, Strings, Inline-Arrays, Block-Arrays). Alles darueber
 * hinaus soll hart scheitern statt still falsch geparst zu werden — validate-skills.mjs
 * benutzt exakt dieselbe Logik in JS.
 */

export type FrontmatterValue = string | string[];

export interface ParsedFrontmatter {
  data: Record<string, FrontmatterValue>;
  body: string;
}

const DELIMITER = '---';

function stripQuotes(raw: string): string {
  const value = raw.trim();
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

function parseInlineArray(raw: string): string[] {
  const inner = raw.trim().slice(1, -1).trim();
  if (!inner) return [];
  return inner
    .split(',')
    .map((entry) => stripQuotes(entry))
    .filter((entry) => entry.length > 0);
}

export function parseFrontmatter(source: string): ParsedFrontmatter {
  const normalised = source.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  if (!normalised.startsWith(`${DELIMITER}\n`)) {
    throw new Error('Frontmatter fehlt: Datei muss mit "---" beginnen.');
  }

  const end = normalised.indexOf(`\n${DELIMITER}`, DELIMITER.length);
  if (end === -1) {
    throw new Error('Frontmatter nicht geschlossen: zweites "---" fehlt.');
  }

  const head = normalised.slice(DELIMITER.length + 1, end);
  const body = normalised.slice(end + DELIMITER.length + 1).replace(/^\n/, '');

  const data: Record<string, FrontmatterValue> = {};
  let currentListKey: string | null = null;

  for (const line of head.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && currentListKey) {
      (data[currentListKey] as string[]).push(stripQuotes(listItem[1]));
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) {
      throw new Error(`Frontmatter-Zeile nicht lesbar: ${JSON.stringify(line)}`);
    }

    const [, key, rawValue] = pair;
    const value = rawValue.trim();

    if (value === '') {
      data[key] = [];
      currentListKey = key;
      continue;
    }

    currentListKey = null;
    data[key] = value.startsWith('[') && value.endsWith(']')
      ? parseInlineArray(value)
      : stripQuotes(value);
  }

  return { data, body };
}
