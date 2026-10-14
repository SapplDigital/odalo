import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const exe = process.env.CHROMIUM_PATH || ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => existsSync(p));

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4321',
    launchOptions: exe ? { executablePath: exe } : {},
    // Skip the cookie bar so it never overlaps what a test inspects.
    storageState: { cookies: [], origins: [{ origin: 'http://localhost:4321', localStorage: [{ name: 'odalo.cookies', value: 'essential' }] }] },
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321/en/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
