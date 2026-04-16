const { KEYS } = require('../_lib/cache');
const fetchDora = require('../_lib/fetch-dora');
const { createV1Handler } = require('../_lib/v1-handler');

module.exports = createV1Handler(KEYS.dora, fetchDora, {});
