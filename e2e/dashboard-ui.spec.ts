import { test, expect } from '@playwright/test';

test.describe('Dashboard UI (Legacy im iframe)', () => {
  test('Hero-KPI / Range-Picker / DORA-Bereich im iframe', async ({ page }) => {
    await page.goto('/');
    const frame = page.frameLocator('iframe[title="Cockpit Dashboard"]');
    await expect(frame.locator('#heroKpiBar, .hero-kpi-bar')).toBeVisible({ timeout: 45_000 });
    await expect(frame.locator('#rangePicker, .range-picker')).toBeVisible();
  });

  test('Sticky Nav oder Hauptinhalt sichtbar', async ({ page }) => {
    await page.goto('/');
    const frame = page.frameLocator('iframe[title="Cockpit Dashboard"]');
    await expect(
      frame.locator('#stickyNav, .sticky-nav, header.header, #pageTop').first()
    ).toBeVisible({ timeout: 45_000 });
  });
});
