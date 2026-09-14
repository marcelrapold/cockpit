import fs from 'node:fs';

import { resolveRawFile } from '@/lib/skills';

export const dynamic = 'force-dynamic';

/**
 * Liefert Markdown aus skills/ unveraendert aus.
 *
 * Genau dieser Endpunkt ist fuer Agenten gedacht: eine URL, ein Dokument,
 * kein HTML drumherum. resolveRawFile() haelt die Anfrage im Verzeichnis.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const file = resolveRawFile(segments);

  if (!file) {
    return new Response('not found\n', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return new Response(fs.readFileSync(file, 'utf8'), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
