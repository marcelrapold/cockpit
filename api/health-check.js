const TARGETS = [
  { name: 'ZVV Mailer', url: 'https://mailer.zvv.ch' },
  { name: 'ZVV TAMA', url: 'https://tama.zvv.ch' },
  { name: 'ZVV Entdeckungsreise', url: 'https://entdeckungsreise.zvv.ch' },
  { name: 'ZVV Kontrollapp', url: 'https://kontrollapp.zvv.dev' },
  { name: 'ZVV KontoRadar', url: 'https://kontoradar.zvv.dev' },
  { name: 'ZVV Medienspiegel', url: 'https://medienspiegel.zvv.dev' },
  { name: 'ZVV PDF2Text', url: 'https://pdf2text.rapold.io' },
  { name: 'ZVV App Modal', url: 'https://appmodal.zvv.ch' },
  { name: 'ZVV App Banner', url: 'https://appbanner.zvv.ch' },
  { name: 'ZVV Kundenkonto', url: 'https://kundenkonto.zvv.dev' },
  { name: 'ZVV Fahrplan', url: 'https://fahrplan.zvv.dev' },
  { name: 'ZVV Lottie', url: 'https://lottie.zvv.dev' },
  { name: 'ZVV Testimonials', url: 'https://testimonials.zvv.ch' },
];

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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=120');

  const results = await Promise.all(TARGETS.map(check));
  const allOk = results.every(r => r.ok);

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    allOk,
    up: results.filter(r => r.ok).length,
    total: results.length,
    services: results,
  });
};
