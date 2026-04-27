const { get, KEYS } = require('./_lib/cache');

// Public read-only endpoint — never triggers the LLM. The cron at /api/cron/refresh-llm
// is the single writer for cache:narrative. If the cache is empty (first deploy / Redis flush)
// we return a 503 so the client can fall back to its bundled JSON.
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  try {
    const cached = await get(KEYS.narrative);
    if (cached) return res.status(200).json(cached);
  } catch (err) {
    return res.status(200).json({
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    error: 'narrative not yet generated',
    hint: 'cron /api/cron/refresh-llm has not produced an artifact yet',
    timestamp: new Date().toISOString(),
  });
};
