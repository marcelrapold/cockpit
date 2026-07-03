import { test, expect } from '@playwright/test';

test.describe('Smoke — Seiten & Shell', () => {
  test('Startseite / lädt (Next.js Shell)', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('main')).toBeVisible();
  });

  test('Hero-Sektionen sind nativ gerendert', async ({ page }) => {
    await page.goto('/');
    // Native Server-Components — kein iframe mehr.
    await expect(page.locator('section[aria-label="Live-KPIs"]')).toBeVisible();
    await expect(page.locator('section[aria-label="DORA Four-Keys"]')).toBeVisible();
    await expect(page.locator('section[aria-label="Portfolio-Übersicht"]')).toBeVisible();
  });

  test('Legacy /legacy.html ist nicht mehr öffentlich ausgeliefert', async ({ request }) => {
    const res = await request.get('/legacy.html');
    expect(res.status()).toBe(404);
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
