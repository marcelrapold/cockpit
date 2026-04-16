const { set, KEYS } = require('../_lib/cache');
const fetchPortfolio = require('../_lib/fetch-portfolio');
const fetchGithubStats = require('../_lib/fetch-github-stats');
const fetchInfraStats = require('../_lib/fetch-infra-stats');
const fetchLanguageStats = require('../_lib/fetch-language-stats');
const fetchHealthCheck = require('../_lib/fetch-health-check');

module.exports = async function handler(req, res) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const start = Date.now();

  const results = await Promise.allSettled([
    fetchPortfolio().then(d => set(KEYS.portfolio, d)),
    fetchGithubStats().then(d => set(KEYS.githubStats, d)),
    fetchInfraStats().then(d => set(KEYS.infraStats, d)),
    fetchLanguageStats().then(d => set(KEYS.languageStats, d)),
    fetchHealthCheck().then(d => set(KEYS.healthCheck, d)),
  ]);

  const keyNames = Object.keys(KEYS);
  const summary = results.map((r, i) => ({
    key: keyNames[i],
    status: r.status,
    ...(r.reason && { error: r.reason.message }),
  }));

  const fulfilled = results.filter(r => r.status === 'fulfilled').length;

  return res.status(200).json({
    refreshed: new Date().toISOString(),
    duration: `${Date.now() - start}ms`,
    ok: fulfilled === results.length,
    summary,
  });
};
