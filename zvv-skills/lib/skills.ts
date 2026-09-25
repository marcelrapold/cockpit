import fs from 'node:fs';
import path from 'node:path';

import { parseFrontmatter, type FrontmatterValue } from './frontmatter.ts';
import type { Skill, SkillMeta, SkillReference, SkillStatus, SkillSummary } from './types.ts';

export const SKILLS_DIR = path.join(process.cwd(), 'skills');

const STATUSES: SkillStatus[] = ['draft', 'review', 'stable', 'deprecated'];

/** Ordner mit fuehrendem "_" sind Vorlagen/Shared-Material, keine Skills. */
function isSkillDir(entry: fs.Dirent): boolean {
  return entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.');
}

function asString(value: FrontmatterValue | undefined, field: string, slug: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`skills/${slug}: Frontmatter-Feld "${field}" fehlt oder ist kein String.`);
  }
  return value;
}

function asArray(value: FrontmatterValue | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.length > 0) return [value];
  return [];
}

function toMeta(data: Record<string, FrontmatterValue>, slug: string): SkillMeta {
  const name = asString(data.name, 'name', slug);
  if (name !== slug) {
    throw new Error(`skills/${slug}: Frontmatter "name" ist "${name}", muss dem Ordnernamen entsprechen.`);
  }

  const status = asString(data.status, 'status', slug) as SkillStatus;
  if (!STATUSES.includes(status)) {
    throw new Error(`skills/${slug}: "status" ist "${status}", erlaubt sind ${STATUSES.join(', ')}.`);
  }

  const updated = asString(data.updated, 'updated', slug);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) {
    throw new Error(`skills/${slug}: "updated" ist "${updated}", erwartet YYYY-MM-DD.`);
  }

  return {
    name,
    description: asString(data.description, 'description', slug),
    status,
    owner: asString(data.owner, 'owner', slug),
    tags: asArray(data.tags),
    updated,
    requires: asArray(data.requires),
  };
}

/** Erste ATX-Ueberschrift einer Referenzdatei, sonst der Dateiname. */
function referenceTitle(file: string, absolute: string): string {
  const firstHeading = fs
    .readFileSync(absolute, 'utf8')
    .split('\n')
    .find((line) => line.startsWith('# '));
  return firstHeading ? firstHeading.slice(2).trim() : path.basename(file);
}

function collectReferences(skillDir: string): SkillReference[] {
  const referencesDir = path.join(skillDir, 'references');
  if (!fs.existsSync(referencesDir)) return [];

  return fs
    .readdirSync(referencesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => {
      const absolute = path.join(referencesDir, entry.name);
      return {
        path: `references/${entry.name}`,
        title: referenceTitle(entry.name, absolute),
        bytes: fs.statSync(absolute).size,
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function readSkill(slug: string): Skill {
  const skillDir = path.join(SKILLS_DIR, slug);
  const file = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(file)) {
    throw new Error(`skills/${slug}: SKILL.md fehlt.`);
  }

  const source = fs.readFileSync(file, 'utf8');
  const { data, body } = parseFrontmatter(source);

  return {
    slug,
    meta: toMeta(data, slug),
    body: body.trim(),
    references: collectReferences(skillDir),
    bytes: Buffer.byteLength(source, 'utf8'),
  };
}

let cache: Skill[] | null = null;

/** Alle Skills, alphabetisch. In Produktion einmal pro Lambda-Instanz gelesen. */
export function getSkills(): Skill[] {
  if (cache && process.env.NODE_ENV === 'production') return cache;

  const slugs = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(isSkillDir)
    .map((entry) => entry.name)
    .sort();

  cache = slugs.map(readSkill);
  return cache;
}

export function getSkill(slug: string): Skill | undefined {
  return getSkills().find((skill) => skill.slug === slug);
}

export function getTags(): string[] {
  const tags = new Set<string>();
  for (const skill of getSkills()) {
    for (const tag of skill.meta.tags) tags.add(tag);
  }
  return [...tags].sort();
}

/** Basis-URL fuer absolute Links in maschinenlesbaren Antworten. */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (process.env.VERCEL_ENV === 'production') return 'https://skills.zvv.dev';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export function toSummary(skill: Skill, base = siteUrl()): SkillSummary {
  return {
    slug: skill.slug,
    name: skill.meta.name,
    description: skill.meta.description,
    status: skill.meta.status,
    owner: skill.meta.owner,
    tags: skill.meta.tags,
    updated: skill.meta.updated,
    requires: skill.meta.requires ?? [],
    references: skill.references.map((reference) => `${base}/s/${skill.slug}/${reference.path}`),
    raw: `${base}/s/${skill.slug}/SKILL.md`,
    html: `${base}/skills/${skill.slug}`,
  };
}

/**
 * Loest einen angefragten Roh-Pfad gegen skills/ auf.
 *
 * Gibt null zurueck, sobald der Pfad das Verzeichnis verlaesst, ein Symlink ist
 * oder kein Markdown adressiert — die Route darf nur Repo-Inhalt ausliefern.
 */
export function resolveRawFile(segments: string[]): string | null {
  if (segments.length === 0) return null;
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) return null;

  const relative = segments.join('/');
  if (!relative.endsWith('.md')) return null;

  const absolute = path.resolve(SKILLS_DIR, relative);
  const root = path.resolve(SKILLS_DIR);
  if (absolute !== root && !absolute.startsWith(root + path.sep)) return null;

  let stats: fs.Stats;
  try {
    stats = fs.lstatSync(absolute);
  } catch {
    return null;
  }
  if (!stats.isFile()) return null;

  return absolute;
}
