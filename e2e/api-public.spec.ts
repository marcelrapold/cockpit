import { test, expect, type APIRequestContext } from '@playwright/test';

async function expectJson200(
  request: APIRequestContext,
  path: string,
  predicate: (data: Record<string, unknown>) => boolean
) {
  const res = await request.get(path);
  expect(res.status(), `${path} status`).toBe(200);
  const ct = res.headers()['content-type'] || '';
  expect(ct, `${path} content-type`).toMatch(/json/);
  const data = (await res.json()) as Record<string, unknown>;
  expect(predicate(data), `${path} JSON shape`).toBe(true);
}

test.describe('API — öffentliche Endpoints (ohne v1-Auth)', () => {
  test('GET /api/github-stats', async ({ request }) => {
    await expectJson200(request, '/api/github-stats', d => typeof d.timestamp === 'string');
  });

  test('GET /api/github-stats?range=7d', async ({ request }) => {
    const res = await request.get('/api/github-stats?range=7d');
    expect(res.status()).toBe(200);
    const d = (await res.json()) as { week?: number };
    expect(typeof d.week).toBe('number');
  });

  test('GET /api/dora', async ({ request }) => {
    const res = await request.get('/api/dora');
    expect(res.status()).toBe(200);
    const d = (await res.json()) as { error?: string; metrics?: unknown };
    expect(d.metrics != null || d.error != null).toBe(true);
  });

  test('GET /api/dora?range=30d', async ({ request }) => {
    const res = await request.get('/api/dora?range=30d');
    expect(res.status()).toBe(200);
  });

  test('GET /api/portfolio', async ({ request }) => {
    await expectJson200(request, '/api/portfolio', d => Array.isArray(d.projects));
  });

  test('GET /api/infra-stats', async ({ request }) => {
    await expectJson200(request, '/api/infra-stats', d => typeof d.timestamp === 'string');
  });

  test('GET /api/language-stats', async ({ request }) => {
    await expectJson200(request, '/api/language-stats', d => d.languages != null);
  });

  test('GET /api/health-check', async ({ request }) => {
    await expectJson200(request, '/api/health-check', d => typeof d.allOk === 'boolean');
  });
});
