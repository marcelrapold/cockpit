const { KEYS } = require('../_lib/cache');
const fetchLanguageStats = require('../_lib/fetch-language-stats');
const { createV1Handler } = require('../_lib/v1-handler');

module.exports = createV1Handler(KEYS.languageStats, fetchLanguageStats, {
  languages: {}, languagesByRepo: {}, events: [],
});
