import Link from 'next/link';

import { SkillCard } from '@/components/SkillCard';
import { getSkills, getTags } from '@/lib/skills';

export const dynamic = 'force-static';

export default function HomePage() {
  const skills = getSkills();
  const tags = getTags();
  const active = skills.filter((skill) => skill.meta.status !== 'deprecated');
  const retired = skills.filter((skill) => skill.meta.status === 'deprecated');

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Wiederkehrende ZVV-Workflows, einmal sauber aufgeschrieben.
        </h1>
        <p className="max-w-2xl text-[var(--zvv-muted)]">
          Jeder Skill beschreibt einen Geschäftsablauf so präzise, dass ihn ein Mensch nachvollziehen und ein
          Sprachmodell ausführen kann: Analytics-Abfragen, Reporting-Routinen und Betriebschecks über Adobe
          Analytics, Piano, Google Search Console und Cloudflare.
        </p>
      </section>

      <section className="rounded-xl border border-[var(--zvv-border)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--zvv-muted)]">Für Agenten</h2>
        <ul className="mt-3 space-y-1.5 font-mono text-sm">
          <li>
            <a className="text-[var(--zvv-blue)] hover:underline" href="/llms.txt">
              /llms.txt
            </a>{' '}
            <span className="text-[var(--zvv-muted)]">— Katalog als Klartext</span>
          </li>
          <li>
            <Link className="text-[var(--zvv-blue)] hover:underline" href="/api/skills" prefetch={false}>
              /api/skills
            </Link>{' '}
            <span className="text-[var(--zvv-muted)]">— Katalog als JSON</span>
          </li>
          <li>
            <span className="text-[var(--zvv-blue)]">/api/skills/&lt;slug&gt;</span>{' '}
            <span className="text-[var(--zvv-muted)]">— ein Skill inkl. Body</span>
          </li>
          <li>
            <span className="text-[var(--zvv-blue)]">/s/&lt;slug&gt;/SKILL.md</span>{' '}
            <span className="text-[var(--zvv-muted)]">— rohes Markdown, direkt in den Kontext ladbar</span>
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {active.length} Skill{active.length === 1 ? '' : 's'}
          </h2>
          {tags.length > 0 && (
            <p className="font-mono text-xs text-[var(--zvv-muted)]">{tags.join(' · ')}</p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {active.map((skill) => (
            <SkillCard key={skill.slug} skill={skill} />
          ))}
        </div>
      </section>

      {retired.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--zvv-muted)]">Abgelöst</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {retired.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
