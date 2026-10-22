// Diagnostic-only config: same server/browser setup as the repo config, test dir = this folder.
// Run from the repo root: npx playwright test -c docs/review/performance-final/restored-scroll-correction/tools/playwright.diag.config.ts --workers=4 --repeat-each=8
import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const exe = process.env.CHROMIUM_PATH || ['/opt/pw-browsers/chromium'].find((p) => existsSync(p));
const port = Number(process.env.TEST_PORT || 4322);
const origin = `http://localhost:${port}`;
export default defineConfig({
  testDir: '.',
  testMatch: /lifecycle\.spec\.ts/,
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: origin, launchOptions: exe ? { executablePath: exe } : {} },
  webServer: { command: `npm run build && npx astro preview --host --port ${port}`, url: `${origin}/en/`, reuseExistingServer: false, timeout: 180_000, cwd: '../../../../..' },
});
