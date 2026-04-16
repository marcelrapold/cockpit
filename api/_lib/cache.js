const Redis = require('ioredis');

let redis;
function getClient() {
  if (!redis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL not configured');
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: true,
    });
  }
  return redis;
}

const KEYS = {
  portfolio: 'cache:portfolio',
  githubStats: 'cache:github-stats',
  infraStats: 'cache:infra-stats',
  languageStats: 'cache:language-stats',
  healthCheck: 'cache:health-check',
};

const TTL = 600;

async function get(key) {
  const raw = await getClient().get(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
}

async function set(key, data) {
  return getClient().set(key, JSON.stringify(data), 'EX', TTL);
}

module.exports = { getClient, KEYS, TTL, get, set };
