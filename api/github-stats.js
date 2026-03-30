const ORG = 'zvvch';
const USER = 'muraschal';

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

function startOfWeek(d) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=600');

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(200).json({
      error: 'GITHUB_TOKEN not configured',
      today: 0, week: 0, month: 0, lastCommit: null,
      activeRepos: [], streak: 0, timestamp: new Date().toISOString(),
    });
  }

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const monday = startOfWeek(now).toISOString().split('T')[0];
    const monthStart = `${today.slice(0, 7)}-01`;

    const baseQ = `org:${ORG} author:${USER}`;

    const [todayData, weekData, monthData, recentData, events] = await Promise.all([
      searchCommits(`${baseQ} committer-date:${today}`, token),
      searchCommits(`${baseQ} committer-date:>=${monday}`, token),
      searchCommits(`${baseQ} committer-date:>=${monthStart}`, token),
      searchCommits(`${baseQ} committer-date:>=${monday}`, token, 12),
      ghFetch(`https://api.github.com/users/${USER}/events?per_page=100`, token),
    ]);

    const pushEvents = (Array.isArray(events) ? events : [])
      .filter(e => e.type === 'PushEvent' && e.org?.login === ORG);

    const lastPush = pushEvents[0];
    const lastCommit = lastPush ? {
      message: (lastPush.payload.commits?.slice(-1)[0]?.message || '').split('\n')[0],
      repo: lastPush.repo.name.replace(`${ORG}/`, ''),
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
        const repo = (item.repository?.full_name || '').replace(`${ORG}/`, '');
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
        const repo = e.repo.name.replace(`${ORG}/`, '');
        weekRepos[repo] = (weekRepos[repo] || 0) + (e.payload.size || 0);
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

    return res.status(200).json({
      today: todayData.total_count || 0,
      week: weekData.total_count || 0,
      month: monthData.total_count || 0,
      lastCommit,
      recentCommits,
      activeRepos: Object.entries(weekRepos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, commits]) => ({ name, commits })),
      streak,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    return res.status(200).json({
      error: err.message,
      today: 0, week: 0, month: 0, lastCommit: null,
      activeRepos: [], streak: 0, timestamp: new Date().toISOString(),
    });
  }
};
