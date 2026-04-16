import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['ioredis'],
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/**': ['./api/**/*'],
  },
};

export default nextConfig;
