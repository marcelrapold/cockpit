import type { SkillStatus } from '@/lib/types';

const LABEL: Record<SkillStatus, string> = {
  draft: 'Entwurf',
  review: 'in Review',
  stable: 'stabil',
  deprecated: 'abgelöst',
};

/** Farbe kodiert Verlaesslichkeit, nicht Aktualitaet. */
const TONE: Record<SkillStatus, string> = {
  draft: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
  review: 'border-sky-500/40 text-sky-600 dark:text-sky-400',
  stable: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
  deprecated: 'border-[var(--zvv-border)] text-[var(--zvv-muted)] line-through',
};

export function StatusBadge({ status }: { status: SkillStatus }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[0.68rem] uppercase tracking-wide ${TONE[status]}`}>
      {LABEL[status]}
    </span>
  );
}
