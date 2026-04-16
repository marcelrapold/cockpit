const { KEYS } = require('../_lib/cache');
const fetchHealthCheck = require('../_lib/fetch-health-check');
const { createV1Handler } = require('../_lib/v1-handler');

module.exports = createV1Handler(KEYS.healthCheck, fetchHealthCheck, {
  allOk: false, up: 0, total: 0, services: [],
});
