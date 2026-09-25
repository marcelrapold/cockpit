import { getSkills, siteUrl } from '@/lib/skills';

export const dynamic = 'force-static';

/**
 * Katalog nach der llms.txt-Konvention: eine Datei, die ein Modell komplett
 * lesen kann, um zu entscheiden, welchen Skill es danach im Detail holt.
 */
export function GET() {
  const base = siteUrl();
  const skills = getSkills().filter((skill) => skill.meta.status !== 'deprecated');

  const lines: string[] = [
    '# ZVV Skills',
    '',
    '> Versionierte Business-Workflows des Zürcher Verkehrsverbunds, geschrieben für die Ausführung durch',
    '> Sprachmodelle. Jeder Skill ist eine Markdown-Datei mit Frontmatter; Quelle ist github.com/zvvch/zvv-skills.',
    '',
    'So benutzt du diesen Katalog: Wähle unten den Skill, dessen Beschreibung zur Aufgabe passt, und lade',
    'sein SKILL.md nach. Referenzdateien erst laden, wenn der Ablauf sie nennt.',
    '',
    '## Skills',
    '',
  ];

  for (const skill of skills) {
    lines.push(`- [${skill.slug}](${base}/s/${skill.slug}/SKILL.md): ${skill.meta.description}`);
  }

  lines.push('', '## Endpunkte', '');
  lines.push(`- [Katalog als JSON](${base}/api/skills): alle Skills mit Metadaten, ohne Bodies`);
  lines.push(`- [Einzelner Skill als JSON](${base}/api/skills/<slug>): Metadaten plus vollständiger Body`);
  lines.push(`- [Rohes Markdown](${base}/s/<slug>/SKILL.md): unveränderte Datei aus dem Repo`);
  lines.push('');

  return new Response(lines.join('\n'), {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
