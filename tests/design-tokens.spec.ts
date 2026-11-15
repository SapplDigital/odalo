import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const css = fs.readFileSync('src/styles/global.css', 'utf8');
const root = css.match(/:root\s*\{[\s\S]*?\n\}/)![0];
const tok = (name: string) => root.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();

test.describe('design tokens (ported from odalo-web)', () => {
  test('palette', () => {
    expect(tok('--coral')).toBe('#e78f65');
    expect(tok('--accent')).toBe('var(--coral)');
    expect(tok('--ink')).toBe('#004066');
    expect(tok('--paper')).toBe('#f8f9fa');
    expect(tok('--sand')).toBe('#f3e5d1');
    expect(tok('--slate')).toBe('#416c8d');
    expect(tok('--ink-deep')).toMatch(/^#002a44/);
    expect(tok('--rust-text')).toMatch(/^#9a4a28/);
    expect(tok('--surface')).toBe('#ffffff');
  });

  test('ink scale, lines, radii', () => {
    for (const n of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
      expect(tok(`--ink-${n}`), `--ink-${n}`).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(tok('--line')).toContain('rgb(0 64 102');
    expect(tok('--line-strong')).toContain('rgb(0 64 102');
    expect(tok('--radius-tile')).toBe('16px');
    expect(tok('--radius-card')).toBe('20px');
    expect(tok('--radius-panel')).toBe('24px');
    expect(tok('--radius-hero')).toBe('28px');
  });

  test('shadows, easing, type', () => {
    for (const s of ['hair', 'soft', 'float', 'lift']) expect(tok(`--shadow-${s}`), s).toBeTruthy();
    expect(tok('--ease-glass')).toBe('cubic-bezier(0.22, 1, 0.36, 1)');
    expect(tok('--text-display')).toContain('clamp(');
    expect(tok('--measure-prose')).toBe('62ch');
  });

  test('legacy token names remain', () => {
    for (const n of ['ink', 'coral', 'sand', 'paper', 'slate', 'ink-deep', 'rust-text', 'line', 'fs-hero', 'fs-h2', 'fs-h3', 'fs-body']) {
      expect(tok(`--${n}`), n).toBeTruthy();
    }
  });

  test('source is credited, motion stays 150-400 ms, reduced motion kept', () => {
    expect(css).toContain('odalo-web');
    // The reduced-motion override (0.01ms) is intentionally outside the 150-400 ms rule.
    const withoutReduced = css.replace(/@media \(prefers-reduced-motion[^{]*\{[\s\S]*?\n\}/g, '');
    for (const m of withoutReduced.matchAll(/(?:transition|animation)[^;{}]*?(\d*\.?\d+)(ms|s)\b/g)) {
      const ms = m[2] === 's' ? parseFloat(m[1]) * 1000 : parseFloat(m[1]);
      expect(ms, m[0]).toBeGreaterThanOrEqual(150);
      expect(ms, m[0]).toBeLessThanOrEqual(400);
    }
    expect(css).toContain('prefers-reduced-motion');
  });
});
