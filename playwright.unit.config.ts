import { defineConfig } from '@playwright/test';

/** Unit-Tests ohne Browser und ohne Webserver (z. B. Middleware-Weiche). */
export default defineConfig({
  testDir: './tests/unit',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
});
