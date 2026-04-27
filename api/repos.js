const { get, KEYS } = require('./_lib/cache');

// Public read-only endpoint — never triggers the LLM. See api/narrative.js for the contract.
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');

  try {
    const cached = await get(KEYS.repos);
    if (cached) return res.status(200).json(cached);
  } catch (err) {
    return res.status(200).json({
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    error: 'repo summaries not yet generated',
    hint: 'cron /api/cron/refresh-llm has not produced an artifact yet',
    timestamp: new Date().toISOString(),
  });
};
