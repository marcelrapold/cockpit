const { get, KEYS } = require('./_lib/cache');
const fetchPortfolio = require('./_lib/fetch-portfolio');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  try {
    const cached = await get(KEYS.portfolio);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json(data);
    }
  } catch {}

  try {
    const data = await fetchPortfolio();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(200).json({ projects: [], error: err.message });
  }
};
