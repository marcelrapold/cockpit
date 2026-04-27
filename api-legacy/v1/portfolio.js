const { KEYS } = require('../_lib/cache');
const fetchPortfolio = require('../_lib/fetch-portfolio');
const { createV1Handler } = require('../_lib/v1-handler');

module.exports = createV1Handler(KEYS.portfolio, fetchPortfolio, { projects: [] });
