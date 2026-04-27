import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['ioredis', 'ai', '@ai-sdk/gateway', 'zod'],
  reactStrictMode: true,
};

export default nextConfig;
