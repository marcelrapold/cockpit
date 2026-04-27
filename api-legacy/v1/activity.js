const { KEYS } = require('../_lib/cache');
const fetchGithubStats = require('../_lib/fetch-github-stats');
const { createV1Handler } = require('../_lib/v1-handler');

module.exports = createV1Handler(KEYS.githubStats, fetchGithubStats, {
  today: 0, week: 0, month: 0, lastCommit: null, activeRepos: [], streak: 0,
});
