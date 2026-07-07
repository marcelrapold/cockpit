const CONFIG = require('../portfolio-config.json');

const EXCLUDE_SET = new Set(CONFIG.exclude || []);

function repoName(fullName) {
  return String(fullName || '').split('/').pop() || '';
}

function isExcludedRepo(fullName) {
  const name = repoName(fullName).toLowerCase();
  return EXCLUDE_SET.has(fullName) || name.includes('demo');
}

function filterRepos(repos) {
  return (repos || []).filter(repo => !isExcludedRepo(repo.full_name || repo.name));
}

module.exports = {
  EXCLUDE_SET,
  filterRepos,
  isExcludedRepo,
};
