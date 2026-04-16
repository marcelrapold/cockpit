const USER = process.env.GITHUB_USER || 'muraschal';
const ORGS = (process.env.GITHUB_ORGS || '').split(',').map(s => s.trim()).filter(Boolean);

const SCOPES = [
  ...ORGS.map(o => `org:${o}`),
  `user:${USER}`,
];

async function ghFetch(url, token) {
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${url}`);
  return res.json();
}

async function searchCommits(query, token, perPage = 1) {
  const res = await fetch(
    `https://api.github.com/search/commits?q=${encodeURIComponent(query)}&sort=committer-date&order=desc&per_page=${perPage}`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );
  if (!res.ok) return { total_count: 0, items: [] };
  return res.json();
}

async function searchCommitsMultiScope(scopes, authorQ, dateQ, token, perPage = 1) {
  const results = await Promise.all(
    scopes.map(scope =>
      searchCommits(`${scope} ${authorQ} ${dateQ}`, token, perPage)
    )
  );
  let totalCount = 0;
  const allItems = [];
  for (const r of results) {
    totalCount += r.total_count || 0;
    if (r.items) allItems.push(...r.items);
  }
  allItems.sort((a, b) => {
    const da = a.commit?.committer?.date || '';
    const db = b.commit?.committer?.date || '';
    return db.localeCompare(da);
  });
  return { total_count: totalCount, items: allItems.slice(0, perPage) };
}

async function searchIssues(query, token) {
  const res = await fetch(
    `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=1`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );
  if (!res.ok) return { total_count: 0 };
  return res.json();
}

function startOfWeek(d) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function rangeToDays(range) {
  if (!range) return null;
  const m = range.match(/^(\d+)([dwmy])$/i);
  if (m) {
    const n = parseInt(m[1], 10);
    switch (m[2].toLowerCase()) {
      case 'd': return n;
      case 'w': return n * 7;
      case 'm': return n * 30;
      case 'y': return n * 365;
    }
  }
  if (range === 'ytd') {
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((now - jan1) / 86400000);
  }
  return null;
}

module.exports = async function fetchGithubStats(opts = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return {
      error: 'GITHUB_TOKEN not configured',
      today: 0, week: 0, month: 0, lastCommit: null,
      activeRepos: [], streak: 0, timestamp: new Date().toISOString(),
    };
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const monday = startOfWeek(now).toISOString().split('T')[0];
  const monthStart = `${today.slice(0, 7)}-01`;

  const rangeDays = rangeToDays(opts.range);
  const rangeSince = rangeDays
    ? new Date(now.getTime() - rangeDays * 86400000).toISOString().split('T')[0]
    : null;

  const authorQ = `author:${USER}`;

  const prevMonday = new Date(startOfWeek(now));
  prevMonday.setDate(prevMonday.getDate() - 7);
  const prevSunday = new Date(prevMonday);
  prevSunday.setDate(prevSunday.getDate() + 6);
  const prevMondayStr = prevMonday.toISOString().split('T')[0];
  const prevSundayStr = prevSunday.toISOString().split('T')[0];

  const issueScopes = ORGS.length > 0
    ? ORGS.map(o => `org:${o}`).join(' ')
    : `author:${USER}`;

  const queries = [
    searchCommitsMultiScope(SCOPES, authorQ, `committer-date:${today}`, token),
    searchCommitsMultiScope(SCOPES, authorQ, `committer-date:>=${monday}`, token),
    searchCommitsMultiScope(SCOPES, authorQ, `committer-date:>=${monthStart}`, token),
    searchCommitsMultiScope(SCOPES, authorQ, `committer-date:${prevMondayStr}..${prevSundayStr}`, token),
    searchCommitsMultiScope(SCOPES, authorQ, `committer-date:>=${monday}`, token, 30),
    ghFetch(`https://api.github.com/users/${USER}/events?per_page=100`, token),
    searchIssues(`${issueScopes} is:issue is:open assignee:${USER}`, token).catch(() => ({ total_count: 0 })),
    searchIssues(`${issueScopes} is:pr is:open author:${USER}`, token).catch(() => ({ total_count: 0 })),
  ];

  if (rangeSince) {
    queries.push(
      searchCommitsMultiScope(SCOPES, authorQ, `committer-date:>=${rangeSince}`, token)
    );
  }

  const results = await Promise.all(queries);
  const [todayData, weekData, monthData, prevWeekData, recentData, events, openIssues, openPRs] = results;
  const rangeData = rangeSince ? results[8] : null;

  const allEvents = Array.isArray(events) ? events : [];
  const pushEvents = allEvents.filter(e => e.type === 'PushEvent');

  const lastPush = pushEvents[0];
  const lastCommit = lastPush ? {
    message: (lastPush.payload.commits?.slice(-1)[0]?.message || '').split('\n')[0],
    repo: lastPush.repo.name,
    time: lastPush.created_at,
  } : null;

  const recentCommits = (recentData.items || [])
    .filter(item => {
      const msg = (item.commit?.message || '').split('\n')[0];
      return !msg.startsWith('Merge') && !msg.startsWith('chore: update dashboard');
    })
    .slice(0, 10)
    .map(item => {
      const msg = (item.commit?.message || '').split('\n')[0];
      const repo = item.repository?.full_name || '';
      return {
        sha: item.sha?.slice(0, 7),
        message: msg.length > 72 ? msg.slice(0, 69) + '…' : msg,
        repo,
        time: item.commit?.committer?.date || item.commit?.author?.date,
        url: item.html_url,
      };
    });

  const weekRepos = {};
  pushEvents.forEach(e => {
    const d = e.created_at?.split('T')[0];
    if (d && d >= monday) {
      const repo = e.repo.name;
      const count = e.payload.size || e.payload.distinct_size || (e.payload.commits ? e.payload.commits.length : 0) || 1;
      weekRepos[repo] = (weekRepos[repo] || 0) + count;
    }
  });

  const streakDates = new Set();
  pushEvents.forEach(e => {
    if (e.created_at) streakDates.add(e.created_at.split('T')[0]);
  });
  let streak = 0;
  const checkDate = new Date(now);
  if (!streakDates.has(today)) checkDate.setDate(checkDate.getDate() - 1);
  while (true) {
    const ds = checkDate.toISOString().split('T')[0];
    if (streakDates.has(ds)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }

  const weekCount = weekData.total_count || 0;
  const prevWeekCount = prevWeekData.total_count || 0;
  const velocityPct = prevWeekCount > 0
    ? Math.round(((weekCount - prevWeekCount) / prevWeekCount) * 100)
    : (weekCount > 0 ? 100 : 0);

  const monthCount = monthData.total_count || 0;
  const dayOfMonth = now.getDate();
  const avgPerDay = dayOfMonth > 0 ? +(monthCount / dayOfMonth).toFixed(1) : 0;

  // Daily commit counts for sparkline (last N days based on range or default 30)
  const sparkDays = Math.min(rangeDays || 30, 90);
  const dailyCommits = [];
  for (let i = sparkDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0];
    dailyCommits.push({ date: d, count: 0 });
  }
  pushEvents.forEach(e => {
    const d = e.created_at?.split('T')[0];
    const entry = dailyCommits.find(dc => dc.date === d);
    if (entry) {
      entry.count += e.payload.size || e.payload.distinct_size || (e.payload.commits ? e.payload.commits.length : 0) || 1;
    }
  });

  const result = {
    today: todayData.total_count || 0,
    week: weekCount,
    month: monthCount,
    prevWeek: prevWeekCount,
    velocity: velocityPct,
    avgPerDay,
    openIssues: openIssues.total_count || 0,
    openPRs: openPRs.total_count || 0,
    lastCommit,
    recentCommits,
    activeRepos: Object.entries(weekRepos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, commits]) => ({ name, commits })),
    streak,
    orgs: ORGS,
    sparkline: dailyCommits.map(dc => dc.count),
    timestamp: now.toISOString(),
  };

  if (rangeData) {
    result.rangeTotal = rangeData.total_count || 0;
    result.rangeDays = rangeDays;
    result.rangeAvgPerDay = rangeDays > 0
      ? +(result.rangeTotal / rangeDays).toFixed(1)
      : 0;
  }

  return result;
};
