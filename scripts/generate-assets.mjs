#!/usr/bin/env node
/**
 * Generates all brand assets: favicon (SVG+PNG+ICO), apple-touch-icon,
 * android chrome icons, and OG image. Uses sharp for SVG→PNG conversion.
 */
import { readFileSync, writeFileSync } from 'fs';
import sharp from 'sharp';

const OUT = 'public';
const APP_NAME = process.env.APP_NAME || 'Cockpit';
const APP_DOMAIN = process.env.APP_DOMAIN || 'cockpit.rapold.io';

// ---------------------------------------------------------------------------
// Signet: freigegebenes Cockpit-Signet aus Atlas (marcelrapold/mra-atlas,
// brands/rapold/assets/logos/cockpit.svg und light/cockpit.svg), unverändert
// nach public/brand/ übernommen. Hier nur zusammengesetzt, nicht neu gezeichnet.
// ---------------------------------------------------------------------------
const TILE = '#050B19'; // Rapold dark background (Atlas, Brand "rapold")

function signetShapes(file) {
  const svg = readFileSync(`${OUT}/brand/${file}`, 'utf8');
  const shapes = svg.match(/<(path|polygon)\b[^>]*\/>/g);
  if (!shapes || shapes.length < 2) throw new Error(`Signet ${file}: Formen nicht gefunden`);
  return shapes;
}

const darkShapes = signetShapes('cockpit.svg');
const lightShapes = signetShapes('cockpit-light.svg');

function withClass(shape, cls) {
  return shape.replace(/ fill="[^"]*"/, '').replace(/^<(path|polygon)/, `<$1 class="${cls}"`);
}

// favicon.svg: transparent, Farbvariante folgt dem Farbschema des Browsers.
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>Cockpit</title>
  <style>
    .body{fill:${lightShapes[0].match(/fill="([^"]+)"/)[1]}}.facet{fill:${lightShapes[1].match(/fill="([^"]+)"/)[1]}}
    @media (prefers-color-scheme: dark){.body{fill:${darkShapes[0].match(/fill="([^"]+)"/)[1]}}.facet{fill:${darkShapes[1].match(/fill="([^"]+)"/)[1]}}}
  </style>
  ${withClass(lightShapes[0], 'body')}
  ${withClass(lightShapes[1], 'facet')}
</svg>
`;

// PNG-Icons: dunkle Kachel mit dem Standard-Signet (für dunkle Flächen freigegeben).
function tileSvg(size, { rounded = true, scale = 0.84 } = {}) {
  const radius = rounded ? size * 0.1875 : 0;
  const inner = size * scale;
  const offset = (size - inner) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${TILE}"/>
  <g transform="translate(${offset} ${offset}) scale(${inner / 256})">
    ${darkShapes.join('\n    ')}
  </g>
</svg>`;
}

// ---------------------------------------------------------------------------
// OG Image (1200x630)
// ---------------------------------------------------------------------------
const heatmapCells = (() => {
  const rows = 7, cols = 40;
  let cells = '';
  const seed = 42;
  let state = seed;
  function pseudo() { state = (state * 1103515245 + 12345) & 0x7fffffff; return state / 0x7fffffff; }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const intensity = pseudo();
      const color = intensity < 0.3 ? '#0e4429' : intensity < 0.5 ? '#006d32' : intensity < 0.7 ? '#26a641' : '#39d353';
      const opacity = intensity < 0.15 ? '0.1' : intensity.toFixed(2);
      cells += `<rect x="${c * 14}" y="${r * 14}" width="11" height="11" rx="2" fill="${color}" opacity="${opacity}"/>`;
    }
  }
  return cells;
})();

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g opacity="0.04" stroke="#fff" stroke-width="0.5">
    ${Array.from({ length: 30 }, (_, i) => `<line x1="${i * 42}" y1="0" x2="${i * 42}" y2="630"/>`).join('')}
    ${Array.from({ length: 16 }, (_, i) => `<line x1="0" y1="${i * 42}" x2="1200" y2="${i * 42}"/>`).join('')}
  </g>
  <rect x="0" y="0" width="6" height="630" fill="url(#accent)"/>
  <text x="80" y="140" font-family="system-ui, Helvetica, Arial, sans-serif" font-size="56" font-weight="700" fill="#ffffff">${APP_NAME}</text>
  <text x="80" y="185" font-family="system-ui, Helvetica, Arial, sans-serif" font-size="22" fill="#94a3b8">Engineering-Dashboard — Live-Commits, Deployments, Uptime, Tech Stack</text>
  <text x="80" y="215" font-family="system-ui, Helvetica, Arial, sans-serif" font-size="17" fill="#64748b">GitHub · Vercel · Supabase — 70+ Projekte auf einen Blick</text>
  <rect x="80" y="240" width="100" height="3" rx="1.5" fill="#3b82f6"/>
  <g font-family="system-ui, Helvetica, Arial, sans-serif">
    <g transform="translate(80, 270)">
      <text y="30" font-size="36" font-weight="700" fill="#ffffff">203</text>
      <text y="50" font-size="13" fill="#64748b">Commits / Monat</text>
    </g>
    <g transform="translate(280, 270)">
      <text y="30" font-size="36" font-weight="700" fill="#ffffff">66</text>
      <text y="50" font-size="13" fill="#64748b">Vercel-Projekte</text>
    </g>
    <g transform="translate(440, 270)">
      <text y="30" font-size="36" font-weight="700" fill="#ffffff">10</text>
      <text y="50" font-size="13" fill="#64748b">Supabase-DBs</text>
    </g>
    <g transform="translate(580, 270)">
      <text y="30" font-size="36" font-weight="700" fill="#ffffff">14/14</text>
      <text y="50" font-size="13" fill="#64748b">Services Online</text>
    </g>
    <g transform="translate(780, 270)">
      <text y="30" font-size="36" font-weight="700" fill="#ffffff">16</text>
      <text y="50" font-size="13" fill="#64748b">Sprachen</text>
    </g>
  </g>
  <g transform="translate(80, 380)">${heatmapCells}</g>
  <text x="80" y="598" font-family="system-ui, Helvetica, Arial, sans-serif" font-size="14" fill="#475569">${APP_DOMAIN}</text>
  <text x="1120" y="598" font-family="system-ui, Helvetica, Arial, sans-serif" font-size="14" fill="#475569" text-anchor="end">Marcel Rapold</text>
</svg>`;

// ---------------------------------------------------------------------------
// Write SVGs + convert to PNGs
// ---------------------------------------------------------------------------
async function main() {
  writeFileSync(`${OUT}/favicon.svg`, faviconSvg);
  console.log('  favicon.svg');

  const convert = async (svg, outFile, width, height) => {
    await sharp(Buffer.from(svg), { density: 300 }).resize({ width, height }).png().toFile(`${OUT}/${outFile}`);
    console.log(`  ${outFile}`);
  };

  await Promise.all([
    convert(tileSvg(32, { scale: 0.96 }), 'favicon.ico', 32, 32),
    convert(tileSvg(16, { scale: 1 }), 'favicon-16x16.png', 16, 16),
    convert(tileSvg(32, { scale: 0.96 }), 'favicon-32x32.png', 32, 32),
    convert(tileSvg(180, { rounded: false, scale: 0.8 }), 'apple-touch-icon.png', 180, 180),
    convert(tileSvg(192), 'android-chrome-192x192.png', 192, 192),
    convert(tileSvg(512), 'android-chrome-512x512.png', 512, 512),
    convert(ogSvg, 'og-image.png', 1200, 630),
  ]);

  writeFileSync(`${OUT}/og-image.svg`, ogSvg);
  console.log('  og-image.svg');
  console.log('\nDone — all assets generated.');
}

main().catch(err => { console.error(err); process.exit(1); });
