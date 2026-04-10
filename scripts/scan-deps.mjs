#!/usr/bin/env node
/**
 * Scans org repos for dependencies (local + GitHub API fallback).
 * Outputs to public/data-deps.json
 *
 * Configure via environment variables:
 *   GITHUB_ORG      - GitHub organization name (required for GitHub scan)
 *   GITHUB_TOKEN    - GitHub personal access token
 *   GITHUB_USER     - Your GitHub username (for contributor filtering)
 *   SCAN_ROOT       - Local directory path for local scan mode
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { execSync } from 'child_process';

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const ORG = process.env.GITHUB_ORG || 'your-org';
const LOCAL_ROOT = process.env.SCAN_ROOT || '';
const SKIP = new Set(['.github', 'node_modules']);
const MY_AUTHORS = (process.env.GITHUB_USER || '').split(',').map(s => s.trim()).filter(Boolean);

const CATEGORIES = {
  'next': 'Framework', 'react': 'Framework', 'react-dom': 'Framework', 'vue': 'Framework',
  'express': 'Framework', 'fastapi': 'Framework', 'vite': 'Build',
  '@supabase/supabase-js': 'Backend', '@supabase/ssr': 'Backend',
  'resend': 'Backend', '@upstash/redis': 'Backend', '@vercel/kv': 'Backend',
  'tailwindcss': 'Styling', '@radix-ui': 'UI Components',
  'zod': 'Validation', 'typescript': 'Language',
  'eslint': 'Tooling', 'prettier': 'Tooling', 'vitest': 'Testing',
  '@playwright/test': 'Testing', 'jest': 'Testing',
  'chart.js': 'Visualization', 'echarts': 'Visualization', 'recharts': 'Visualization',
  'd3': 'Visualization', 'leaflet': 'Visualization', 'react-leaflet': 'Visualization',
  'three': '3D/ML', '@react-three/fiber': '3D/ML', '@react-three/drei': '3D/ML',
  '@mediapipe': '3D/ML', '@tensorflow': '3D/ML',
  'framer-motion': 'Animation', 'mermaid': 'Visualization',
  'ai': 'AI/LLM', '@ai-sdk': 'AI/LLM', 'openai': 'AI/LLM',
  '@modelcontextprotocol/sdk': 'AI/LLM',
  'exceljs': 'Data', 'sharp': 'Media',
  '@vercel/analytics': 'Analytics',
};

function categorize(pkg) {
  for (const [prefix, cat] of Object.entries(CATEGORIES)) {
    if (pkg === prefix || pkg.startsWith(prefix + '/')) return cat;
  }
  if (pkg.startsWith('@radix-ui/')) return 'UI Components';
  if (pkg.startsWith('@ai-sdk/')) return 'AI/LLM';
  if (pkg.startsWith('@tensorflow/')) return '3D/ML';
  if (pkg.startsWith('@mediapipe/')) return '3D/ML';
  return 'Other';
}

function scanLocal(root) {
  const repos = {};
  const dirs = readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory() && !SKIP.has(d.name) && !d.name.startsWith('.'));

  for (const dir of dirs) {
    const name = dir.name;
    const gitDir = join(root, name, '.git');
    if (existsSync(gitDir)) {
      try {
        const authorCheck = MY_AUTHORS.map(a => `--author=${a}`).join(' ');
        const out = execSync(
          `git log ${authorCheck} --max-count=1 --format=%H`,
          { cwd: join(root, name), timeout: 5000, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }
        ).trim();
        if (!out) { continue; }
      } catch { continue; }
    }
    const pkgPaths = [
      join(root, name, 'package.json'),
      join(root, name, name, 'package.json'),
    ];
    const reqPaths = [
      join(root, name, 'requirements.txt'),
    ];

    let deps = {};
    let devDeps = {};
    let framework = null;

    for (const p of pkgPaths) {
      if (existsSync(p)) {
        try {
          const pkg = JSON.parse(readFileSync(p, 'utf8'));
          deps = { ...deps, ...(pkg.dependencies || {}) };
          devDeps = { ...devDeps, ...(pkg.devDependencies || {}) };

          if (deps.next || devDeps.next) framework = 'Next.js';
          else if (deps.vite || devDeps.vite) framework = 'Vite';
          else if (deps.express) framework = 'Express';
          else if (devDeps['@vitejs/plugin-react']) framework = 'Vite + React';
        } catch {}
        break;
      }
    }

    let pythonDeps = [];
    for (const p of reqPaths) {
      if (existsSync(p)) {
        try {
          const lines = readFileSync(p, 'utf8').split('\n')
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('#'));
          pythonDeps = lines.map(l => {
            const m = l.match(/^([a-zA-Z0-9_-]+(\[[^\]]+\])?)/);
            return m ? { name: m[1].replace(/\[.*\]/, ''), spec: l } : null;
          }).filter(Boolean);
          if (!framework) {
            if (pythonDeps.some(d => d.name === 'fastapi')) framework = 'FastAPI';
            else framework = 'Python';
          }
        } catch {}
      }
    }

    const allDeps = Object.keys(deps).length + Object.keys(devDeps).length + pythonDeps.length;
    if (allDeps === 0) continue;

    repos[name] = {
      framework,
      dependencies: Object.entries(deps).map(([n, v]) => ({ name: n, version: v, dev: false })),
      devDependencies: Object.entries(devDeps).map(([n, v]) => ({ name: n, version: v, dev: true })),
      pythonDeps,
      totalDeps: Object.keys(deps).length,
      totalDevDeps: Object.keys(devDeps).length,
      totalPythonDeps: pythonDeps.length,
    };
  }
  return repos;
}

async function scanGitHub() {
  if (!TOKEN) return {};

  const repos = {};
  const repoList = await fetch(`https://api.github.com/orgs/${ORG}/repos?per_page=100`, {
    headers: { Authorization: `token ${TOKEN}`, Accept: 'application/vnd.github+json' },
  }).then(r => r.json());

  for (const repo of (Array.isArray(repoList) ? repoList : [])) {
    if (SKIP.has(repo.name)) continue;
    try {
      const contribRes = await fetch(
        `https://api.github.com/repos/${ORG}/${repo.name}/contributors?per_page=100`,
        { headers: { Authorization: `token ${TOKEN}`, Accept: 'application/vnd.github+json' } }
      );
      if (MY_AUTHORS.length > 0 && contribRes.ok) {
        const contribs = await contribRes.json();
        const logins = (Array.isArray(contribs) ? contribs : []).map(c => c.login?.toLowerCase());
        if (!MY_AUTHORS.some(a => logins.includes(a.toLowerCase()))) {
          continue;
        }
      }
      const content = await fetch(
        `https://api.github.com/repos/${ORG}/${repo.name}/contents/package.json`,
        { headers: { Authorization: `token ${TOKEN}`, Accept: 'application/vnd.github.raw+json' } }
      );
      if (!content.ok) continue;
      const pkg = await content.json();
      const deps = pkg.dependencies || {};
      const devDeps = pkg.devDependencies || {};

      let framework = null;
      if (deps.next || devDeps.next) framework = 'Next.js';
      else if (deps.vite || devDeps.vite) framework = 'Vite';
      else if (deps.express) framework = 'Express';

      repos[repo.name] = {
        framework,
        dependencies: Object.entries(deps).map(([n, v]) => ({ name: n, version: v, dev: false })),
        devDependencies: Object.entries(devDeps).map(([n, v]) => ({ name: n, version: v, dev: true })),
        pythonDeps: [],
        totalDeps: Object.keys(deps).length,
        totalDevDeps: Object.keys(devDeps).length,
        totalPythonDeps: 0,
      };
    } catch {}
  }
  return repos;
}

async function main() {
  console.log('Scanning dependencies...');

  let repos;
  if (LOCAL_ROOT && existsSync(LOCAL_ROOT)) {
    console.log(`Local scan: ${LOCAL_ROOT}`);
    repos = scanLocal(LOCAL_ROOT);
  } else {
    console.log('GitHub API scan...');
    repos = await scanGitHub();
  }

  const pkgUsage = {};
  const categoryCount = {};
  const frameworkCount = {};

  for (const [repoName, data] of Object.entries(repos)) {
    if (data.framework) {
      frameworkCount[data.framework] = (frameworkCount[data.framework] || 0) + 1;
    }
    const allPkgs = [...data.dependencies, ...data.devDependencies];
    for (const pkg of allPkgs) {
      const cat = categorize(pkg.name);
      if (!pkgUsage[pkg.name]) pkgUsage[pkg.name] = { repos: [], category: cat, dev: pkg.dev };
      pkgUsage[pkg.name].repos.push(repoName);
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }
    for (const dep of data.pythonDeps) {
      const cat = categorize(dep.name);
      if (!pkgUsage[dep.name]) pkgUsage[dep.name] = { repos: [], category: cat, dev: false, python: true };
      pkgUsage[dep.name].repos.push(repoName);
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }
  }

  const topPackages = Object.entries(pkgUsage)
    .map(([name, data]) => ({ name, count: data.repos.length, category: data.category, repos: data.repos }))
    .sort((a, b) => b.count - a.count);

  const output = {
    generated: new Date().toISOString(),
    repoCount: Object.keys(repos).length,
    uniquePackages: Object.keys(pkgUsage).length,
    repos: Object.fromEntries(
      Object.entries(repos).map(([name, data]) => [name, {
        framework: data.framework,
        totalDeps: data.totalDeps,
        totalDevDeps: data.totalDevDeps,
        totalPythonDeps: data.totalPythonDeps,
      }])
    ),
    topPackages: topPackages.slice(0, 60),
    categories: Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    frameworks: Object.entries(frameworkCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };

  writeFileSync('public/data-deps.json', JSON.stringify(output));
  console.log(`✓ ${Object.keys(repos).length} repos, ${Object.keys(pkgUsage).length} unique packages`);
}

main().catch(e => { console.error(e); process.exit(1); });
