const DEFAULT_PUBLIC_ORIGIN = 'https://cockpit.rapold.io';
const DEFAULT_REDACT_OWNERS = ['zvvch', 'ALPA-one', 'besyncag', 'rlroomup', 'tmsimba'];

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function publicOrigin() {
  return (process.env.COCKPIT_CORS_ORIGIN || DEFAULT_PUBLIC_ORIGIN).trim();
}

function isPrivateMode() {
  return String(process.env.COCKPIT_EXPOSURE_MODE || 'public').toLowerCase() === 'private';
}

function redactedOwners() {
  return splitCsv(process.env.COCKPIT_PUBLIC_REDACT_OWNERS || DEFAULT_REDACT_OWNERS.join(','));
}

function repoOwner(fullName) {
  return String(fullName || '').split('/')[0] || '';
}

function hashLabel(input) {
  let hash = 5381;
  const text = String(input || 'redacted');
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
  return Math.abs(hash >>> 0).toString(36).slice(0, 5).toUpperCase();
}

function isSensitiveRepo(fullName) {
  const owner = repoOwner(fullName);
  return redactedOwners().some(redacted => redacted.toLowerCase() === owner.toLowerCase());
}

function redactRepoName(fullName) {
  if (!isSensitiveRepo(fullName)) return fullName;
  return `business-repo-${hashLabel(fullName)}`;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', publicOrigin());
  res.setHeader('Vary', 'Origin');
}

function sanitizeCommit(commit) {
  if (!commit || typeof commit !== 'object') return commit;
  const repo = commit.repo || commit.repository?.full_name || commit.name || '';
  if (!isSensitiveRepo(repo)) return commit;
  return {
    ...commit,
    repo: redactRepoName(repo),
    message: 'Commit in redacted business repository',
    url: undefined,
  };
}

function sanitizeGithubStats(data) {
  if (isPrivateMode() || !data || typeof data !== 'object') return data;
  return {
    ...data,
    orgs: ['public + business scopes'],
    activeRepos: Array.isArray(data.activeRepos)
      ? data.activeRepos.map(repo => ({ ...repo, name: redactRepoName(repo.name) }))
      : data.activeRepos,
    lastCommit: sanitizeCommit(data.lastCommit),
    recentCommits: Array.isArray(data.recentCommits)
      ? data.recentCommits.map(sanitizeCommit)
      : data.recentCommits,
    dataSources: data.dataSources ? {
      ...data.dataSources,
      orgs: ['redacted-business-orgs'],
      repoOwners: ['redacted-business-owners'],
      searchScopes: ['public + redacted business scopes'],
      note: 'Public mode redacts business/internal repository names. Private mode contains the full operating view.',
    } : data.dataSources,
  };
}

function sanitizePortfolioProject(project) {
  if (!project || typeof project !== 'object' || !isSensitiveRepo(project.repo)) return project;
  const label = redactRepoName(project.repo);
  return {
    ...project,
    name: `Business initiative ${hashLabel(project.repo)}`,
    purpose: 'Redacted business initiative. Details are available in private mode.',
    work: '',
    lcNote: '',
    forecast: '',
    github: null,
    prod: null,
    vercel: null,
    supabase: null,
    repo: label,
    topics: [],
  };
}

function sanitizePortfolio(data) {
  if (isPrivateMode() || !data || typeof data !== 'object') return data;
  return {
    ...data,
    orgs: ['public + business scopes'],
    projects: Array.isArray(data.projects)
      ? data.projects.map(sanitizePortfolioProject)
      : data.projects,
  };
}

function sanitizeRepos(data) {
  if (isPrivateMode() || !data || typeof data !== 'object') return data;
  const repos = {};
  for (const [key, value] of Object.entries(data.repos || {})) {
    if (!isSensitiveRepo(key)) {
      repos[key] = value;
      continue;
    }
    const label = redactRepoName(key);
    repos[label] = {
      ...value,
      full: label,
      oneLiner: 'Redacted business repository. Details are available in private mode.',
      purpose: 'Public mode hides internal repository purpose, architecture and links.',
      audience: 'Private operating context',
      tags: ['redacted', 'business'],
    };
  }
  return {
    ...data,
    orgs: ['public + business scopes'],
    repos,
    count: Object.keys(repos).length,
  };
}

function sanitizeNarrative(data) {
  if (isPrivateMode()) return data;
  const source = data && typeof data === 'object' ? data : {};
  return {
    generatedAt: source.generatedAt || new Date().toISOString(),
    model: 'public-redacted',
    dataHash: source.dataHash || 'public-redacted',
    teaser: 'Public Cockpit: anonymisierte Engineering-Velocity, Delivery-Signale und Portfolio-Load ohne interne Projekt- oder Kundendetails.',
    extended: [
      'Diese öffentliche Ansicht zeigt aggregierte Engineering-Signale und blendet interne Repository-Namen, URLs, Projektbeschreibungen und strategische Einschätzungen aus.',
      'Die vollständige Delivery-Intelligence bleibt dem privaten Cockpit vorbehalten.',
    ],
    weekly: '',
    strategic: '',
  };
}

function sanitizeInfra(data) {
  if (isPrivateMode() || !data || typeof data !== 'object') return data;
  const supabase = data.supabase ? {
    ...data.supabase,
    projects: Array.isArray(data.supabase.projects)
      ? data.supabase.projects.map((project, index) => ({ ...project, name: `project-${index + 1}` }))
      : data.supabase.projects,
  } : data.supabase;
  const vercel = data.vercel?.latestDeploy ? {
    ...data.vercel,
    latestDeploy: { ...data.vercel.latestDeploy, project: 'redacted-project', url: undefined },
  } : data.vercel;
  return { ...data, vercel, supabase };
}

function sanitizeLanguageStats(data) {
  if (isPrivateMode() || !data || typeof data !== 'object') return data;
  return {
    ...data,
    orgs: ['public + business scopes'],
    languagesByRepo: undefined,
    events: undefined,
  };
}

function sanitizeHealth(data) {
  if (isPrivateMode() || !data || typeof data !== 'object') return data;
  return {
    ...data,
    services: Array.isArray(data.services)
      ? data.services.map((service, index) => ({
          ...service,
          name: `service-${index + 1}`,
          url: undefined,
        }))
      : data.services,
  };
}

function sanitizePublicPayload(kind, data) {
  switch (kind) {
    case 'githubStats': return sanitizeGithubStats(data);
    case 'portfolio': return sanitizePortfolio(data);
    case 'repos': return sanitizeRepos(data);
    case 'narrative': return sanitizeNarrative(data);
    case 'infra': return sanitizeInfra(data);
    case 'languageStats': return sanitizeLanguageStats(data);
    case 'health': return sanitizeHealth(data);
    default: return data;
  }
}

module.exports = {
  publicOrigin,
  isPrivateMode,
  redactedOwners,
  isSensitiveRepo,
  redactRepoName,
  setCors,
  sanitizePublicPayload,
  sanitizeGithubStats,
  sanitizePortfolio,
  sanitizeRepos,
  sanitizeNarrative,
  sanitizeInfra,
  sanitizeLanguageStats,
  sanitizeHealth,
};
