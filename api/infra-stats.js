const VERCEL_TEAM = 'team_lLeixJvuVuXTtChUs2G9qKUL';

const SUPABASE_PROJECTS = [
  { id: 'tlevzyumphawvwmshgiw', name: 'ZVV Mailer', host: 'db.tlevzyumphawvwmshgiw.supabase.co' },
  { id: 'idiwijltdmhzxyqmzsor', name: 'Entdeckungsreise', host: 'db.idiwijltdmhzxyqmzsor.supabase.co' },
  { id: 'jvalxijthygyinyahhqo', name: 'ZVV TAMA', host: 'db.jvalxijthygyinyahhqo.supabase.co' },
  { id: 'ecojqvbmmzatjzabbttg', name: 'Medienspiegel', host: 'db.ecojqvbmmzatjzabbttg.supabase.co' },
  { id: 'gwpkjbufvktcrpwjoxwy', name: 'Mailer Integration', host: 'db.gwpkjbufvktcrpwjoxwy.supabase.co' },
];

async function vercelFetch(path, token) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Vercel ${res.status}: ${path}`);
  return res.json();
}

function startOfWeek(d) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

async function checkSupabaseHealth(project) {
  const url = `https://${project.id}.supabase.co/rest/v1/`;
  try {
    const start = Date.now();
    const res = await fetch(url, {
      headers: { apikey: 'placeholder' },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;
    const ok = res.status < 500;
    return { name: project.name, ok, latency, status: ok ? 'healthy' : 'degraded' };
  } catch {
    return { name: project.name, ok: false, latency: null, status: 'unreachable' };
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');

  const vercelToken = process.env.VERCEL_API_KEY;

  const result = {
    timestamp: new Date().toISOString(),
    vercel: null,
    supabase: null,
  };

  if (vercelToken) {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const mondayTs = startOfWeek(now).getTime();
      const todayTs = new Date(today).getTime();

      const { projects } = await vercelFetch(
        `/v9/projects?teamId=${VERCEL_TEAM}&limit=50`, vercelToken
      );

      const projectList = (projects || []).map(p => ({ id: p.id, name: p.name }));
      const topProjects = projectList.slice(0, 8);

      let deploymentsToday = 0;
      let deploymentsWeek = 0;
      let totalDeployments = 0;
      let errors = 0;
      let latestDeploy = null;
      const projectDeployments = [];

      await Promise.all(topProjects.map(async (proj) => {
        try {
          const data = await vercelFetch(
            `/v6/deployments?projectId=${proj.id}&teamId=${VERCEL_TEAM}&limit=20&since=${mondayTs}`,
            vercelToken
          );
          const deps = data.deployments || [];
          let projToday = 0, projWeek = 0, projErrors = 0;

          deps.forEach(d => {
            if (d.created >= todayTs) { deploymentsToday++; projToday++; }
            if (d.created >= mondayTs) { deploymentsWeek++; projWeek++; }
            totalDeployments++;
            if (d.state === 'ERROR') { errors++; projErrors++; }
            if (!latestDeploy || d.created > latestDeploy.created) {
              latestDeploy = {
                project: proj.name,
                state: d.state,
                created: d.created,
                message: d.meta?.githubCommitMessage?.split('\n')[0] || '',
                sha: d.meta?.githubCommitSha?.slice(0, 7) || '',
              };
            }
          });

          if (projWeek > 0) {
            projectDeployments.push({
              name: proj.name, today: projToday, week: projWeek, errors: projErrors,
            });
          }
        } catch {}
      }));

      const successRate = totalDeployments > 0
        ? Math.round(((totalDeployments - errors) / totalDeployments) * 100)
        : 100;

      result.vercel = {
        totalProjects: projectList.length,
        deploymentsToday,
        deploymentsWeek,
        successRate,
        latestDeploy: latestDeploy ? {
          ...latestDeploy,
          time: new Date(latestDeploy.created).toISOString(),
        } : null,
        activeProjects: projectDeployments
          .sort((a, b) => b.week - a.week)
          .slice(0, 6),
      };
    } catch (err) {
      result.vercel = { error: err.message };
    }
  }

  try {
    const healthChecks = await Promise.all(SUPABASE_PROJECTS.map(checkSupabaseHealth));
    const allHealthy = healthChecks.every(h => h.ok);
    const avgLatency = Math.round(
      healthChecks.filter(h => h.latency).reduce((s, h) => s + h.latency, 0) /
      healthChecks.filter(h => h.latency).length || 0
    );

    result.supabase = {
      totalProjects: SUPABASE_PROJECTS.length,
      healthy: healthChecks.filter(h => h.ok).length,
      allHealthy,
      avgLatency,
      projects: healthChecks,
    };
  } catch (err) {
    result.supabase = { error: err.message };
  }

  return res.status(200).json(result);
};
