import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';

// Use the pre-installed Chromium when present (cloud container); otherwise Playwright's own.
const candidates = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'];
const executablePath = process.env.CHROMIUM_PATH || candidates.find((c) => existsSync(c));
export const launch = (opts = {}) => chromium.launch({ executablePath, ...opts });
export { executablePath };
