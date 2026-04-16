const { get, KEYS, rangeKey, parseRange, rangeToDays } = require('./_lib/cache');
const fetchDora = require('./_lib/fetch-dora');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  const range = parseRange(req.query?.range);
  const cacheKey = rangeKey(KEYS.dora, range);

  try {
    const cached = await get(cacheKey);
    if (cached) return res.json(cached);
  } catch {}

  try {
    const data = await fetchDora({ days: rangeToDays(range) });
    return res.json(data);
  } catch (err) {
    return res.status(200).json({
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
};
