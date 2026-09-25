import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Liegt das Projekt in einem Ordner mit weiterem Lockfile darueber, waehlt Next
  // sonst dessen Verzeichnis als Tracing-Wurzel und packt fremde Dateien ein.
  outputFileTracingRoot: process.cwd(),
  // Die Skills liegen als Markdown im Repo und werden zur Build-/Request-Zeit
  // via fs gelesen. Ohne dieses Tracing fehlen die Dateien im Serverless-Bundle.
  outputFileTracingIncludes: {
    '/api/skills': ['./skills/**/*'],
    '/api/skills/[slug]': ['./skills/**/*'],
    '/s/[...path]': ['./skills/**/*'],
    '/llms.txt': ['./skills/**/*'],
    '/skills/[slug]': ['./skills/**/*'],
    '/': ['./skills/**/*'],
  },
};

export default nextConfig;
