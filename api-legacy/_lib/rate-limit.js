const { getClient } = require('./cache');

const WINDOW_MS = 3600000;
const MAX_REQUESTS = 100;

async function rateLimit(req, res) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
    const hour = Math.floor(Date.now() / WINDOW_MS);
    const key = `ratelimit:${token.slice(0, 8)}:${hour}`;
    const client = getClient();

    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, 3600);
    }

    const remaining = Math.max(0, MAX_REQUESTS - count);
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', (hour + 1) * WINDOW_MS);

    if (count > MAX_REQUESTS) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        limit: MAX_REQUESTS,
        retryAfter: Math.ceil(((hour + 1) * WINDOW_MS - Date.now()) / 1000),
      });
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

module.exports = { rateLimit };
