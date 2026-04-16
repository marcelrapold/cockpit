const DEFAULT_TARGETS = [];

const TARGETS = (() => {
  try {
    return process.env.HEALTH_TARGETS
      ? JSON.parse(process.env.HEALTH_TARGETS)
      : DEFAULT_TARGETS;
  } catch {
    return DEFAULT_TARGETS;
  }
})();

async function check(target) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(target.url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return {
      name: target.name,
      url: target.url,
      status: res.status,
      ok: res.status >= 200 && res.status < 400,
      latency: Date.now() - start,
    };
  } catch (e) {
    return {
      name: target.name,
      url: target.url,
      status: 0,
      ok: false,
      latency: Date.now() - start,
      error: e.name === 'AbortError' ? 'timeout' : e.message,
    };
  }
}

module.exports = async function fetchHealthCheck() {
  if (TARGETS.length === 0) {
    return {
      timestamp: new Date().toISOString(),
      allOk: true,
      up: 0,
      total: 0,
      services: [],
      note: 'No targets configured. Set HEALTH_TARGETS env var or edit api/health-check.js.',
    };
  }

  const results = await Promise.all(TARGETS.map(check));
  const allOk = results.every(r => r.ok);

  return {
    timestamp: new Date().toISOString(),
    allOk,
    up: results.filter(r => r.ok).length,
    total: results.length,
    services: results,
  };
};
