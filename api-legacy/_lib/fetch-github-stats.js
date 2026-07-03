const {
  buildCommitSearchScopes,
  getGithubIdentity,
} = require('./github-identity');

const COMMIT_SEARCH_MAX_PAGES = Number(process.env.GITHUB_COMMIT_SEARCH_MAX_PAGES || 1);

async function ghSearch(url, token) {
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub ${res.status}: ${body.slice(0, 160) || url}`);
  }
  return res.json();
}

async function searchCommitItems(query, token, maxPages = COMMIT_SEARCH_MAX_PAGES) {
  const items = [];
  let truncated = false;
  let totalCount = 0;

  for (let page = 1; page <= maxPages; page++) {
    const url =
      `https://api.github.com/search/commits?q=${encodeURIComponent(query)}` +
      `&sort=committer-date&order=desc&per_page=100&page=${page}`;
    const data = await ghSearch(url, token);
    totalCount = data.total_count || totalCount;
    const pageItems = data.items || [];
    items.push(...pageItems);

    if (pageItems.length < 100 || items.length >= (data.total_count || 0)) break;
    if (page === maxPages) truncated = true;
  }

  return { items, totalCount, truncated };
}

async function searchCommitItemsAcross(scopes, authorQueries, dateQ, token, opts = {}) {
  const maxPages = opts.maxPages || COMMIT_SEARCH_MAX_PAGES;
  const queryParts = [];

  for (const scope of scopes) {
    for (const author of authorQueries) {
      queryParts.push({
        scope,
        author,
        query: [scope, author.query, dateQ].filter(Boolean).join(' '),
      });
    }
  }

  const chunks = await Promise.all(
    queryParts.map(part =>
      searchCommitItems(part.query, token, maxPages).then(result => ({ ...result, part })),
    ),
  );

  const seen = new Map();
  const truncatedQueries = [];
  let totalCount = 0;

  for (const chunk of chunks) {
    if (chunk.truncated) truncatedQueries.push(chunk.part.query);
    totalCount += chunk.totalCount || 0;
    for (const item of chunk.items) {
      const repo = item.repository?.full_name || item.repository?.name || 'unknown';
      const key = `${repo}:${item.sha}`;
      if (item.sha && !seen.has(key)) seen.set(key, item);
    }
  }

  const items = [...seen.values()].sort((a, b) => {
    const da = commitDate(a) || '';
    const db = commitDate(b) || '';
    return db.localeCompare(da);
  });

  return {
    total_count: totalCount,
    items,
    queryCount: queryParts.length,
    truncated: truncatedQueries.length > 0,
    truncatedQueries,
  };
}

async function searchIssues(query, token) {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=100`;
  return ghSearch(url, token).catch(() => ({ total_count: 0, items: [] }));
}

async function searchIssuesAcross(scopes, logins, issueQ, token) {
  const queries = [];
  for (const scope of scopes) {
    for (const login of logins) {
      queries.push([scope, issueQ(login)].filter(Boolean).join(' '));
    }
  }

  const chunks = await Promise.all(queries.map(query => searchIssues(query, token)));
  const seen = new Set();
  for (const chunk of chunks) {
    for (const item of chunk.items || []) {
      if (item.html_url) seen.add(item.html_url);
    }
  }
  return { total_count: seen.size };
}

function startOfWeek(d) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function toDateString(d) {
  return d.toISOString().split('T')[0];
}

function daysAgo(now, days) {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d;
}

function rangeToDays(range) {
  if (!range) return null;
  const m = String(range).match(/^(\d+)([dwmy])$/i);
  if (m) {
    const n = parseInt(m[1], 10);
    switch (m[2].toLowerCase()) {
      case 'd': return n;
      case 'w': return n * 7;
      case 'm': return n * 30;
      case 'y': return n * 365;
      default: return null;
    }
  }
  if (range === 'ytd') {
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((now - jan1) / 86400000);
  }
  return null;
}

function commitDate(item) {
  return item.commit?.committer?.date || item.commit?.author?.date || null;
}

function commitDateOnly(item) {
  return commitDate(item)?.split('T')[0] || null;
}

function toRecentCommit(item) {
  const msg = (item.commit?.message || '').split('\n')[0];
  const repo = item.repository?.full_name || '';
  return {
    sha: item.sha?.slice(0, 7),
    message: msg.length > 72 ? `${msg.slice(0, 69)}...` : msg,
    repo,
    time: commitDate(item),
    url: item.html_url,
  };
}

function repoCounts(items) {
  const counts = {};
  for (const item of items) {
    const repo = item.repository?.full_name || item.repository?.name;
    if (!repo) continue;
    counts[repo] = (counts[repo] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, commits]) => ({ name, commits }));
}

function itemCount(items) {
  return items.length;
}

function dailyCounts(items, now, days) {
  const byDate = new Map();
  for (const item of items) {
    const d = commitDateOnly(item);
    if (d) byDate.set(d, (byDate.get(d) || 0) + 1);
  }

  const output = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = toDateString(daysAgo(now, i));
    output.push({ date: d, count: byDate.get(d) || 0 });
  }
  return output;
}

function currentStreak(items, now, today) {
  const dates = new Set(items.map(commitDateOnly).filter(Boolean));
  let streak = 0;
  const checkDate = new Date(now);
  if (!dates.has(today)) checkDate.setDate(checkDate.getDate() - 1);

  while (true) {
    const ds = toDateString(checkDate);
    if (!dates.has(ds)) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}

function fallbackPayload(error) {
  return {
    error,
    today: 0,
    week: 0,
    month: 0,
    lastCommit: null,
    activeRepos: [],
    streak: 0,
    timestamp: new Date().toISOString(),
  };
}

module.exports = async function fetchGithubStats(opts = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return fallbackPayload('GITHUB_TOKEN not configured');

  const identity = getGithubIdentity();
  const source = buildCommitSearchScopes(opts.scope);
  const scopes = source.scopes;
  const authorQueries = identity.commitAuthorQueries;

  if (!scopes.length || !authorQueries.length) {
    return fallbackPayload('GitHub identity or source scope not configured');
  }

  const now = new Date();
  const today = toDateString(now);
  const monday = toDateString(startOfWeek(now));
  const rolling30Since = toDateString(daysAgo(now, 30));

  const rangeDays = rangeToDays(opts.range);
  const rangeSince = rangeDays ? toDateString(daysAgo(now, rangeDays)) : null;

  const prevMonday = new Date(startOfWeek(now));
  prevMonday.setDate(prevMonday.getDate() - 7);
  const prevSunday = new Date(prevMonday);
  prevSunday.setDate(prevSunday.getDate() + 6);
  const prevMondayStr = toDateString(prevMonday);
  const prevSundayStr = toDateString(prevSunday);

  const issueScopes = source.scope === 'all'
    ? ['']
    : scopes;

  const queries = [
    searchCommitItemsAcross(scopes, authorQueries, `committer-date:${today}`, token),
    searchCommitItemsAcross(scopes, authorQueries, `committer-date:>=${monday}`, token),
    searchCommitItemsAcross(scopes, authorQueries, `committer-date:>=${rolling30Since}`, token),
    searchCommitItemsAcross(scopes, authorQueries, `committer-date:${prevMondayStr}..${prevSundayStr}`, token),
    searchIssuesAcross(issueScopes, identity.authorLogins, login => `is:issue is:open assignee:${login}`, token),
    searchIssuesAcross(issueScopes, identity.authorLogins, login => `is:pr is:open author:${login}`, token),
  ];

  if (rangeSince) {
    queries.push(searchCommitItemsAcross(scopes, authorQueries, `committer-date:>=${rangeSince}`, token));
  }

  const results = await Promise.all(queries);
  const [todayData, weekData, monthData, prevWeekData, openIssues, openPRs] = results;
  const rangeData = rangeSince ? results[6] : null;

  const last = monthData.items[0] || weekData.items[0] || todayData.items[0] || null;
  const lastCommit = last ? {
    message: (last.commit?.message || '').split('\n')[0],
    repo: last.repository?.full_name || last.repository?.name || '',
    time: commitDate(last),
  } : null;

  const recentCommits = monthData.items
    .filter(item => {
      const msg = (item.commit?.message || '').split('\n')[0];
      return !msg.startsWith('Merge') && !msg.startsWith('chore: update dashboard');
    })
    .slice(0, 10)
    .map(toRecentCommit);

  const weekCount = weekData.total_count || 0;
  const prevWeekCount = prevWeekData.total_count || 0;
  const velocityPct = prevWeekCount > 0
    ? Math.round(((weekCount - prevWeekCount) / prevWeekCount) * 100)
    : (weekCount > 0 ? 100 : 0);

  const monthCount = monthData.total_count || 0;
  const avgPerDay = +(monthCount / 30).toFixed(1);
  const sparkDays = Math.min(rangeDays || 30, 90);
  const sparkItems = rangeData?.items || monthData.items;
  const sparkline = dailyCounts(sparkItems, now, sparkDays).map(dc => dc.count);

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
    activeRepos: repoCounts(weekData.items),
    streak: currentStreak(monthData.items, now, today),
    orgs: source.owners.orgs,
    scope: source.scope,
    dataSources: {
      scope: source.scope,
      orgs: source.owners.orgs,
      repoOwners: source.owners.repoOwners,
      searchScopes: scopes.map(scope => scope || 'global-accessible'),
      commitIdentity: identity.public,
      note: 'scope=all searches every configured org plus explicit repo owner for the configured author mapping. Item lists are deduplicated; KPI totals use GitHub search total_count per configured author query.',
    },
    identity: identity.public,
    queryStats: {
      commitSearchMaxPages: COMMIT_SEARCH_MAX_PAGES,
      todayQueries: todayData.queryCount,
      weekQueries: weekData.queryCount,
      monthQueries: monthData.queryCount,
      sampledWeekItems: itemCount(weekData.items),
      sampledMonthItems: itemCount(monthData.items),
      truncated:
        todayData.truncated ||
        weekData.truncated ||
        monthData.truncated ||
        prevWeekData.truncated ||
        Boolean(rangeData?.truncated),
    },
    sparkline,
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
