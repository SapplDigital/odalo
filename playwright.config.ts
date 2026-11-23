import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const exe = process.env.CHROMIUM_PATH || ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => existsSync(p));

// Tests always build and serve their own copy on a dedicated port, so they never reuse (or disturb)
// a dev server running on 4321. Override with TEST_PORT if 4322 is taken.
const port = Number(process.env.TEST_PORT || 4322);
const origin = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: origin,
    launchOptions: exe ? { executablePath: exe } : {},
  },
  webServer: {
    command: `npm run build && npx astro preview --ignore-lock --host --port ${port}`,
    url: `${origin}/en/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
