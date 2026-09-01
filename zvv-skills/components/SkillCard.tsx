import Link from 'next/link';

import type { Skill } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export function SkillCard({ skill }: { skill: Skill }) {
  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="block rounded-xl border border-[var(--zvv-border)] bg-[var(--zvv-surface)] p-5 transition-colors hover:border-[var(--zvv-blue)]"
    >
      <div className="flex items-baseline gap-3">
        <h2 className="font-mono text-[0.95rem] font-semibold text-[var(--zvv-blue)]">{skill.slug}</h2>
        <StatusBadge status={skill.meta.status} />
      </div>
      <p className="mt-2 text-sm leading-relaxed">{skill.meta.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--zvv-muted)]">
        <span>{skill.meta.owner}</span>
        <span aria-hidden>·</span>
        <span>geprüft {skill.meta.updated}</span>
        {skill.references.length > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>
              {skill.references.length} Referenz{skill.references.length === 1 ? '' : 'en'}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
