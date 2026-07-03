const { get, KEYS, rangeKey, parseRange, parseScope } = require('./_lib/cache');
const { sanitizeGithubStats, setCors } = require('./_lib/exposure');
const fetchGithubStats = require('./_lib/fetch-github-stats');

module.exports = async function handler(req, res) {
  setCors(res);
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  const range = parseRange(req.query?.range);
  const scope = parseScope(req.query?.scope);
  const cacheKey = rangeKey(KEYS.githubStats, range, scope);

  try {
    const cached = await get(cacheKey);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json(sanitizeGithubStats(data));
    }
  } catch {}

  try {
    const data = await fetchGithubStats({ ...(range ? { range } : {}), ...(scope ? { scope } : {}) });
    if (data?.error) {
      res.setHeader('Cache-Control', 'private, no-cache, max-age=0, must-revalidate');
    }
    return res.status(200).json(sanitizeGithubStats(data));
  } catch (err) {
    res.setHeader('Cache-Control', 'private, no-cache, max-age=0, must-revalidate');
    return res.status(200).json({
      error: err.message,
      today: 0, week: 0, month: 0, lastCommit: null,
      activeRepos: [], streak: 0, timestamp: new Date().toISOString(),
    });
  }
};
