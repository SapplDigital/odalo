import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const toml = fs.readFileSync('netlify.toml', 'utf8');

test.describe('netlify.toml', () => {
  test('build settings', () => {
    expect(toml).toMatch(/\[build\][^[]*command\s*=\s*"npm run build"/);
    expect(toml).toMatch(/publish\s*=\s*"dist"/);
  });

  test('build environment', () => {
    expect(toml).toMatch(/SITE_URL\s*=\s*"https:\/\/odalo\.sappl-digital\.de"/);
    expect(toml).toMatch(/SITE_BASE\s*=\s*"\/"/);
    expect(toml).toMatch(/PUBLIC_NOINDEX\s*=\s*"true"/);
    expect(toml).toMatch(/PUBLIC_AUDIT_TRANSPORT\s*=\s*"netlify"/);
  });

  test('headers for /*', () => {
    expect(toml).toMatch(/\[\[headers\]\]\s*for\s*=\s*"\/\*"/);
    expect(toml).toMatch(/X-Robots-Tag\s*=\s*"[^"]*noindex[^"]*"/);
    expect(toml).toMatch(/X-Content-Type-Options\s*=\s*"nosniff"/);
    expect(toml).toMatch(/Referrer-Policy\s*=\s*"strict-origin-when-cross-origin"/);
    expect(toml).toMatch(/X-Frame-Options\s*=\s*"DENY"/);
    const pp = toml.match(/Permissions-Policy\s*=\s*"([^"]*)"/)?.[1] ?? '';
    for (const f of ['camera', 'microphone', 'geolocation']) expect(pp).toContain(`${f}=()`);
  });

  test('no CSP and no secret-looking keys', () => {
    expect(toml).not.toMatch(/Content-Security-Policy/i);
    expect(toml).not.toMatch(/^\s*[A-Za-z_]*(TOKEN|SECRET|KEY|PASSWORD|AUTH(?!_))[A-Za-z_]*\s*=/im);
  });

  test('robots.txt source handles noindex and default builds', () => {
    const src = fs.readFileSync('src/pages/robots.txt.ts', 'utf8');
    expect(src).toContain("PUBLIC_NOINDEX === 'true'");
    expect(src).toContain('Disallow: /');
    expect(src).toContain('Allow: /');
  });
});
