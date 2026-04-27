const fetchRepoSummaries = require('../_lib/fetch-repo-summaries');
const fetchNarrative = require('../_lib/fetch-narrative');

// Single writer for cache:narrative + cache:repos. Triggered by Vercel Cron on a slow schedule
// (see vercel.json — every 6h). Each fetcher does its own hash-skip, so the actual LLM call
// only happens when input data has materially changed.
//
// Order matters: repo-summaries first, because the narrative pipeline enriches its top repos
// with the freshly-cached summaries.
module.exports = async function handler(req, res) {
  const secret = (process.env.CRON_SECRET || '').trim();
  if (!secret || req.headers['authorization'] !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const force = req.query?.force === '1' || req.query?.force === 'true';
  const start = Date.now();
  const summary = [];

  try {
    const r = await fetchRepoSummaries({ force });
    summary.push({
      job: 'repos',
      status: 'fulfilled',
      skipped: r.skipped,
      reason: r.reason,
      count: r.payload?.count,
      hash: r.payload?.listHash,
    });
  } catch (err) {
    summary.push({ job: 'repos', status: 'rejected', error: err.message });
  }

  try {
    const n = await fetchNarrative({ force });
    summary.push({
      job: 'narrative',
      status: 'fulfilled',
      skipped: n.skipped,
      reason: n.reason,
      hash: n.payload?.dataHash,
    });
  } catch (err) {
    summary.push({ job: 'narrative', status: 'rejected', error: err.message });
  }

  const fulfilled = summary.filter(s => s.status === 'fulfilled').length;
  const skipped = summary.filter(s => s.skipped).length;

  return res.status(200).json({
    refreshed: new Date().toISOString(),
    duration: `${Date.now() - start}ms`,
    ok: fulfilled === summary.length,
    skippedCount: skipped,
    summary,
  });
};
