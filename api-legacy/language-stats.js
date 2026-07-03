const { get, KEYS } = require('./_lib/cache');
const { sanitizeLanguageStats, setCors } = require('./_lib/exposure');
const fetchLanguageStats = require('./_lib/fetch-language-stats');

module.exports = async function handler(req, res) {
  setCors(res);
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  try {
    const cached = await get(KEYS.languageStats);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json(sanitizeLanguageStats(data));
    }
  } catch {}

  try {
    const data = await fetchLanguageStats();
    return res.status(200).json(sanitizeLanguageStats(data));
  } catch (err) {
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      languages: {},
      languagesByRepo: {},
      events: [],
      error: err.message,
    });
  }
};
