import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Skill nicht gefunden</h1>
      <p className="text-[var(--zvv-muted)]">
        Der Katalog steht unter{' '}
        <Link className="text-[var(--zvv-blue)] hover:underline" href="/">
          skills.zvv.dev
        </Link>
        .
      </p>
    </div>
  );
}
