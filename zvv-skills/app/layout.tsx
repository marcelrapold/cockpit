import type { Metadata } from 'next';
import Link from 'next/link';

import { siteUrl } from '@/lib/skills';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'ZVV Skills',
    template: '%s — ZVV Skills',
  },
  description:
    'Versionierte, LLM-optimierte Business-Workflows des ZVV: Analytics-Abfragen, Reporting und Betriebsroutinen als Agent Skills.',
  openGraph: {
    type: 'website',
    siteName: 'ZVV Skills',
    locale: 'de_CH',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de-CH">
      <head>
        {/* Agenten finden den Katalog ueber die llms.txt-Konvention. */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM-Index" />
      </head>
      <body>
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 sm:px-8">
          <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-[var(--zvv-border)] py-6">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              ZVV <span className="text-[var(--zvv-blue)]">Skills</span>
            </Link>
            <p className="text-sm text-[var(--zvv-muted)]">Business-Workflows für Menschen und Agenten</p>
            <nav className="ml-auto flex gap-4 text-sm">
              <a className="hover:text-[var(--zvv-blue)]" href="/llms.txt">
                llms.txt
              </a>
              <Link className="hover:text-[var(--zvv-blue)]" href="/api/skills" prefetch={false}>
                API
              </Link>
            </nav>
          </header>

          <main className="flex-1 py-10">{children}</main>

          <footer className="border-t border-[var(--zvv-border)] py-6 text-sm text-[var(--zvv-muted)]">
            <p>
              Quelle: <code>zvvch/zvv-skills</code> · Jeder Skill ist Markdown im Repo — Änderungen laufen über
              Pull Request.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
