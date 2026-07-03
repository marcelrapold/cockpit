const { get, KEYS, rangeKey, parseRange, rangeToDays } = require('./_lib/cache');
const { sanitizeInfra, setCors } = require('./_lib/exposure');
const fetchInfraStats = require('./_lib/fetch-infra-stats');

module.exports = async function handler(req, res) {
  setCors(res);
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  const range = parseRange(req.query?.range);
  const cacheKey = rangeKey(KEYS.infraStats, range);

  try {
    const cached = await get(cacheKey);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json(sanitizeInfra(data));
    }
  } catch {}

  try {
    const opts = range ? { days: rangeToDays(range) } : {};
    const data = await fetchInfraStats(opts);
    return res.status(200).json(sanitizeInfra(data));
  } catch (err) {
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      vercel: null,
      supabase: null,
      error: err.message,
    });
  }
};
