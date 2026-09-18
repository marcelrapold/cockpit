/** Datenmodell der Skill-Registry. Einzige Quelle der Wahrheit: skills/<slug>/SKILL.md */

/** Reifegrad eines Skills. Steuert Sichtbarkeit und Erwartungshaltung. */
export type SkillStatus = 'draft' | 'review' | 'stable' | 'deprecated';

/** Frontmatter-Block einer SKILL.md. */
export interface SkillMeta {
  /** Muss dem Ordnernamen entsprechen (kebab-case). */
  name: string;
  /** Ein Satz: was der Skill kann UND wann er greift. Wird vom LLM zum Routing gelesen. */
  description: string;
  status: SkillStatus;
  /** Fachlicher Owner, z. B. ein ZVV-Team. */
  owner: string;
  /** Systeme/Themen zum Filtern, z. B. ["adobe-analytics", "reporting"]. */
  tags: string[];
  /** ISO-Datum der letzten inhaltlichen Pruefung. */
  updated: string;
  /** Env-Variablen, die ein ausfuehrender Agent braucht. */
  requires?: string[];
}

/** Eine zusaetzliche Referenzdatei, die erst bei Bedarf geladen wird. */
export interface SkillReference {
  /** Pfad relativ zum Skill-Ordner, z. B. "references/api.md". */
  path: string;
  title: string;
  bytes: number;
}

/** Vollstaendiger Skill inklusive Body. */
export interface Skill {
  slug: string;
  meta: SkillMeta;
  /** SKILL.md ohne Frontmatter. */
  body: string;
  references: SkillReference[];
  bytes: number;
}

/** Listeneintrag ohne Body — das ist der Router-Katalog fuer LLMs. */
export interface SkillSummary {
  slug: string;
  name: string;
  description: string;
  status: SkillStatus;
  owner: string;
  tags: string[];
  updated: string;
  requires: string[];
  references: string[];
  /** Absoluter Pfad zum rohen Markdown. */
  raw: string;
  /** Absoluter Pfad zur HTML-Ansicht. */
  html: string;
}
