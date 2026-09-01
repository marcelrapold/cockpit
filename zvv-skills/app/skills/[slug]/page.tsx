import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { StatusBadge } from '@/components/StatusBadge';
import { renderMarkdown } from '@/lib/markdown';
import { getSkill, getSkills } from '@/lib/skills';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return getSkills().map((skill) => ({ slug: skill.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const skill = getSkill(slug);
  if (!skill) return { title: 'Nicht gefunden' };

  return {
    title: skill.meta.name,
    description: skill.meta.description,
  };
}

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = getSkill(slug);
  if (!skill) notFound();

  const requires = skill.meta.requires ?? [];

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-xl font-semibold text-[var(--zvv-blue)]">{skill.slug}</h1>
          <StatusBadge status={skill.meta.status} />
        </div>
        <p className="max-w-2xl text-[var(--zvv-muted)]">{skill.meta.description}</p>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--zvv-muted)]">
          <div className="flex gap-2">
            <dt>Owner</dt>
            <dd className="text-[var(--zvv-ink)]">{skill.meta.owner}</dd>
          </div>
          <div className="flex gap-2">
            <dt>Zuletzt geprüft</dt>
            <dd className="text-[var(--zvv-ink)]">{skill.meta.updated}</dd>
          </div>
          {skill.meta.tags.length > 0 && (
            <div className="flex gap-2">
              <dt>Tags</dt>
              <dd className="font-mono text-[var(--zvv-ink)]">{skill.meta.tags.join(', ')}</dd>
            </div>
          )}
        </dl>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--zvv-border)] p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--zvv-muted)]">
            Roh laden
          </h2>
          <ul className="mt-2 space-y-1 font-mono text-sm">
            <li>
              <a className="text-[var(--zvv-blue)] hover:underline" href={`/s/${skill.slug}/SKILL.md`}>
                /s/{skill.slug}/SKILL.md
              </a>
            </li>
            {skill.references.map((reference) => (
              <li key={reference.path}>
                <a
                  className="text-[var(--zvv-blue)] hover:underline"
                  href={`/s/${skill.slug}/${reference.path}`}
                >
                  /s/{skill.slug}/{reference.path}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-[var(--zvv-border)] p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--zvv-muted)]">
            Benötigte Zugänge
          </h2>
          {requires.length > 0 ? (
            <ul className="mt-2 space-y-1 font-mono text-sm">
              {requires.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--zvv-muted)]">Keine — reiner Ablauf ohne API-Zugriff.</p>
          )}
        </div>
      </section>

      <div className="prose-zvv" dangerouslySetInnerHTML={{ __html: renderMarkdown(skill.body) }} />

      {skill.references.length > 0 && (
        <section className="rounded-xl border border-[var(--zvv-border)] p-5">
          <h2 className="text-sm font-semibold">Referenzen</h2>
          <p className="mt-1 text-sm text-[var(--zvv-muted)]">
            Bewusst ausgelagert: Ein Agent lädt sie erst, wenn der Ablauf sie verlangt.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {skill.references.map((reference) => (
              <li key={reference.path}>
                <a
                  className="text-[var(--zvv-blue)] hover:underline"
                  href={`/s/${skill.slug}/${reference.path}`}
                >
                  {reference.title}
                </a>{' '}
                <span className="font-mono text-xs text-[var(--zvv-muted)]">
                  {reference.path} · {(reference.bytes / 1024).toFixed(1)} kB
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
