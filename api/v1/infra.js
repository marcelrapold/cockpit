const { KEYS } = require('../_lib/cache');
const fetchInfraStats = require('../_lib/fetch-infra-stats');
const { createV1Handler } = require('../_lib/v1-handler');

module.exports = createV1Handler(KEYS.infraStats, fetchInfraStats, {
  vercel: null, supabase: null,
});
