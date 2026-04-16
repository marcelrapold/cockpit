import { test, expect } from '@playwright/test';

const token = process.env.PLAYWRIGHT_API_TOKEN || process.env.API_TOKEN;
const describeWithToken = token ? test.describe : test.describe.skip;

test.describe('API v1 — öffentliche Fehlercodes', () => {
  test('GET /api/v1/summary ohne Token → 401 oder 503', async ({ request }) => {
    const res = await request.get('/api/v1/summary');
    expect([401, 503]).toContain(res.status());
  });
});

describeWithToken('API v1 — mit Bearer (PLAYWRIGHT_API_TOKEN)', () => {
  test('GET /api/v1/summary', async ({ request }) => {
    const res = await request.get('/api/v1/summary', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const d = await res.json();
    expect(d.timestamp).toBeTruthy();
    expect(res.headers()['x-ratelimit-limit']).toBeTruthy();
  });

  test('GET /api/v1/dora?range=7d', async ({ request }) => {
    const res = await request.get('/api/v1/dora?range=7d', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/activity', async ({ request }) => {
    const res = await request.get('/api/v1/activity', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });
});
