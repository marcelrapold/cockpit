#!/usr/bin/env node
/**
 * Generates all brand assets: favicon (SVG+PNG+ICO), apple-touch-icon,
 * android chrome icons, and OG image. Uses sharp for SVG→PNG conversion.
 */
import { writeFileSync } from 'fs';
import sharp from 'sharp';

const OUT = 'public';
const APP_NAME = process.env.APP_NAME || 'Cockpit';
const APP_DOMAIN = process.env.APP_DOMAIN || 'cockpit.rapold.io';

// ---------------------------------------------------------------------------
// Favicon: stylized gauge / tachometer icon
// ---------------------------------------------------------------------------
function faviconSvg(size) {
  const s = size;
  const cx = s / 2, cy = s / 2;
  const r = s * 0.38;
  const needleLen = s * 0.28;
  const tickR = s * 0.32;
  const innerR = s * 0.06;
  const cornerR = s * 0.1875;

  const ticks = [];
  for (let deg = 210; deg >= -30; deg -= 30) {
    const rad = (deg * Math.PI) / 180;
    const x1 = cx + tickR * Math.cos(rad);
    const y1 = cy - tickR * Math.sin(rad);
    const x2 = cx + r * Math.cos(rad);
    const y2 = cy - r * Math.sin(rad);
    ticks.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#475569" stroke-width="${Math.max(1, s * 0.04)}" stroke-linecap="round"/>`);
  }

  const needleAngle = 30;
  const rad = (needleAngle * Math.PI) / 180;
  const nx = cx + needleLen * Math.cos(rad);
  const ny = cy - needleLen * Math.sin(rad);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">
  <rect width="${s}" height="${s}" rx="${cornerR}" fill="#0f172a"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1e293b" stroke-width="${Math.max(2, s * 0.06)}"/>
  ${ticks.join('\n  ')}
  <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#3b82f6" stroke-width="${Math.max(1.5, s * 0.05)}" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="#3b82f6"/>
  <rect x="${s * 0.15}" y="${s * 0.82}" width="${s * 0.7}" height="${s * 0.07}" rx="${s * 0.035}" fill="#005093"/>
</svg>`;
}

// ---------------------------------------------------------------------------
// Apple touch icon: gauge + label
// ---------------------------------------------------------------------------
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <rect width="180" height="180" rx="36" fill="#0f172a"/>
  <g transform="translate(90, 72)">
    <circle cx="0" cy="0" r="42" fill="none" stroke="#1e293b" stroke-width="6"/>
    ${(() => {
      const ticks = [];
      for (let deg = 210; deg >= -30; deg -= 30) {
        const rad = (deg * Math.PI) / 180;
        ticks.push(`<line x1="${(36 * Math.cos(rad)).toFixed(1)}" y1="${(-36 * Math.sin(rad)).toFixed(1)}" x2="${(42 * Math.cos(rad)).toFixed(1)}" y2="${(-42 * Math.sin(rad)).toFixed(1)}" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>`);
      }
      return ticks.join('\n    ');
    })()}
    <line x1="0" y1="0" x2="${(30 * Math.cos((30 * Math.PI) / 180)).toFixed(1)}" y2="${(-30 * Math.sin((30 * Math.PI) / 180)).toFixed(1)}" stroke="#3b82f6" stroke-width="4" stroke-linecap="round"/>
    <circle cx="0" cy="0" r="5" fill="#3b82f6"/>
  </g>
  <rect x="30" y="130" width="120" height="6" rx="3" fill="#005093"/>
  <text x="90" y="158" font-family="system-ui, Helvetica, Arial, sans-serif" font-size="16" font-weight="600" fill="#94a3b8" text-anchor="middle">${APP_NAME}</text>
</svg>`;

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
  const fav32Svg = faviconSvg(32);
  const fav16Svg = faviconSvg(16);
  const fav192Svg = faviconSvg(192);
  const fav512Svg = faviconSvg(512);

  writeFileSync(`${OUT}/favicon.svg`, faviconSvg(32));
  console.log('  favicon.svg');

  const convert = async (svg, outFile, width, height) => {
    const buf = Buffer.from(svg);
    const opts = { width, height };
    if (outFile.endsWith('.png')) {
      await sharp(buf).resize(opts).png().toFile(`${OUT}/${outFile}`);
    } else if (outFile.endsWith('.ico')) {
      await sharp(buf).resize(opts).png().toFile(`${OUT}/${outFile}`);
    }
    console.log(`  ${outFile}`);
  };

  await Promise.all([
    convert(fav32Svg, 'favicon.ico', 32, 32),
    convert(fav16Svg, 'favicon-16x16.png', 16, 16),
    convert(fav32Svg, 'favicon-32x32.png', 32, 32),
    convert(appleSvg, 'apple-touch-icon.png', 180, 180),
    convert(fav192Svg, 'android-chrome-192x192.png', 192, 192),
    convert(fav512Svg, 'android-chrome-512x512.png', 512, 512),
    convert(ogSvg, 'og-image.png', 1200, 630),
  ]);

  writeFileSync(`${OUT}/og-image.svg`, ogSvg);
  console.log('  og-image.svg');
  console.log('\nDone — all assets generated.');
}

main().catch(err => { console.error(err); process.exit(1); });
