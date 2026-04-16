const VERCEL_TEAMS = (() => {
  try {
    const raw = process.env.VERCEL_TEAM_IDS || process.env.VERCEL_TEAM_ID || '';
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
})();

const SUPABASE_PROJECTS = (() => {
  try {
    return process.env.SUPABASE_PROJECTS
      ? JSON.parse(process.env.SUPABASE_PROJECTS)
      : [];
  } catch {
    return [];
  }
})();

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

async function supabaseMgmt(path, token) {
  const res = await fetch(`https://api.supabase.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) return null;
  return res.json();
}

async function getSupabaseProjectStats(project, token) {
  const start = Date.now();
  const [details, usage] = await Promise.all([
    supabaseMgmt(`/v1/projects/${project.id}`, token),
    supabaseMgmt(`/v1/projects/${project.id}/usage`, token).catch(() => null),
  ]);
  const latency = Date.now() - start;

  const status = details?.status || 'UNKNOWN';
  const ok = status === 'ACTIVE_HEALTHY';
  const dbVersion = details?.database?.version || null;
  const region = details?.region || null;
  const plan = details?.subscription_id || details?.organization_id ? 'pro' : 'free';
  const createdAt = details?.created_at || null;

  let dbSize = null;
  let storageSize = null;
  let monthlyApiRequests = null;
  if (usage && Array.isArray(usage)) {
    const dbUsage = usage.find(u => u.metric === 'DB_SIZE' || u.metric === 'db_size');
    const stUsage = usage.find(u => u.metric === 'STORAGE_SIZE' || u.metric === 'storage_size');
    const apiUsage = usage.find(u => u.metric === 'MONTHLY_ACTIVE_USERS' || u.metric === 'func_invocations');
    if (dbUsage) dbSize = dbUsage.usage || dbUsage.total;
    if (stUsage) storageSize = stUsage.usage || stUsage.total;
    if (apiUsage) monthlyApiRequests = apiUsage.usage || apiUsage.total;
  }

  return {
    name: project.name,
    id: project.id,
    ok,
    latency,
    status: ok ? 'healthy' : status.toLowerCase(),
    dbVersion,
    region,
    plan,
    createdAt,
    dbSize,
    storageSize,
    monthlyApiRequests,
  };
}

async function fetchTeamStats(teamId, vercelToken, mondayTs, todayTs) {
  const teamParam = `&teamId=${teamId}`;
  const { projects } = await vercelFetch(
    `/v9/projects?limit=50${teamParam}`, vercelToken
  );

  const projectList = (projects || []).map(p => ({ id: p.id, name: p.name }));
  const topProjects = projectList.slice(0, 12);

  let deploymentsToday = 0;
  let deploymentsWeek = 0;
  let totalDeployments = 0;
  let errors = 0;
  let latestDeploy = null;
  const projectDeployments = [];

  await Promise.all(topProjects.map(async (proj) => {
    try {
      const data = await vercelFetch(
        `/v6/deployments?projectId=${proj.id}${teamParam}&limit=20&since=${mondayTs}`,
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

  return {
    teamId,
    totalProjects: projectList.length,
    deploymentsToday,
    deploymentsWeek,
    totalDeployments,
    errors,
    latestDeploy,
    projectDeployments,
  };
}

module.exports = async function fetchInfraStats(opts = {}) {
  const vercelToken = process.env.VERCEL_API_KEY;

  const result = {
    timestamp: new Date().toISOString(),
    vercel: null,
    supabase: null,
  };

  if (vercelToken && VERCEL_TEAMS.length > 0) {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const defaultMondayTs = startOfWeek(now).getTime();
      const todayTs = new Date(today).getTime();

      const rangeDays = opts.days || null;
      const mondayTs = rangeDays
        ? now.getTime() - rangeDays * 86400000
        : defaultMondayTs;

      const teamResults = await Promise.all(
        VERCEL_TEAMS.map(tid => fetchTeamStats(tid, vercelToken, mondayTs, todayTs))
      );

      let totalProjects = 0;
      let deploymentsToday = 0;
      let deploymentsWeek = 0;
      let totalDeployments = 0;
      let totalErrors = 0;
      let latestDeploy = null;
      const allProjectDeployments = [];

      for (const t of teamResults) {
        totalProjects += t.totalProjects;
        deploymentsToday += t.deploymentsToday;
        deploymentsWeek += t.deploymentsWeek;
        totalDeployments += t.totalDeployments;
        totalErrors += t.errors;
        allProjectDeployments.push(...t.projectDeployments);
        if (t.latestDeploy && (!latestDeploy || t.latestDeploy.created > latestDeploy.created)) {
          latestDeploy = t.latestDeploy;
        }
      }

      const successRate = totalDeployments > 0
        ? Math.round(((totalDeployments - totalErrors) / totalDeployments) * 100)
        : 100;

      result.vercel = {
        teams: VERCEL_TEAMS.length,
        totalProjects,
        deploymentsToday,
        deploymentsWeek,
        successRate,
        latestDeploy: latestDeploy ? {
          ...latestDeploy,
          time: new Date(latestDeploy.created).toISOString(),
        } : null,
        activeProjects: allProjectDeployments
          .sort((a, b) => b.week - a.week)
          .slice(0, 8),
      };
    } catch (err) {
      result.vercel = { error: err.message };
    }
  }

  const sbToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (sbToken) {
    try {
      let projectList = SUPABASE_PROJECTS;

      if (projectList.length === 0) {
        const discovered = await supabaseMgmt('/v1/projects', sbToken);
        if (Array.isArray(discovered)) {
          projectList = discovered.map(p => ({
            id: p.id,
            name: p.name,
            host: p.database?.host || `db.${p.id}.supabase.co`,
          }));
        }
      }

      if (projectList.length > 0) {
        const projects = await Promise.all(
          projectList.map(p => getSupabaseProjectStats(p, sbToken))
        );

        const allHealthy = projects.every(h => h.ok);
        const avgLatency = Math.round(
          projects.filter(h => h.latency).reduce((s, h) => s + h.latency, 0) /
          (projects.filter(h => h.latency).length || 1)
        );
        const dbVersions = [...new Set(projects.map(p => p.dbVersion).filter(Boolean))];

        result.supabase = {
          totalProjects: projectList.length,
          healthy: projects.filter(h => h.ok).length,
          allHealthy,
          avgLatency,
          dbVersions,
          projects,
        };
      }
    } catch (err) {
      result.supabase = { error: err.message };
    }
  }

  return result;
};
