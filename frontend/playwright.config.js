import { defineConfig } from '@playwright/test';
import { API_URL, APP_URL, E2E_DATABASE_URL } from './e2e/helpers.js';

// Browser tests start their own backend (port 4730) and frontend (port 5730)
// against the separate nosh_e2e database, so they never touch development data.
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  fullyParallel: false,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: APP_URL,
    // Use an installed browser with PW_CHANNEL=chrome or PW_CHANNEL=msedge; otherwise Playwright's bundled Chromium.
    channel: process.env.PW_CHANNEL || undefined,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm --prefix ../backend run start:e2e',
      url: `${API_URL}/health`,
      timeout: 60_000,
      reuseExistingServer: false,
      env: { NODE_ENV: 'test', PORT: '4730', DATABASE_URL: E2E_DATABASE_URL, CORS_ORIGINS: APP_URL },
    },
    {
      command: 'npx vite --port 5730 --strictPort',
      url: APP_URL,
      timeout: 60_000,
      reuseExistingServer: false,
      env: { VITE_API_BASE_URL: API_URL },
    },
  ],
});
