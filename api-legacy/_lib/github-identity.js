const DEFAULT_USER = 'muraschal';
const VALID_SCOPES = new Set(['all', 'private', 'organizations', 'zvv']);

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function maskEmail(email) {
  const [name, domain] = String(email).split('@');
  if (!name || !domain) return '***';
  return `${name.slice(0, 2)}***@${domain}`;
}

function parseScope(scope) {
  const raw = String(scope || process.env.GITHUB_SCOPE || 'all').toLowerCase();
  return VALID_SCOPES.has(raw) ? raw : 'all';
}

function getGithubIdentity() {
  const primaryLogin = process.env.GITHUB_USER || DEFAULT_USER;
  const configuredAuthorLogins = splitCsv(
    process.env.GITHUB_AUTHOR_LOGINS || process.env.GITHUB_AUTHOR_USERS,
  );
  const authorLogins = uniq([primaryLogin, ...configuredAuthorLogins]);
  const authorEmails = uniq(splitCsv(process.env.GITHUB_AUTHOR_EMAILS));
  const humanAuthors = uniq(splitCsv(process.env.GITHUB_HUMAN_AUTHORS || primaryLogin));

  return {
    primaryLogin,
    authorLogins,
    authorEmails,
    humanAuthors,
    commitAuthorQueries: [
      ...authorLogins.map(login => ({ kind: 'login', value: login, query: `author:${login}` })),
      ...authorEmails.map(email => ({ kind: 'email', value: email, query: `author-email:${email}` })),
    ],
    public: {
      primaryLogin,
      authorLogins,
      authorEmailCount: authorEmails.length,
      authorEmailsMasked: authorEmails.map(maskEmail),
    },
  };
}

function getGithubOwners() {
  const identity = getGithubIdentity();
  const orgs = uniq(splitCsv(process.env.GITHUB_ORGS));
  const repoOwners = uniq([
    identity.primaryLogin,
    ...identity.authorLogins,
    ...splitCsv(process.env.GITHUB_REPO_OWNERS),
  ]);
  const zvvOrgs = uniq(splitCsv(process.env.GITHUB_ZVV_ORGS));
  const detectedZvvOrgs = orgs.filter(org => /(^|[-_])zvv|zvv/i.test(org));

  return {
    orgs,
    repoOwners,
    zvvOrgs: zvvOrgs.length ? zvvOrgs : detectedZvvOrgs,
  };
}

function buildCommitSearchScopes(scopeInput) {
  const scope = parseScope(scopeInput);
  const owners = getGithubOwners();
  const userOwners = owners.repoOwners.filter(owner => !owners.orgs.includes(owner));

  let scopes;
  switch (scope) {
    case 'organizations':
      scopes = owners.orgs.map(org => `org:${org}`);
      break;
    case 'zvv':
      scopes = owners.zvvOrgs.map(org => `org:${org}`);
      break;
    case 'private':
      scopes = [
        ...owners.orgs.map(org => `org:${org} is:private`),
        ...userOwners.map(owner => `user:${owner} is:private`),
      ];
      break;
    case 'all':
    default:
      scopes = [
        ...owners.orgs.map(org => `org:${org}`),
        ...userOwners.map(owner => `user:${owner}`),
      ];
      break;
  }

  return {
    scope,
    scopes: uniq(scopes),
    owners,
  };
}

module.exports = {
  splitCsv,
  uniq,
  maskEmail,
  parseScope,
  getGithubIdentity,
  getGithubOwners,
  buildCommitSearchScopes,
};
