import { test, expect } from '@playwright/test';

test.describe('Smoke — Seiten & Shell', () => {
  test('Startseite / lädt (Next.js Shell)', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('main')).toBeVisible();
  });

  test('iframe Cockpit Dashboard ist sichtbar', async ({ page }) => {
    await page.goto('/');
    const frame = page.frameLocator('iframe[title="Cockpit Dashboard"]');
    await expect(frame.locator('body')).toBeVisible({ timeout: 30_000 });
  });

  test('Legacy /index.html lädt direkt (200)', async ({ request }) => {
    const res = await request.get('/index.html');
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] || '';
    expect(ct).toContain('text/html');
  });

  test('Manifest & Service Worker erreichbar', async ({ request }) => {
    const m = await request.get('/manifest.json');
    expect(m.status()).toBe(200);
    const data = await m.json();
    expect(data.name || data.short_name).toBeTruthy();

    const sw = await request.get('/sw.js');
    expect(sw.status()).toBe(200);
  });
});
