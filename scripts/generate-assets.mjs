#!/usr/bin/env node
/**
 * Generates SVG-based assets: OG image, favicons, Apple touch icon.
 * Pure SVG → no image dependencies needed.
 */
import { writeFileSync, mkdirSync } from 'fs';

const OUT = 'public';
const APP_NAME = process.env.APP_NAME || 'Workload-Portfolio';
const APP_DOMAIN = process.env.APP_DOMAIN || 'your-portfolio.vercel.app';
const APP_REPO_LABEL = process.env.APP_REPO_LABEL || 'Fork me on GitHub';

// OG Image (1200x630)
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
  <!-- Grid pattern -->
  <g opacity="0.04" stroke="#fff" stroke-width="0.5">
    ${Array.from({length: 30}, (_, i) => `<line x1="${i*42}" y1="0" x2="${i*42}" y2="630"/>`).join('')}
    ${Array.from({length: 16}, (_, i) => `<line x1="0" y1="${i*42}" x2="1200" y2="${i*42}"/>`).join('')}
  </g>
  <!-- Accent bar -->
  <rect x="0" y="0" width="6" height="630" fill="url(#accent)"/>
  <!-- Title -->
  <text x="80" y="145" font-family="Helvetica Neue, Arial, sans-serif" font-size="52" font-weight="700" fill="#ffffff">${APP_NAME}</text>
  <!-- Subtitle -->
  <text x="80" y="190" font-family="Helvetica Neue, Arial, sans-serif" font-size="22" fill="#94a3b8">Live KPIs · Commit Calendar · Uptime Monitor · Tech Stack</text>
  <!-- Divider -->
  <rect x="80" y="220" width="120" height="3" rx="1.5" fill="#3b82f6"/>
  <!-- KPIs -->
  <g font-family="Helvetica Neue, Arial, sans-serif" fill="#ffffff">
    <text x="80" y="290" font-size="44" font-weight="700">GitHub</text>
    <text x="80" y="315" font-size="14" fill="#64748b">Commit Activity</text>
    <text x="300" y="290" font-size="44" font-weight="700">Vercel</text>
    <text x="300" y="315" font-size="14" fill="#64748b">Deploy Stats</text>
    <text x="520" y="290" font-size="44" font-weight="700">Supabase</text>
    <text x="520" y="315" font-size="14" fill="#64748b">Database Health</text>
    <text x="780" y="290" font-size="44" font-weight="700">Uptime</text>
    <text x="780" y="315" font-size="14" fill="#64748b">Service Monitor</text>
  </g>
  <!-- Mini heatmap visualization -->
  <g transform="translate(80, 370)">
    ${(() => {
      const rows = 7, cols = 40;
      let cells = '';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const intensity = Math.random();
          const color = intensity < 0.3 ? '#0e4429' : intensity < 0.5 ? '#006d32' : intensity < 0.7 ? '#26a641' : '#39d353';
          const opacity = intensity < 0.15 ? 0.1 : intensity;
          cells += `<rect x="${c*14}" y="${r*14}" width="11" height="11" rx="2" fill="${color}" opacity="${opacity}"/>`;
        }
      }
      return cells;
    })()}
  </g>
  <!-- Footer -->
  <text x="80" y="590" font-family="Helvetica Neue, Arial, sans-serif" font-size="13" fill="#475569">${APP_DOMAIN}</text>
  <text x="1120" y="590" font-family="Helvetica Neue, Arial, sans-serif" font-size="13" fill="#475569" text-anchor="end">${APP_REPO_LABEL}</text>
</svg>`;

// Favicon SVG (32x32 logical)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#1e293b"/>
  <text x="16" y="22" font-family="Helvetica Neue, Arial, sans-serif" font-size="16" font-weight="700" fill="#ffffff" text-anchor="middle">W</text>
  <rect x="4" y="26" width="24" height="2.5" rx="1.25" fill="#3b82f6"/>
</svg>`;

// Apple touch icon (180x180)
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="36" fill="#1e293b"/>
  <text x="90" y="105" font-family="Helvetica Neue, Arial, sans-serif" font-size="72" font-weight="700" fill="#ffffff" text-anchor="middle">W</text>
  <rect x="30" y="130" width="120" height="10" rx="5" fill="#3b82f6"/>
  <text x="90" y="160" font-family="Helvetica Neue, Arial, sans-serif" font-size="16" font-weight="500" fill="#94a3b8" text-anchor="middle">Portfolio</text>
</svg>`;

writeFileSync(`${OUT}/og-image.svg`, ogSvg);
writeFileSync(`${OUT}/favicon.svg`, faviconSvg);
writeFileSync(`${OUT}/apple-touch-icon.svg`, appleSvg);
console.log('✓ Generated og-image.svg, favicon.svg, apple-touch-icon.svg');
