import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['ioredis', 'ai', '@ai-sdk/gateway', 'zod'],
  reactStrictMode: true,
  // Statische JSON-Inputs müssen ins Bundle der LLM-Cron-Route, sonst kann
  // fetch-narrative.js sie zur Runtime nicht via fs.readFileSync() lesen.
  // Scope strikt auf diese eine Route — der frühere Wildcard `/**` führte
  // zu Bundle-Dedup-Problemen mit der App-Router-Erkennung.
  outputFileTracingIncludes: {
    '/api/cron/refresh-llm': [
      './data/private/data.json',
      './data/private/data-deps.json',
      './data/private/data-history.json',
      './data/private/data-repos.json',
      './api-legacy/portfolio-config.json',
    ],
  },
};

export default nextConfig;
