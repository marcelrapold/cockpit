const { get, KEYS } = require('./_lib/cache');
const { sanitizeHealth, setCors } = require('./_lib/exposure');
const fetchHealthCheck = require('./_lib/fetch-health-check');

module.exports = async function handler(req, res) {
  setCors(res);
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  try {
    const cached = await get(KEYS.healthCheck);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json(sanitizeHealth(data));
    }
  } catch {}

  try {
    const data = await fetchHealthCheck();
    return res.status(200).json(sanitizeHealth(data));
  } catch (err) {
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      allOk: false,
      up: 0,
      total: 0,
      services: [],
      error: err.message,
    });
  }
};
