const { parseRange, rangeToDays } = require('./_lib/cache');
const fetchDora = require('./_lib/fetch-dora');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'private, no-cache, max-age=0, must-revalidate');

  const range = parseRange(req.query?.range);

  // Do not read Redis here — poisoned or CDN-stale portfolio-shaped blobs were still served.
  // Cron continues to populate KEYS.dora for /api/v1/dora and summary; this route always live-fetches.

  try {
    const data = await fetchDora({ days: rangeToDays(range) });
    if (data && typeof data === 'object' && Array.isArray(data.projects) && !data.metrics) {
      const err = new Error('fetch-dora returned portfolio-shaped JSON (module resolution bug)');
      console.error('[legacy-dora-route]', err.message);
      throw err;
    }
    return res.json(data);
  } catch (err) {
    const days = rangeToDays(range);
    return res.status(200).json({
      ...fetchDora.buildEmptyDoraPayload(days),
      error: err.message,
    });
  }
};
