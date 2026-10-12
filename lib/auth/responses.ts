import { NextResponse } from 'next/server';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/** Kleine, eigenständige Statusseite für Login-Fehler und Abmeldung (ohne App-Daten). */
export function authPage(
  status: number,
  title: string,
  message: string,
  links: Array<{ href: string; label: string }> = [],
) {
  const linkHtml = links
    .map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`)
    .join(' · ');
  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)} · Cockpit</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#050B19;color:#E2E8F0;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
  main{max-width:28rem;padding:2rem 1.5rem;text-align:center}
  img{width:72px;height:72px}
  h1{font-size:1.25rem;margin:1rem 0 .5rem}
  p{color:#94A3B8;margin:0 0 1.25rem}
  a{color:#38B8FF}
</style>
</head>
<body>
<main>
<img src="/favicon.svg" alt="" width="72" height="72">
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(message)}</p>
<p>${linkHtml}</p>
</main>
</body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
