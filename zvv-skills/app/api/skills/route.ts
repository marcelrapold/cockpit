import { NextResponse } from 'next/server';

import { getSkills, siteUrl, toSummary } from '@/lib/skills';

export const dynamic = 'force-static';

/**
 * Katalog aller Skills ohne Bodies.
 *
 * Das ist die Routing-Ebene fuer Agenten: erst hier den passenden Skill waehlen,
 * dann gezielt /api/skills/<slug> oder /s/<slug>/SKILL.md nachladen.
 */
export function GET() {
  const base = siteUrl();
  const skills = getSkills().map((skill) => toSummary(skill, base));

  return NextResponse.json({
    source: 'https://github.com/zvvch/zvv-skills',
    site: base,
    count: skills.length,
    skills,
  });
}
