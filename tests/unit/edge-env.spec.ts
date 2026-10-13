import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// In der Edge-Middleware ersetzt Next.js nur statische `process.env.NAME`-Ausdrücke.
// Ein Zugriff mit berechnetem Schlüssel bleibt dort leer – so war OIDC in Produktion nie aktiv (14.10.2026).
const EDGE_FILES = ['middleware.ts', 'lib/auth/config.ts', 'lib/auth/session.ts', 'lib/auth/responses.ts'];

for (const file of EDGE_FILES) {
  test(`${file} liest Umgebungsvariablen nur statisch`, () => {
    const source = readFileSync(join(__dirname, '..', '..', file), 'utf8');
    expect(source).not.toMatch(/process\.env\[/);
  });
}
