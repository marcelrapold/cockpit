const ORG = 'zvvch';

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

async function fetchAllOrgRepos(token) {
  const repos = [];
  const pageErrors = [];
  for (let page = 1; page <= 100; page++) {
    const url = `https://api.github.com/orgs/${ORG}/repos?per_page=100&page=${page}&type=all`;
    try {
      const pageRepos = await ghFetch(url, token);
      if (!Array.isArray(pageRepos) || pageRepos.length === 0) break;
      repos.push(...pageRepos);
      if (pageRepos.length < 100) break;
    } catch (err) {
      pageErrors.push({ page, message: err.message });
      break;
    }
  }
  return { repos, pageErrors };
}

function aggregateLanguages(results) {
  const languages = {};
  const languagesByRepo = {};
  const repoErrors = [];

  for (const { name, langs, error } of results) {
    if (error || !langs) {
      if (error) repoErrors.push({ repo: name, error });
      continue;
    }
    languagesByRepo[name] = { ...langs };
    for (const [lang, bytes] of Object.entries(langs)) {
      languages[lang] = (languages[lang] || 0) + bytes;
    }
  }

  return { languages, languagesByRepo, repoErrors };
}

function shortRepoName(fullName) {
  if (!fullName || typeof fullName !== 'string') return '';
  const parts = fullName.split('/');
  return parts.length > 1 ? parts[1] : fullName;
}

function formatTickerEvent(event) {
  const repo = shortRepoName(event.repo?.name);
  const actor = event.actor?.login || '';
  const time = event.created_at || '';
  const base = { type: event.type, repo, actor, time };
  const payload = event.payload || {};

  switch (event.type) {
    case 'PushEvent': {
      const commitsList = Array.isArray(payload.commits) ? payload.commits : [];
      const commitsCount =
        typeof payload.size === 'number' ? payload.size : commitsList.length;
      const last = commitsList.length > 0 ? commitsList[commitsList.length - 1] : null;
      const message = (last?.message || '').split('\n')[0] || '';
      return { ...base, message, commits: commitsCount };
    }
    case 'CreateEvent': {
      const refType = payload.ref_type || '';
      const refName = payload.ref || payload.master_branch || '';
      let message;
      if (refType === 'repository') {
        message = 'created repository';
      } else {
        message = `created ${refType}${refName ? ` ${refName}` : ''}`.trim();
      }
      return { ...base, refType, refName, message };
    }
    case 'IssuesEvent': {
      const action = payload.action || '';
      const title = payload.issue?.title || '';
      const message = title ? `${action}: ${title}` : action;
      return { ...base, action, message };
    }
    case 'PullRequestEvent': {
      const action = payload.action || '';
      const title = payload.pull_request?.title || '';
      const message = title ? `${action}: ${title}` : action;
      return { ...base, action, message };
    }
    default:
      return { ...base, message: event.type.replace(/Event$/, '') };
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800');

  const timestamp = new Date().toISOString();
  const token = process.env.GITHUB_TOKEN;

  const emptyPayload = {
    timestamp,
    languages: {},
    languagesByRepo: {},
    events: [],
  };

  if (!token) {
    return res.status(200).json({
      ...emptyPayload,
      error: 'GITHUB_TOKEN not configured',
    });
  }

  const languages = {};
  const languagesByRepo = {};
  const errors = [];

  let repos = [];
  try {
    const { repos: listed, pageErrors } = await fetchAllOrgRepos(token);
    repos = listed;
    for (const pe of pageErrors) {
      errors.push({ step: 'listRepos', page: pe.page, message: pe.message });
    }
  } catch (err) {
    errors.push({ step: 'listRepos', message: err.message });
  }

  if (repos.length > 0) {
    const langResults = await Promise.all(
      repos.map(async (repo) => {
        const name = repo.name;
        try {
          const langs = await ghFetch(
            `https://api.github.com/repos/${ORG}/${name}/languages`,
            token
          );
          return { name, langs };
        } catch (err) {
          return { name, langs: null, error: err.message };
        }
      })
    );

    const agg = aggregateLanguages(langResults);
    Object.assign(languages, agg.languages);
    Object.assign(languagesByRepo, agg.languagesByRepo);
    for (const e of agg.repoErrors) {
      errors.push({ step: 'repoLanguages', repo: e.repo, message: e.error });
    }
  }

  let events = [];
  let eventsError = null;
  try {
    const raw = await ghFetch(
      `https://api.github.com/orgs/${ORG}/events?per_page=50`,
      token
    );
    const list = Array.isArray(raw) ? raw : [];
    events = list.map(formatTickerEvent).slice(0, 30);
  } catch (err) {
    eventsError = err.message;
    errors.push({ step: 'orgEvents', message: err.message });
  }

  return res.status(200).json({
    timestamp,
    languages,
    languagesByRepo,
    events,
    ...(eventsError && { eventsError }),
    ...(errors.length > 0 && { errors }),
  });
};
