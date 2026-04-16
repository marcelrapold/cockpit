const VERCEL_TEAMS = (() => {
  try {
    const raw = process.env.VERCEL_TEAM_IDS || process.env.VERCEL_TEAM_ID || '';
    return raw.split(',').map(s => s.trim()).filter(Boolean);
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

const TIERS = {
  deployFreq:  { elite: 7,     high: 1,    medium: 1/7,   low: 1/30 },
  leadTime:    { elite: 60,    high: 1440, medium: 10080, low: 43200 },
  cfr:         { elite: 5,     high: 10,   medium: 15,    low: 100 },
  mttr:        { elite: 60,    high: 1440, medium: 10080, low: 43200 },
};

function classifyTier(metric, value) {
  const t = TIERS[metric];
  if (!t) return 'unknown';

  if (metric === 'deployFreq') {
    if (value >= t.elite)  return 'elite';
    if (value >= t.high)   return 'high';
    if (value >= t.medium) return 'medium';
    return 'low';
  }
  // Lower is better for leadTime, cfr, mttr
  if (value <= t.elite)  return 'elite';
  if (value <= t.high)   return 'high';
  if (value <= t.medium) return 'medium';
  return 'low';
}

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function fetchTeamDeploys(teamId, token, sinceTs) {
  const teamParam = `&teamId=${teamId}`;
  const { projects } = await vercelFetch(
    `/v9/projects?limit=50${teamParam}`, token
  );
  const projectList = (projects || []).map(p => ({ id: p.id, name: p.name }));

  const allDeploys = [];
  await Promise.all(projectList.slice(0, 20).map(async (proj) => {
    try {
      const data = await vercelFetch(
        `/v6/deployments?projectId=${proj.id}${teamParam}&limit=100&target=production&since=${sinceTs}`,
        token
      );
      for (const d of (data.deployments || [])) {
        allDeploys.push({
          project: proj.name,
          projectId: proj.id,
          state: d.state,
          created: d.created,
          ready: d.ready || null,
          sha: d.meta?.githubCommitSha || null,
        });
      }
    } catch {}
  }));

  return allDeploys;
}

module.exports = async function fetchDora(opts = {}) {
  const token = process.env.VERCEL_API_KEY;
  if (!token || VERCEL_TEAMS.length === 0) {
    return {
      error: 'VERCEL_API_KEY or VERCEL_TEAM_IDS not configured',
      timestamp: new Date().toISOString(),
    };
  }

  const now = new Date();
  const days = opts.days || 30;
  const sinceTs = now.getTime() - days * 86400000;

  const teamDeploys = await Promise.all(
    VERCEL_TEAMS.map(tid => fetchTeamDeploys(tid, token, sinceTs))
  );
  const allDeploys = teamDeploys.flat().sort((a, b) => a.created - b.created);

  const readyDeploys = allDeploys.filter(d => d.state === 'READY');
  const errorDeploys = allDeploys.filter(d => d.state === 'ERROR');
  const total = allDeploys.filter(d => d.state === 'READY' || d.state === 'ERROR').length;

  // --- Deployment Frequency (per day) ---
  const deploysByDay = {};
  for (const d of readyDeploys) {
    const day = new Date(d.created).toISOString().split('T')[0];
    deploysByDay[day] = (deploysByDay[day] || 0) + 1;
  }
  const deployFreqPerDay = days > 0 ? readyDeploys.length / days : 0;
  const dailyCounts = [];
  for (let i = 0; i < Math.min(days, 30); i++) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().split('T')[0];
    dailyCounts.unshift(deploysByDay[key] || 0);
  }

  // --- Lead Time (pipeline: created → ready, in minutes) ---
  const leadTimes = readyDeploys
    .filter(d => d.ready && d.ready > d.created)
    .map(d => (d.ready - d.created) / 60000);
  const leadTimeMedian = Math.round(median(leadTimes) * 10) / 10;

  // --- Change Failure Rate ---
  const cfr = total > 0 ? Math.round((errorDeploys.length / total) * 1000) / 10 : 0;

  // --- MTTR (time from ERROR to next READY on same project, in minutes) ---
  const mttrValues = [];
  const deploysByProject = {};
  for (const d of allDeploys) {
    if (!deploysByProject[d.project]) deploysByProject[d.project] = [];
    deploysByProject[d.project].push(d);
  }
  for (const projDeps of Object.values(deploysByProject)) {
    for (let i = 0; i < projDeps.length; i++) {
      if (projDeps[i].state === 'ERROR') {
        const recovery = projDeps.slice(i + 1).find(d => d.state === 'READY');
        if (recovery) {
          mttrValues.push((recovery.created - projDeps[i].created) / 60000);
        }
      }
    }
  }
  const mttrMedian = Math.round(median(mttrValues) * 10) / 10;

  // --- Previous period for trends ---
  const prevSinceTs = sinceTs - days * 86400000;
  const prevDeploys = [];
  try {
    const prevTeamDeploys = await Promise.all(
      VERCEL_TEAMS.map(tid => fetchTeamDeploys(tid, token, prevSinceTs))
    );
    for (const td of prevTeamDeploys) {
      prevDeploys.push(...td.filter(d => d.created < sinceTs));
    }
  } catch {}

  const prevReady = prevDeploys.filter(d => d.state === 'READY');
  const prevErrors = prevDeploys.filter(d => d.state === 'ERROR');
  const prevTotal = prevDeploys.filter(d => d.state === 'READY' || d.state === 'ERROR').length;
  const prevFreq = days > 0 ? prevReady.length / days : 0;
  const prevCfr = prevTotal > 0 ? Math.round((prevErrors.length / prevTotal) * 1000) / 10 : 0;

  const prevLeadTimes = prevReady
    .filter(d => d.ready && d.ready > d.created)
    .map(d => (d.ready - d.created) / 60000);
  const prevLeadTimeMedian = Math.round(median(prevLeadTimes) * 10) / 10;

  function trend(current, prev) {
    if (!prev || prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / prev) * 100);
  }

  return {
    timestamp: new Date().toISOString(),
    period: { days, since: new Date(sinceTs).toISOString(), until: now.toISOString() },
    metrics: {
      deployFrequency: {
        value: Math.round(deployFreqPerDay * 100) / 100,
        unit: '/day',
        tier: classifyTier('deployFreq', deployFreqPerDay),
        trend: trend(deployFreqPerDay, prevFreq),
        total: readyDeploys.length,
        sparkline: dailyCounts,
      },
      leadTime: {
        value: leadTimeMedian,
        unit: 'min',
        tier: classifyTier('leadTime', leadTimeMedian),
        trend: trend(prevLeadTimeMedian, leadTimeMedian),
        samples: leadTimes.length,
      },
      changeFailureRate: {
        value: cfr,
        unit: '%',
        tier: classifyTier('cfr', cfr),
        trend: trend(prevCfr, cfr),
        errors: errorDeploys.length,
        total,
      },
      mttr: {
        value: mttrMedian,
        unit: 'min',
        tier: classifyTier('mttr', mttrMedian),
        incidents: mttrValues.length,
      },
    },
    tiers: TIERS,
  };
};
