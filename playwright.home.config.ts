// Runs the focused homepage regression against an already running build (no build, no webServer, no browser download).
// Uses the Microsoft Edge that is already installed (channel 'msedge'); HOME_URL defaults to the local 4343 preview.
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: ['home-runtime.spec.ts', 'language-flash.spec.ts'], timeout: 45_000, reporter: [['list']],
  use: { baseURL: process.env.HOME_URL || 'http://127.0.0.1:4343', channel: 'msedge' },
});
