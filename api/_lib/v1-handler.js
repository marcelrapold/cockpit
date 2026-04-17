const { authenticate } = require('./auth');
const { rateLimit } = require('./rate-limit');
const { get, rangeKey, parseRange, rangeToDays, isValidDoraCachePayload, isDoraRedisKey } = require('./cache');

function createV1Handler(cacheBaseKey, fetcher, fallbackData) {
  return async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!authenticate(req, res)) return;
    if (!(await rateLimit(req, res))) return;

    const range = parseRange(req.query?.range);
    const cacheKey = rangeKey(cacheBaseKey, range);

    try {
      const cached = await get(cacheKey);
      if (
        cached &&
        !(isDoraRedisKey(cacheKey) && !isValidDoraCachePayload(cached))
      ) {
        return res.json(cached);
      }
    } catch {}

    try {
      const opts = range ? { range, days: rangeToDays(range) } : {};
      const data = await fetcher(opts);
      return res.json(data);
    } catch (err) {
      return res.status(200).json(fallbackData
        ? { ...fallbackData, error: err.message, timestamp: new Date().toISOString() }
        : { error: err.message, timestamp: new Date().toISOString() }
      );
    }
  };
}

module.exports = { createV1Handler };
