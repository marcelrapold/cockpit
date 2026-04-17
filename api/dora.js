const {
  get,
  KEYS,
  rangeKey,
  parseRange,
  rangeToDays,
  isPoisonedDoraCache,
  isDoraRedisKey,
} = require('./_lib/cache');
const fetchDora = require('./_lib/fetch-dora');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  const range = parseRange(req.query?.range);
  const cacheKey = rangeKey(KEYS.dora, range);

  try {
    const cached = await get(cacheKey);
    if (cached) {
      if (isDoraRedisKey(cacheKey) && isPoisonedDoraCache(cached)) {
        res.setHeader('X-Dora-Cache', 'reject-poisoned');
      } else {
        res.setHeader('X-Dora-Cache', 'hit');
        return res.json(cached);
      }
    }
  } catch {}

  try {
    const data = await fetchDora({ days: rangeToDays(range) });
    if (!res.getHeader('X-Dora-Cache')) res.setHeader('X-Dora-Cache', 'fetch-live');
    return res.json(data);
  } catch (err) {
    const days = rangeToDays(range);
    return res.status(200).json({
      ...fetchDora.buildEmptyDoraPayload(days),
      error: err.message,
    });
  }
};
