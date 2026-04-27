function authenticate(req, res) {
  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  const validToken = (process.env.API_TOKEN || '').trim();

  if (!validToken) {
    res.status(503).json({ error: 'API authentication not configured' });
    return false;
  }
  if (!token || token !== validToken) {
    res.status(401).json({ error: 'Unauthorized — Bearer token required' });
    return false;
  }
  return true;
}

module.exports = { authenticate };
