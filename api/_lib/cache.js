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
  dora: 'cache:dora',
};

const VALID_RANGES = ['7d', '30d', '90d', 'ytd', '12m'];

function parseRange(range) {
  if (!range) return null;
  const r = range.toLowerCase();
  if (!VALID_RANGES.includes(r)) return null;
  return r;
}

function rangeKey(base, range) {
  if (!range || range === '30d') return base;
  return `${base}:${range}`;
}

function rangeToDays(range) {
  if (!range) return 30;
  switch (range) {
    case '7d':  return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '12m': return 365;
    case 'ytd': {
      const now = new Date();
      return Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / 86400000);
    }
    default: return 30;
  }
}

const TTL = 600;

async function get(key) {
  const raw = await getClient().get(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
}

async function set(key, data) {
  return getClient().set(key, JSON.stringify(data), 'EX', TTL);
}

module.exports = { getClient, KEYS, TTL, VALID_RANGES, get, set, rangeKey, parseRange, rangeToDays };
