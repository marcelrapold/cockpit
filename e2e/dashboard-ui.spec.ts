import { test, expect } from '@playwright/test';

test.describe('Dashboard UI (native Cockpit)', () => {
  test('Atlas navigation und Kernbereiche sind sichtbar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner').first()).toBeVisible({ timeout: 45_000 });
    const nav = page.getByRole('navigation', { name: 'Cockpit navigation' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Insights', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Lunar/ })).toBeVisible();
    await expect(page.locator('section[aria-label^="Live-KPIs"]')).toBeVisible();
    await expect(page.locator('section[aria-label="Lunar Velocity Summary"]')).toBeVisible();
  });

  test('kein Legacy-iframe mehr auf der Startseite', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('iframe[title="Cockpit Dashboard"]')).toHaveCount(0);
    await expect(page.getByRole('main').first()).toBeVisible();
  });
});
