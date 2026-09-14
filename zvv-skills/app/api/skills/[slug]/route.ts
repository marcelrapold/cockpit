import { NextResponse } from 'next/server';

import { getSkill, getSkills, siteUrl, toSummary } from '@/lib/skills';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return getSkills().map((skill) => ({ slug: skill.slug }));
}

/** Ein Skill inklusive vollstaendigem SKILL.md-Body. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = getSkill(slug);

  if (!skill) {
    return NextResponse.json({ error: 'skill_not_found', slug }, { status: 404 });
  }

  const base = siteUrl();

  return NextResponse.json({
    ...toSummary(skill, base),
    bytes: skill.bytes,
    body: skill.body,
    referenceFiles: skill.references.map((reference) => ({
      ...reference,
      url: `${base}/s/${skill.slug}/${reference.path}`,
    })),
  });
}
