const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KEYS = {
  portfolio: 'cache:portfolio',
  githubStats: 'cache:github-stats',
  infraStats: 'cache:infra-stats',
  languageStats: 'cache:language-stats',
  healthCheck: 'cache:health-check',
};

const TTL = 600;

async function get(key) {
  return redis.get(key);
}

async function set(key, data) {
  return redis.set(key, JSON.stringify(data), { ex: TTL });
}

module.exports = { redis, KEYS, TTL, get, set };
