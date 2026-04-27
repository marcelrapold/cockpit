const { get, KEYS, rangeKey, parseRange } = require('./_lib/cache');
const fetchGithubStats = require('./_lib/fetch-github-stats');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  const range = parseRange(req.query?.range);
  const cacheKey = rangeKey(KEYS.githubStats, range);

  try {
    const cached = await get(cacheKey);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json(data);
    }
  } catch {}

  try {
    const data = await fetchGithubStats(range ? { range } : {});
    return res.status(200).json(data);
  } catch (err) {
    return res.status(200).json({
      error: err.message,
      today: 0, week: 0, month: 0, lastCommit: null,
      activeRepos: [], streak: 0, timestamp: new Date().toISOString(),
    });
  }
};
