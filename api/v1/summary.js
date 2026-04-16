const { authenticate } = require('../_lib/auth');
const { rateLimit } = require('../_lib/rate-limit');
const { get, KEYS } = require('../_lib/cache');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!authenticate(req, res)) return;
  if (!(await rateLimit(req, res))) return;

  const [dora, github, infra, portfolio, health] = await Promise.all([
    get(KEYS.dora).catch(() => null),
    get(KEYS.githubStats).catch(() => null),
    get(KEYS.infraStats).catch(() => null),
    get(KEYS.portfolio).catch(() => null),
    get(KEYS.healthCheck).catch(() => null),
  ]);

  const summary = {
    timestamp: new Date().toISOString(),
    dora: dora?.metrics || null,
    commits: github ? {
      today: github.today,
      week: github.week,
      month: github.month,
      avgPerDay: github.avgPerDay,
      velocity: github.velocity,
      streak: github.streak,
    } : null,
    infra: infra ? {
      vercelProjects: infra.vercel?.totalProjects || 0,
      deploymentsToday: infra.vercel?.deploymentsToday || 0,
      deploymentsWeek: infra.vercel?.deploymentsWeek || 0,
      deploySuccessRate: infra.vercel?.successRate || null,
      supabaseProjects: infra.supabase?.totalProjects || 0,
      supabaseHealthy: infra.supabase?.healthy || 0,
    } : null,
    portfolio: portfolio ? {
      totalProjects: portfolio.total,
      orgs: portfolio.orgs,
    } : null,
    health: health ? {
      allOk: health.allOk,
      up: health.up,
      total: health.total,
    } : null,
  };

  return res.json(summary);
};
