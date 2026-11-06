// Isolated Playwright config for the FA2 prototype. Does NOT start the app build and does not touch playwright.config.ts.
// Expects the task-owned prototype server (node docs/review/free-audit/FA2/serve.mjs 4391) to be running.
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: 'fa2.spec.mjs',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  outputDir: './evidence/test-output',
  use: { baseURL: 'http://127.0.0.1:4391/docs/review/free-audit/FA2/', channel: 'msedge' },
});
